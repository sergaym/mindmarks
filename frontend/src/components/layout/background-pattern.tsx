"use client";

import DotPattern from "@/components/ui/dot-pattern";
import Particles from "@/components/ui/particles";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export const BackgroundPattern = () => {
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === "light";

  return (
    <>
      <DotPattern
        width={30}
        height={30}
        cx={0.5}
        cy={0.5}
        cr={0.5}
        className={cn(
          "[mask-image:radial-gradient(ellipse,rgba(0,0,0,0.05)_30%,black_50%)]",
          "dark:fill-slate-700/10 fill-slate-950/5"
        )}
      />
      <Particles
        className="absolute inset-0"
        quantity={80}
        ease={100}
        color={isLightTheme ? "#000" : "#fff"}
        mouseInteraction={true}
        refresh
      />
    </>
  );
};
