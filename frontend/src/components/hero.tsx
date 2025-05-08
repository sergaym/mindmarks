'use client';

import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import { BackgroundPattern } from "./layout/background-pattern";
import { cn } from "@/lib/utils";

const Hero = () => {
  // Uncomment the color version you prefer:
  
  // Blue version
  const badgeClasses = "inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50";
  
  // Green version
  // const badgeClasses = "inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <BackgroundPattern />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        <span className={badgeClasses}>
          Your Digital Reading Journal
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold !leading-[1.2] tracking-tight">
          Collect, Annotate, Get AI Insights
        </h1>
        <p className="mt-6 text-[17px] md:text-lg text-muted-foreground">
          Save interesting articles, add your thoughts as you read, and use AI to extract key insights from your collection.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
          <Button size="lg" className="rounded-lg text-base">
            Start Reading <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-lg text-base shadow-none"
          >
            <CirclePlay className="mr-2 h-4 w-4" /> See How It Works
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero; 