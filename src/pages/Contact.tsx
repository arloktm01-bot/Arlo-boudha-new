import React, { useState } from "react";
import { Mail, MapPin, Instagram, Phone } from "lucide-react";
import { motion } from "motion/react";

export function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 3000);
  };

  const inputClass = "w-full border-b border-black/20 py-3 bg-transparent focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1";

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[1400px] mx-auto min-h-screen">
      <div className="text-center mb-24 border-b border-black/5 pb-16">
        <h1 className="text-5xl md:text-[80px] leading-none font-heading font-black uppercase tracking-tighter mb-6 text-[#141414]">Get in Touch</h1>
        <p className="text-[#141414]/50 max-w-md mx-auto text-sm font-medium italic">Have a question about sizing, restocks, or your order? Drop us a line.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-16 lg:gap-32">
        <div className="w-full md:w-1/2">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center bg-[#FAFAFA] p-8 text-center border border-black/5"
            >
              <h3 className="text-2xl font-heading font-black uppercase tracking-tighter mb-2">Message Sent</h3>
              <p className="text-[#141414]/50 font-medium italic">We'll get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className={labelClass}>Name</label>
                <input required type="text" className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
              </div>
              <div>
                <label className={labelClass}>Message</label>
                <textarea required rows={5} className={`${inputClass} resize-none`} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" className="bg-black text-white px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-zinc-800 transition-colors w-full md:w-auto">
                Send Message
              </button>
            </form>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-16">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 mb-8">Contact Info</h3>
            <ul className="space-y-8">
              <li className="flex items-start gap-6">
                <MapPin className="text-[#141414] shrink-0" size={20} />
                <div>
                  <p className="font-bold text-sm tracking-wide uppercase mb-1">Arlo Studio (By Appointment)</p>
                  <p className="text-[#141414]/60 font-medium italic text-sm">Boudha Stupa Circle<br/>Kathmandu, Nepal 44600</p>
                </div>
              </li>
              <li className="flex items-center gap-6">
                <Mail className="text-[#141414] shrink-0" size={20} />
                <p className="text-sm font-medium italic text-[#141414]/60">hello@arloboudha.com</p>
              </li>
              <li className="flex items-center gap-6">
                <Phone className="text-[#141414] shrink-0" size={20} />
                <p className="text-sm font-medium italic text-[#141414]/60">+977 980-0000000</p>
              </li>
            </ul>
          </div>

          <div>
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40 mb-6">Socials</h3>
             <a href="#" className="inline-flex items-center gap-3 text-sm font-medium italic hover:text-[#141414]/50 transition-colors">
               <Instagram size={20} /> @arloboudha
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
