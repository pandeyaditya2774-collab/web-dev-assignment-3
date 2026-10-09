// Run: npm run seed   (clears the collection and inserts 12 sample products)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const data = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-101', category: 'Furniture', price: 5499, quantity: 15, reorderLevel: 5, supplier: 'Godrej' },
  { name: 'Laptop 15"', sku: 'ELEC-LP-001', category: 'Electronics', price: 52999, quantity: 3, reorderLevel: 5, supplier: 'HP India' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-002', category: 'Electronics', price: 799, quantity: 40, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-KB-003', category: 'Electronics', price: 3499, quantity: 25, reorderLevel: 8, supplier: 'Redragon' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-004', category: 'Electronics', price: 1999, quantity: 28, reorderLevel: 10, supplier: 'boAt' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-201', category: 'Apparel', price: 599, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jeans', sku: 'APRL-JN-202', category: 'Apparel', price: 2199, quantity: 18, reorderLevel: 20, supplier: 'Levis' },
  { name: 'Notebook A4', sku: 'STNY-NB-301', category: 'Stationery', price: 90, quantity: 200, reorderLevel: 50, supplier: 'Classmate' },
  { name: 'Gel Pen Pack of 15', sku: 'STNY-PN-713', category: 'Stationery', price: 120, quantity: 40, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-401', category: 'Grocery', price: 650, quantity: 6, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-402', category: 'Grocery', price: 899, quantity: 12, reorderLevel: 10, supplier: 'Figaro' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(data);
  console.log(`Seeded ${data.length} products`);
  await mongoose.disconnect();
})();
