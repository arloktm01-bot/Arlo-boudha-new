import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-[#141414] text-white pt-20 mt-20 flex flex-col">
      <div className="px-4 md:px-10 max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/5 pb-16">
        <div className="md:col-span-2">
          <h2 className="font-heading font-black text-2xl tracking-tighter uppercase mb-6">
            ARLO BOUDHA
          </h2>
          <p className="text-white/50 max-w-sm mb-6 leading-relaxed italic text-sm">
            Premium streetwear born in the backstreets of Boudha, Kathmandu. 
            Blending minimal aesthetics with raw culture.
          </p>
        </div>
        
        <div>
          <h3 className="font-bold mb-6 text-[10px] uppercase tracking-widest text-white/40">Shop</h3>
          <ul className="space-y-4 text-white/70 text-[11px] font-bold uppercase tracking-widest">
            <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/shop?category=Hoodies" className="hover:text-white transition-colors">Hoodies</Link></li>
            <li><Link to="/shop?category=T-Shirts" className="hover:text-white transition-colors">T-Shirts</Link></li>
            <li><Link to="/shop?category=Pants" className="hover:text-white transition-colors">Bottoms</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-6 text-[10px] uppercase tracking-widest text-white/40">Support</h3>
          <ul className="space-y-4 text-white/70 text-[11px] font-bold uppercase tracking-widest">
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
      
      <div className="px-4 md:px-10 max-w-[1400px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
        <p>&copy; {new Date().getFullYear()} Arlo Boudha. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="https://www.instagram.com/arlo_boudha/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
          <a href="https://wa.me/9779843402357" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
          <a href="#" className="hover:text-white transition-colors">TikTok</a>
        </div>
      </div>

      {/* BOTTOM MARQUEE BAR */}
      <div className="bg-white text-[#141414] h-12 flex items-center overflow-hidden border-t border-black/5">
        <div className="whitespace-nowrap flex space-x-12 px-6 uppercase text-[10px] font-bold tracking-[0.3em] animate-marquee">
          <span>Arlo — Built for the Everyday Hustle.</span>
          <span className="opacity-30">/</span>
          <span>Arlo — Built for the Everyday Hustle.</span>
          <span className="opacity-30">/</span>
          <span>Arlo — Built for the Everyday Hustle.</span>
          <span className="opacity-30">/</span>
          <span>Arlo — Built for the Everyday Hustle.</span>
          <span className="opacity-30">/</span>
          <span>Arlo — Built for the Everyday Hustle.</span>
          <span className="opacity-30">/</span>
          <span>Arlo — Built for the Everyday Hustle.</span>
        </div>
      </div>
    </footer>
  );
}
