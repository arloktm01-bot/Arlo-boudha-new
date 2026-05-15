export type Category = "All" | "Hoodies" | "T-Shirts" | "Pants" | "Accessories";
export type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category | string;
  images: string[];
  description: string;
  isNew?: boolean;
  isSale?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  oldPrice?: number;
  colour?: string;
  sizes?: Size[];
  stock?: number;
}

export const products: Product[] = [];

export const getFeaturedProducts = () => products.filter(p => p.isNew || p.isSale).slice(0, 4);
export const getBestSellers = () => products.filter(p => p.isBestSeller).slice(0, 4);
