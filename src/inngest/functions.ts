import { inngest } from "./client";
import { openai,
         createAgent, 
         createTool, 
         createNetwork, 
         type Tool, 
         type Message, 
         createState } from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { getSandboxId, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import prisma from "@/lib/db";
import { parseAgentOutput } from "./utils";
import { SANDBOX_TIMEOUT } from "./types";


const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const DEFAULT_NVIDIA_MODEL = "moonshotai/kimi-k2-thinking";

const getModelConfig = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set in environment variables");
  }
  const model = process.env.NVIDIA_MODEL_ID || DEFAULT_NVIDIA_MODEL;
  return {
    model,
    apiKey: apiKey,
    baseUrl: NVIDIA_BASE,
  };
};

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const projectId = event.data.projectId;

    const saveErrorMessage = async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.message.create({
        data: {
          projectId,
          content: `Generation failed: ${msg}`,
          role: "ASSISTANT",
          type: "ERROR",
        },
      });
    };

    try {
    const modelConfig = getModelConfig();

    const sandboxId = await step.run("get-sandbox-id", async () => {
      const templateId = process.env.E2B_TEMPLATE_ID || "0flpulpnw5cfn2sifn1n";
      const sandbox = await Sandbox.create(templateId);
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      return sandbox.sandboxId;
    });

    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];
    
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        });
      }

      return formattedMessages.reverse();
    });

    const state = createState<AgentState>({
      summary: "",
      files: {},
    },
      { messages: previousMessages },
    );

    const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "An expert coding angent",
      system: PROMPT,
      model: openai({
        model: modelConfig.model,
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
        defaultParameters: { 
          temperature: 1.0,
          top_p: 1.0,
        },
      }),

      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              
              try {
                const sandbox = await getSandboxId(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });
                return result.stdout
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstddout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstddout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try{
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandboxId(sandboxId);
                
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                
                return updatedFiles;
              } catch (e) {
                return "Error: " + e;
              }
            });

            if (typeof newFiles == "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        
        createTool({
          name: "readFiles",
          description: "Read files from the sandbx",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandboxId(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        })
      ],
      lifecycle: {
       onResponse: async ({ result, network }) => {
        const lastAssistantMessageText = lastAssistantTextMessageContent(result);
        if (lastAssistantMessageText && network) {
          if (lastAssistantMessageText.includes("<task_summary>")) {
            network.state.data.summary = lastAssistantMessageText;
          }
        }

        return result;
       },
      },
    });
      
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
      
        if (summary) {
          return;
        }
        return codeAgent;
      }
    })

    let result;
    try {
      result = await network.run(event.data.value, { state });
    } catch (error) {
      console.error("Network execution error:", error);
      if (error instanceof Error && error.message.includes("401")) {
        throw new Error("Invalid NVIDIA API key. Check NVIDIA_API_KEY in .env");
      }
      if (error instanceof Error && error.message.includes("404")) {
        throw new Error(`Model not found. Check model name: ${modelConfig.model}`);
      }
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("NVIDIA API rate limit exceeded. Try again later.");
      }
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: modelConfig.model,
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
        defaultParameters: { 
          temperature: 1.0,
          top_p: 1.0,
        },
      }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: modelConfig.model,
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
        defaultParameters: { 
          temperature: 1.0,
          top_p: 1.0,
        },
      }),
    });

    let fragmentTitleOutput: Message[], responseOutput: Message[];
    try {
      const fragmentTitleResult = await fragmentTitleGenerator.run(result.state.data.summary);
      fragmentTitleOutput = fragmentTitleResult.output;
    } catch (error) {
      console.error("Fragment title generation error:", error);
      fragmentTitleOutput = [{ type: "text", role: "assistant", content: "Fragment" }] as Message[];
    }

    try {
      const responseResult = await responseGenerator.run(result.state.data.summary);
      responseOutput = responseResult.output;
    } catch (error) {
      console.error("Response generation error:", error);
      responseOutput = [{ type: "text", role: "assistant", content: result.state.data.summary || "No response generated" }] as Message[];
    }

    const isError = 
      !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

    // Fix app/page.tsx if the agent wrote a broken "use client" line (unquoted).
    // Unquoted "use client;" causes "Parsing ecmascript source code failed". Replace
    // with the valid directive 'use client' so the build succeeds and hooks still work.
    await step.run("fix-page-tsx-use-client", async () => {
      const files = result.state.data.files || {};
      const pagePath = "app/page.tsx";
      const content = files[pagePath];
      if (typeof content !== "string") return;
      const firstLine = content.split("\n")[0]?.trim() ?? "";
      const isBrokenUseClient =
        firstLine === "use client" || firstLine === "use client;";
      if (!isBrokenUseClient) return;
      const rest = content.slice(content.indexOf("\n") + 1);
      const fixed = "'use client'\n" + rest;
      const sandbox = await getSandboxId(sandboxId);
      await sandbox.files.write(pagePath, fixed);
      result.state.data.files = { ...files, [pagePath]: fixed };
    });

    // Normalize component imports in app/page.tsx when the agent imports
    // a named component from a file that only has a default export.
    // Example broken pattern:
    //   import { MainArea } from "./main-area";
    //   // but app/main-area.tsx only has `export default ...`
    // This rewrites the import to:
    //   import MainArea from "./main-area";
    await step.run("fix-mismatched-component-imports", async () => {
      const files = result.state.data.files || {};
      const pagePath = "app/page.tsx";
      const pageContent = files[pagePath];
      if (typeof pageContent !== "string") return;

      const importRegex =
        /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*["'](\.\/[^"']+)["'];?/g;

      let updatedContent = pageContent;
      let changed = false;

      const sandbox = await getSandboxId(sandboxId);

      let match: RegExpExecArray | null;
      while ((match = importRegex.exec(pageContent)) !== null) {
        const [fullImport, importedName, relPath] = match;

        // app/page.tsx lives in app/, so "./x" refers to "app/x"
        let targetPath = `app/${relPath.slice(2)}`;
        if (!targetPath.endsWith(".tsx") && !targetPath.endsWith(".ts")) {
          targetPath += ".tsx";
        }

        const targetContent = files[targetPath];
        if (typeof targetContent !== "string") continue;

        const hasNamedExport =
          new RegExp(`export\\s+(?:const|function|class)\\s+${importedName}\\b`).test(
            targetContent,
          ) ||
          new RegExp(`export\\s*\\{[^}]*\\b${importedName}\\b[^}]*\\}`).test(
            targetContent,
          );

        const hasDefaultExport = /export\s+default\b/.test(targetContent);

        // If the target file has no matching named export but *does*
        // have a default export, switch to a default import.
        if (!hasNamedExport && hasDefaultExport) {
          const fixedImport = `import ${importedName} from "${relPath}";`;
          updatedContent = updatedContent.replace(fullImport, fixedImport);
          changed = true;
        }
      }

      if (!changed) return;

      await sandbox.files.write(pagePath, updatedContent);
      result.state.data.files = { ...files, [pagePath]: updatedContent };
    });

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandboxId(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async() => {
      if(isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Error: " + result.state.data.summary,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              files: result.state.data.files,
            }
          }
        },
      });
    })
      
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
    } catch (err) {
      await saveErrorMessage(err);
      throw err;
    }
  },
);
