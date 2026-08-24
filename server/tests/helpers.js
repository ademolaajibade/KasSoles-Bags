const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const { signAccessToken } = require("../src/utils/tokenUtils");

let counter = 0;
function unique(prefix) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

async function createUser({ role = "customer", email, password = "password123" } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: "Test User",
    email: email || `${unique("user")}@test.com`,
    passwordHash,
    role,
  });
  const accessToken = signAccessToken(user);
  return { user, accessToken, password };
}

function createAdmin(overrides = {}) {
  return createUser({ ...overrides, role: "admin" });
}

async function createCategory(overrides = {}) {
  return Category.create({
    name: "Bags",
    slug: unique("bags"),
    gender: "unisex",
    ...overrides,
  });
}

async function createProduct(overrides = {}) {
  const category = overrides.category || (await createCategory())._id;

  return Product.create({
    name: "Tote Bag",
    slug: unique("tote-bag"),
    category,
    gender: "unisex",
    basePrice: 500000,
    variants: [
      {
        sku: unique("SKU"),
        size: "M",
        color: "Brown",
        price: 500000,
        stockQuantity: 10,
      },
    ],
    ...overrides,
  });
}

module.exports = { createUser, createAdmin, createCategory, createProduct };
