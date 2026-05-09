import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatNPR } from '@/lib/utils';
import { Package, Search, Truck, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const orderRef = doc(db, 'orders', orderId.trim());
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } else {
        setError("Order not found. Please check your Order ID.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('permission')) {
        setError("Missing permissions to track order. Please check Firebase rules to allow public reads for tests, or sign in.");
      } else {
        setError("Failed to fetch order details. " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="text-yellow-500" size={32} />;
      case 'processing': return <Package className="text-blue-500" size={32} />;
      case 'shipped': return <Truck className="text-indigo-500" size={32} />;
      case 'delivered': return <CheckCircle2 className="text-green-500" size={32} />;
      default: return <Package className="text-gray-500" size={32} />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return "Order Received";
      case 'processing': return "Processing Order";
      case 'shipped': return "Out for Delivery";
      case 'delivered': return "Delivered";
      case 'cancelled': return "Cancelled";
      default: return status;
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 md:px-10 max-w-[800px] mx-auto min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-4">Track Order</h1>
        <p className="opacity-50 text-[11px] font-bold uppercase tracking-widest leading-tight">Enter your order ID to see the current status.</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 max-w-md mx-auto mb-16">
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter Order ID" 
          className="flex-1 border border-black/20 py-4 px-6 focus:outline-none focus:border-black transition-colors rounded-none text-[#141414] font-medium"
        />
        <button 
          type="submit"
          disabled={loading || !orderId.trim()}
          className="bg-black text-white px-8 flex items-center justify-center font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : <Search size={20} />}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-6 text-center text-[11px] font-bold uppercase tracking-widest border border-red-100">
          {error}
        </div>
      )}

      {order && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/5 p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/5 pb-8 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Order ID</p>
              <p className="font-mono text-sm font-bold">{order.id}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mt-4 mb-1">Date Placed</p>
              <p className="text-sm font-bold">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recently'}</p>
            </div>
            
            <div className="flex flex-col items-center bg-[#FAFAFA] p-6 border border-black/5 min-w-[200px]">
              <div className="mb-3">
                {getStatusIcon(order.status || 'pending')}
              </div>
              <h3 className="font-heading font-black text-lg uppercase tracking-wide">{getStatusText(order.status || 'pending')}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4 border-b border-black/5 pb-2">Order Items</h3>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-[#141414]/50 mt-1">
                        Size: {item.size} {item.color && `| Color: ${item.color}`} | Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold">{formatNPR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4 border-b border-black/5 pb-2">Shipping Details</h3>
              <div className="text-sm space-y-1">
                <p className="font-bold">{order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</p>
                <p>{order.shippingDetails?.address}</p>
                <p>{order.shippingDetails?.city}, {order.shippingDetails?.postalCode}</p>
                <p className="mt-2 font-medium text-[#141414]/70">{order.shippingDetails?.phone}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-black/5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-[11px] uppercase tracking-widest">Total Amount</span>
                  <span>{formatNPR(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
