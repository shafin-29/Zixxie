"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const Page = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <button
            onClick={() => router.back()}
            className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            ← Back
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-background border border-border rounded-2xl p-12 shadow-lg">
          {/* Brand Section */}
          <div className="mb-12">
            <button
              onClick={() => router.push("/")}
              className="group relative inline-block"
            >
              <h1 className="text-4xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                Zixxy
              </h1>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500 ease-out"></span>
            </button>
            <p className="text-muted-foreground mt-2 text-lg">Making the future happen, not waiting for it</p>
          </div>

          {/* Story Content */}
          <div className="space-y-8 mb-12">
            <div className="border-l-4 border-primary pl-6 py-2">
              <p className="text-lg leading-relaxed text-muted-foreground">
                I didn’t come from a <span className="text-primary font-medium">university pipeline or follow a traditional academic path.</span><span className="text-foreground font-semibold"> I’m self-taught,</span> no college background, no formal credentials—just years of learning by doing, breaking things, fixing them, and writing code late into the night.
              </p>
            </div>

            <div className="border-l-4 border-muted pl-6 py-2">
              <p className="text-lg leading-relaxed text-muted-foreground">
                <span className="text-primary font-semibold">Zixxy</span> isn’t just something I built for fun. It’s <span className="text-foreground font-medium">proof</span>. Proof that someone without institutional backing, financial privilege, or a polished resume can still create real, competitive technology. I build. No buzzwords, no shortcuts—just ideas turned into working systems.<span className="text-primary font-semibold"> Execution, creativity</span>, and belief that ideas are worthless until they're built.
              </p>
            </div>

            <div className="border-l-4 border-muted pl-6 py-2">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Every feature in this product stands for something simple but powerful; talent isn’t owned by elite schools, innovation doesn’t require permission, and progress doesn’t wait for approval. What matters is drive—the kind that keeps you going when there’s no safety net underneath you. You just need <span className="text-primary font-semibold">fire</span>.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-6 py-2">
              <p className="text-lg leading-relaxed text-muted-foreground">
                This is where I am right now. Starting from zero, learning everything the hard way, and <span className="text-foreground font-semibold">aiming</span>. far beyond where I began. Zixxy isn’t the finish line—it’s the first real step.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="inline-block p-6 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-muted-foreground mb-4">
                Ready to see what's possible?
              </p>
              <button
                onClick={() => router.push("/")}
                className="group relative bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Explore Zixxy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;