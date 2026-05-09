export type Category = "All" | "Hoodies" | "T-Shirts" | "Pants" | "Accessories";
export type Size = "S" | "M" | "L" | "XL";

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
  oldPrice?: number;
  color?: string;
}

export const products: Product[] = [
  {
    id: "p-001",
    name: "Oversized Heavyweight Hoodie - Onyx",
    price: 4500,
    category: "Hoodies",
    images: [
      "https://images.unsplash.com/photo-1556821840-ce6567a21390?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556821835-188fa538e12d?q=80&w=1000&auto=format&fit=crop"
      ],
    description: "Premium heavyweight cotton hoodie with a relaxed, oversized fit. Dropped shoulders, double-lined hood, and minimalist Arlo Boudha branding on the chest. Built for the streets of KTM.",
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "p-002",
    name: "Classic Box Fit Tee - Blanc",
    price: 1800,
    category: "T-Shirts",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "The perfect boxy t-shirt. Crafted from thick 240gsm cotton structure that holds its shape. A staple for any wardrobe.",
    isBestSeller: true,
  },
  {
    id: "p-003",
    name: "Cargo Parachute Pants - Olive",
    price: 3600,
    category: "Pants",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552874869-5c39ec9288dc?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Adjustable parachute-style pants featuring multiple utilitarian pockets and drawstrings at the ankle for versatile styling.",
    isSale: true,
    oldPrice: 4200,
  },
  {
    id: "p-004",
    name: "Washed Graphic Tee - 'Boudha Nights'",
    price: 2200,
    category: "T-Shirts",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Vintage-washed dark grey t-shirt featuring a custom screen-printed design inspired by the backstreets of Boudha.",
    isBestSeller: true,
  },
  {
    id: "p-005",
    name: "Essential Zip-Up Hoodie - Ash",
    price: 4200,
    category: "Hoodies",
    images: [
      "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Everyday zip-up hoodie featuring a two-way YKK zipper, cropped body, and extended sleeves.",
    isBestSeller: true,
  },
  {
    id: "p-006",
    name: "Arlo Signature Tote",
    price: 1200,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1597820351717-b769ea84cb06?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1597820351631-50fb77f15b36?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Heavy canvas tote bag with reinforced straps and internal pocket. Features puff-print branding.",
    isNew: true,
  },
  {
    id: "p-007",
    name: "Tech-Fleece Joggers - Black",
    price: 3200,
    category: "Pants",
    images: [
      "https://images.unsplash.com/photo-1604160450925-0eecf56738b3?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Slim-tapered tech fleece joggers designed for comfort and mobility. Features hidden zip pockets.",
  },
  {
    id: "p-008",
    name: "Logo Beanie - Charcoal",
    price: 900,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop"
    ],
    description: "Thick ribbed knit beanie with a subtle woven logo tab.",
  }
];

export const getFeaturedProducts = () => products.filter(p => p.isNew || p.isSale).slice(0, 4);
export const getBestSellers = () => products.filter(p => p.isBestSeller).slice(0, 4);
