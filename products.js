const express = require('express');
const Product = require('../models/Product');
const { validateId, requireBody, validateStockChange } = require('../middleware/validate');

const router = express.Router();

const FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE = ['name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'];

const pick = (obj) =>
  FIELDS.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- Reports (must be declared before /:id) ----------

// GET /api/products/low-stock  -> quantity <= reorderLevel
router.get('/low-stock', async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).sort({ quantity: 1 });
    res.json({ count: lowStockItems.length, lowStockItems });
  } catch (err) { next(err); }
});

// GET /api/products/summary  -> category-wise aggregation
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { totalStockValue: -1 } },
    ]);
    res.json({ categories: summary.length, summary });
  } catch (err) { next(err); }
});

// ---------- CRUD ----------

// POST /api/products
router.post('/', requireBody, async (req, res, next) => {
  try {
    const product = await Product.create(pick(req.body));
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&sort=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { category, supplier, search, minPrice, maxPrice, sort } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = {};
    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
    if (supplier) filter.supplier = new RegExp(`^${escapeRegex(supplier)}$`, 'i');
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // sort=-price,name  (whitelisted fields only)
    const sortBy = {};
    (sort ? sort.split(',') : ['-createdAt']).forEach((s) => {
      const field = s.replace(/^-/, '');
      if (SORTABLE.includes(field)) sortBy[field] = s.startsWith('-') ? -1 : 1;
    });

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
    ]);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      products,
    });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

// PUT /api/products/:id  (partial updates allowed, validators re-run)
router.put('/:id', validateId, requireBody, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: pick(req.body) },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -3 }
// Atomic $inc; the filter stops stock from going below zero (no race conditions)
router.patch('/:id/stock', validateId, validateStockChange, async (req, res, next) => {
  try {
    const { change } = req.body;
    const filter = { _id: req.params.id };
    if (change < 0) filter.quantity = { $gte: -change };

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { quantity: change } },
      { new: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });
      if (!exists) return res.status(404).json({ error: 'Product not found' });
      return res.status(400).json({ error: 'Insufficient stock for this sale' });
    }
    res.json({ message: 'Stock updated', product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: product.id });
  } catch (err) { next(err); }
});

module.exports = router;
