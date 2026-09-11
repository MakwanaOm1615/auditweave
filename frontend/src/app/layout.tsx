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
      <body className="min-h-screen bg-brand-cream text-brand-deep antialiased flex flex-col">
        {pathname !== "/" && pathname !== "/login" && (
          <header className="h-16 border-b border-brand-deep/10 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 8L10 36H17L20 28H32" stroke="#B1B7AB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 16L34 26L40 40" stroke="#B1B7AB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 26C18 36 26 42 36 40" stroke="#3F9C7E" strokeWidth="5" strokeLinecap="round"/>
                </svg>
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-xl tracking-tight text-brand-deep leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                    AuditWeave
                  </span>
                  <span className="text-[10px] text-brand-laurel font-medium mt-1 leading-none">
                    Powered by Axorean
                  </span>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        active
                          ? "bg-brand-green/10 text-brand-green"
                          : "text-brand-deep/70 hover:text-brand-deep hover:bg-brand-deep/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-xs text-brand-deep/60 mr-4">
                <span>DPDP Act 2023</span>
                <span className="h-1 w-1 rounded-full bg-brand-laurel"></span>
                <span className="text-brand-green font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>Active</span>
              </div>
              <div className="text-[10px] font-bold text-brand-laurel uppercase tracking-wider">
                Powered by Axorean
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 w-full flex flex-col bg-brand-cream">
          {children}
        </main>
      </body>
    </html>
  );
}
