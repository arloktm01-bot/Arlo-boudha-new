import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Category } from "@/data/products";
import { useProductsStore } from "@/store/useProductsStore";
import { ProductCard } from "@/components/ui/ProductCard";
import { SlidersHorizontal } from "lucide-react";

const MAIN_CATEGORIES = [
  { name: "Uppers", subs: ['Tshirts', 'Shirts', 'Jackets', 'Hoodies'] },
  { name: "Lowers", subs: ['Pants', 'Trousers', 'Shorts'] },
  { name: "Essentials", subs: [] },
  { name: "Accessories", subs: [] },
];

type SortOption = "newest" | "price-asc" | "price-desc";

export function Shop() {
  const products = useProductsStore(state => state.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "All";
  const searchParam = searchParams.get("search") || "";
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParam);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }

    if (activeCategory !== "All") {
      // Find if active category is a main category
      const mainCat = MAIN_CATEGORIES.find(c => c.name === activeCategory);
      if (mainCat) {
        result = result.filter(p => p.category === activeCategory);
      } else {
        result = result.filter(p => p.subCategory === activeCategory || p.category === activeCategory);
      }
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return result;
  }, [activeCategory, sortBy]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-6 py-8 border-b border-black/5">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-2">Shop Collection</h1>
          <p className="opacity-50 text-[11px] font-bold uppercase tracking-widest leading-tight">{filteredProducts.length} Products</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-64 relative">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-black/10 bg-transparent py-3 pl-4 pr-10 text-[11px] font-bold uppercase tracking-widest text-[#141414] focus:outline-none focus:border-black placeholder:text-[#141414]/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="4"></circle><line x1="13" y1="13" x2="9" y2="9"></line></svg>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex-1 w-full flex items-center justify-center gap-2 border border-black/10 py-3 text-[11px] font-bold uppercase tracking-widest text-[#141414]"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          
          <div className="relative flex-1 md:flex-none">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full md:w-auto border border-black/10 bg-transparent py-3 pl-4 pr-10 text-[11px] font-bold uppercase tracking-widest text-[#141414] focus:outline-none focus:border-black appearance-none cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#141414]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Filters */}
        <div className={`md:w-48 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-28">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-[#141414]/40">Category</h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => handleCategoryChange("All")}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    activeCategory === "All" ? 'text-[#141414] border-b border-[#141414] pb-0.5' : 'text-[#141414]/50 hover:text-[#141414]'
                  }`}
                >
                  All
                </button>
              </li>
              {MAIN_CATEGORIES.map((cat) => (
                <li key={cat.name} className="pt-2">
                  <button
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors mb-2 ${
                      activeCategory === cat.name ? 'text-[#141414] border-b border-[#141414] pb-0.5' : 'text-[#141414]/50 hover:text-[#141414]'
                    }`}
                  >
                    {cat.name}
                  </button>
                  {cat.subs.length > 0 && (
                    <ul className="pl-3 space-y-2 border-l border-black/10 ml-1">
                      {cat.subs.map(sub => (
                        <li key={sub}>
                          <button
                            onClick={() => handleCategoryChange(sub)}
                            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              activeCategory === sub ? 'text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'
                            }`}
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8">
              {filteredProducts.map((product, i) => (
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
      </div>
    </div>
  );
}
