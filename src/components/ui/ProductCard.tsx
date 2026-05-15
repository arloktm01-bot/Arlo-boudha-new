import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Product } from "@/data/products";
import { formatNPR } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToastStore } from "@/store/useToastStore";

export function ProductCard({ product }: { product: Product; key?: React.Key }) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);
  const addToast = useToastStore((state) => state.addToast);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeItem(product.id);
    } else {
      addItem(product);
      addToast('Added to wishlist');
    }
  };

  const isSoldOut = product.stock === 0;

  const cardContent = (
    <>
      <div className="relative aspect-[3/4] bg-zinc-100 mb-4 overflow-hidden">
        <button 
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-20 p-2 transition-transform hover:scale-110"
        >
          <Heart 
            size={18} 
            className={isWishlisted ? "fill-[#141414] text-[#141414]" : "text-[#141414]"} 
            strokeWidth={isWishlisted ? 2 : 1.5}
          />
        </button>
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          {isSoldOut && (
            <div className="bg-red-600 text-white px-3 py-1.5 text-[10px] items-center text-center font-bold uppercase tracking-widest shadow-sm">
              Sold Out
            </div>
          )}
          {product.isNew && !isSoldOut && (
            <div className="bg-white text-[#141414] px-2 py-1 text-[9px] font-bold uppercase tracking-tighter shadow-sm">
              New
            </div>
          )}
          {product.isSale && !isSoldOut && (
            <div className="bg-black text-white px-2 py-1 text-[9px] font-bold uppercase tracking-tighter shadow-sm">
              Sale
            </div>
          )}
          {product.isBestSeller && !isSoldOut && (
            <div className="bg-[#141414] text-white px-2 py-1 text-[9px] font-bold uppercase tracking-tighter shadow-sm">
              Best Seller
            </div>
          )}
        </div>
        <img
          src={product.images[0]}
          alt={product.name}
          className={`object-cover w-full h-full transition-transform duration-700 ${!isSoldOut ? 'group-hover:scale-105' : ''}`}
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.name}
            className={`absolute inset-0 object-cover w-full h-full opacity-0 transition-opacity duration-500 ${!isSoldOut ? 'group-hover:opacity-100' : ''}`}
          />
        )}
      </div>
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wide mb-1 leading-tight">{product.name}</h3>
        <div className="text-[11px] font-medium flex flex-wrap items-center gap-2">
          {product.oldPrice && (
            <span className="opacity-30 line-through">{formatNPR(product.oldPrice)}</span>
          )}
          <span className="opacity-70">{formatNPR(product.price)}</span>
        </div>
        {product.colour && (
          <div className="text-[9px] mt-1 font-medium opacity-50 uppercase tracking-widest truncate">
            {product.colour}
          </div>
        )}
      </div>
    </>
  );

  return isSoldOut ? (
    <div className="group block relative opacity-75">
      {cardContent}
    </div>
  ) : (
    <Link to={`/product/${product.id}`} className="group block relative">
      {cardContent}
    </Link>
  );
}
