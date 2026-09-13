import Image from "next/image";
import { Shield, Lock, Smartphone } from "lucide-react";

export function AuthSidebar() {
  return (
    <aside className="relative hidden min-h-[100dvh] w-1/2 shrink-0 overflow-hidden border-r border-brand-green/30 bg-brand-deep px-8 py-8 text-brand-cream lg:flex xl:px-12 xl:py-10 2xl:px-16 2xl:py-12">
      {/* Background Concentric Circles - matching AuditWeave theme */}
      <div className="pointer-events-none absolute left-[80%] top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-80">
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
          <div className="relative z-10 flex h-[118px] w-[118px] flex-col items-center justify-center rounded-[24px] border border-brand-green/80 bg-brand-deep/90 shadow-2xl backdrop-blur-sm xl:h-[130px] xl:w-[130px]">
            <Image src="/axoreon-logo.png" alt="" width={36} height={36} className="mb-2.5 object-contain brightness-0 invert opacity-90" />
            <h2 className="text-[14.5px] font-bold tracking-tight text-brand-cream font-serif">AuditWeave</h2>
            <p className="text-[5.5px] font-extrabold text-[#3F9C7E] uppercase tracking-[0.25em] mt-1">POWERED BY AXOREON</p>
          </div>
        </div>
      </div>

      {/* Main Content (Z-10) */}
      <div className="relative z-10 flex w-full max-w-[560px] flex-col justify-center">
        {/* Top Logo */}
        <div className="mb-8 flex items-center space-x-3 [@media(max-height:700px)]:mb-5">
          <Image src="/axoreon-logo.png" alt="Axoreon" width={34} height={34} className="object-contain brightness-0 invert opacity-90" priority />
          <div className="flex flex-col mt-1">
            <span className="font-serif font-black text-[24px] leading-[0.9] tracking-tight text-brand-cream">AuditWeave</span>
            <span className="text-[7.5px] font-extrabold text-[#3F9C7E] uppercase tracking-[0.22em] mt-1.5">POWERED BY AXOREON</span>
          </div>
        </div>

        {/* Badge */}
        <div className="mb-7 inline-flex w-max items-center rounded-full border border-brand-laurel/30 bg-brand-green/20 px-4 py-1.5 backdrop-blur-md [@media(max-height:700px)]:mb-5">
          <span className="text-[11.5px] text-brand-cream font-semibold tracking-wide">DPDP 2023 Ready Platform</span>
        </div>

        {/* Headings */}
        <h1 className="mb-6 font-sans text-[clamp(3.5rem,5.6vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-brand-cream [@media(max-height:700px)]:mb-4 [@media(max-height:700px)]:text-[3.45rem]">
          Privacy &<br />
          Compliance<br />
          <span className="text-[#3F9C7E]">Simplified</span>
        </h1>

        <p className="mb-9 max-w-[460px] text-[15px] font-medium leading-7 text-brand-laurel [@media(max-height:700px)]:mb-0 [@media(max-height:700px)]:text-sm [@media(max-height:700px)]:leading-6">
          Automate consent management, privacy governance, audit trails and regulatory compliance through one intelligent platform built for modern businesses.
        </p>

        {/* Bullet Points */}
        <div className="space-y-3.5 [@media(max-height:700px)]:hidden">
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
    </aside>
  );
}
