import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { formatNPR } from "@/lib/utils";
import { Package, Clock } from "lucide-react";

export function Orders() {
  const { user, loading } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoadingOrders(false);
        return;
      }
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        // Note: Firestore requires a composite index for where() + orderBy(). 
        // We'll sort it client-side to avoid index requirement for now.
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
          .sort((a, b) => {
             const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
             const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
             return tB - tA;
          });
        setOrders(fetchedOrders);
      } catch (err: any) {
        console.error("Error loading user orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    
    if (!loading) {
      loadOrders();
    }
  }, [user, loading]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-4">Please Sign In</h1>
        <p className="text-black/50 text-center mb-8">You need an account to view your order history.</p>
        <Link to="/login" className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-[11px] hover:bg-black/80 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 md:px-10 max-w-[900px] mx-auto min-h-screen">
      <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tighter mb-12 text-[#141414]">Order History</h1>
      
      {loadingOrders ? (
        <div className="text-center text-sm font-bold uppercase tracking-widest text-black/50 py-12">Loading Orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center bg-[#FAFAFA] border border-black/5 p-12">
          <Package className="mx-auto text-black/20 mb-4" size={48} />
          <h2 className="text-lg font-bold uppercase tracking-widest mb-2">No Orders Found</h2>
          <p className="text-black/50 mb-6 font-medium text-sm">You haven't placed any orders yet.</p>
          <Link to="/shop" className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-[11px] inline-block hover:bg-black/80">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="border border-black/10 bg-[#FAFAFA] p-6 lg:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-black/5 pb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1">Order ID</p>
                  <p className="font-mono text-lg font-bold">{order.id}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/50 mb-1">Status</p>
                    <p className="font-bold text-sm uppercase tracking-widest text-blue-600">{order.status || 'Pending'}</p>
                  </div>
                  <Link to={`/track`} state={{ orderId: order.id }} className="bg-black text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-colors ml-4 whitespace-nowrap">
                    Track Order
                  </Link>
                </div>
              </div>
              
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm font-medium">
                    <div>
                      <span className="font-bold text-[#141414]">{item.quantity}x</span> {item.name}
                      <span className="text-black/50 ml-2">({item.size}{item.color ? `, ${item.color}` : ''})</span>
                    </div>
                    <div className="font-bold">{formatNPR(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-black/5 flex justify-between items-center text-lg font-bold">
                <span className="uppercase tracking-widest text-[11px]">Total</span>
                <span>{formatNPR(order.totalAmount || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
