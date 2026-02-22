import { inngest } from "./client"
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit"
import { Sandbox } from "e2b"
import { getSandboxId, lastAssistantTextMessageContent } from "./utils"
import z from "zod"
import {
  FRAGMENT_TITLE_PROMPT,
  RESPONSE_PROMPT,
  ORCHESTRATOR_PROMPT,
  ML_ENGINEER_PROMPT,
  REPORTER_PROMPT,
} from "@/prompt"
import prisma from "@/lib/db"
import { parseAgentOutput } from "./utils"
import { SANDBOX_TIMEOUT } from "./types"

interface FileUploadData {
  name: string
  content: string
  mimeType: string
  size: number
}

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"
const DEFAULT_NVIDIA_MODEL = "meta/llama-3.3-70b-instruct"

const getModelConfig = () => {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set")
  const model = process.env.NVIDIA_MODEL_ID || DEFAULT_NVIDIA_MODEL
  return { model, apiKey, baseUrl: NVIDIA_BASE }
}

// Helper to create an openai model instance
const makeModel = (
  config: ReturnType<typeof getModelConfig>,
  temperature = 0.7
) =>
  openai({
    model: config.model,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    defaultParameters: { temperature, top_p: 0.9 },
  })

// Parse METRICS_JSON from terminal output
function extractMetrics(text: string): Record<string, number | string> {
  try {
    const match = text.match(/METRICS_JSON:\s*(\{[^}]+\})/)
    if (match) return JSON.parse(match[1])
  } catch {}
  return {}
}

// Parse <ml_plan> block from orchestrator output
function extractPlan(text: string): string {
  const match = text.match(/<ml_plan>([\s\S]*?)<\/ml_plan>/)
  return match ? match[1].trim() : ""
}

interface MLAgentState {
  summary: string
  files: { [path: string]: string }
  artifacts: {
    modelPath?: string
    reportPath?: string
    plots?: string[]
    appPath?: string
    apiPath?: string
    dataPath?: string
  }
  phase: "orchestrating" | "engineering" | "reporting" | "done"
  metrics: { [key: string]: number | string }
  plan: string
  terminalOutput: string
  needsClarification: boolean
}

export const zixxyFunction = inngest.createFunction(
  { id: "zixxy" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const projectId = event.data.projectId

    const saveErrorMessage = async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      await prisma.message.create({
        data: {
          projectId,
          content: `Zixxy failed: ${msg}`,
          role: "ASSISTANT",
          type: "ERROR",
        },
      })
    }

    try {
      const modelConfig = getModelConfig()

      // ─── SANDBOX SETUP ───────────────────────────────────────────
      const sandboxId = await step.run("get-sandbox-id", async () => {
        const templateId =
          process.env.E2B_ML_TEMPLATE_ID ||
          process.env.E2B_TEMPLATE_ID ||
          "0flpulpnw5cfn2sifn1n"
        const sandbox = await Sandbox.create(templateId)
        await sandbox.setTimeout(SANDBOX_TIMEOUT)
        return sandbox.sandboxId
      })

      await step.run("init-sandbox-dirs", async () => {
  const sandbox = await getSandboxId(sandboxId)
  await sandbox.commands.run(
    "mkdir -p /home/user/outputs/model /home/user/outputs/plots /home/user/outputs/data /home/user/outputs/reports /home/user/uploads"
  )
})

// Write uploaded file to sandbox if present
const uploadedFilePath = await step.run("handle-file-upload", async () => {
  const fileData = event.data.fileData
  if (!fileData) return null

  try {
    const sandbox = await getSandboxId(sandboxId)
    // Write base64 content directly to uploads directory
    const filePath = `uploads/${fileData.name}` 
    await sandbox.files.write(filePath, fileData.content)
    return filePath
  } catch (e) {
    console.error("File upload to sandbox failed:", e)
    return null
  }
})

      // ─── PREVIOUS MESSAGES ───────────────────────────────────────
      const previousMessages = await step.run(
        "get-previous-messages",
        async () => {
          const formattedMessages: Message[] = []
          const messages = await prisma.message.findMany({
            where: { projectId: event.data.projectId },
            orderBy: { createdAt: "desc" },
            take: 10,
          })
          for (const message of messages) {
            formattedMessages.push({
              type: "text",
              role: message.role === "ASSISTANT" ? "assistant" : "user",
              content: message.content,
            })
          }
          return formattedMessages.reverse()
        }
      )

      // ─── SHARED STATE ─────────────────────────────────────────────
      const state = createState<MLAgentState>(
        {
          summary: "",
          files: {},
          artifacts: {},
          phase: "orchestrating",
          metrics: {},
          plan: "",
          terminalOutput: "",
          needsClarification: false,
        },
        { messages: previousMessages }
      )

      // ═══════════════════════════════════════════════════
      // AGENT 1: ORCHESTRATOR
      // Plans the task, detects ambiguity, asks questions
      // ═══════════════════════════════════════════════════
      const orchestratorAgent = createAgent<MLAgentState>({
        name: "orchestrator",
        description: "Plans ML tasks and detects ambiguity",
        system: ORCHESTRATOR_PROMPT,
        model: makeModel(modelConfig, 0.5),
        lifecycle: {
          onResponse: async ({ result, network }) => {
            const lastMsg = lastAssistantTextMessageContent(result)
            if (lastMsg && network) {
              const plan = extractPlan(lastMsg)
              if (plan) {
                network.state.data.plan = plan
                network.state.data.phase = "engineering"
              } else {
                // No plan means it asked a clarifying question
                network.state.data.needsClarification = true
                network.state.data.phase = "done"
                network.state.data.summary = lastMsg
              }
            }
            return result
          },
        },
      })

      // ═══════════════════════════════════════════════════
      // AGENT 2: ML ENGINEER
      // Writes and executes Python code in E2B sandbox
      // ═══════════════════════════════════════════════════
      const mlEngineerAgent = createAgent<MLAgentState>({
        name: "mlEngineer",
        description: "Implements ML pipelines in Python",
        system: ML_ENGINEER_PROMPT,
        model: makeModel(modelConfig, 0.7),
        tools: [
          createTool({
            name: "terminal",
            description:
              "Run shell commands or Python scripts in the ML sandbox.",
            parameters: z.object({
              command: z.string().describe("Shell command to execute"),
            }),
            handler: async ({ command }, { step, network }: Tool.Options<MLAgentState>) => {
              return await step?.run("terminal", async () => {
                const buffers = { stdout: "", stderr: "" }
                try {
                  const sandbox = await getSandboxId(sandboxId)
                  const result = await sandbox.commands.run(command, {
                    onStdout: (data: string) => { buffers.stdout += data },
                    onStderr: (data: string) => { buffers.stderr += data },
                  })
                  const output = [
                    buffers.stdout && `STDOUT:\n${buffers.stdout}`,
                    buffers.stderr && `STDERR:\n${buffers.stderr}`,
                  ]
                    .filter(Boolean)
                    .join("\n")
                  const finalOutput =
                    output || result.stdout || "Command completed with no output"

                  // Extract metrics from terminal output
                  if (network) {
                    const metrics = extractMetrics(finalOutput)
                    if (Object.keys(metrics).length > 0) {
                      network.state.data.metrics = {
                        ...network.state.data.metrics,
                        ...metrics,
                      }
                    }
                    network.state.data.terminalOutput += finalOutput + "\n"
                  }
                  return finalOutput
                } catch (e) {
                  return `Command failed: ${e}\nSTDOUT: ${buffers.stdout}\nSTDERR: ${buffers.stderr}` 
                }
              })
            },
          }),

          createTool({
            name: "createOrUpdateFiles",
            description: "Create or update files in the ML sandbox.",
            parameters: z.object({
              files: z.array(
                z.object({
                  path: z.string(),
                  content: z.string(),
                })
              ),
            }),
            handler: async (
              { files },
              { step, network }: Tool.Options<MLAgentState>
            ) => {
              const newFiles = await step?.run(
                "createOrUpdateFiles",
                async () => {
                  try {
                    const updatedFiles = network.state.data.files || {}
                    const sandbox = await getSandboxId(sandboxId)
                    for (const file of files) {
                      await sandbox.files.write(file.path, file.content)
                      updatedFiles[file.path] = file.content
                    }
                    return updatedFiles
                  } catch (e) {
                    return `Error writing files: ${e}` 
                  }
                }
              )
              if (typeof newFiles === "object" && network) {
                network.state.data.files = newFiles
                const artifacts = network.state.data.artifacts
                for (const file of files) {
                  if (
                    file.path.includes("outputs/model") ||
                    file.path.endsWith(".pkl") ||
                    file.path.endsWith(".pt") ||
                    file.path.endsWith(".joblib")
                  ) {
                    artifacts.modelPath = file.path
                  }
                  if (
                    file.path.includes("outputs/plots") ||
                    file.path.endsWith(".png")
                  ) {
                    if (!artifacts.plots) artifacts.plots = []
                    artifacts.plots.push(file.path)
                  }
                  if (file.path.endsWith("report.md") || file.path.includes("outputs/reports")) {
                    artifacts.reportPath = file.path
                  }
                  if (file.path.endsWith("app.py")) artifacts.appPath = file.path
                  if (file.path.endsWith("api.py")) artifacts.apiPath = file.path
                  if (file.path.endsWith(".csv") || file.path.includes("outputs/data")) {
                    artifacts.dataPath = file.path
                  }
                }
                network.state.data.artifacts = artifacts
              }
            },
          }),

          createTool({
            name: "readFiles",
            description: "Read files from the ML sandbox.",
            parameters: z.object({
              files: z.array(z.string()),
            }),
            handler: async ({ files }, { step }) => {
              return await step?.run("readFiles", async () => {
                try {
                  const sandbox = await getSandboxId(sandboxId)
                  const contents = []
                  for (const file of files) {
                    const content = await sandbox.files.read(file)
                    contents.push({ path: file, content })
                  }
                  return JSON.stringify(contents)
                } catch (e) {
                  return `Error reading files: ${e}` 
                }
              })
            },
          }),

          createTool({
            name: "listOutputs",
            description: "List all files in the outputs directory.",
            parameters: z.object({
              directory: z.string().default("outputs"),
            }),
            handler: async ({ directory }, { step }) => {
              return await step?.run("listOutputs", async () => {
                try {
                  const sandbox = await getSandboxId(sandboxId)
                  const result = await sandbox.commands.run(
                    `find ${directory} -type f 2>/dev/null | sort || echo "Empty"` 
                  )
                  return result.stdout || "No outputs found"
                } catch (e) {
                  return `Error: ${e}` 
                }
              })
            },
          }),
        ],

        lifecycle: {
          onResponse: async ({ result, network }) => {
            const lastMsg = lastAssistantTextMessageContent(result)
            if (lastMsg && network) {
              if (lastMsg.includes("<task_summary>")) {
                network.state.data.summary = lastMsg
                network.state.data.phase = "reporting"
              }
            }
            return result
          },
        },
      })

      // ═══════════════════════════════════════════════════
      // AGENT 3: REPORTER
      // Takes raw results and writes clean markdown report
      // ═══════════════════════════════════════════════════
      const reporterAgent = createAgent<MLAgentState>({
        name: "reporter",
        description: "Writes clean ML reports from raw results",
        system: REPORTER_PROMPT,
        model: makeModel(modelConfig, 0.4),
        tools: [
          createTool({
            name: "createOrUpdateFiles",
            description: "Save the generated report to outputs/reports/report.md",
            parameters: z.object({
              files: z.array(
                z.object({
                  path: z.string(),
                  content: z.string(),
                })
              ),
            }),
            handler: async (
              { files },
              { step, network }: Tool.Options<MLAgentState>
            ) => {
              const newFiles = await step?.run(
                "reporter-save-files",
                async () => {
                  try {
                    const updatedFiles = network.state.data.files || {}
                    const sandbox = await getSandboxId(sandboxId)
                    for (const file of files) {
                      await sandbox.files.write(file.path, file.content)
                      updatedFiles[file.path] = file.content
                      if (file.path.endsWith(".md")) {
                        network.state.data.artifacts.reportPath = file.path
                      }
                    }
                    return updatedFiles
                  } catch (e) {
                    return `Error: ${e}` 
                  }
                }
              )
              if (typeof newFiles === "object" && network) {
                network.state.data.files = newFiles
              }
            },
          }),
        ],
        lifecycle: {
          onResponse: async ({ result, network }) => {
            const lastMsg = lastAssistantTextMessageContent(result)
            if (lastMsg && network) {
              network.state.data.phase = "done"
            }
            return result
          },
        },
      })

      // ─── MULTI-AGENT NETWORK ──────────────────────────────────────
      const network = createNetwork<MLAgentState>({
        name: "zixxy-network",
        agents: [orchestratorAgent, mlEngineerAgent, reporterAgent],
        maxIter: 25,
        defaultState: state,
        router: async ({ network }) => {
          const { phase, needsClarification } = network.state.data

          // If clarification needed, stop and surface question to user
          if (needsClarification) return

          // Phase routing
          if (phase === "orchestrating") return orchestratorAgent
          if (phase === "engineering") return mlEngineerAgent
          if (phase === "reporting") return reporterAgent
          if (phase === "done") return

          return orchestratorAgent
        },
      })

      // ─── RUN THE NETWORK ──────────────────────────────────────────
      let result
      try {
        // Append file path context to prompt if file was uploaded
        const promptValue = uploadedFilePath
          ? `${event.data.value}\n\nThe user has uploaded a data file. It is available in the sandbox at: ${uploadedFilePath}\nUse this file as your dataset. Load it with pandas: pd.read_csv('${uploadedFilePath}')` 
          : event.data.value

        result = await network.run(promptValue, { state })
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          throw new Error("Invalid NVIDIA API key.")
        }
        if (error instanceof Error && error.message.includes("429")) {
          throw new Error("NVIDIA API rate limit exceeded. Try again later.")
        }
        throw new Error(
          `Zixxy failed: ${error instanceof Error ? error.message : String(error)}` 
        )
      }

      // ─── GENERATE TITLE + RESPONSE ────────────────────────────────
      const fragmentTitleGenerator = createAgent({
        name: "fragment-title-generator",
        system: FRAGMENT_TITLE_PROMPT,
        model: makeModel(modelConfig, 0.3),
      })

      const responseGenerator = createAgent({
        name: "response-generator",
        system: RESPONSE_PROMPT,
        model: makeModel(modelConfig, 0.5),
      })

      let fragmentTitleOutput: Message[]
      let responseOutput: Message[]

      try {
        const r = await fragmentTitleGenerator.run(result.state.data.summary)
        fragmentTitleOutput = r.output
      } catch {
        fragmentTitleOutput = [
          { type: "text", role: "assistant", content: "ML Task" },
        ] as Message[]
      }

      try {
        const r = await responseGenerator.run(result.state.data.summary)
        responseOutput = r.output
      } catch {
        responseOutput = [
          {
            type: "text",
            role: "assistant",
            content: result.state.data.summary || "ML task completed.",
          },
        ] as Message[]
      }

      // ─── HANDLE CLARIFICATION QUESTIONS ──────────────────────────
      // If orchestrator asked a question, save it as a special message
      if (result.state.data.needsClarification) {
        await step.run("save-clarification", async () => {
          await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content: result.state.data.summary,
              role: "ASSISTANT",
              type: "RESULT",
            },
          })
        })
        return { clarification: true, question: result.state.data.summary }
      }

      // ─── SAVE RESULT ──────────────────────────────────────────────
      const isError =
        !result.state.data.summary ||
        Object.keys(result.state.data.files || {}).length === 0

      await step.run("save-result", async () => {
        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content:
                "Zixxy Error: " +
                (result.state.data.summary || "Unknown error"),
              role: "ASSISTANT",
              type: "ERROR",
            },
          })
        }
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: parseAgentOutput(responseOutput),
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: "",
                title: parseAgentOutput(fragmentTitleOutput),
                files: result.state.data.files,
                modelPath: result.state.data.artifacts.modelPath ?? null,
                reportPath: result.state.data.artifacts.reportPath ?? null,
                dataPath: result.state.data.artifacts.dataPath ?? null,
                appPath: result.state.data.artifacts.appPath ?? null,
                apiPath: result.state.data.artifacts.apiPath ?? null,
                plots: result.state.data.artifacts.plots ?? [],
                metrics: result.state.data.metrics,
                phase: "done",
              },
            },
          },
        })
      })

      return {
        title: parseAgentOutput(fragmentTitleOutput),
        files: result.state.data.files,
        artifacts: result.state.data.artifacts,
        metrics: result.state.data.metrics,
        summary: result.state.data.summary,
      }
    } catch (err) {
      await saveErrorMessage(err)
      throw err
    }
  }
)
