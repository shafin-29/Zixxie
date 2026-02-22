'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { useState, useRef, useEffect, useCallback } from "react"
import { z } from "zod"
import {
  ArrowUpIcon,
  Loader2Icon,
  PaperclipIcon,
  XIcon,
  FileTextIcon,
  BrainCircuitIcon,
  CreditCardIcon,
} from "lucide-react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { Usage } from "./usage"
import { useAuth } from "@clerk/nextjs"
import { createPortal } from "react-dom"

interface Props {
  projectId: string
}

interface FileData {
  name: string
  content: string // base64
  mimeType: string
  size: number
}

const GlassEffect: React.FC<{ children: React.ReactNode; className?: string; onDragOver?: (e: React.DragEvent) => void; onDragLeave?: () => void; onDrop?: (e: React.DragEvent) => Promise<void> }> = ({
  children,
  className = "",
  onDragOver,
  onDragLeave,
  onDrop,
}) => (
  <div className={`relative overflow-hidden rounded-3xl ${className}`}>
    <div
      className="absolute inset-0 z-0 rounded-3xl"
      style={{ backdropFilter: "blur(14px)", background: "rgba(255, 255, 255, 0.15)" }}
    />
    <div
      className="absolute inset-0 z-10 rounded-3xl"
      style={{
        boxShadow:
          "inset 2px 2px 6px rgba(255,255,255,0.35), inset -2px -2px 6px rgba(0,0,0,0.1)",
      }}
    />
    <div className="relative z-20">{children}</div>
  </div>
)

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message cannot be empty" })
    .max(5000, { message: "Message cannot be longer than 5000 characters" }),
})

// Allowed file types for ML tasks
const ALLOWED_TYPES = [
  "text/csv",
  "application/json",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]
const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".xlsx", ".xls", ".tsv"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const MessageForm = ({ projectId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { has } = useAuth()
  const hasProAccess = has?.({ plan: "pro" })

  const [attachedFile, setAttachedFile] = useState<FileData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCredits, setShowCredits] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
    mode: "onChange",
  })

  const { data: usage } = useQuery(trpc.usage.status.queryOptions())

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset()
        setAttachedFile(null)
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        )
        queryClient.invalidateQueries(trpc.usage.status.queryOptions())
      },
      onError: () => toast.error("Failed to send message"),
    })
  )

  const isPending = createMessage.isPending
  const isButtonDisabled = isPending || !form.formState.isValid

  // Model selector
  const models = [
    {
      name: "kimi",
      label: "Auto",
      isPro: false,
      description: "NVIDIA NIM · Free · 128k context",
    },
  ]
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [dropdownOpen])

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Strip the data URL prefix (e.g. "data:text/csv;base64,")
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const processFile = useCallback(async (file: File) => {
    // Validate extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`)
      return
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.")
      return
    }

    try {
      const base64Content = await fileToBase64(file)
      setAttachedFile({
        name: file.name,
        content: base64Content,
        mimeType: file.type || "text/plain",
        size: file.size,
      })
      toast.success(`${file.name} attached successfully`)
    } catch {
      toast.error("Failed to read file")
    }
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await processFile(file)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [processFile]
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) await processFile(file)
    },
    [processFile]
  )

  const removeFile = useCallback(() => {
    setAttachedFile(null)
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>): Promise<void> => {
    await createMessage.mutateAsync({
      value: values.value,
      projectId,
      model: selectedModel.name as "kimi",
      fileData: attachedFile ?? undefined,
    })
  }

  return (
    <Form {...form}>
      {/* Credits toggle button */}
      {usage && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowCredits(!showCredits)}
            className="flex items-center mr-3 gap-1.5 px-2 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-all duration-200"
          >
            <CreditCardIcon className="h-3 w-3" />
            {usage.remainingPoints} credits
          </button>
        </div>
      )}

      {/* Credits dropdown */}
      {showCredits && usage && (
        <div className="mb-4 p-3 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg">
          <Usage
            points={usage.remainingPoints}
            msBeforeNext={usage.msBeforeNext}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <section className="flex flex-col items-center w-full">
        <GlassEffect
          className={cn(
            "w-full max-w-3xl p-4 transition-all duration-500 border border-primary/20 shadow-lg",
            form.formState.isDirty && "scale-[1.01] ring-2 ring-primary/40",
            isDragging && "ring-2 ring-primary border-primary scale-[1.01]"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3 relative"
          >
            {/* Drag overlay hint */}
            {isDragging && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-primary/10 border-2 border-dashed border-primary">
                <div className="flex flex-col items-center gap-2 text-primary">
                  <PaperclipIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Drop file to attach</span>
                </div>
              </div>
            )}

            {/* Attached file preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                <FileTextIcon className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {attachedFile.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(attachedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-primary/20 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Textarea */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <TextareaAutosize
                  {...field}
                  onFocus={() => setDropdownOpen(false)}
                  disabled={isPending}
                  minRows={2}
                  maxRows={8}
                  placeholder={
                    attachedFile
                      ? `Describe what to do with ${attachedFile.name}...`
                      : "Describe your ML task or drop a CSV file here..."
                  }
                  className={cn(
                    "w-full resize-none border-none bg-transparent text-foreground placeholder:text-foreground/70 focus:ring-0 outline-none transition-all duration-300",
                    "scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent hover:scrollbar-thumb-primary/70"
                  )}
                />
              )}
            />

            <div className="flex items-center justify-between gap-x-2">
              {/* Left: attach + model */}
              <div className="flex items-center gap-2">
                {/* Paperclip button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-200",
                    attachedFile && "border-primary/50 bg-primary/10 text-primary",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title="Attach CSV, JSON, or Excel file"
                >
                  <PaperclipIcon className="h-3.5 w-3.5" />
                </button>

                {/* Model selector */}
                <div className="relative">
                  <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-sm bg-white/20 dark:bg-white/10 border-white/20 text-foreground hover:bg-white/30 transition-all text-xs"
                  >
                    <BrainCircuitIcon className="h-3 w-3 text-primary" />
                    <span className="font-medium">{selectedModel.label}</span>
                  </button>

                  {dropdownOpen &&
                    buttonRef.current &&
                    createPortal(
                      <div
                        ref={(el) => {
                          if (!el) return
                          const rect =
                            buttonRef.current!.getBoundingClientRect()
                          const scrollY = window.scrollY
                          el.style.top = `${rect.top + scrollY - el.offsetHeight - 4}px`
                          el.style.left = `${rect.left + window.scrollX}px`
                          el.style.width = `${Math.max(rect.width, 240)}px`
                        }}
                        className="rounded-xl bg-background/95 backdrop-blur-md border border-border shadow-lg overflow-hidden z-[9999]"
                        style={{ position: "absolute" }}
                      >
                        {models.map((model) => (
                          <button
                            key={model.name}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model)
                              setDropdownOpen(false)
                            }}
                            className="flex flex-col w-full px-3 py-2.5 text-left transition-all hover:bg-primary/10"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <BrainCircuitIcon className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium text-foreground">
                                {model.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 pl-5">
                              {model.description}
                            </span>
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                </div>
              </div>

              {/* Right: send button */}
              <div className="flex items-center gap-2">
                <Button
                  className={cn(
                    "size-8 rounded-full transition-all hover:scale-105",
                    isButtonDisabled
                      ? "bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-sm opacity-50 cursor-not-allowed hover:scale-100"
                      : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  )}
                  disabled={isButtonDisabled}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isPending ? (
                    <Loader2Icon className="animate-spin size-4" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </GlassEffect>

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Supports CSV, JSON, Excel, TXT · Max 10MB · Drag & drop supported
        </p>
      </section>

      <style jsx global>{`
        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.5); border-radius: 9999px; }
        textarea::-webkit-scrollbar-thumb:hover { background: rgba(96,165,250,0.7); }
      `}</style>
    </Form>
  )
}

export default MessageForm