"use client";

import { useState } from "react";
import { signIn } from "../../../auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

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
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok) {
        setError(result?.error || "Something went wrong");
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Sign-in error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
          className="w-full px-4 py-3 rounded-lg border bg-white text-gray-800 border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none transition duration-200 dark:bg-gray-900/40 dark:text-white dark:border-gray-700 dark:focus:ring-gray-700 text-sm"
          disabled={isLoading}
          placeholder="you@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <a href="#" className="text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            Forgot?
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border bg-white text-gray-800 border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none transition duration-200 dark:bg-gray-900/40 dark:text-white dark:border-gray-700 dark:focus:ring-gray-700 text-sm"
          disabled={isLoading}
          placeholder="••••••••"
        />
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
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
      
      <div className="pt-2 text-center">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-800/30 text-gray-200 border border-gray-700">
          Test: test@example.com / password123
        </span>
      </div>
      
      <div className="pt-3 text-center border-t border-gray-200 dark:border-gray-800 mt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">
          Don't have an account?{" "}
          <a href="#" className="font-medium text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white/80 ml-1">
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
} 