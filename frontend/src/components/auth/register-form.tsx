"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/lib/api/auth";
import { PasswordRequirements } from "@/components/ui/password-requirements";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call the centralized registration function
      const result = await registerUser(email, password, fullName);

      if (result.success) {
        // Redirect to login page after successful registration
        router.push("/login?registered=true");
      } else {
        // Provide user-friendly error messages based on error type
        let errorMessage = result.error.message;
        
        // Enhance error messages for common scenarios
        if (result.error.status === 400) {
          if (errorMessage.toLowerCase().includes('email already') || 
              errorMessage.toLowerCase().includes('user already exists')) {
            errorMessage = "An account with this email address already exists. Please use a different email or sign in instead.";
          } else if (errorMessage.toLowerCase().includes('password')) {
            errorMessage = "Password does not meet requirements. Please ensure it's at least 8 characters long.";
          } else if (errorMessage.toLowerCase().includes('email') && 
                     errorMessage.toLowerCase().includes('invalid')) {
            errorMessage = "Please enter a valid email address.";
          } else {
            errorMessage = "Registration failed. Please check your information and try again.";
          }
        } else if (result.error.status === 409) {
          errorMessage = "An account with this email address already exists. Please sign in instead.";
        } else if (result.error.status === 429) {
          errorMessage = "Too many registration attempts. Please wait a moment before trying again.";
        } else if (result.error.status >= 500) {
          errorMessage = "We're experiencing technical difficulties. Please try again in a moment.";
        } else if (!errorMessage || errorMessage.trim() === '') {
          errorMessage = "Registration failed. Please check your information and try again.";
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle different types of errors
      let errorMessage = "An unexpected error occurred during registration. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('network') || 
            error.message.toLowerCase().includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.toLowerCase().includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Registration Error</p>
              <p className="text-sm mt-1 text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-foreground"
        >
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground border-input focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm"
          disabled={isLoading}
          placeholder="Your Name"
        />
      </div>
      
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground border-input focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm"
          disabled={isLoading}
          placeholder="you@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground border-input focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm"
          disabled={isLoading}
          placeholder="••••••••"
        />
        <PasswordRequirements password={password} show={password.length > 0} />
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-lg text-sm font-medium"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span>Create Account</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
      
      <div className="pt-3 text-center border-t border-border mt-2">
        <p className="text-sm text-muted-foreground pt-3">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:text-foreground/80 ml-1 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
} 