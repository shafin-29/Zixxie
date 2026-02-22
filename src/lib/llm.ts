// Sandbox configuration
export const SANDBOX_CONFIG = {
  // Legacy Next.js sandbox (Zixxy original - keep for reference)
  nextjs: {
    templateId: process.env.E2B_TEMPLATE_ID || "",
    templateName: "zixxy1010/zixxy-dev-test-2",
  },
  // New ML Python sandbox
  mlPython: {
    templateId: process.env.E2B_ML_TEMPLATE_ID || "",
    templateName: "ml-python-agent",
  },
} as const;

export type SandboxType = keyof typeof SANDBOX_CONFIG;
