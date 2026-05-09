import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, products as initialProducts } from '@/data/products';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  initialize: () => void;
}

export const useProductsStore = create<ProductsState>((set) => {
  let unsubscribe: (() => void) | null = null;

  return {
    // We start with local products so the UI isn't empty, then merge Firebase
    products: initialProducts,
    loading: true,
    error: null,
    initialize: () => {
      // Prevent multiple listeners
      if (unsubscribe) return;

      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreProducts: Product[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          firestoreProducts.push({
            id: doc.id,
            name: data.name,
            price: Number(data.price),
            description: data.description,
            category: data.category,
            sizes: data.sizes || [],
            images: data.images || [],
            isNew: data.isNew || true, // Defaulting new items to true
            isSale: data.isSale || false,
            isBestSeller: data.isBestSeller || false,
          } as Product);
        });
        
        // Merge with local static products, or just replace? Let's merge so we don't lose static.
        set((state) => {
          // If we want to replace local completely, we just use firestoreProducts
          // Let's add them to the beginning of the list
          const combined = [...firestoreProducts, ...initialProducts];
          // avoid duplicates if we happen to have same IDs? Firestore IDs are unique strings, local IDs are like 'p-001'
          return { products: combined, loading: false };
        });
      }, (error) => {
        console.error("Firestore Error:", error);
        set({ error: error.message, loading: false });
      });
    }
  };
});
