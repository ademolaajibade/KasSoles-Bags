function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(Model, name) {
  const base = slugify(name);
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

module.exports = { slugify, generateUniqueSlug };
