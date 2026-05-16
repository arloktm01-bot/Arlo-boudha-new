import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useProductsStore } from "@/store/useProductsStore";
import { ProductCard } from "@/components/ui/ProductCard";
import { Product } from "@/data/products";

export function Home() {
  const products = useProductsStore(state => state.products);
  
  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllBest, setShowAllBest] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllSale, setShowAllSale] = useState(false);

  const newProducts = products.filter(p => p.isNew);
  const bestSellers = products.filter(p => p.isBestSeller);
  const featuredProducts = products.filter(p => p.isFeatured);
  const saleProducts = products.filter(p => p.isSale);

  const renderProductSection = (
    title: string, 
    productList: Product[], 
    isExpanded: boolean, 
    setExpanded: (val: boolean) => void
  ) => {
    if (productList.length === 0) return null;

    const displayedProducts = isExpanded ? productList : productList.slice(0, 4);

    return (
      <section className={`py-24 px-4 md:px-10 max-w-[1400px] mx-auto ${title === "New Arrivals" ? "" : "border-t border-black/5"}`}>
        <div className="flex justify-between items-end mb-8">
          <h2 className="bg-black text-white px-4 py-2 inline-block text-[11px] font-bold uppercase tracking-widest">{title}</h2>
          {title === "New Arrivals" && (
            <Link to="/shop" className="text-[11px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1 hover:opacity-50 transition-colors">
              View All Items
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8">
          {displayedProducts.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
        
        {productList.length > 4 && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setExpanded(!isExpanded)}
              className="flex flex-col items-center gap-2 text-[#141414]/40 hover:text-[#141414] transition-colors uppercase text-[10px] tracking-widest font-bold"
            >
              <span>{isExpanded ? "Show Less" : "View More"}</span>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[calc(100vh-88px)] md:h-[calc(100vh-96px)] flex border-b border-black/5 bg-[#FAFAFA]">
        <div className="w-full relative overflow-hidden bg-zinc-200 group flex-1">
          <img 
            src="https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=2000&auto=format&fit=crop" 
            alt="Stylish man wearing jeans and tanktop with cowboy hat leaning against a wall" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl md:text-[140px] leading-[0.85] font-black tracking-tighter mb-4 text-[#141414]"
            >
              ARLO<br />BOUDHA
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col md:flex-row md:items-center gap-4 text-[#141414]"
            >
              <p className="max-w-xs text-sm font-medium leading-tight opacity-70 italic">
                THE NEW STANDARD OF KATHMANDU STREETWEAR. Locally crafted, globally inspired.
              </p>
              <Link 
                to="/shop" 
                className="bg-black text-white px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-zinc-800 transition-colors w-fit"
              >
                Shop Collection
              </Link>
            </motion.div>
          </div>
          <div className="absolute top-6 right-6 md:top-10 md:right-10">
            <div className="bg-black text-white w-20 h-20 rounded-full flex flex-col items-center justify-center -rotate-12 font-bold leading-none shadow-xl">
              <span className="text-[10px] uppercase opacity-60 mb-1">New</span>
              <span className="text-lg tracking-tight italic text-zinc-300">2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      {renderProductSection("New Arrivals", newProducts, showAllNew, setShowAllNew)}

      {/* Best Sellers Section */}
      {renderProductSection("Best Sellers", bestSellers, showAllBest, setShowAllBest)}

      {/* Category Banner */}
      <section className="py-12 bg-[#FAFAFA] flex flex-col md:flex-row h-[600px] border-t border-black/5">
        <div className="w-full md:w-1/2 h-full relative group overflow-hidden cursor-pointer border-r border-black/5">
          <Link to="/shop?category=Pants">
            <img 
              src="https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop" 
              alt="Pants" 
              className="w-full h-full object-cover mix-blend-multiply opacity-80 transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: 'center bottom' }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-5xl font-black uppercase tracking-tighter mix-blend-overlay">Pants</h3>
            </div>
          </Link>
        </div>
        <div className="w-full md:w-1/2 h-full relative group overflow-hidden cursor-pointer">
          <Link to="/shop?category=Tshirts">
            <img 
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop" 
              alt="Tshirts" 
              className="w-full h-full object-cover mix-blend-multiply opacity-80 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-5xl font-black uppercase tracking-tighter mix-blend-overlay">Tshirts</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Section */}
      {renderProductSection("Featured", featuredProducts, showAllFeatured, setShowAllFeatured)}

      {/* Sale Section */}
      {renderProductSection("Sale", saleProducts, showAllSale, setShowAllSale)}
      
    </div>
  );
}
