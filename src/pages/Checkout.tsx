import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatNPR } from "@/lib/utils";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/firestoreError";
import { uploadImageToCloudinary } from "@/lib/upload";

export function Checkout() {
  const { getCartTotal, clearCart, items: cartItems } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowItem = location.state?.buyNowItem;
  const items = buyNowItem ? [buyNowItem] : cartItems;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Payment Receipt State
  const [storeQrCode, setStoreQrCode] = useState<string | null>(null);

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "store"));
        if (snap.exists() && snap.data().qrCodeUrl) {
          setStoreQrCode(snap.data().qrCodeUrl);
        }
      } catch (err) {
        console.error("Failed to load store settings", err);
        // Do not throw for settings so the page can still load
      }
    }
    loadSettings();
  }, []);

  const subtotal = buyNowItem
    ? buyNowItem.product.price * buyNowItem.quantity
    : getCartTotal();

  const getCityQuery = (city: string) => city.toLowerCase().trim();
  const cityQuery = getCityQuery(formData.city);
  const isInsideValley =
    cityQuery.includes("kathmandu") ||
    cityQuery.includes("bhaktapur") ||
    cityQuery.includes("lalitpur") ||
    cityQuery.includes("ktm");
  const shipping = isInsideValley ? 100 : 150;

  let discountValue = 0;
  if (appliedDiscount) {
    discountValue = appliedDiscount.amount;
  }

  const total = Math.max(0, subtotal + shipping - discountValue);

  const VALID_CODES: Record<
    string,
    { type: "percent" | "fixed"; value: number }
  > = {
    WELCOME10: { type: "percent", value: 10 },
    ARLO20: { type: "percent", value: 20 },
    FLAT500: { type: "fixed", value: 500 },
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
      if (discountRule.type === "percent") {
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

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        userId: useAuthStore.getState().user?.uid || null,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          colour: item.colour || null,
          instructions: item.instructions || null,
        })),
        shippingDetails: formData,
        subtotal,
        shipping,
        discountCode: appliedDiscount?.code || null,
        discountAmount: appliedDiscount?.amount || 0,
        totalAmount: total,
        status: "pending",
        paymentMethod: "Bank Transfer",
        createdAt: serverTimestamp(),
      };

      let newOrderId = "";
      
      await runTransaction(db, async (transaction) => {
        // Read all product documents first
        const productRefs = items.map(item => doc(db, "products", item.product.id));
        // Need to read sequentially or use Promise.all, but inside transaction it's fine
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        
        // Validate stock
        productSnaps.forEach((snap, idx) => {
          if (!snap.exists()) {
            throw new Error(`Product ${items[idx].product.name} no longer exists.`);
          }
          const productData = snap.data();
          const currentStock = productData.stock !== undefined ? Number(productData.stock) : Infinity;
          if (currentStock < items[idx].quantity) {
             throw new Error(`Insufficient quantity for ${items[idx].product.name}. Only ${currentStock} left in stock.`);
          }
        });

        // Deduct stock
        productSnaps.forEach((snap, idx) => {
          const productData = snap.data();
          const currentStock = productData.stock !== undefined ? Number(productData.stock) : null;
          if (currentStock !== null) {
            transaction.update(productRefs[idx], {
              stock: currentStock - items[idx].quantity
            });
          }
        });

        // Add order document
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, orderData);
        newOrderId = newOrderRef.id;
      });

      setPlacedOrderId(newOrderId);

      // Trigger notification for the first item
      if (items.length > 0) {
        try {
          let clientId = localStorage.getItem('client_id');
          if (!clientId) {
            clientId = Math.random().toString(36).substring(2);
            localStorage.setItem('client_id', clientId);
          }
          await addDoc(collection(db, "public_notifications"), {
            customerName: formData.firstName,
            productName: items[0].product.name,
            deliveryAddress: formData.address,
            timestamp: Date.now(),
            productImage: items[0].product.images[0],
            productUrl: `/product/${items[0].product.id}`,
            clientId,
          });
        } catch (notifErr) {
          console.error("Failed to create public notification", notifErr);
        }
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      if (!buyNowItem) {
        clearCart();
      }
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, "orders");
      if (err.message?.includes("permission")) {
        setError(
          "Missing permissions to create order. Please check Firebase rules to allow public creation for tests, or sign in.",
        );
      } else {
        setError(err.message || "Failed to place order");
      }
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">
        <h1 className="text-3xl font-heading font-bold uppercase mb-4 text-center">
          Your Cart is Empty
        </h1>
        <button
          onClick={() => navigate("/shop")}
          className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
        >
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
          <h1 className="text-3xl font-heading font-black uppercase mb-4 tracking-tighter">
            Order Confirmed!
          </h1>

          <div className="mb-8 border border-black/10 p-6 bg-[#FAFAFA] w-full mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
              Your Order ID
            </p>
            <p className="font-mono text-2xl font-bold tracking-wider">
              {placedOrderId}
            </p>
            <p className="text-[10px] bg-yellow-100 text-yellow-800 uppercase tracking-widest font-bold mt-4 py-2 text-center border border-yellow-200">
              Use this Order ID to track your order.
            </p>
          </div>

          <p className="text-[#141414]/70 mb-8 leading-relaxed font-medium">
            Thank you for your order, {formData.firstName}. We have received
            your payment receipt and will contact you at {formData.phone}{" "}
            shortly.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <a
              href={`https://wa.me/9779843402357?text=${encodeURIComponent(`Hi Arlo! Here is my payment receipt for Order ID: ${placedOrderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
            >
              Send Receipt to WhatsApp
            </a>
            <button
              onClick={() => navigate("/track")}
              className="w-full bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-transparent border border-black text-black px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputClass =
    "w-full border-b border-black/20 py-3 bg-transparent focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium placeholder-[#141414]/30";
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1";

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[1400px] mx-auto min-h-screen">
      <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-12 text-center text-[#141414]">
        Checkout
      </h1>

      <div className="max-w-2xl mx-auto">
        {/* Form */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-8 border-b border-black/5 pb-4">
            Shipping Information
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm font-bold tracking-widest uppercase text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  required
                  type="text"
                  className={inputClass}
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  required
                  type="text"
                  className={inputClass}
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  required
                  type="tel"
                  className={inputClass}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  className={inputClass}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>City *</label>
              <input
                required
                type="text"
                placeholder="e.g. Kathmandu, Lalitpur"
                className={inputClass}
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Delivery Address *</label>
              <input
                required
                type="text"
                placeholder="Street, House No., Landmark"
                className={inputClass}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Order Notes (Optional)</label>
              <textarea
                rows={3}
                className={inputClass}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              ></textarea>
            </div>

            {/* Order Summary embedded inside the form stream */}
            <div className="mt-12 pt-8 border-t border-black/5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-6">
                Order Summary
              </h2>
              <div className="bg-[#FAFAFA] border border-black/5 p-6 space-y-6">
                <div className="space-y-4 border-b border-black/5 pb-6">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}-${item.colour}`}
                      className="flex gap-4"
                    >
                      <div className="w-16 h-20 bg-zinc-100 flex-shrink-0 border border-black/5">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[11px] font-bold uppercase tracking-wide leading-tight mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-[#141414]/50 text-[9px] uppercase font-bold tracking-widest mb-1">
                          Size: {item.size}{" "}
                          {item.colour && (
                            <>
                              <span className="mx-1">|</span> {item.colour}
                            </>
                          )}{" "}
                          <span className="mx-1">|</span> Qty: {item.quantity}
                        </p>
                        <p className="font-medium text-[11px] opacity-70">
                          {formatNPR(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-3 text-[11px] uppercase tracking-widest font-bold">
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
                    <span className="text-[#141414]/50">
                      Delivery ({isInsideValley ? "Inside" : "Outside"} KTM)
                    </span>
                    <span>{formatNPR(shipping)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[#141414]">
                  <span className="font-bold uppercase tracking-widest text-[11px]">
                    Total
                  </span>
                  <span className="font-bold text-lg">{formatNPR(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-black/5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/40 mb-6">
                Payment Method / QR Code
              </h2>
              <div className="border border-black/10 bg-[#FAFAFA] p-6 text-center">
                <p className="font-bold uppercase tracking-widest text-[11px] mb-4 text-[#141414]">
                  Scan QR code to pay
                </p>
                {storeQrCode ? (
                  <img
                    src={storeQrCode}
                    alt="Store QR Code"
                    className="mx-auto max-w-[200px] mb-4 border border-black/10"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-zinc-200 mx-auto flex items-center justify-center text-[10px] uppercase font-bold text-black/40 mb-4 border border-black/10">
                    QR Code Not Configured
                  </div>
                )}

                <p className="text-sm font-medium italic text-[#141414]/70 mt-6 mb-4">
                  Please send the screenshot of the payment reciept to the
                  whatsapp below.
                </p>
                <a
                  href="https://wa.me/9779843402357"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-black/20 hover:bg-black/5 text-[11px] font-bold uppercase tracking-widest text-[#141414] transition-colors py-3 px-6"
                >
                  SEND SCREENSHOT
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 mt-8 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
