'use client';

import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/register-form";
import { ThemeSwitcher } from "@/components/ui/kibo-ui/theme-switcher";

export default function RegisterPage() {
  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md backdrop-blur-sm px-6 py-8 rounded-xl border border-border relative z-10 shadow-2xl bg-card/30">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary/20">
                <Image 
                  src="/logo.svg" 
                  alt="Mindmarks Logo" 
                  width={20} 
                  height={20}
                  className="text-primary-foreground"
                />
              </div>
              <span className="font-bold text-xl text-foreground">Mindmarks</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign up to start using Mindmarks
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
} 