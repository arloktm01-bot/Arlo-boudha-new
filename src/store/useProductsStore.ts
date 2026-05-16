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
    products: [],
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
            subCategory: data.subCategory,
            colour: data.colour || undefined,
            sizes: data.sizes || [],
            images: data.images || [],
            isNew: data.isNew || false,
            isSale: data.isSale || false,
            isBestSeller: data.isBestSeller || false,
            isFeatured: data.isFeatured || false,
            stock: data.stock !== undefined ? Number(data.stock) : undefined,
          } as Product);
        });
        
        // Set firestore products directly
        set((state) => {
          return { products: firestoreProducts, loading: false };
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        set({ error: (error as Error).message, loading: false });
      });
    }
  };
});
