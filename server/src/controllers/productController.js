const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");
const { generateUniqueSlug } = require("../utils/slugify");

function parseVariants(raw) {
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(parsed)) {
    throw new Error("Variants must be an array");
  }
  return parsed;
}

async function destroyUploadedFiles(files) {
  if (!files || files.length === 0) return;
  await Promise.all(
    files.map((file) => cloudinary.uploader.destroy(file.filename).catch(() => {}))
  );
}

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { gender, category, search, minPrice, maxPrice, page = 1, limit = 20, sort } = req.query;

  const filter = {};
  const isAdminRequestingAll = req.user?.role === "admin" && req.query.includeInactive === "true";
  if (!isAdminRequestingAll) filter.isActive = true;

  if (gender) filter.gender = gender;

  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    filter.category = categoryDoc ? categoryDoc._id : null;
  }

  if (search) filter.name = { $regex: search, $options: "i" };

  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    "price-asc": { basePrice: 1 },
    "price-desc": { basePrice: -1 },
  };
  const sortOption = sortOptions[sort] || sortOptions.newest;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    "category",
    "name slug"
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, product });
});

// GET /api/products/id/:id (admin — unlike getProductBySlug, includes inactive products)
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, product });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, category, gender, basePrice, compareAtPrice, isHandmade } =
      req.body;

    if (!name || !category || !gender || basePrice === undefined) {
      res.status(400);
      throw new Error("Name, category, gender and basePrice are required");
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      res.status(400);
      throw new Error("Category not found");
    }

    const variants = parseVariants(req.body.variants);
    if (variants.length === 0) {
      res.status(400);
      throw new Error("At least one variant is required");
    }

    const images = (req.files || []).map((file) => ({ url: file.path, publicId: file.filename }));
    const slug = await generateUniqueSlug(Product, name);

    const product = await Product.create({
      name,
      slug,
      description,
      category: categoryDoc._id,
      gender,
      basePrice,
      compareAtPrice: compareAtPrice === "" || compareAtPrice == null ? undefined : compareAtPrice,
      variants,
      images,
      isHandmade: isHandmade !== undefined ? isHandmade : true,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    await destroyUploadedFiles(req.files);
    throw err;
  }
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const {
      name,
      description,
      category,
      gender,
      basePrice,
      compareAtPrice,
      isHandmade,
      isActive,
    } = req.body;

    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        res.status(400);
        throw new Error("Category not found");
      }
      product.category = categoryDoc._id;
    }

    if (name && name !== product.name) {
      product.name = name;
      product.slug = await generateUniqueSlug(Product, name);
    }
    if (description !== undefined) product.description = description;
    if (gender) product.gender = gender;
    if (basePrice !== undefined) product.basePrice = basePrice;
    if (compareAtPrice !== undefined) {
      product.compareAtPrice = compareAtPrice === "" ? undefined : compareAtPrice;
    }
    if (isHandmade !== undefined) product.isHandmade = isHandmade;
    if (isActive !== undefined) product.isActive = isActive;

    if (req.body.variants !== undefined) {
      const variants = parseVariants(req.body.variants);
      if (variants.length === 0) {
        res.status(400);
        throw new Error("At least one variant is required");
      }
      product.variants = variants;
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({ url: file.path, publicId: file.filename }));
      product.images.push(...newImages);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    await destroyUploadedFiles(req.files);
    throw err;
  }
});

// DELETE /api/products/:id/images  (body: { publicId })
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { publicId } = req.body;
  const image = product.images.find((img) => img.publicId === publicId);
  if (!image) {
    res.status(404);
    throw new Error("Image not found on product");
  }

  await cloudinary.uploader.destroy(publicId);
  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  res.json({ success: true, product });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await Promise.all(product.images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {})));
  await product.deleteOne();

  res.json({ success: true, message: "Product deleted" });
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
};
