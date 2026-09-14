"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Mail, MessageSquare, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

const supportCategories = [
  { id: "feedback", label: "General Feedback & Suggestions" },
  { id: "vulnerability", label: "Security Vulnerability Report" },
  { id: "integration", label: "API Integration Support" },
  { id: "bug", label: "Platform Bug / Error filing" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-[1600px] mx-auto space-y-8 min-h-screen">
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
                <a href="mailto:support@axoreon.com" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <Mail className="h-4 w-4 text-brand-green shrink-0" />
                  <span>support@axoreon.com</span>
                </a>
                <a href="https://www.linkedin.com/company/axoreon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <svg className="h-4 w-4 text-brand-green shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>linkedin.com/company/axoreon</span>
                </a>
                <a href="https://www.instagram.com/axoreon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-deep transition">
                  <svg className="h-4 w-4 text-brand-green shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>instagram.com/axoreon</span>
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
                    placeholder="Example: John Doe"
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

              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Support Category</label>
                <div 
                  className={`w-full px-3.5 py-2 bg-brand-cream/30 border rounded-lg text-brand-deep cursor-pointer flex justify-between items-center transition-colors ${isDropdownOpen ? 'border-brand-green ring-1 ring-brand-green' : 'border-brand-green/30 hover:border-brand-green/60'}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{supportCategories.find(c => c.id === topic)?.label}</span>
                  <ChevronDown className={`h-4 w-4 text-brand-deep/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1.5 bg-white border border-brand-green/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1.5 overflow-hidden font-medium">
                    {supportCategories.map(category => (
                      <div
                        key={category.id}
                        className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center ${topic === category.id ? 'bg-brand-green/10 text-brand-green' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                        onClick={() => {
                          setTopic(category.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {category.label}
                      </div>
                    ))}
                  </div>
                )}
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
