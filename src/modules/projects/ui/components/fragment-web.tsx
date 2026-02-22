'use client'

import { Fragment } from "@prisma/client"
import {
  BrainCircuitIcon,
  FileTextIcon,
  BarChart2Icon,
  PackageIcon,
  RocketIcon,
  CheckCircle2Icon,
  FolderIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  data: Fragment
}

function parseJson<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === "object") return value as T
  try {
    return JSON.parse(value as string)
  } catch {
    return null
  }
}

function getLanguage(path: string): string {
  if (path.endsWith(".py")) return "python"
  if (path.endsWith(".md")) return "markdown"
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml"
  if (path.endsWith(".sh")) return "bash"
  if (path.endsWith(".txt")) return "text"
  return "python"
}

function MetricsTable({
  metrics,
}: {
  metrics: Record<string, string | number>
}) {
  const entries = Object.entries(metrics)
  if (entries.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No metrics recorded.</p>
    )

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">
              Metric
            </th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value], i) => (
            <tr
              key={key}
              className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
            >
              <td className="px-4 py-2 text-muted-foreground capitalize">
                {key.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">
                {typeof value === "number" ? value.toFixed(4) : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArtifactCard({
  icon: Icon,
  label,
  path,
  color,
}: {
  icon: React.ElementType
  label: string
  path: string | null | undefined
  color: string
}) {
  if (!path) return null
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className={`mt-0.5 p-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-mono text-foreground truncate mt-0.5">
          {path}
        </p>
        <Badge variant="outline" className="mt-1 text-xs">
          <CheckCircle2Icon className="h-3 w-3 mr-1 text-green-500" />
          Generated
        </Badge>
      </div>
    </div>
  )
}

function EmptyWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="relative">
        <BrainCircuitIcon className="h-16 w-16 text-muted-foreground/30" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">ML Workspace</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Describe an ML task in the chat. Your model, metrics, and artifacts
          will appear here.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground max-w-xs w-full">
        {[
          "Classification",
          "Regression",
          "NLP / Text",
          "Computer Vision",
          "Time Series",
          "Clustering",
        ].map((t) => (
          <div
            key={t}
            className="flex items-center gap-1.5 bg-muted/30 rounded-md px-2 py-1.5"
          >
            <BrainCircuitIcon className="h-3 w-3 text-primary/60" />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FragmentWeb({ data }: Props) {
  const metrics = parseJson<Record<string, string | number>>(data.metrics)
  const plots = parseJson<string[]>(data.plots)
  const files = parseJson<Record<string, string>>(data.files)

  const hasMetrics = metrics && Object.keys(metrics).length > 0
  const hasPlots = plots && plots.length > 0
  const hasFiles = files && Object.keys(files).length > 0
  const hasAnyArtifact =
    data.modelPath ||
    data.reportPath ||
    data.appPath ||
    data.apiPath ||
    data.dataPath

  const reportContent =
    hasFiles &&
    (files["outputs/reports/report.md"] ||
      files["outputs/report.md"] ||
      files["outputs/reports/iris_classification_report.md"] ||
      Object.entries(files).find(
        ([p]) => p.endsWith(".md") && !p.endsWith("README.md")
      )?.[1])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Tabs defaultValue="outputs" className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-border px-4 pt-2">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            <TabsTrigger
              value="outputs"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm gap-1.5"
            >
              <BarChart2Icon className="h-3.5 w-3.5" />
              Outputs
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm gap-1.5"
            >
              <FolderIcon className="h-3.5 w-3.5" />
              Files
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm gap-1.5"
            >
              <FileTextIcon className="h-3.5 w-3.5" />
              Report
            </TabsTrigger>
            <TabsTrigger
              value="deploy"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm gap-1.5"
            >
              <RocketIcon className="h-3.5 w-3.5" />
              Deploy
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OUTPUTS TAB */}
        <TabsContent
          value="outputs"
          className="flex-1 overflow-y-auto p-4 space-y-4 m-0"
        >
          {!hasMetrics && !hasAnyArtifact && !hasFiles ? (
            <EmptyWorkspace />
          ) : (
            <>
              {hasMetrics && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart2Icon className="h-4 w-4 text-primary" />
                      Model Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <MetricsTable metrics={metrics} />
                  </CardContent>
                </Card>
              )}

              {hasAnyArtifact && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PackageIcon className="h-4 w-4 text-primary" />
                      Generated Artifacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <ArtifactCard
                      icon={BrainCircuitIcon}
                      label="Trained Model"
                      path={data.modelPath}
                      color="bg-blue-500/10 text-blue-500"
                    />
                    <ArtifactCard
                      icon={FileTextIcon}
                      label="Report"
                      path={data.reportPath}
                      color="bg-purple-500/10 text-purple-500"
                    />
                    <ArtifactCard
                      icon={FolderIcon}
                      label="Cleaned Data"
                      path={data.dataPath}
                      color="bg-yellow-500/10 text-yellow-500"
                    />
                    <ArtifactCard
                      icon={RocketIcon}
                      label="Gradio App"
                      path={data.appPath}
                      color="bg-green-500/10 text-green-500"
                    />
                    <ArtifactCard
                      icon={PackageIcon}
                      label="FastAPI Endpoint"
                      path={data.apiPath}
                      color="bg-orange-500/10 text-orange-500"
                    />
                  </CardContent>
                </Card>
              )}

              {hasPlots && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart2Icon className="h-4 w-4 text-primary" />
                      Generated Plots
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {plots.map((plot, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/30 rounded px-3 py-1.5"
                      >
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {plot}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Fallback: show file list if no structured metadata */}
              {!hasMetrics && !hasAnyArtifact && hasFiles && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-primary" />
                      Generated Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {Object.keys(files).map((path) => (
                      <div
                        key={path}
                        className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/30 rounded px-3 py-1.5"
                      >
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {path}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* FILES TAB — syntax highlighted */}
        <TabsContent value="files" className="flex-1 overflow-y-auto p-4 m-0">
          {!hasFiles ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <FolderIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">No files generated yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(files).map(([path, content]) => (
                <Card key={path} className="border-border bg-muted/10 overflow-hidden">
                  <CardHeader className="pb-0 pt-3 px-4 flex-row items-center justify-between">
                    <CardTitle className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                      <FileTextIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      {path}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">
                      {getLanguage(path)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <SyntaxHighlighter
                      language={getLanguage(path)}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: "0.75rem",
                        maxHeight: "320px",
                        background: "transparent",
                      }}
                      showLineNumbers
                      wrapLongLines={false}
                    >
                      {content}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* REPORT TAB — rendered markdown */}
        <TabsContent value="report" className="flex-1 overflow-y-auto p-4 m-0">
          {!reportContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <FileTextIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                Report will appear here after the ML task completes.
              </p>
            </div>
          ) : (
            <Card className="border-border bg-muted/10">
              <CardContent className="px-6 py-6">
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border
                  prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                  prose-pre:bg-muted/40 prose-pre:border prose-pre:border-border prose-pre:rounded-lg
                  prose-ul:text-muted-foreground prose-ul:my-2
                  prose-ol:text-muted-foreground prose-ol:my-2
                  prose-li:my-1
                  prose-table:text-sm prose-table:border-collapse
                  prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted/50 prose-th:text-foreground prose-th:font-semibold
                  prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-muted-foreground
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {reportContent}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DEPLOY TAB */}
        <TabsContent
          value="deploy"
          className="flex-1 overflow-y-auto p-4 space-y-4 m-0"
        >
          {!data.appPath && !data.apiPath ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <RocketIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm text-center max-w-xs">
                Ask the agent to build a Gradio UI or FastAPI endpoint to see
                deployment options here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.appPath && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <RocketIcon className="h-4 w-4 text-green-500" />
                      Gradio App
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Run locally with:
                    </p>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ borderRadius: "0.5rem", fontSize: "0.75rem" }}
                    >
                      {`pip install gradio\npython ${data.appPath}`}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              )}
              {data.apiPath && (
                <Card className="border-border bg-muted/10">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PackageIcon className="h-4 w-4 text-orange-500" />
                      FastAPI Endpoint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Run locally with:
                    </p>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ borderRadius: "0.5rem", fontSize: "0.75rem" }}
                    >
                      {`pip install fastapi uvicorn\nuvicorn ${data.apiPath.replace(".py", "")}:app --reload`}
                    </SyntaxHighlighter>
                    <p className="text-xs text-muted-foreground mt-2">
                      Then POST to:
                    </p>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ borderRadius: "0.5rem", fontSize: "0.75rem" }}
                    >
                      {"http://localhost:8000/predict"}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              )}
              {data.appPath && files && files[data.appPath] && (
                <Card className="border-border bg-muted/10 overflow-hidden">
                  <CardHeader className="pb-0 pt-3 px-4">
                    <CardTitle className="text-xs font-mono text-muted-foreground">
                      {data.appPath}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <SyntaxHighlighter
                      language="python"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: "0.75rem",
                        maxHeight: "320px",
                      }}
                      showLineNumbers
                    >
                      {files[data.appPath]}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}