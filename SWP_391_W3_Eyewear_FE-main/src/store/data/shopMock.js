
//store/data/shopMock.js
export const products = [
  // ===== FRAMES =====
  {
    id: 1,
    name: "Titanium Full Rim Black",
    category: "frame",
    type: "full-rim",
    brand: "Ray-Ban",
    price: 2800000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800"],
    featured: true,
  },
  {
    id: 2,
    name: "TR90 Lightweight Frame",
    category: "frame",
    type: "half-rim",
    brand: "Oakley",
    price: 1900000,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800"],
  },
  {
    id: 3,
    name: "Rimless Office Frame",
    category: "frame",
    type: "rimless",
    brand: "Gentle Monster",
    price: 3200000,
    stock: 8,
    images: ["https://images.unsplash.com/photo-1589987607627-0c09c3e6a43a?w=800"],
  },

  // ===== LENS =====
  {
    id: 4,
    name: "Blue Light Filter Lens",
    category: "lens",
    type: "blue-light",
    brand: "Essilor",
    price: 1500000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800"],
  },
  {
    id: 5,
    name: "Progressive Lens Premium",
    category: "lens",
    type: "progressive",
    brand: "Zeiss",
    price: 4200000,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=800"],
    featured: true,
  },
  {
    id: 6,
    name: "Polarized Prescription Lens",
    category: "lens",
    type: "polarized",
    brand: "Hoya",
    price: 3500000,
    stock: 12,
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800"],
  },

  // ===== SUNGLASSES =====
  {
    id: 7,
    name: "Aviator Polarized Gold",
    category: "sunglasses",
    type: "polarized",
    brand: "Ray-Ban",
    price: 3500000,
    stock: 10,
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"],
    featured: true,
  },
  {
    id: 8,
    name: "Sport Shield Black",
    category: "sunglasses",
    type: "sport",
    brand: "Oakley",
    price: 2900000,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800"],
  },
  {
    id: 9,
    name: "Fashion Oversize Sunglasses",
    category: "sunglasses",
    type: "fashion",
    brand: "Gentle Monster",
    price: 2600000,
    stock: 22,
    images: ["https://images.unsplash.com/photo-1520975922203-b2f0d9f1d17c?w=800"],
  },
];

export const formatPrice = (price) =>
  price.toLocaleString("vi-VN") + "₫";