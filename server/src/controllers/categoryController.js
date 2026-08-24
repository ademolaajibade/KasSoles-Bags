const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { generateUniqueSlug } = require("../utils/slugify");

// GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.gender) filter.gender = req.query.gender;

  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ success: true, categories });
});

// GET /api/categories/:slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, category });
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, gender } = req.body;

  if (!name || !gender) {
    res.status(400);
    throw new Error("Name and gender are required");
  }

  const slug = await generateUniqueSlug(Category, name);
  const category = await Category.create({ name, gender, slug });

  res.status(201).json({ success: true, category });
});

// PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const { name, gender } = req.body;

  if (name && name !== category.name) {
    category.name = name;
    category.slug = await generateUniqueSlug(Category, name);
  }
  if (gender) category.gender = gender;

  await category.save();
  res.json({ success: true, category });
});

// DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const inUse = await Product.exists({ category: category._id });
  if (inUse) {
    res.status(409);
    throw new Error("Cannot delete a category that still has products assigned to it");
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
