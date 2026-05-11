import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Size } from "@/data/products";
import { useProductsStore } from "@/store/useProductsStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToastStore } from "@/store/useToastStore";
import { formatNPR } from "@/lib/utils";
import {
  ChevronRight,
  Heart,
  Share2,
  Facebook,
  Twitter,
  Eye,
} from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const SIZES: Size[] = ["S", "M", "L", "XL"];

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const {
    items: wishlistItems,
    addItem: addWishlist,
    removeItem: removeWishlist,
    isInWishlist,
  } = useWishlistStore();
  const addToast = useToastStore((state) => state.addToast);

  const products = useProductsStore((state) => state.products);
  const featured = products.filter((p) => p.isNew || p.isSale).slice(0, 4);
  const product = products.find((p) => p.id === id);
  const [selectedSize, setSelectedSize] = useState<Size | "">("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [activeImage, setActiveImage] = useState(0);
  const [viewCount, setViewCount] = useState<number>(0);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const toggleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeWishlist(product.id);
    } else {
      addWishlist(product);
      addToast("Added to wishlist");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSize("");
    setSelectedColor("");
    setInstructions("");
    setActiveImage(0);

    // Track views
    if (!id) return;
    const viewRef = doc(db, "product_views", id);
    let viewTimer: ReturnType<typeof setTimeout>;

    const trackView = async () => {
      // Small debounce to prevent rapid refresh inflation
      viewTimer = setTimeout(async () => {
        try {
          const docSnap = await getDoc(viewRef);
          if (docSnap.exists()) {
            await updateDoc(viewRef, {
              viewCount: increment(1),
              lastViewedAt: Date.now(),
            });
          } else {
            await setDoc(viewRef, {
              viewCount: 1,
              lastViewedAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("View tracking error", error);
        }
      }, 2000);
    };
    trackView();

    const unsubViews = onSnapshot(viewRef, (doc) => {
      if (doc.exists()) {
        setViewCount(doc.data().viewCount);
      }
    }, (error) => {
      console.error("View count snapshot error:", error);
    });

    return () => {
      clearTimeout(viewTimer);
      unsubViews();
    };
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <h1 className="text-2xl font-bold uppercase mb-4">Product Not Found</h1>
        <button
          onClick={() => navigate("/shop")}
          className="text-gray-500 hover:text-black uppercase text-sm tracking-widest border-b border-black"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const colourOptions = product?.colour
      ? product.colour
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean)
      : [];
    const hasSizes = product?.sizes && product.sizes.length > 0;
    const hasColors = colourOptions.length > 0;

    if (hasSizes && hasColors) {
      if (!selectedSize || !selectedColor) {
        addToast("Please select size and color before proceeding.");
        return;
      }
    } else if (hasSizes && !hasColors) {
      if (!selectedSize) {
        addToast("Please select a size before proceeding.");
        return;
      }
    } else if (!hasSizes && hasColors) {
      if (!selectedColor) {
        addToast("Please select a color before proceeding.");
        return;
      }
    }

    if (!product) return;

    const finalColour =
      selectedColor || (colourOptions.length > 0 ? colourOptions[0] : "");
    const finalSize =
      selectedSize || (hasSizes ? product.sizes![0] : ("" as Size));
    addItem(product, finalSize, 1, finalColour, instructions);
    addToast("Added to cart");
  };

  const handleBuy = () => {
    const colourOptions = product?.colour
      ? product.colour
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean)
      : [];
    const hasSizes = product?.sizes && product.sizes.length > 0;
    const hasColors = colourOptions.length > 0;

    if (hasSizes && hasColors) {
      if (!selectedSize || !selectedColor) {
        addToast("Please select size and color before proceeding.");
        return;
      }
    } else if (hasSizes && !hasColors) {
      if (!selectedSize) {
        addToast("Please select a size before proceeding.");
        return;
      }
    } else if (!hasSizes && hasColors) {
      if (!selectedColor) {
        addToast("Please select a color before proceeding.");
        return;
      }
    }

    if (!product) return;

    const finalColour =
      selectedColor || (colourOptions.length > 0 ? colourOptions[0] : "");
    const finalSize =
      selectedSize || (hasSizes ? product.sizes![0] : ("" as Size));
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product,
          size: finalSize,
          quantity: 1,
          colour: finalColour,
          instructions,
        },
      },
    });
  };

  const WHATSAPP_NUMBER = "9779843402357";
  const whatsappMsg = `Hi Arlo Boudha! I'm interested in buying: ${product.name} (Size: ${selectedSize || "Not selected"}${selectedColor ? `, Colour: ${selectedColor}` : ""}). Link: ${window.location.href}`;
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="pt-24 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
        <button
          onClick={() => navigate("/shop")}
          className="hover:text-black transition-colors"
        >
          Shop
        </button>
        <ChevronRight size={14} />
        <button
          onClick={() => navigate(`/shop?category=${product.category}`)}
          className="hover:text-black transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight size={14} />
        <span className="text-black overflow-hidden text-ellipsis whitespace-nowrap">
          {product.name}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-24">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 flex flex-col-reverse lg:flex-row gap-4">
          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible no-scrollbar">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-20 h-24 flex-shrink-0 bg-gray-100 transition-opacity ${activeImage === i ? "ring-2 ring-black opacity-100" : "opacity-60 hover:opacity-100"}`}
              >
                <img
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-gray-100 relative aspect-[3/4] lg:aspect-auto lg:h-[700px] overflow-hidden group">
            <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 z-20 p-3 transition-transform hover:scale-110"
            >
              <Heart
                size={24}
                className={
                  isWishlisted
                    ? "fill-[#141414] text-[#141414]"
                    : "text-[#141414]"
                }
                strokeWidth={isWishlisted ? 2 : 1.5}
              />
            </button>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover absolute inset-0"
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-2">
            {product.name}
          </h1>

          {viewCount > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60 mb-4 bg-black/5 w-fit px-3 py-1.5 rounded-full">
              <Eye size={12} className="opacity-70" />
              <span>
                {viewCount} view{viewCount > 1 ? "s" : ""}
              </span>
              {viewCount > 10 && (
                <span className="ml-1 text-red-500 font-extrabold flex items-center gap-1">
                  🔥 Trending
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-8 text-[#141414]">
            <span className="text-2xl font-bold">
              {formatNPR(product.price)}
            </span>
            {product.oldPrice && (
              <span className="opacity-30 line-through text-lg font-medium">
                {formatNPR(product.oldPrice)}
              </span>
            )}
            <div className="flex gap-2">
              {product.isNew && (
                <span className="bg-white border border-[#141414]/10 text-[#141414] px-2 py-1 text-[9px] font-bold uppercase tracking-tighter">
                  New
                </span>
              )}
              {product.isSale && (
                <span className="bg-black text-white px-2 py-1 text-[9px] font-bold uppercase tracking-tighter">
                  Sale
                </span>
              )}
              {product.isBestSeller && (
                <span className="bg-[#141414] text-white px-2 py-1 text-[9px] font-bold uppercase tracking-tighter">
                  Best Seller
                </span>
              )}
            </div>
          </div>

          <p className="opacity-70 leading-relaxed mb-10 text-sm font-medium italic">
            {product.description}
          </p>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold uppercase tracking-widest text-[11px] text-[#141414]/40">
                Size
              </span>
              <button className="text-[11px] font-bold text-[#141414]/40 border-b border-[#141414]/40 hover:text-[#141414] hover:border-[#141414] uppercase tracking-widest transition-colors">
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border border-black/10 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 space-y-6">
            {product.colour && (
              <div>
                <label className="block font-bold uppercase tracking-widest text-[11px] text-[#141414]/40 mb-4">
                  Colour Options
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colour
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .map((colourOption) => (
                      <button
                        key={colourOption}
                        onClick={() => setSelectedColor(colourOption)}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all border ${
                          selectedColor === colourOption
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-black/10 hover:border-black"
                        }`}
                      >
                        {colourOption}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div>
              <label className="block font-bold uppercase tracking-widest text-[11px] text-[#141414]/40 mb-4">
                Special Instructions (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any specific requests or descriptions..."
                rows={2}
                className="w-full border border-black/10 p-3 text-sm focus:outline-none focus:border-black transition-colors bg-white/50 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleBuy}
              className="w-full bg-[#141414] text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors"
            >
              Buy
            </button>
            <div className="flex gap-4 w-full">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-white border border-black text-black py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/10 transition-colors"
              >
                Add To Cart
              </button>
              <button
                onClick={toggleWishlist}
                className="w-14 items-center justify-center flex border border-black hover:bg-[#141414]/5 transition-colors"
              >
                <Heart
                  size={20}
                  className={
                    isWishlisted ? "fill-black text-black" : "text-[#141414]"
                  }
                />
              </button>
            </div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-3 bg-[#25D366] text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#20bd5a] transition-colors"
            >
              <span className="w-2.5 h-2.5 bg-white/50 rounded-full animate-pulse"></span>
              <span>Order via WhatsApp</span>
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-black/5 text-[11px] text-[#141414]/50 space-y-6 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 text-[#141414]">
              <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></div>{" "}
              In Stock, Ready to Ship
            </div>

            <div className="pt-6 border-t border-black/5">
              <span className="block mb-4">Share</span>
              <div className="flex gap-4">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
                  aria-label="Share on Facebook"
                >
                  <Facebook size={16} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${product.name} at Arlo Boudha!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
                  aria-label="Share on Twitter"
                >
                  <Twitter size={16} />
                </a>
                <a
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
                  aria-label="Share on Pinterest"
                >
                  <Share2 size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="pt-20 mt-24 border-t border-black/5">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40">
            You May Also Like
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {featured
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
        </div>
      </div>
    </div>
  );
}
