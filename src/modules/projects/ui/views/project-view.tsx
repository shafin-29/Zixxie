'use client'

import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { Fragment } from "@prisma/client"
import { ProjectHeader } from "../components/project-header"
import { 
  BrainCircuitIcon, 
  Loader2, 
  AlertCircle,
  DatabaseIcon,
  BookOpenIcon,
  BarChart3Icon
} from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AIBrainPanel } from "../components/ai-brain-panel"
import { DataSamples } from "../components/data-samples"
import { DataIntelligenceDashboard } from "../components/data-intelligence-dashboard"
import { PipelineNarrative } from "../components/pipeline-narrative"
import { NotebookViewer } from "../components/notebook-viewer"

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm">{message}</p>
  </div>
)

const ErrorFallback = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-destructive">
    <AlertCircle className="h-8 w-8" />
    <p className="text-center text-sm">{message}</p>
  </div>
)

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null)
  const [activeTab, setActiveTab] = useState("ai-brain")

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <ResizablePanelGroup
        direction="horizontal"
        className="animate-in fade-in duration-500"
      >
        {/* LEFT PANEL — Chat */}
        <ResizablePanel defaultSize={30} minSize={20} className="flex flex-col min-h-0">
          <div className="flex-shrink-0">
            <ErrorBoundary
              fallback={<ErrorFallback message="Error loading project header." />}
            >
              <Suspense fallback={<LoadingState message="Loading Project..." />}>
                <ProjectHeader projectId={projectId} />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <ErrorBoundary
              fallback={<ErrorFallback message="Error loading messages." />}
            >
              <Suspense fallback={<LoadingState message="Loading Messages..." />}>
                <MessagesContainer
                  projectId={projectId}
                  activeFragment={activeFragment}
                  setActiveFragment={setActiveFragment}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1.5 bg-border transition-colors hover:bg-primary" />

        {/* RIGHT PANEL — ML Workspace */}
        <ResizablePanel
          defaultSize={70}
          minSize={40}
          className="flex min-h-0 flex-col"
        >
          {/* Workspace header with tabs */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-background/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">ML Workspace</span>
              {activeFragment && (
                <Badge variant="secondary" className="ml-2 bg-blue-400 text-xs">
                  {activeFragment.title}
                </Badge>
              )}
            </div>
          </div>

          {/* Cool Navigation Bar */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-md mx-4 my-4">
            <div className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 h-full flex flex-col">
                <TabsList className="grid gap-35 grid-cols-3 bg-transparent h-auto p-0 flex-shrink-0">
                  <TabsTrigger
                    value="ai-brain"
                    className="data-[state=active]:bg-white/90 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-lg data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/30 hover:border-white/50 hover:rounded-lg hover:shadow-sm hover:scale-105 rounded-none px-4 py-3 text-sm gap-2 justify-start transition-all duration-300"
                  >
                    <BrainCircuitIcon className="h-4 w-4" />
                    <span>AI Brain & Model Control</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="data-intelligence"
                    className="data-[state=active]:bg-white/90 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-lg data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/30 hover:border-white/50 hover:rounded-lg hover:shadow-sm hover:scale-105 rounded-none px-4 py-3 text-sm gap-2 justify-start transition-all duration-300"
                  >
                    <DatabaseIcon className="h-4 w-4" />
                    <span>Data Intelligence</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notebook"
                    className="data-[state=active]:bg-white/90 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-lg data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-white/30 hover:border-white/50 hover:rounded-lg hover:shadow-sm hover:scale-105 rounded-none px-4 py-3 text-sm gap-2 justify-start transition-all duration-300"
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    <span>Execution Notebook</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 h-full flex flex-col">
              <TabsContent value="ai-brain" className="m-0 h-full overflow-hidden">
                {activeFragment ? (
                  <AIBrainPanel data={activeFragment} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                    <BrainCircuitIcon className="h-16 w-16 text-muted-foreground/20" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        AI Brain & Model Control
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Start a conversation to access model configuration, testing, metrics, and comparison tools.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data-intelligence" className="m-0 h-full overflow-hidden">
                {activeFragment ? (
                  <Tabs defaultValue="samples" className="h-full flex flex-col mt-4">
                    <TabsList className="grid gap-50 grid-cols-3 scale-110 mb-4 bg-transparent h-auto p-0 flex-shrink-0">
                      <TabsTrigger value="samples" className="bg-background text-foreground shadow-sm border border-border rounded-md ml-20 px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
                        Data Samples
                      </TabsTrigger>
                      <TabsTrigger value="intelligence" className="bg-background text-foreground shadow-sm border border-border rounded-md px-3 py-1.5 mr-5 ml-5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
                        Intelligence
                      </TabsTrigger>
                      <TabsTrigger value="pipeline" className="bg-background text-foreground shadow-sm border border-border rounded-md mr-20 px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary hover:bg-muted hover:shadow-md transition-all duration-200">
                        Pipeline
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="samples" className="flex-1 m-0 overflow-hidden">
                      <DataSamples data={activeFragment} />
                    </TabsContent>
                    <TabsContent value="intelligence" className="flex-1 m-0 overflow-hidden">
                      <DataIntelligenceDashboard data={activeFragment} />
                    </TabsContent>
                    <TabsContent value="pipeline" className="flex-1 m-0 overflow-hidden">
                      <PipelineNarrative data={activeFragment} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                    <DatabaseIcon className="h-16 w-16 text-muted-foreground/20" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Data Intelligence & Pipeline Transparency
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Explore your data, understand preprocessing steps, and follow the agent's pipeline narrative.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notebook" className="m-0 h-full overflow-hidden">
                {activeFragment ? (
                  <NotebookViewer data={activeFragment} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                    <BookOpenIcon className="h-16 w-16 text-muted-foreground/20" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Execution Notebook
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        View complete execution flow with interactive cells and detailed documentation.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ProjectView