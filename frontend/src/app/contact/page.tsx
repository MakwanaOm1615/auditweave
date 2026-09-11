"use client";

import { useState } from "react";
import { Shield, Mail, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    // Simulate support submission
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-deep tracking-tight flex items-center gap-2">
          <span>Contact & Support Portal</span>
        </h1>
        <p className="text-sm text-brand-deep/70 mt-1">
          Get in touch with GRC specialists, report vulnerabilities, or submit platform feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: SaaS details (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-brand-green/20 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-brand-deep">About AuditWeave</h2>
              <p className="text-xs text-brand-deep/70 leading-relaxed mt-1.5">
                AuditWeave is an advanced GRC auditing platform. We build hybrid deterministic and language-modeling pipelines to check statutory notice guidelines under India's Digital Personal Data Protection Act 2023.
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-brand-deep/60 uppercase tracking-wider text-[10px]">Contact Info</h3>
              <div className="space-y-2 text-xs text-brand-deep/70">
                <a href="mailto:malviyasatwik@gmail.com" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <Mail className="h-4 w-4 text-brand-green shrink-0" />
                  <span>malviyasatwik@gmail.com</span>
                </a>
                <a href="https://www.linkedin.com/in/satwikmalviya" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <svg className="h-4 w-4 text-brand-green shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>linkedin.com/in/satwikmalviya</span>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <svg className="h-4 w-4 text-brand-green shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>github.com/AuditWeave-ai</span>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-brand-cream/50 p-4 border border-brand-green/10 rounded-xl text-[11px] text-brand-deep/60 leading-normal">
            <span className="text-brand-deep/80 font-bold block mb-1">Response SLA</span>
            Enterprise GRC ticket responses are handled within 12 business hours. Bug filings and security disclosures trigger immediate engineering reviews.
          </div>
        </div>

        {/* Right Column: Support form (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-brand-green/20 shadow-sm">
          <h2 className="text-base font-bold text-brand-deep pb-3 border-b border-brand-green/10 mb-6">Support & Feedback Ticket</h2>
          
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-brand-deep">Ticket Submitted Successfully</p>
                <p className="text-xs text-brand-deep/60">Thank you for your feedback. Our GRC compliance team will review it shortly.</p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-white border border-brand-green/30 hover:bg-brand-cream text-xs font-bold text-brand-deep rounded-xl transition shadow-sm cursor-pointer"
              >
                File Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Example: Mr. Satwik Malviya"
                    className="w-full px-3.5 py-2 bg-brand-cream/30 border border-brand-green/30 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep placeholder-brand-deep/40"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2 bg-brand-cream/30 border border-brand-green/30 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep placeholder-brand-deep/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Support Category</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2 bg-brand-cream/30 border border-brand-green/30 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep cursor-pointer"
                >
                  <option value="feedback">General Feedback & Suggestions</option>
                  <option value="vulnerability">Security Vulnerability Report</option>
                  <option value="integration">API Integration Support</option>
                  <option value="bug">Platform Bug / Error filing</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Message Description</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Detail your inquiry, feedback, or technical issue..."
                  className="w-full p-3.5 bg-brand-cream/30 border border-brand-green/30 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep placeholder-brand-deep/40 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-green hover:bg-brand-deep text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer"
              >
                File Support Ticket
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
