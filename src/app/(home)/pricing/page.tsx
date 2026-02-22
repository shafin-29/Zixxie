"use client";

import { Check, Shield, Cpu, Gauge, Headphones, Crown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [focusedPlan, setFocusedPlan] = useState<string | null>(null);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/sign-up");
  };

  // Loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full px-4">
      <section className="space-y-16 pt-[16vh] 2xl:pt-48 pb-24">
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Choose Your Plan
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Try it free first, and upgrade as your professional needs grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-white/10 p-1 rounded-lg border border-white/20 backdrop-blur-md shadow-md">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                !isYearly 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative ${
                isYearly 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div
            onMouseEnter={() => setFocusedPlan("free")} 
            onMouseLeave={() => setFocusedPlan(null)}
            className={`relative bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-md transition-all duration-300 p-8 ${
              focusedPlan === "free" 
                ? 'border-white/30 shadow-lg' 
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">Free</h3>
                  <p className="text-sm text-foreground/60">
                    Get started with essential features
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-foreground/60" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-bold text-foreground">$0</div>
                <p className="text-sm text-foreground/60">Forever free</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Community projects</div>
                    <div className="text-xs text-foreground/60">Make your work visible to others</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Auto AI model</div>
                    <div className="text-xs text-foreground/60">Reliable AI-powered development</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Quick Deploy</div>
                    <div className="text-xs text-foreground/60">Simple app deployment</div>
                  </div>
                </div>
              </div>

              {/* Conditional button based on authentication */}
              {isSignedIn ? (
                <button 
                  disabled
                  className="w-full py-3 px-4 bg-foreground/5 text-foreground/40 border border-foreground/10 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Current plan
                </button>
              ) : (
                <button 
                  onClick={handleGetStarted}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground border border-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              )}
            </div>
          </div>

          {/* Pro Plan */}
          <div
            onMouseEnter={() => setFocusedPlan("pro")}
            onMouseLeave={() => setFocusedPlan(null)}
            className={`relative bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-md transition-all duration-300 p-8 ${
              focusedPlan === "pro" 
                ? 'border-white/40 shadow-xl' 
                : 'border-white/25'
            }`}
          >
            {/* Recommended badge */}
            <div className="absolute -top-3 left-6">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Recommended
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                  <p className="text-sm text-foreground/60">
                  Built for advanced use cases
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  {isYearly && (
                    <span className="text-xl text-foreground/40 line-through">$180</span>
                  )}
                  <div className="text-3xl font-bold text-foreground">
                    ${isYearly ? "149" : "15"}
                  </div>
                  <span className="text-sm text-foreground/60">
                    per {isYearly ? "year" : "month"}
                  </span>
                </div>
                <p className="text-xs text-foreground/60">
                  {isYearly ? "Billed annually" : "Billed monthly"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Private repositories</div>
                    <div className="text-xs text-foreground/60">Keep your code secure and confidential</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Cpu className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Premium AI models</div>
                    <div className="text-xs text-foreground/60">Access GPT-5.1, Opus-4.6, Grok-4.1, and more</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Gauge className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Accelerated deployment</div>
                    <div className="text-xs text-foreground/60">3x faster with dedicated infrastructure</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Unlimited usage</div>
                    <div className="text-xs text-foreground/60">No request limits on free models</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Headphones className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Expert support</div>
                    <div className="text-xs text-foreground/60">Get help straight from our team</div>
                  </div>
                </div>
              </div>

              <button 
                disabled
                className={`w-full py-3 px-4 rounded-lg text-sm font-medium cursor-not-allowed transition-all duration-300 border ${
                  focusedPlan === "pro" 
                    ? 'bg-primary/10 border-primary/30 text-foreground/70' 
                    : 'bg-foreground/5 border-foreground/20 text-foreground/50'
                }`}
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-foreground/60">
            All plans come with community access and continuous updates
          </p>
          <p className="text-sm text-foreground/60">
          Need a custom plan? <a href="mailto:zixxy1010@gmail.com" target="_blank" rel="noopener noreferrer"><span className="text-primary cursor-pointer hover:underline">Contact us</span></a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default PricingSection;
