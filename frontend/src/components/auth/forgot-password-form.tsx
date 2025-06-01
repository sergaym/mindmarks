"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api/auth";
import { validateEmail } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.message || 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSuccess(true);
        // Clear the form
        setEmail("");
      } else {
        setError(result.error.message);
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Show success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center dark:bg-emerald-900/20 dark:border-emerald-800/50">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
            Check Your Email
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            If an account with this email exists, you will receive password reset instructions within the next few minutes.
          </p>
          <div className="flex items-center justify-center text-xs text-emerald-600 dark:text-emerald-400 mb-4">
            <Mail className="w-4 h-4 mr-1" />
            <span>Check your spam folder if you don&apos;t see the email</span>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            variant="outline"
            className="w-full"
          >
            Send Another Reset Email
          </Button>
          
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show form
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Reset Error</p>
              <p className="text-sm mt-1 text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email Address
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
          aria-describedby="email-help"
        />
        <p id="email-help" className="text-xs text-muted-foreground">
          We&apos;ll send reset instructions to this email address
        </p>
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full h-11 rounded-lg text-sm font-medium"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Sending Reset Email...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span>Send Reset Email</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
      
      <div className="pt-3 text-center border-t border-border mt-2">
        <p className="text-sm text-muted-foreground pt-3">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-foreground hover:text-foreground/80 ml-1 transition-colors">
            Back to Sign In
          </Link>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:text-foreground/80 ml-1 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
} 