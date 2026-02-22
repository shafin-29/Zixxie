'use client'

import Image from "next/image"
import { motion } from "framer-motion"

export const HowItWorksSection = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl p-8 bg-gray-900/50 mt-40">
      <Image
        src="https://framerusercontent.com/images/iJ55obhuijBeJ3Lq3yxzKMzvvRo.png"
        alt="How Zixxy works"
        fill
        className="object-cover"
        quality={100}
        priority
      />

      <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-white"
        >
          How{" "}
          <span className="text-primary font-bold italic">Zixxy</span>{" "}
          does it
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-5xl font-semibold text-white leading-tight"
        >
          One prompt in → Production model out
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base text-white/80 leading-relaxed"
        >
          No notebooks. No manual tuning. No deployment headaches. Describe your ML problem, 
          and the agent handles everything — EDA, feature engineering, model training, 
          evaluation, and packaging — like a senior ML engineer working at full speed.
        </motion.p>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 pointer-events-none rounded-2xl" />
    </div>
  )
}