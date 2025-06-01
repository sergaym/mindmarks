"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { loginUser } from "@/lib/api/auth";
import { setCookie } from "cookies-next";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log("Attempting login with:", email);

      // Use the enhanced auth API
      const result = await loginUser(email, password);
      
      if (result.success) {
        console.log("Login successful");

        // The loginUser function already handles token storage
        // Just set the cookie for middleware compatibility
        setCookie('auth_token', result.data.tokens.access_token, {
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });
        
        // Check for callback URL
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get('callbackUrl');
        const redirectUrl = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
        
        console.log("Redirecting to:", redirectUrl);
        router.push(redirectUrl);
      } else {
        // Provide user-friendly error messages based on error type
        let errorMessage = result.error.message;
        
        // Enhance error messages for common scenarios
        if (result.error.status === 401) {
          if (errorMessage.toLowerCase().includes('incorrect email') || 
              errorMessage.toLowerCase().includes('incorrect password') ||
              errorMessage.toLowerCase().includes('incorrect username')) {
            errorMessage = "The email or password you entered is incorrect. Please double-check your credentials and try again.";
          } else if (errorMessage.toLowerCase().includes('user not found')) {
            errorMessage = "No account found with this email address. Please check your email or create a new account.";
          } else if (errorMessage.toLowerCase().includes('account disabled') || 
                     errorMessage.toLowerCase().includes('account suspended')) {
            errorMessage = "Your account has been disabled. Please contact support for assistance.";
          } else {
            errorMessage = "Authentication failed. Please check your email and password and try again.";
          }
        } else if (result.error.status === 429) {
          errorMessage = "Too many login attempts. Please wait a moment before trying again.";
        } else if (result.error.status >= 500) {
          errorMessage = "We're experiencing technical difficulties. Please try again in a moment.";
        } else if (!errorMessage || errorMessage.trim() === '') {
          errorMessage = "Login failed. Please check your credentials and try again.";
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle different types of errors
      let errorMessage = "An unexpected error occurred. Please try again.";
      
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
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          {error}
        </div>
      )}
      
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
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Forgot?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground border-input focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm"
          disabled={isLoading}
          placeholder="••••••••"
        />
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
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span>Sign In</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
      
      <div className="pt-3 text-center border-t border-border mt-2">
        <p className="text-sm text-muted-foreground pt-3">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:text-foreground/80 ml-1 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
} 