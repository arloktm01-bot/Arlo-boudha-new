import { create } from "zustand";
import { Product, Size } from "../data/products";

export interface CartItem {
  product: Product;
  size: Size;
  quantity: number;
  colour?: string;
  instructions?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: Size, quantity?: number, colour?: string, instructions?: string) => void;
  removeItem: (productId: string, size: Size, colour?: string) => void;
  updateQuantity: (productId: string, size: Size, delta: number, colour?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (product, size, quantity = 1, colour = "", instructions = "") => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id && item.size === size && item.colour === colour
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id && item.size === size && item.colour === colour
              ? { 
                  ...item, 
                  quantity: product.stock !== undefined ? Math.min(product.stock, item.quantity + quantity) : item.quantity + quantity,
                  instructions 
                }
              : item
          )
        };
      }

      return {
        items: [...state.items, { 
          product, 
          size, 
          quantity: product.stock !== undefined ? Math.min(product.stock, quantity) : quantity, 
          colour, 
          instructions 
        }]
      };
    });
  },
  removeItem: (productId, size, colour) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.product.id === productId && item.size === size && item.colour === colour)
      ),
    }));
  },
  updateQuantity: (productId, size, delta, colour) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.product.id === productId && item.size === size && item.colour === colour) {
             const newQuantity = Math.max(0, item.quantity + delta);
             const maxQuantity = item.product.stock !== undefined ? item.product.stock : Infinity;
             return { ...item, quantity: Math.min(newQuantity, maxQuantity) };
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
