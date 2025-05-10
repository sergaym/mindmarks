"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { login } from "@/lib/api/client";
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
      console.log("Attempting API login with:", email);

      // Call our API client login function
      const result = await login(email, password);
      
      console.log("Login successful, received token");

      // Store token and email in localStorage for use across the app
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('token_type', result.token_type);
      localStorage.setItem('user_email', email);
      
      // Also set in cookie for middleware (server-side) access
      // Set secure, httpOnly cookie that middleware can access
      setCookie('auth_token', result.access_token, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'strict',
      });
      
      // Success - redirect to dashboard
      console.log("Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials and try again.");
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