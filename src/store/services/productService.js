import { getAllProductStoreApi, getProductByIdApi } from "../api/productApi";

export const getAllProducts = async () => {
  const res = await getAllProductStoreApi();
  // res.data is the ApiResponse, res.data.data is the List<Product>
  const products = res || [];

  return products.map((p) => {
    const totalStock =
      p.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
      
    return {
      id: p.productId,
      name: p.name,
      category: p.productType,
      price: p.price ?? 0,
      stock: totalStock,
      brand: p.brand,
      img:
        p.variants?.[0]?.imageUrl ||
        "https://placehold.co/500",
    };
  });
};

export const getProductById = async (id) => {
  const res = await getProductByIdApi(id);
  // res.data.data is the Product object
  const p = res;
  
  if (!p) return null;

  return {
      id: p.productId,
      category: p.productType,
      name: p.name,
      brand: p.brand,
      description: p.description,
      isPrescriptionSupported: p.isPrescriptionSupported,
      price: p.price ?? 0,
      variants: p.variants || []
  };
};



