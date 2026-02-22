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
  BrainCircuitIcon,
  BarChart2Icon,
  FileTextIcon,
  NetworkIcon,
  ClockIcon,
  ImageIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { useRouter } from "next/navigation"
import { useClerk, useAuth } from "@clerk/nextjs"
import { PoweredBy } from "./prompt-su"
import { createPortal } from "react-dom"
import ShinyText from "@/components/ShinyText"

const GlassEffect: React.FC<{
  children: React.ReactNode
  className?: string
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}> = ({ children, className = "", onDragOver, onDragLeave, onDrop }) => (
  <div
    className={`relative overflow-hidden rounded-3xl ${className}`}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <div
      className="absolute inset-0 z-0 rounded-3xl"
      style={{ backdropFilter: "blur(14px)", background: "rgba(255,255,255,0.15)" }}
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

const ML_TASK_CHIPS = [
  { label: "Classification", icon: BrainCircuitIcon, prompt: "Train a classification model to predict " },
  { label: "Regression", icon: BarChart2Icon, prompt: "Build a regression model to predict " },
  { label: "NLP / Text", icon: FileTextIcon, prompt: "Build an NLP pipeline for " },
  { label: "Neural Network", icon: NetworkIcon, prompt: "Design and train a neural network for " },
  { label: "Time Series", icon: ClockIcon, prompt: "Build a time series forecasting model for " },
  { label: "Computer Vision", icon: ImageIcon, prompt: "Train a computer vision model to " },
]

interface FileData {
  name: string
  content: string
  mimeType: string
  size: number
}

type Model = {
  name: string
  label: string
  icon: React.ReactNode | null
  isPro: boolean
}

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".xlsx", ".xls", ".tsv"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const ProjectForm = () => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const clerk = useClerk()
  const { has } = useAuth()
  const hasProAccess = has?.({ plan: "pro" }) ?? false

  const [attachedFile, setAttachedFile] = useState<FileData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
    mode: "onChange",
  })

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions())
        router.push(`/projects/${data.id}`)
        queryClient.invalidateQueries(trpc.usage.status.queryOptions())
      },
      onError: (error) => {
        toast.error(error.message)
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn()
        if (error.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing")
      },
    })
  )

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model>({
    name: "kimi",
    label: "Auto",
    icon: null,
    isPro: false,
  })

  const models: Model[] = [
    { name: "kimi", label: "Auto", icon: null, isPro: false },
  ]

  const isPending = createProject.isPending
  const isButtonDisabled = isPending || !form.formState.isValid

  const buttonRef = useRef<HTMLDivElement>(null)
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
  }, [dropdownOpen])

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(",")[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const processFile = useCallback(async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`)
      return
    }
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
      toast.success(`${file.name} attached`)
    } catch {
      toast.error("Failed to read file")
    }
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await processFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [processFile]
  )

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
      model: selectedModel.name,
      fileData: attachedFile ?? undefined,
    })
  }

  const handleChipClick = (prompt: string) => {
    form.setValue("value", prompt, { shouldValidate: true })
    form.setFocus("value")
  }

  return (
    <Form {...form}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <section className="flex flex-col items-center w-full gap-3">
        {/* ML task chips */}
        <div className="flex flex-wrap justify-center gap-2 w-full max-w-3xl mb-1">
          {ML_TASK_CHIPS.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleChipClick(prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-all duration-200"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <GlassEffect
          className={cn(
            "w-full max-w-3xl p-6 transition-all duration-500 border border-primary/20 shadow-lg",
            isFocused && "scale-[1.01] ring-2 ring-primary/40",
            isDragging && "ring-2 ring-primary border-primary scale-[1.01]"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 relative dark:text-white"
          >
            {/* Drag overlay */}
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
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-muted-foreground/30 rounded-xl w-fit">
                <FileTextIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                  onClick={() => setAttachedFile(null)}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-muted-foreground/20 transition-colors"
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
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isPending}
                  minRows={3}
                  maxRows={12}
                  placeholder={
                    attachedFile
                      ? `Describe what to do with ${attachedFile.name}...` 
                      : "Describe your ML task or drop a CSV/Excel file here..."
                  }
                  className={cn(
                    "w-full resize-none border-none bg-transparent text-foreground placeholder:text-foreground/70 focus:ring-0 outline-none transition-all duration-300",
                    "scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent hover:scrollbar-thumb-primary/70"
                  )}
                  style={{ scrollbarColor: "#60a5fa66 transparent" }}
                />
              )}
            />

            <div className="flex items-center justify-between gap-x-2 relative">
              {/* Left: paperclip + model */}
              <div className="flex items-center gap-2">
                {/* Paperclip */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-200",
                    attachedFile && "border-muted-foreground/50 bg-muted/50 text-muted-foreground",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title="Attach CSV, JSON, or Excel file"
                >
                  <PaperclipIcon className="h-3.5 w-3.5" />
                </button>

                {/* Model badge */}
                <div
                  ref={buttonRef}
                  className={cn(
                    "relative group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all backdrop-blur-md border shadow-sm cursor-pointer",
                    "bg-white/20 dark:bg-white/10 border-white/20 text-muted-foreground hover:bg-white/30"
                  )}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <BrainCircuitIcon className="h-3 w-3" />
                  {selectedModel.label}
                  <span className="absolute bottom-full mb-1 hidden group-hover:block text-[9px] text-muted-foreground bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                    Powered by NVIDIA NIM
                  </span>
                </div>
              </div>

              {/* Send button */}
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

              {dropdownOpen &&
                buttonRef.current &&
                createPortal(
                  <div
                    className="rounded-xl bg-background/95 backdrop-blur-md border border-border shadow-lg overflow-hidden min-w-[250px] z-[9999]"
                    style={{
                      position: "absolute",
                      top: dropdownCoords.top + window.scrollY,
                      left: dropdownCoords.left + window.scrollX,
                      width: Math.max(dropdownCoords.width, 250),
                    }}
                  >
                    {models.map((model) => (
                      <button
                        key={model.name}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model)
                          setDropdownOpen(false)
                        }}
                        className="flex flex-col w-full px-4 py-3 text-left transition-all duration-150 rounded-lg text-foreground hover:bg-primary/10"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuitIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{model.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          NVIDIA NIM · Free tier · 128k context
                        </span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
            </div>
          </form>
        </GlassEffect>

        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Supports CSV, JSON, Excel, TXT · Max 10MB · Drag & drop supported
        </p>
        <ShinyText className="mt-1" text="Describe your ML problem → Get production-ready models" />
        <PoweredBy />
      </section>
    </Form>
  )
}

export default ProjectForm
