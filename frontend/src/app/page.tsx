'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 w-full max-w-full">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Smart Reading Companion
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Save, organize, and summarize your reading content with AI assistance.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button asChild size="lg" className="px-8 w-full sm:w-auto">
              <Link href="/dashboard">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 w-full sm:w-auto">
              <Link href="/features">
                Learn More
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div 
          className="relative mx-auto rounded-lg overflow-hidden shadow-xl border border-border max-w-5xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <div className="aspect-video relative">
            <Image
              src="/dashboard-preview.png"
              alt="Mindmarks Dashboard Preview"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 w-full p-4 text-sm text-white/80">
            Mindmarks Dashboard Preview
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <div className="mb-4 text-primary p-2 bg-primary/5 w-fit rounded-md">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: "Smart Summaries",
    description: "AI-powered summaries of your reading materials save you time while preserving key insights.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  },
  {
    title: "Organize Content",
    description: "Keep all your reading materials organized and easily searchable in one place.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
  },
  {
    title: "Track Progress",
    description: "Never lose your place with automatic progress tracking across all your reading materials.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  }
];
