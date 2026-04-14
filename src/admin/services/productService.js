import {
  createProductApi,
  createVariantApi,
  deleteProductApi,
  deleteVariantApi,
  getAllProductsApi,
  getProductByIdApi,
  updateProductApi,
  updateVariantApi,
  updateVariantQuantityApi,
} from "../api/productApi";

const mapProduct = (p) => {
  const totalStock =
    p.variants?.reduce((sum, v) => sum + (v.stockQuantity ?? v.quantity ?? v.stock ?? 0), 0) ?? 0;

  return {
    id: p.productId,
    name: p.name,
    category: p.productType,
    price: p.price ?? 0,
    stock: totalStock,
    status: p.status || "AVAILABLE",
    active: p.active ?? true,
    img:
      p.variants?.[0]?.imageUrl ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj1_Gp9JZ246p0IK04AFBLjWqfTwYWt-nD9w&s",
    variants: p.variants || [], // 🔥 TRẢ VỀ VARIANTS ĐỂ HIỂN THỊ TRONG DASHBOARD
  };
};

export const getAllProducts = async () => {
  const res = await getAllProductsApi();

  return res.map(mapProduct);
};

export const createProduct = async (form) => {
  const payload = {
    productType: form.type, // FRAME / LENS
    name: form.name,
    brand: form.brand,
    description: form.description || "",
    price: Number(form.price),
    isPrescriptionSupported: true,

    variants: form.variants.map((v) => ({
      stockQuantity: Number(v.stock),
      frameSize: v.frameSize || null,
      color: v.color,
      material: v.material,
      imageUrl: v.image,
    })),
  };

  const res = await createProductApi(payload);

  return mapProduct(res);
};

export const deleteProduct = async (id) => {
  const res = await deleteProductApi(id);
  return res;
};

export const getProductById = async (id) => {
  const res = await getProductByIdApi(id);
  const p = res.data.data;
  return {
    id: p.productId,
    type: p.productType,
    name: p.name || "",
    brand: p.brand || "",
    description: p.description || "",
    price: p.price ?? "",

    isPrescriptionSupported: true,
    variants:
      p.variants?.map((v) => ({
        variantId: v.variantId,
        stock: v.stockQuantity || "",
        frameSize: v.frameSize || "",
        color: v.color || "",
        material: v.material || "",
        image: v.imageUrl || "",
        _done: true, // load lên coi như completed
      })) || [],
  };
};

export const updateProduct = async (id, form) => {
  const payload = {
    productId: id,
    productType: form.type,
    name: form.name,
    brand: form.brand,
    description: form.description || "",
    price: Number(form.price),

    isPrescriptionSupported: true,
    active: form.active ?? true, // 🔥 dùng giá trị từ form thay vì hardcode true

    variants: form.variants.map((v) => ({
      variantId: v.variantId || 0, // 🔥 rất quan trọng
      productId: id,
      stockQuantity: v.stock,
      frameSize: v.frameSize || null,
      color: v.color,
      material: v.material,
      imageUrl: v.image || v.imageUrl,
      status: v.status || (form.active === false ? "UNAVAILABLE" : "AVAILABLE"),
      active: form.active ?? true, // 🔥 đồng bộ với trạng thái sản phẩm
      deleted: false,
    })),
  };

  const res = await updateProductApi(id, payload);

  return res.data.data; // vì API bọc trong { success, data }
};

export const updateVariant = async (id, quantity, data) => {
  const res = await updateVariantApi(id, quantity, data);

  return res.data.data;
};

export const updateVariantQuantity = async (id, quantity) => {
  const res = await updateVariantQuantityApi(id, quantity);

  return res.data.data;
};

export const createVariant = async (id, data) => {
  const payload = {
    stockQuantity: data.stockQuantity,
    frameSize: data.frameSize,
    color: data.color,
    material: data.material,
    imageUrl: data.imageUrl,
    status: "AVAILABLE",
    active: true,
  };
  const res = await createVariantApi(id, payload);
  return res.data.data;
};

export const deleteVariant = async (id) => {
  const res = await deleteVariantApi(id);
  return res.data;
};
