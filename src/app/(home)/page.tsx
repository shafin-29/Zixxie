'use client'

import ProjectForm from "@/modules/home/ui/components/project-form"
import { ChevronDownIcon } from "lucide-react"
import BlurText from "@/components/21stdev/blur-text"
import { HowItWorksSection } from "@/modules/home/ui/components/tagline"
import { Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { ProjectsList } from "@/modules/home/ui/components/projects-list"
import { Features } from "@/modules/home/ui/components/features-bento"

const Page = () => {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight - 100, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full bg-transparent">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <BlurText
          text="Your AI ML Engineer. From Data to Deployment."
          className="font-bold text-4xl md:text-5xl mb-20 mt-10 text-center transition-all duration-300 pl-26"
        />
        <p className="text-lg md:text-xl text-muted-foreground text-center hover:italic">
           any ML problem — get a{" "}
          <strong className="text-primary italic">production-ready model</strong>{" "}
          with metrics, artifacts, and deployment code.
        </p>

        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>

        {!isSignedIn && (
          <div className="flex justify-center">
            <button
              onClick={scrollToContent}
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300 group"
            >
              <span className="text-sm font-medium">See how it works</span>
              <ChevronDownIcon className="h-5 w-5 animate-bounce group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {isSignedIn ? (
          <div className="mt-20">
            <ProjectsList />
          </div>
        ) : (
          <>
            <HowItWorksSection />
            <Features />
            <div className="flex items-center justify-center w-full">
              <p className="text-7xl font-semibold text-center tracking-tighter cursor-pointer text-foreground transition-all duration-300 ease-in-out hover:-translate-y-2">
                Stop Guessing.{" "}
                <span className="text-primary">Start Training.</span>
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default Page