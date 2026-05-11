import { create } from "zustand";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface OrderNotification {
  id: string;
  customerName: string;
  productName: string;
  deliveryAddress: string;
  timestamp: number;
  productImage: string;
  productUrl: string;
}

interface OrderNotificationStore {
  notifications: OrderNotification[];
  removeNotification: (id: string) => void;
  initialize: () => void;
  _initialized: boolean;
}

export const useOrderNotificationStore = create<OrderNotificationStore>(
  (set, get) => ({
    notifications: [],
    _initialized: false,
    initialize: () => {
      if (get()._initialized) return;
      set({ _initialized: true });

      const q = query(
        collection(db, "public_notifications"),
        orderBy("timestamp", "desc"),
        limit(5),
      );

      onSnapshot(q, (snapshot) => {
        let newNotifications: OrderNotification[] = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const oneHourAgo = Date.now() - 3600000;
            if (data.timestamp >= oneHourAgo) {
              newNotifications.push({
                id: change.doc.id,
                ...data,
              } as OrderNotification);
            }
          }
        });

        if (newNotifications.length > 0) {
          set((state) => ({
            notifications: [
              ...state.notifications,
              ...newNotifications.reverse(),
            ],
          }));
        }
      }, (error) => {
        console.error("Notifications snapshot error:", error);
      });
    },
    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    },
  }),
);
