"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Shield, User, Layers, History, Crown } from "lucide-react";
import { isAdmin } from "@/lib/api";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(isAdmin());
  }, [pathname]);

  const navLinks = [
    { href: "/audit/new", label: "Compliance Auditor", icon: Shield },
    { href: "/audit/batch", label: "Batch Multi-Audit", icon: Layers },
    { href: "/history", label: "Audit History", icon: History },
    { href: "/contact", label: "Contact & Support", icon: User },
    ...(admin ? [{ href: "/admin", label: "Admin Console", icon: Crown }] : []),
  ];

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0D3A35] text-[#F8FAFC] antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          {pathname !== "/" && pathname !== "/login" && (
            <aside className="w-64 border-r border-slate-800/60 bg-[#132E2A]/80 backdrop-blur-md hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen z-20">
              <div className="space-y-6">
                <Link href="/" className="flex items-center space-x-3 px-2 py-1">
                  <Shield className="h-6 w-6 text-emerald-300 glow-primary" />
                  <span className="font-semibold text-lg tracking-wider text-slate-100 font-sans">
                    AuditWeave <span className="text-emerald-300">AI</span>
                  </span>
                </Link>
                <nav className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          active
                            ? "bg-emerald-600/10 text-emerald-300 border-l-2 border-emerald-300 font-medium"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer Info */}
              <div className="border-t border-slate-800/60 pt-4 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AuditWeave Compliance Node</p>
                <p className="text-[9px] text-slate-600 mt-1">DPDP compliance engine active. No session data retained.</p>
              </div>
            </aside>
          )}

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
            {/* Header Navbar */}
            {pathname !== "/" && pathname !== "/login" && (
              <header className="h-16 border-b border-slate-800/50 bg-[#0D3A35]/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="md:hidden flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-emerald-300" />
                  <span className="font-bold text-sm">AuditWeave</span>
                </div>
                <div className="hidden md:block text-xs text-slate-400">
                  Compliance Framework: <span className="text-slate-300 font-semibold">DPDP Act 2023</span> | Version v1.0
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 glow-success animate-pulse"></span>
                    <span className="text-xs text-emerald-400 font-medium">Compliance Node Active</span>
                  </div>
                </div>
              </header>
            )}

            {/* Content Body */}
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
