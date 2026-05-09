import { motion } from "motion/react";

export function About() {
  return (
    <div className="min-h-screen">
      <div className="relative h-[50vh] bg-[#FAFAFA] flex items-center justify-center overflow-hidden border-b border-black/5">
        <img 
          src="https://images.unsplash.com/photo-1542055610-d0234f9a0c16?q=80&w=2000&auto=format&fit=crop" 
          alt="Boudha Stupa" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
        />
        <h1 className="relative z-10 text-6xl md:text-[140px] text-white font-black uppercase tracking-tighter mix-blend-overlay leading-[0.85]">OUR<br/>STORY</h1>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-heading prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-[#141414]/70 prose-p:leading-relaxed"
        >
          <h2 className="text-4xl mb-8 text-[#141414]">Born in the backstreets of Boudha.</h2>
          
          <p>
            Arlo Boudha is more than a clothing brand; it's a reflection of the raw, unfiltered energy of Kathmandu's street culture. Founded in 2024, our mission is to create premium, minimalist streetwear that speaks volumes without shouting.
          </p>

          <p>
            We believe in quality over quantity. Every piece is designed with intention—focusing on heavyweight fabrics, meticulous boxy fits, and subtle utilitarian details. We source our materials carefully to ensure that every hoodie, tee, and cargo pant not only looks exceptional but can withstand the hustle of city life.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-16">
            <img src="https://images.unsplash.com/photo-1622470564560-449e2954a6b2?q=80&w=1000&auto=format&fit=crop" alt="Lookbook 1" className="w-full h-[400px] object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" alt="Lookbook 2" className="w-full h-[400px] object-cover grayscale hover:grayscale-0 transition-all duration-700 md:mt-12" />
          </div>

          <h3 className="text-2xl mt-12 mb-6">Our Philosophy</h3>
          <p>
            The aesthetic is monochrome, heavy, and structured. We reject the noise of fast fashion, instead focusing on timeless silhouettes that serve as uniform for the modern creative. By stripping away excess branding, we let the cut, drape, and texture of the garment take center stage.
          </p>
          <p>
            Welcome to the new standard of Nepali streetwear.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
