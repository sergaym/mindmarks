'use client';

import { ArrowUpRight, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="container max-w-6xl mx-auto py-24 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Mindmarks</h1>
          <p className="text-xl text-muted-foreground">
            Your digital reading journal with AI assistance
          </p>
        </div>

        <div className="aspect-video rounded-xl overflow-hidden shadow-lg relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-900/40 dark:to-purple-900/40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={64} className="text-primary opacity-50" />
          </div>
        </div>

        <div className="space-y-6 text-lg">
          <p>
            Mindmarks was born from a simple idea: create a better way to save, organize, and learn from the content we read online.
          </p>
          
          <p>
            As avid readers ourselves, we found our bookmarks folders overflowing, our note-taking apps disconnected from our reading, and valuable insights getting lost in the noise.
          </p>
          
          <p>
            We built Mindmarks to solve these problems by combining a clean reading experience with powerful AI tools that help you extract meaningful insights from your collection.
          </p>
        </div>

        <div className="border-t border-border pt-8 mt-12">
          <h2 className="text-2xl font-semibold mb-6">Our Mission</h2>
          <p className="text-lg">
            We believe that reading isn't just about consuming information—it's about connecting ideas, discovering insights, and building knowledge over time. Mindmarks helps you get more value from everything you read.
          </p>
        </div>

        <div className="border-t border-border pt-8 mt-12">
          <h2 className="text-2xl font-semibold mb-6">Meet the Team</h2>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-primary/10 border border-primary/20">
              <Users size={36} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Button className="rounded-lg">
            Start Reading <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 