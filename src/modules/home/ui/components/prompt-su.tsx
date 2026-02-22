'use client'

import { motion } from "framer-motion"
import {
  SiClerk,
  SiNextdotjs,
  SiReact,
  SiTailwindcss,
  SiTrpc,
  SiPrisma,
  SiPython,
  SiScikitlearn,
  SiPytorch,
  SiHuggingface,
  SiFastapi,
} from "react-icons/si"
import { FiCodesandbox } from "react-icons/fi"
import ShinyText from "@/components/ShinyText"

const poweredBy = [
  { name: "React", tooltip: "React — UI Library", icon: <SiReact /> },
  { name: "Next.js", tooltip: "Next.js — React Framework", icon: <SiNextdotjs /> },
  { name: "Python", tooltip: "Python — ML Runtime", icon: <SiPython /> },
  { name: "PyTorch", tooltip: "PyTorch — Deep Learning", icon: <SiPytorch /> },
  { name: "Scikit-learn", tooltip: "Scikit-learn — ML Library", icon: <SiScikitlearn /> },
  { name: "HuggingFace", tooltip: "HuggingFace — Transformers", icon: <SiHuggingface /> },
  { name: "FastAPI", tooltip: "FastAPI — Model Serving", icon: <SiFastapi /> },
  { name: "E2B", tooltip: "E2B — Sandboxed Execution", icon: <FiCodesandbox /> },
  { name: "Clerk", tooltip: "Clerk — Auth", icon: <SiClerk /> },
  { name: "tRPC", tooltip: "tRPC — Type-safe APIs", icon: <SiTrpc /> },
  { name: "Prisma", tooltip: "Prisma — Database ORM", icon: <SiPrisma /> },
  { name: "Tailwind", tooltip: "Tailwind CSS — Styling", icon: <SiTailwindcss /> },
]

export const PoweredBy = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="inline-flex flex-col items-start bg-white/10 border border-white/20 backdrop-blur-md rounded-xl px-6 py-4 shadow-md gap-4 mt-13"
    >
      <ShinyText text="Powered by" className="font-semibold" />

      <div className="flex flex-wrap gap-4">
        {poweredBy.map((tool, i) => (
          <motion.div
            key={tool.name}
            title={tool.tooltip}
            className="w-6 h-6 flex items-center justify-center text-2xl cursor-pointer text-foreground hover:text-primary transition-colors duration-200"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1 * i,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            whileHover={{
              scale: 1.3,
              opacity: 1,
              transition: { type: "spring", stiffness: 400 },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {tool.icon}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}