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
                <img src="/axoreon-logo.png" alt="Axoreon Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md" />
                <div className="flex flex-col justify-center">
                  <span className="font-extrabold text-2xl tracking-tighter text-brand-deep leading-none font-serif">
                    AuditWeave
                  </span>
                  <span className="text-[10px] text-brand-laurel font-bold mt-1 leading-none uppercase tracking-widest">
                    POWERED BY AXOREON
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
                Powered by Axoreon
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
