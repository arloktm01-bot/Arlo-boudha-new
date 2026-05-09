import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { ProductCard } from "@/components/ui/ProductCard";

export function Wishlist() {
  const { items } = useWishlistStore();

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-12 py-8 border-b border-black/5">
        <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-2">Wishlist</h1>
        <p className="opacity-50 text-[11px] font-bold uppercase tracking-widest leading-tight">{items.length} Items</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-bold text-[11px] uppercase tracking-widest text-[#141414]/50 mb-6">Your wishlist is empty.</p>
          <Link 
            to="/shop" 
            className="px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors"
          >
            Explore Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8">
          {items.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
