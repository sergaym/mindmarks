'use client';

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="container max-w-6xl mx-auto py-24 px-4">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that&apos;s right for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="rounded-xl border border-border p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-muted-foreground">Perfect for casual readers who want to organize their content.</p>
          </div>

          <div className="mt-8 space-y-4">
            <Feature text="Up to 100 saved articles" />
            <Feature text="Basic AI summaries" />
            <Feature text="Personal notes" />
            <Feature text="Search functionality" />
          </div>

          <Button className="w-full mt-8 rounded-lg">
            Get Started
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="rounded-xl border border-primary p-8 bg-card shadow-md hover:shadow-lg transition-shadow">
          {/* Popular Badge */}
          <div className="absolute right-4 -top-3">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground shadow-sm">
              Popular
            </span>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Premium</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-muted-foreground">Ideal for avid readers who want advanced AI capabilities.</p>
          </div>

          <div className="mt-8 space-y-4">
            <Feature text="Unlimited saved articles" />
            <Feature text="Advanced AI analysis and insights" />
            <Feature text="Smart categorization" />
            <Feature text="Full-text search" />
            <Feature text="Priority support" />
          </div>

          <Button className="w-full mt-8 rounded-lg" variant="default">
            Start Free Trial
          </Button>
        </div>
      </div>

      <div className="text-center mt-16 space-y-4 text-muted-foreground">
        <p>All plans include a 14-day money-back guarantee</p>
        <p>Have questions? <span className="underline cursor-pointer">Contact us</span></p>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check size={18} className="text-primary" />
      <span>{text}</span>
    </div>
  );
} 