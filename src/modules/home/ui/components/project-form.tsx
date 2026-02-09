"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useClerk, useAuth } from "@clerk/nextjs";
import { SiOpenai } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { PoweredBy } from "./prompt-su";
import { createPortal } from "react-dom";
import ShinyText from "@/components/ShinyText";

// Glass effect wrapper
const GlassEffect: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`relative overflow-hidden rounded-3xl ${className}`}>
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
);

// Zod schema
const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message cannot be empty" })
    .max(5000, { message: "Message cannot be longer than 5000 characters" }),
});

// Model type
type Model = {
  name: string;
  label: string;
  icon: React.ReactNode | null;
  isPro: boolean;
};

export const ProjectForm = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const { has } = useAuth();

  const hasProAccess = has?.({ plan: "pro" }) ?? false;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
    mode: "onChange",
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        router.push(`/projects/${data.id}`);
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        if (error.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing");
      },
    })
  );

  const [isFocused, setIsFocused] = useState(false);
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  // Model selector
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>({
    name: "deepseek",
    label: "Auto",
    icon: null,
    isPro: false,
  });

  const models: Model[] = [
    { name: "deepseek", label: "Auto", icon: null, isPro: false },
  ];

  type SubmitData = z.infer<typeof formSchema> & { model: "deepseek" };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const data: SubmitData = { ...values, model: selectedModel.name as "deepseek"};
    await createProject.mutateAsync(data);
  };

  // Dropdown position
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [dropdownOpen]);

  return (
    <Form {...form}>
      <section className="flex flex-col items-center w-full">
        <GlassEffect
          className={cn(
            "w-full max-w-3xl p-6 transition-all duration-500 border border-primary/20 shadow-lg",
            isFocused && "scale-[1.01] ring-2 ring-primary/40"
          )}
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 relative dark:text-white">
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
                  placeholder="Describe your idea or ask a question..."
                  className={cn(
                    "w-full resize-none border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0 outline-none transition-all duration-300",
                    "scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent hover:scrollbar-thumb-primary/70"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)(e);
                    }
                  }}
                  style={{ scrollbarColor: "#60a5fa66 transparent" }}
                />
              )}
            />

            <div className="flex items-center justify-between gap-x-2 relative">
              {/* Left side: Model selector */}
              <div
                ref={buttonRef}
                className={cn(
                  "relative group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all backdrop-blur-md border shadow-sm cursor-pointer",
                  selectedModel.isPro
                    ? hasProAccess
                      ? "bg-primary text-primary-foreground border-primary/50 shadow-md scale-105"
                      : "bg-white/20 dark:bg-white/10 border-white/20 text-muted-foreground cursor-not-allowed"
                    : "bg-white/20 dark:bg-white/10 border-white/20 text-muted-foreground hover:bg-white/30"
                )}
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                {selectedModel.icon && <span className="size-3">{selectedModel.icon}</span>}
                {selectedModel.label}

                {/* Tooltip */}
                <span className="absolute bottom-full mb-1 hidden group-hover:block text-[9px] text-muted-foreground bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                  Select a model to use
                </span>
              </div>

              {/* Right side: send button */}
              <div className="flex items-center gap-x-2">
                <Button
                  className={cn(
                    "size-8 rounded-full transition-all hover:scale-105",
                    isButtonDisabled
                      ? "bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-sm opacity-50 cursor-not-allowed hover:scale-100 hover:bg-white/30"
                      : "bg-primary text-primary-foreground shadow-md hover:bg-primary/40"
                  )}
                  disabled={isButtonDisabled}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isPending ? (
                    <Loader2Icon className="animate-spin size-4 text-primary bg-primary" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
                  )}
                </Button>
              </div>


              {dropdownOpen && buttonRef.current &&
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
                    {models.map((model) => {
                      const disabled = model.isPro && !hasProAccess;
                      const isBest = model.name === "codex";

                      return (
                        <button
                          key={model.name}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (!disabled) setSelectedModel(model);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            "flex flex-col w-full px-4 py-3 text-left transition-all duration-150 rounded-lg",
                            disabled
                              ? "text-muted-foreground cursor-not-allowed opacity-60"
                              : "text-foreground hover:bg-primary/10 hover:scale-[1.01]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {model.icon && <span className="size-4">{model.icon}</span>}
                            <span className="font-medium">{model.label}</span>
                            {model.isPro && (
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary text-primary-foreground">
                                PRO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {model.name === "deepseek" && "Best model for general use"}
                          </span>
                        </button>
                      );
                    })}
                    
                  </div>,
                  document.body
                )
              }
              
            </div>
          </form>
        </GlassEffect>
        <ShinyText className="mt-2" text="Sharper prompts → Smarter results"  />

        <PoweredBy />
      </section>
    </Form>
  );
};

export default ProjectForm;
