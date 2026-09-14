"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-deep/5 flex flex-col items-center text-center relative z-10">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/axoreon-logo.png" alt="Axoreon Logo" width={40} height={40} className="h-10 w-10 object-contain drop-shadow-sm mb-2" priority />
          <span className="text-[9px] font-bold text-brand-green uppercase tracking-[0.2em]">
            Powered by Axoreon
          </span>
        </div>

        {/* Icon */}
        <div className="h-16 w-16 rounded-2xl border-2 border-brand-deep/10 flex items-center justify-center text-brand-deep/60 mb-6 bg-brand-cream/30">
          <FileQuestion className="h-8 w-8" />
        </div>

        {/* Text content */}
        <h1 className="text-6xl font-extrabold text-[#1a3b34] mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-[#1a3b34] mb-4">
          Page Not Found
        </h2>
        
        <p className="text-sm text-brand-deep/60 leading-relaxed mb-10 max-w-sm">
          The page or document you're looking for seems to have been moved, deleted, or never existed in our compliance records.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center w-full space-x-4">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-brand-deep/20 text-brand-deep font-bold text-sm hover:bg-brand-cream/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#205244] hover:bg-[#1a4035] text-white font-bold text-sm transition-colors shadow-lg shadow-brand-green/20"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
