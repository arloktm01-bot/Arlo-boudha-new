import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatNPR } from "@/lib/utils";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { uploadImageToCloudinary } from "@/lib/upload";

export function Checkout() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  
  // Payment Receipt State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [storeQrCode, setStoreQrCode] = useState<string | null>(null);
  const [shippingRegion, setShippingRegion] = useState<'inside' | 'outside'>('inside');
  
  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, amount: number} | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: ""
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "store"));
        if (snap.exists() && snap.data().qrCodeUrl) {
          setStoreQrCode(snap.data().qrCodeUrl);
        }
      } catch (err) {
        console.error("Failed to load store settings", err);
      }
    }
    loadSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const subtotal = getCartTotal();
  const shipping = shippingRegion === 'inside' ? 100 : 150;
  
  let discountValue = 0;
  if (appliedDiscount) {
    discountValue = appliedDiscount.amount;
  }
  
  const total = Math.max(0, subtotal + shipping - discountValue);

  const VALID_CODES: Record<string, { type: 'percent' | 'fixed', value: number }> = {
    'WELCOME10': { type: 'percent', value: 10 },
    'ARLO20': { type: 'percent', value: 20 },
    'FLAT500': { type: 'fixed', value: 500 }
  };

  const handleApplyDiscount = () => {
    setDiscountError("");
    const code = discountCode.toUpperCase().trim();
    
    if (!code) {
      setDiscountError("Please enter a code");
      return;
    }

    if (appliedDiscount && appliedDiscount.code === code) {
      setDiscountError("This code is already applied");
      return;
    }

    const discountRule = VALID_CODES[code];
    if (discountRule) {
      let amount = 0;
      if (discountRule.type === 'percent') {
        amount = (subtotal * discountRule.value) / 100;
      } else {
        amount = discountRule.value;
      }
      setAppliedDiscount({ code, amount });
      setDiscountCode("");
    } else {
      setDiscountError("Invalid discount code");
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setError("Please upload the payment receipt.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const receiptUrl = await uploadImageToCloudinary(receiptFile);

      const orderData = {
        userId: useAuthStore.getState().user?.uid || null,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color || null,
          instructions: item.instructions || null
        })),
        shippingDetails: formData,
        shippingRegion,
        subtotal,
        shipping,
        discountCode: appliedDiscount?.code || null,
        discountAmount: appliedDiscount?.amount || 0,
        totalAmount: total,
        status: 'pending',
        paymentMethod: 'Bank Transfer',
        receiptUrl,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setPlacedOrderId(docRef.id);
      
      setIsSubmitting(false);
      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission')) {
        setError("Missing permissions to create order. Please check Firebase rules to allow public creation for tests, or sign in.");
      } else {
        setError(err.message || 'Failed to place order');
      }
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">
        <h1 className="text-3xl font-heading font-bold uppercase mb-4 text-center">Your Cart is Empty</h1>
        <button onClick={() => navigate("/shop")} className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
          Return to Shop
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center flex flex-col items-center max-w-md w-full"
        >
          <CheckCircle2 size={64} className="text-green-500 mb-6" />
          <h1 className="text-3xl font-heading font-black uppercase mb-4 tracking-tighter">Order Confirmed!</h1>
          
          <div className="mb-8 border border-black/10 p-6 bg-[#FAFAFA] w-full mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Your Order ID</p>
            <p className="font-mono text-2xl font-bold tracking-wider">{placedOrderId}</p>
            <p className="text-[10px] bg-yellow-100 text-yellow-800 uppercase tracking-widest font-bold mt-4 py-2 text-center border border-yellow-200">Use this Order ID to track your order.</p>
          </div>
          
          <p className="text-[#141414]/70 mb-8 leading-relaxed font-medium">
            Thank you for your order, {formData.firstName}. We have received your payment receipt and will contact you at {formData.phone} shortly.
          </p>
          
          <div className="flex flex-col gap-4 w-full">
            <a 
              href={`https://wa.me/9779843402357?text=${encodeURIComponent(`Hi Arlo! Here is my payment receipt for Order ID: ${placedOrderId}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
            >
              Send Receipt to WhatsApp
            </a>
            <button onClick={() => navigate("/track")} className="w-full bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
              Track Order
            </button>
            <button onClick={() => navigate("/")} className="w-full bg-transparent border border-black text-black px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputClass = "w-full border-b border-black/20 py-3 bg-transparent focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1";

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[1400px] mx-auto min-h-screen">
      <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-12 text-center text-[#141414]">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Form */}
        <div className="flex-1 order-2 lg:order-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-8 border-b border-black/5 pb-4">Shipping Information</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm font-bold tracking-widest uppercase text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name *</label>
                <input required type="text" className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input required type="text" className={inputClass} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input required type="tel" className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Delivery Region *</label>
                <select className={inputClass} value={shippingRegion} onChange={e => setShippingRegion(e.target.value as any)}>
                  <option value="inside">Inside Kathmandu Valley (Rs 100)</option>
                  <option value="outside">Outside Kathmandu Valley (Rs 150)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>City *</label>
                <input required type="text" placeholder="e.g. Kathmandu, Lalitpur" className={inputClass} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Delivery Address *</label>
              <input required type="text" placeholder="Street, House No., Landmark" className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div>
              <label className={labelClass}>Order Notes (Optional)</label>
              <textarea rows={3} className={inputClass} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>

            <div className="mt-12 pt-8 border-t border-black/5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-6">Payment Method / QR Code</h2>
              <div className="border border-black/10 bg-[#FAFAFA] p-6 text-center">
                <p className="font-bold uppercase tracking-widest text-[11px] mb-4 text-[#141414]">Scan QR code to pay</p>
                {storeQrCode ? (
                  <img src={storeQrCode} alt="Store QR Code" className="mx-auto max-w-[200px] mb-4 border border-black/10" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-zinc-200 mx-auto flex items-center justify-center text-[10px] uppercase font-bold text-black/40 mb-4 border border-black/10">QR Code Not Configured</div>
                )}
                
                <p className="text-sm font-medium italic text-[#141414]/70 mb-6">Please upload the payment receipt below.</p>
                
                <label className="border border-dashed border-black/20 p-6 relative cursor-pointer hover:bg-black/5 transition-colors block text-center min-h-[100px] flex items-center justify-center bg-white group">
                   <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                   <div className="text-[11px] font-bold uppercase tracking-widest text-black/50 group-hover:text-black transition-colors">
                     {receiptFile ? (
                       <span className="text-green-600 block mb-1">Receipt Selected:<br/> {receiptFile.name}</span>
                     ) : 'Click to select receipt image *'}
                   </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 mt-8 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[450px] order-1 lg:order-2">
          <div className="bg-[#FAFAFA] border border-black/5 p-6 md:p-8 sticky top-28">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-6 border-b border-black/5 pb-4">Order Summary</h2>
            
            <div className="space-y-6 mb-8 border-b border-black/5 pb-8">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-4">
                  <div className="w-16 h-20 bg-zinc-100 flex-shrink-0 border border-black/5">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide leading-tight mb-1">{item.product.name}</h3>
                    <p className="text-[#141414]/50 text-[9px] uppercase font-bold tracking-widest mb-1">
                      Size: {item.size} {item.color && <><span className="mx-1">|</span> {item.color}</>} <span className="mx-1">|</span> Qty: {item.quantity}
                    </p>
                    {item.instructions && (
                        <p className="text-[#141414]/40 text-[9px] font-medium italic mb-1 line-clamp-1">Note: {item.instructions}</p>
                    )}
                    <p className="font-medium text-[11px] opacity-70">{formatNPR(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code" 
                  className="flex-1 border border-black/20 py-3 px-4 bg-white focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30"
                  disabled={appliedDiscount !== null}
                />
                <button 
                  type="button"
                  onClick={appliedDiscount ? removeDiscount : handleApplyDiscount}
                  className={`px-6 text-[11px] font-bold uppercase tracking-widest transition-colors ${appliedDiscount ? 'bg-[#141414]/10 text-[#141414]' : 'bg-[#141414] text-white hover:bg-zinc-800'}`}
                >
                  {appliedDiscount ? 'Remove' : 'Apply'}
                </button>
              </div>
              {discountError && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2">{discountError}</p>
              )}
            </div>

            <div className="pt-4 space-y-3 text-[11px] uppercase tracking-widest font-bold">
              <div className="flex justify-between">
                <span className="text-[#141414]/50">Subtotal</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-2">
                    Discount ({appliedDiscount.code})
                  </span>
                  <span>-{formatNPR(appliedDiscount.amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-black/5 pb-4">
                <span className="text-[#141414]/50">Delivery ({shippingRegion === 'inside' ? 'Inside KTM' : 'Outside KTM'})</span>
                <span>{formatNPR(shipping)}</span>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between items-center text-[#141414]">
              <span className="font-bold uppercase tracking-widest text-[11px]">Total</span>
              <span className="font-bold text-lg">{formatNPR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
