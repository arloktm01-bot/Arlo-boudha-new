import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatNPR } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

export function Cart() {
  const { isOpen, toggleCart, items, updateQuantity, removeItem, getCartTotal } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#FAFAFA] z-[70] shadow-2xl flex flex-col border-l border-black/5"
          >
            <div className="flex items-center justify-between p-8 border-b border-black/5">
              <h2 className="text-[11px] font-heading font-black uppercase tracking-[0.2em] text-[#141414]">Your Cart <span className="text-[#141414]/40">({items.reduce((acc, i) => acc + i.quantity, 0)})</span></h2>
              <button onClick={toggleCart} className="text-[#141414]/50 hover:text-[#141414] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#141414]/40 space-y-6">
                  <ShoppingBag size={32} className="opacity-50" />
                  <p className="font-bold text-[11px] uppercase tracking-widest text-[#141414]/50">Your cart is empty.</p>
                  <button onClick={() => { toggleCart(); navigate("/shop"); }} className="px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.colour}`} className="flex gap-6 pb-6 border-b border-black/5 last:border-0 last:pb-0">
                    <div className="w-20 h-28 bg-zinc-100 flex-shrink-0">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover mix-blend-multiply opacity-90"
                      />
                    </div>
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-[11px] uppercase tracking-wide leading-tight text-[#141414]">{item.product.name}</h3>
                        <button 
                          onClick={() => removeItem(item.product.id, item.size, item.colour)}
                          className="text-[#141414]/30 hover:text-red-500 transition-colors mt-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <p className="text-[#141414]/50 text-[10px] uppercase font-bold tracking-widest border border-black/5 inline-flex px-2 py-0.5">Size: {item.size}</p>
                        {item.colour && (
                          <p className="text-[#141414]/50 text-[10px] uppercase font-bold tracking-widest border border-black/5 inline-flex px-2 py-0.5">Colour: {item.colour}</p>
                        )}
                      </div>
                      {item.instructions && (
                        <p className="text-[#141414]/40 text-[9px] font-medium italic mt-1 line-clamp-1">Note: {item.instructions}</p>
                      )}
                      
                      <div className="mt-auto flex items-end justify-between">
                        <div className="flex items-center border border-black/10">
                          <button 
                            className="p-2 hover:bg-[#141414]/5 transition-colors text-[#141414]"
                            onClick={() => updateQuantity(item.product.id, item.size, -1, item.colour)}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-[11px] font-bold text-[#141414]">{item.quantity}</span>
                          <button 
                            className="p-2 hover:bg-[#141414]/5 transition-colors text-[#141414]"
                            onClick={() => updateQuantity(item.product.id, item.size, 1, item.colour)}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <p className="font-bold text-[11px]">{formatNPR(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-black/5 p-8 bg-white">
                <div className="flex justify-between mb-4 font-bold uppercase tracking-widest text-[11px] text-[#141414]">
                  <span>Subtotal</span>
                  <span>{formatNPR(getCartTotal())}</span>
                </div>
                <p className="text-[10px] font-medium italic text-[#141414]/50 mb-6">Shipping & taxes calculated at checkout.</p>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
