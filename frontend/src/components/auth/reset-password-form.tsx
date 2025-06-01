"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "@/lib/api/auth";
import { validatePassword } from "@/lib/validation";
import { PasswordRequirements } from "@/components/ui/password-requirements";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get the token from URL parameters
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    // Client-side password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Please enter a valid password');
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);

      if (result.success) {
        setSuccess(true);
        // Clear the form
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error.message);
      }
    } catch (error) {
      console.error("Password reset error:", error);
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
            Password Reset Successful
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/login')}
            className="w-full"
          >
            <div className="flex items-center justify-center">
              <span>Continue to Sign In</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Button>
        </div>
      </div>
    );
  }

  // Show error state if no token
  if (!token && error) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Invalid Reset Link</p>
              <p className="text-sm mt-1 text-destructive/90">{error}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/forgot-password')}
            variant="outline"
            className="w-full"
          >
            Request New Password Reset
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
      {error && !(!token && error) && (
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
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 rounded-lg border bg-background text-foreground border-input focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm"
            disabled={isLoading}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <PasswordRequirements password={password} show={password.length > 0} />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-4 py-3 pr-12 rounded-lg border bg-background text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none transition duration-200 text-sm ${
              confirmPassword.length > 0 && password !== confirmPassword
                ? 'border-destructive focus:border-destructive focus:ring-destructive'
                : 'border-input'
            }`}
            disabled={isLoading}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
          className="w-full h-11 rounded-lg text-sm font-medium"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Updating Password...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span>Update Password</span>
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
      </div>
    </form>
  );
} 