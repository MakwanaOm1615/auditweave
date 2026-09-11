import React from "react";
import { Shield, Lock, Smartphone } from "lucide-react";

export function AuthSidebar() {
  return (
    <div className="relative hidden lg:flex flex-col w-[50%] bg-brand-deep text-brand-cream p-12 xl:p-16 overflow-hidden items-start justify-between border-r border-brand-green/30">
      {/* Background Concentric Circles - matching AuditWeave theme */}
      <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="relative flex items-center justify-center">
          {/* Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-brand-green/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-brand-green/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-brand-green/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-brand-green/80 bg-brand-green/10" />
          
          {/* Subtle glow behind the badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-[#3F9C7E]/20 blur-xl" />
          
          {/* Orbiting Icons */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
            {/* Lock icon */}
            <div className="absolute top-[15%] right-[15%] h-[34px] w-[34px] rounded-full bg-brand-deep border border-brand-green shadow-lg flex items-center justify-center text-[#3F9C7E]">
              <Lock className="h-4 w-4" />
            </div>
            {/* Smartphone icon */}
            <div className="absolute bottom-[20%] left-[10%] h-[34px] w-[34px] rounded-full bg-brand-deep border border-brand-green shadow-lg flex items-center justify-center text-[#3F9C7E]">
              <Smartphone className="h-4 w-4" />
            </div>
            {/* Shield icon */}
            <div className="absolute bottom-[0%] left-[50%] h-[34px] w-[34px] rounded-full bg-brand-deep border border-brand-green shadow-lg flex items-center justify-center text-[#3F9C7E]">
              <Shield className="h-4 w-4" />
            </div>
          </div>

          {/* Center Graphic Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center bg-brand-deep/90 rounded-[24px] w-[130px] h-[130px] shadow-2xl border border-brand-green/80 backdrop-blur-sm">
            <img src="/axoreon-logo.png" alt="Axoreon" className="h-9 w-9 object-contain filter brightness-0 invert opacity-90 mb-2.5" />
            <h2 className="text-[14.5px] font-bold tracking-tight text-brand-cream font-serif">AuditWeave</h2>
            <p className="text-[5.5px] font-extrabold text-[#3F9C7E] uppercase tracking-[0.25em] mt-1">POWERED BY AXOREON</p>
          </div>
        </div>
      </div>

      {/* Main Content (Z-10) */}
      <div className="z-10 flex flex-col h-full w-full max-w-[480px]">
        {/* Top Logo */}
        <div className="flex items-center space-x-3 mb-12">
          <img src="/axoreon-logo.png" alt="Axoreon" className="h-[34px] w-[34px] object-contain filter brightness-0 invert opacity-90" />
          <div className="flex flex-col mt-1">
            <span className="font-serif font-black text-[24px] leading-[0.9] tracking-tight text-brand-cream">AuditWeave</span>
            <span className="text-[7.5px] font-extrabold text-[#3F9C7E] uppercase tracking-[0.22em] mt-1.5">POWERED BY AXOREON</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex w-max items-center px-4 py-1.5 rounded-full border border-brand-laurel/30 bg-brand-green/20 mb-8 backdrop-blur-md">
          <span className="text-[11.5px] text-brand-cream font-semibold tracking-wide">DPDP 2023 Ready Platform</span>
        </div>

        {/* Headings */}
        <h1 className="text-[4.75rem] font-extrabold leading-[1.03] tracking-tight mb-7 text-brand-cream font-sans">
          Privacy &<br />
          Compliance<br />
          <span className="text-[#3F9C7E]">Simplified</span>
        </h1>

        <p className="text-brand-laurel text-[15.5px] leading-[1.75] max-w-[420px] mb-12 font-medium">
          Automate consent management, privacy governance, audit trails and regulatory compliance through one intelligent platform built for modern businesses.
        </p>

        {/* Bullet Points */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-[7px] w-[7px] rounded-full bg-[#3F9C7E]" />
            <span className="text-[14.5px] text-brand-cream font-medium tracking-wide">Consent Management</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-[7px] w-[7px] rounded-full bg-[#3F9C7E]" />
            <span className="text-[14.5px] text-brand-cream font-medium tracking-wide">AI Compliance Monitoring</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-[7px] w-[7px] rounded-full bg-[#3F9C7E]" />
            <span className="text-[14.5px] text-brand-cream font-medium tracking-wide">Blockchain Audit Trail</span>
          </div>
        </div>
      </div>
      
      <div className="z-10 mt-auto flex items-center pt-8">
        <div className="h-10 w-10 rounded-full bg-brand-green/40 border border-brand-laurel/20 flex items-center justify-center">
          <span className="text-brand-cream text-sm font-serif font-bold">A</span>
        </div>
      </div>
    </div>
  );
}
