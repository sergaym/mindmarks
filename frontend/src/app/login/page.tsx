import { SignInForm } from "@/components/auth/sign-in-form";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md backdrop-blur-sm px-6 py-8 rounded-xl border border-gray-800/50 relative z-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-yellow-300/20 dark:bg-yellow-300/20">
                <Image 
                  src="/logo.svg" 
                  alt="Mindmarks Logo" 
                  width={20} 
                  height={20}
                  className="text-yellow-300"
                />
              </div>
              <span className="font-bold text-xl text-white">Mindmarks</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sign In</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Sign in to your account to continue
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
} 