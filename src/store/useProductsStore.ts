import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, products as initialProducts } from '@/data/products';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

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
            oldPrice: data.oldPrice ? Number(data.oldPrice) : undefined,
            description: data.description,
            category: data.category,
            colour: data.colour || undefined,
            sizes: data.sizes || [],
            images: data.images || [],
            isNew: data.isNew || true, // Defaulting new items to true
            isSale: data.isSale || false,
            isBestSeller: data.isBestSeller || false,
          } as Product);
        });
        
        // Merge with local static products
        set((state) => {
          const map = new Map<string, Product>();
          // Add firestore products first so they appear at the top
          firestoreProducts.forEach(p => map.set(p.id, p));
          // Add initial products only if they don't already exist from firestore
          initialProducts.forEach(p => {
             if (!map.has(p.id)) {
                 map.set(p.id, p);
             }
          });
          const combined = Array.from(map.values());
          return { products: combined, loading: false };
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        set({ error: (error as Error).message, loading: false });
      });
    }
  };
});
