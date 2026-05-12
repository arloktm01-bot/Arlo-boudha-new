import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SettingsState {
  storeQrCodeUrl: string | null;
  logoUrl: string | null;
  notificationSoundUrl: string | null;
  loading: boolean;
  initialize: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  let unsubscribe: (() => void) | null = null;
  return {
    storeQrCodeUrl: null,
    logoUrl: null,
    notificationSoundUrl: null,
    loading: true,
    initialize: () => {
      if (unsubscribe) return;
      try {
        unsubscribe = onSnapshot(doc(db, "settings", "store"), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            set({ 
              storeQrCodeUrl: data.qrCodeUrl || null,
              logoUrl: data.logoUrl || null,
              notificationSoundUrl: data.notificationSoundUrl || null,
              loading: false 
            });
          } else {
            set({ loading: false });
          }
        }, (error) => {
          console.error("Failed to load settings snapshot:", error);
          set({ loading: false });
        });
      } catch (err) {
        console.error("Failed to initialize settings:", err);
      }
    }
  };
});
