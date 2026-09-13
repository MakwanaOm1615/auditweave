"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, User, Layers, History, LogOut, LayoutDashboard } from "lucide-react";
import { isAuthenticated, logoutUser, getCurrentEmail } from "@/lib/api";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUserEmail(getCurrentEmail());
    
    // Route protection
    const publicPaths = ["/", "/login", "/register"];
    if (!publicPaths.includes(pathname) && !isAuthenticated()) {
      router.push("/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
    setIsAuth(false);
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audit/new", label: "Compliance Auditor", icon: Shield },
    { href: "/audit/batch", label: "Batch Multi-Audit", icon: Layers },
    { href: "/history", label: "Audit History", icon: History },
    { href: "/contact", label: "Contact & Support", icon: User },
  ];

  const hideHeaderPaths = ["/", "/login", "/register"];
  const shouldShowHeader = !hideHeaderPaths.includes(pathname);

  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-cream text-brand-deep antialiased flex flex-col">
        {shouldShowHeader && (
          <header className="h-16 border-b border-brand-deep/10 bg-white/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50 overflow-hidden">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Link href="/" className="flex items-center space-x-2 shrink-0">
                <img src="/axoreon-logo.png" alt="Axoreon Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md" />
                <div className="flex flex-col justify-center">
                  <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-brand-deep leading-none font-serif">
                    AuditWeave
                  </span>
                  <span className="text-[8px] md:text-[10px] text-brand-laurel font-bold mt-1 leading-none uppercase tracking-widest">
                    POWERED BY AXOREON
                  </span>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
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
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4 shrink-0">
              <div className="hidden xl:flex items-center space-x-2 text-xs text-brand-deep/60 mr-2 lg:mr-4">
                <span>DPDP Act 2023</span>
                <span className="h-1 w-1 rounded-full bg-brand-laurel"></span>
                <span className="text-brand-green font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>Active</span>
              </div>
              
              {isAuth && userEmail && (
                <div className="flex items-center space-x-2 bg-brand-deep/5 px-3 py-1.5 rounded-full border border-brand-deep/10 mr-1 md:mr-2 shrink-0">
                  <div className="h-6 w-6 rounded-full bg-brand-green text-white flex items-center justify-center text-xs font-bold uppercase">
                    {userEmail.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-brand-deep max-w-[120px] lg:max-w-[150px] truncate">
                    {userEmail}
                  </span>
                </div>
              )}

              <button 
                onClick={handleLogout}
                className="p-2 text-brand-deep/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
