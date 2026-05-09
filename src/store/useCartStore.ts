import { create } from "zustand";
import { Product, Size } from "../data/products";

export interface CartItem {
  product: Product;
  size: Size;
  quantity: number;
  color?: string;
  instructions?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: Size, quantity?: number, color?: string, instructions?: string) => void;
  removeItem: (productId: string, size: Size, color?: string) => void;
  updateQuantity: (productId: string, size: Size, delta: number, color?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (product, size, quantity = 1, color = "", instructions = "") => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id && item.size === size && item.color === color
              ? { ...item, quantity: item.quantity + quantity, instructions }
              : item
          ),
          isOpen: true,
        };
      }

      return {
        items: [...state.items, { product, size, quantity, color, instructions }],
        isOpen: true,
      };
    });
  },
  removeItem: (productId, size, color) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.product.id === productId && item.size === size && item.color === color)
      ),
    }));
  },
  updateQuantity: (productId, size, delta, color) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.product.id === productId && item.size === size && item.color === color) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    }));
  },
  clearCart: () => set({ items: [] }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  getCartTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },
}));
