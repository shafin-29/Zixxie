'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { UserControl } from "@/components/user-control"
import { useScroll } from "@/hooks/use-scroll"
import { FiGithub } from "react-icons/fi"
import { InteractiveHoverButton } from "@/components/21stdev/interactive-hover-button"
import { Usage } from "@/modules/projects/ui/components/usage"
import { useQuery } from "@tanstack/react-query"
import { CreditCardIcon } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export const Navbar = () => {
  const isScrolled = useScroll()
  const [mounted, setMounted] = useState(false)
  const [showCredits, setShowCredits] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const trpc = useTRPC()
  const { data: usage } = useQuery(trpc.usage.status.queryOptions())

  const navItems = [
    { name: "Pricing", href: "/pricing" },
  ]

  const resources = [
    {
      title: "About",
      href: "/about",
      description: "Learn about the Zixxy platform and our mission.",
    },
    {
      title: "Terms",
      href: "/terms",
      description: "Understand the rules of using our platform.",
    },
    {
      title: "Privacy",
      href: "/privacy",
      description: "How we protect and handle your data.",
    },
  ]

  return (
    <div
      className={cn(
        "fixed top-4 left-0 right-0 z-50 flex items-center px-4 transition-all duration-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      {/* Center pill */}
      <nav
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center gap-3 transition-all duration-500 backdrop-blur-md shadow-lg rounded-full px-3 py-1.5",
          isScrolled ? "gap-2 py-1" : "gap-3 py-1.5"
        )}
        style={{
          background:
            "linear-gradient(90deg, rgba(0, 212, 255, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(2, 0, 36, 1) 100%)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/mylogo.png"
            alt="Zixxy"
            width={isScrolled ? 24 : 30}
            height={isScrolled ? 24 : 30}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          <span
            className={cn(
              "italic font-bold transition-colors duration-300 text-white",
              isScrolled ? "text-sm" : "text-base",
              "group-hover:text-white/80"
            )}
          >
            Zixxy
          </span>
        </Link>

        {/* Nav Items */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 rounded-full transition-all duration-300 font-semibold",
            isScrolled ? "gap-1.5 px-2" : "gap-2 px-2"
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative group px-2 py-1 rounded-full text-white hover:text-white/80 transition-colors duration-300 text-sm"
            >
              {item.name}
              <span className="absolute left-1/2 -bottom-1 h-0.5 w-0 bg-primary rounded-full transition-all duration-500 group-hover:w-2/3 -translate-x-1/2" />
            </Link>
          ))}

          {/* Resources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative group flex items-center gap-1 px-2 py-1 rounded-full text-white hover:text-white/80 transition-colors duration-300 text-sm">
                Resources
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-xl w-[420px] grid grid-cols-2 gap-3 shadow-md"
              align="center"
            >
              {resources.map((item) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link
                    href={item.href}
                    className="flex flex-col items-start gap-0.5 p-2 rounded-lg transition-all duration-200 bg-muted/30 border border-border hover:bg-muted/60 hover:text-primary"
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* GitHub */}
          <a
            href="https://github.com/shafin-29/Zixxy.git"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group flex items-center justify-center p-1.5 rounded-full hover:bg-primary/10 transition-all duration-300"
          >
            <FiGithub
              className={cn(
                "text-white",
                isScrolled ? "w-4 h-4" : "w-4.5 h-4.5",
                "transition-transform duration-300 group-hover:scale-110"
              )}
            />
          </a>
        </div>
      </nav>

      {/* Right side */}
      <div className="flex items-center ml-auto gap-2 relative">
        {/* Credits button */}
        {usage && (
          <button
            onClick={() => setShowCredits(!showCredits)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-all duration-200"
          >
            <CreditCardIcon className="h-3 w-3" />
            {usage.remainingPoints} credits
          </button>
        )}
        
        <SignedOut>
          <SignUpButton>
            <InteractiveHoverButton text="Sign Up" />
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserControl />
        </SignedIn>

        {/* Credits dropdown */}
        {showCredits && usage && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-lg z-50">
            <Usage
              points={usage.remainingPoints}
              msBeforeNext={usage.msBeforeNext}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar