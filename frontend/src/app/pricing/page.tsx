"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Shield, Zap, Sparkles, Loader2, IndianRupee } from "lucide-react";
import { isAuthenticated } from "@/lib/api";

const pricingTiers = [
  {
    id: "starter",
    credits: 5,
    price: 100,
    title: "Starter Pack",
    desc: "Perfect for one-off DPDP compliance audits and SMBs.",
    popular: false,
    features: ["5 Compliance Audits", "Full PDF/DOCX Reports", "Basic Gap Analysis", "Standard Email Support"]
  },
  {
    id: "pro",
    credits: 20,
    price: 350,
    title: "Pro Pack",
    desc: "Ideal for growing agencies and compliance consultants.",
    popular: true,
    features: ["20 Compliance Audits", "Bulk Audit Pipeline", "Remediated Policy Exports", "Priority GRC Support"]
  },
  {
    id: "enterprise",
    credits: 100,
    price: 1500,
    title: "Enterprise Batch",
    desc: "Mass auditing capabilities for law firms and enterprises.",
    popular: false,
    features: ["100 Compliance Audits", "API Access (Coming Soon)", "Custom Whitelabeling", "Dedicated Account Manager"]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handlePurchase = async (tier: typeof pricingTiers[0]) => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoadingId(tier.id);
    setError("");

    try {
      // 1. Create order (placeholder)
      const token = localStorage.getItem("auth_token");
      const orderRes = await fetch("http://localhost:8000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ credits: tier.credits })
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      // 2. Verify payment (placeholder - simulates successful razorpay modal)
      const verifyRes = await fetch("http://localhost:8000/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: orderData.id,
          razorpay_payment_id: "pay_test_" + Math.random().toString(36).substring(7),
          razorpay_signature: "test_sig"
        })
      });

      if (!verifyRes.ok) throw new Error("Payment verification failed");
      
      // Update global session (trigger event)
      window.dispatchEvent(new Event("auth_session_change"));
      
      setSuccessId(tier.id);
      setTimeout(() => {
        router.push("/history");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Something went wrong during checkout.");
    } finally {
      if (!successId) setLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-[1400px] mx-auto min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-deep tracking-tight">
          Simple, Transparent <span className="text-brand-green">Pricing</span>
        </h1>
        <p className="text-base text-brand-deep/70 font-medium">
          Top-up your AuditWeave credits to generate more comprehensive DPDP Act compliance reports. One credit equals one full policy audit.
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 p-4 rounded-xl text-sm font-semibold text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingTiers.map((tier) => (
          <div 
            key={tier.id}
            className={`relative rounded-3xl bg-white p-8 flex flex-col transition-all duration-300 ${
              tier.popular 
                ? "border-2 border-brand-green shadow-xl shadow-brand-green/10 scale-105 z-10" 
                : "border border-brand-deep/10 shadow-lg hover:shadow-xl hover:border-brand-deep/20"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-brand-deep mb-2">{tier.title}</h3>
              <p className="text-xs text-brand-deep/60 font-medium h-8">{tier.desc}</p>
            </div>
            
            <div className="mb-8 flex items-end gap-1">
              <span className="text-4xl font-black text-brand-deep flex items-center">
                <IndianRupee className="h-8 w-8 mr-[-2px] mt-1" />
                {tier.price}
              </span>
              <span className="text-sm font-bold text-brand-deep/50 mb-1">/ one-time</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {tier.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-brand-deep/80">
                  <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handlePurchase(tier)}
              disabled={loadingId !== null || successId !== null}
              className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                successId === tier.id
                  ? "bg-brand-deep text-white cursor-default"
                  : tier.popular
                  ? "bg-brand-green hover:bg-[#2a6d57] text-white shadow-md cursor-pointer disabled:opacity-70"
                  : "bg-brand-cream hover:bg-brand-deep/10 text-brand-deep cursor-pointer disabled:opacity-70"
              }`}
            >
              {successId === tier.id ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Payment Successful!
                </>
              ) : loadingId === tier.id ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Get {tier.credits} Credits
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-20 text-center flex flex-col items-center justify-center space-y-3">
        <Shield className="h-8 w-8 text-brand-deep/30" />
        <p className="text-xs font-bold text-brand-deep/60 uppercase tracking-wider">
          Enterprise Grade Security · Razorpay Secured Payments
        </p>
      </div>
    </div>
  );
}
