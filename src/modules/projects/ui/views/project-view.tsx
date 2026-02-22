'use client'

import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { FragmentWeb } from "../components/fragment-web"
import { Fragment } from "@prisma/client"
import { ProjectHeader } from "../components/project-header"
import { BrainCircuitIcon, Loader2, AlertCircle } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

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

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <ResizablePanelGroup
        direction="horizontal"
        className="animate-in fade-in duration-500"
      >
        {/* LEFT PANEL — Chat */}
        <ResizablePanel defaultSize={38} minSize={25} className="flex flex-col min-h-0">
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
          defaultSize={62}
          minSize={30}
          className="flex min-h-0 flex-col"
        >
          {/* Workspace header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-background/50 backdrop-blur-sm flex-shrink-0">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">ML Workspace</span>
            {activeFragment && (
              <span className="ml-2 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {activeFragment.title}
              </span>
            )}
          </div>

          {/* Workspace content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeFragment ? (
              <FragmentWeb data={activeFragment} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                <div className="relative">
                  <BrainCircuitIcon className="h-16 w-16 text-muted-foreground/20" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    ML Workspace
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Start a conversation to build your ML pipeline. Results, metrics, and artifacts will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ProjectView