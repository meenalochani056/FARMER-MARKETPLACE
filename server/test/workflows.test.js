import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-only-secret-with-enough-length';

let mongo;
let api;
let User;
let Product;
let Category;
let MarketPrice;
let farmerToken;
let buyerToken;
let otherBuyerToken;
let adminToken;
let farmerId;
let productId;

const address = { name: 'Demo Buyer', phone: '9876543210', line1: '12 Market Road', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' };
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const [{ default: app }, userModel, productModel, categoryModel, marketPriceModel] = await Promise.all([
    import('../app.js'), import('../models/User.js'), import('../models/Product.js'), import('../models/Category.js'), import('../models/MarketPrice.js')
  ]);
  api = request(app);
  User = userModel.default;
  Product = productModel.default;
  Category = categoryModel.default;
  MarketPrice = marketPriceModel.default;
  await Promise.all([User.init(), Product.init(), Category.init()]);
  const admin = await User.create({ name: 'Test Admin', email: 'admin@test.local', password: await bcrypt.hash('AdminPass123', 10), role: 'admin', isVerified: true });
  const adminLogin = await api.post('/api/auth/login').send({ email: admin.email, password: 'AdminPass123' }).expect(200);
  adminToken = adminLogin.body.token;
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test('allows the Vite frontend on port 5175 through CORS', async () => {
  await api.get('/api/health')
    .set('Origin', 'http://localhost:5175')
    .expect(200)
    .expect('Access-Control-Allow-Origin', 'http://localhost:5175');
});

test('registration, verification, product search, order/payment, delivery, review, and stock integrity', async () => {
  const farmerResponse = await api.post('/api/auth/register').send({
    name: 'Test Farmer', email: 'farmer@test.local', password: 'FarmerPass123', role: 'farmer'
  }).expect(201);
  farmerToken = farmerResponse.body.token;
  farmerId = farmerResponse.body.user._id;
  assert.equal(Object.hasOwn(farmerResponse.body.user, 'password'), false);
  const storedFarmer = await User.findById(farmerId).select('+password');
  assert.notEqual(storedFarmer.password, 'FarmerPass123');
  assert.equal(await bcrypt.compare('FarmerPass123', storedFarmer.password), true);

  await api.put(`/api/admin/farmers/${farmerId}/verify`).set(authHeader(adminToken)).send({ status: 'verified' }).expect(200);
  const createCategory = await api.post('/api/admin/categories').set(authHeader(adminToken)).send({ name: 'Vegetables' }).expect(201);
  const categoryId = createCategory.body.category._id;
  assert.equal(createCategory.body.category.slug, 'vegetables');
  const productResponse = await api.post('/api/products').set(authHeader(farmerToken)).send({
    name: 'Farm Tomato', category: categoryId, price: 40, priceUnit: 'kg', quantity: 10, quantityUnit: 'kg',
    minimumOrderQuantity: 1, district: 'Chennai', state: 'Tamil Nadu', season: 'Summer', description: 'Fresh harvest'
  }).expect(201);
  productId = productResponse.body.product._id;
  assert.equal(productResponse.body.product.farmer, farmerId);
  await api.get('/api/products')
    .set('Origin', 'http://localhost:5175')
    .query({ search: 'tomato', district: 'Chennai', page: 1, limit: 5 })
    .expect(200)
    .expect('Access-Control-Allow-Origin', 'http://localhost:5175')
    .then((response) => {
    assert.equal(response.body.products.length, 1);
    assert.equal(response.body.products[0].name, 'Farm Tomato');
  });
  await api.put(`/api/products/${productId}`).set(authHeader(adminToken)).send({ quantity: 0 }).expect(400);
  await api.put(`/api/products/${productId}`).set(authHeader(adminToken)).send({ price: 45 }).expect(200);

  const buyerResponse = await api.post('/api/auth/register').send({ name: 'Test Buyer', email: 'buyer@test.local', password: 'BuyerPass123', role: 'buyer' }).expect(201);
  buyerToken = buyerResponse.body.token;
  const otherBuyer = await api.post('/api/auth/register').send({ name: 'Another Buyer', email: 'other@test.local', password: 'BuyerPass123', role: 'buyer' }).expect(201);
  otherBuyerToken = otherBuyer.body.token;

  await User.findByIdAndUpdate(farmerId, { isVerified: false });
  await api.post('/api/orders').set(authHeader(buyerToken)).send({ items: [{ product: productId, quantity: 1 }], deliveryAddress: address }).expect(409);
  assert.equal((await Product.findById(productId)).quantity, 10);
  await User.findByIdAndUpdate(farmerId, { isVerified: true });

  const orderResponse = await api.post('/api/orders').set(authHeader(buyerToken)).send({ items: [{ product: productId, quantity: 2 }], deliveryAddress: address }).expect(201);
  const order = orderResponse.body.orders[0];
  assert.equal(order.totalAmount, 150);
  assert.equal((await Product.findById(productId)).quantity, 8);
  await api.get(`/api/orders/${order._id}`).set(authHeader(otherBuyerToken)).expect(403);
  await api.get(`/api/orders/${order._id}`).set(authHeader(buyerToken)).expect(200);

  const paymentResponse = await api.post('/api/payments/create').set(authHeader(buyerToken)).send({ orderId: order._id, method: 'DEMO' }).expect(201);
  const paymentId = paymentResponse.body.payment._id;
  const paidResponse = await api.post('/api/payments/verify').set(authHeader(buyerToken)).send({ paymentId, success: true }).expect(200);
  assert.equal(paidResponse.body.order.paymentStatus, 'PAID');
  assert.match(paidResponse.body.message, /no money was transferred/i);
  await api.post('/api/payments/verify').set(authHeader(buyerToken)).send({ paymentId, success: true }).expect(409);

  await api.put(`/api/orders/${order._id}/status`).set(authHeader(farmerToken)).send({ status: 'PROCESSING' }).expect(200);
  await api.put(`/api/orders/${order._id}/status`).set(authHeader(farmerToken)).send({ status: 'READY_FOR_PICKUP' }).expect(200);
  const tracking = await api.get(`/api/logistics/${order._id}`).set(authHeader(buyerToken)).expect(200);
  assert.ok(tracking.body.logistics.trackingId);
  for (const status of ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
    await api.put(`/api/logistics/${order._id}/status`).set(authHeader(farmerToken)).send({ status }).expect(200);
  }
  const deliveredOrder = await api.get(`/api/orders/${order._id}`).set(authHeader(buyerToken)).expect(200);
  assert.equal(deliveredOrder.body.order.orderStatus, 'DELIVERED');
  const review = await api.post('/api/reviews').set(authHeader(buyerToken)).send({ order: order._id, rating: 5, comment: 'Fresh and fairly priced.' }).expect(201);
  assert.equal(review.body.review.rating, 5);
  await api.post('/api/reviews').set(authHeader(buyerToken)).send({ order: order._id, rating: 5 }).expect(409);
  assert.equal((await User.findById(farmerId)).rating, 5);
  await api.get(`/api/farmers/${farmerId}`).expect(200);
  await api.get(`/api/farmers/${farmerId}/products`).expect(200);
  await api.get(`/api/farmers/${farmerId}/reviews`).expect(200);
  assert.ok((await api.get('/api/notifications').set(authHeader(buyerToken)).expect(200)).body.notifications.length > 0);
  await api.delete(`/api/products/${productId}`).set(authHeader(farmerToken)).expect(200);
  assert.equal((await Product.findById(productId)).status, 'ARCHIVED');

  const marketPrice = await api.post('/api/market-prices').set(authHeader(adminToken)).send({
    crop: 'Tomato', market: 'Test Market', location: 'Chennai', minimumPrice: 20, averagePrice: 30, maximumPrice: 40, unit: 'kg'
  }).expect(201);
  await api.put(`/api/market-prices/${marketPrice.body.marketPrice._id}`).set(authHeader(adminToken)).send({ averagePrice: 45 }).expect(400);
  await api.put(`/api/market-prices/${marketPrice.body.marketPrice._id}`).set(authHeader(adminToken)).send({ averagePrice: 35 }).expect(200);
  await api.get('/api/market-prices').set(authHeader(buyerToken)).expect(200);
  await api.delete(`/api/market-prices/${marketPrice.body.marketPrice._id}`).set(authHeader(adminToken)).expect(200);
});

test('failed mock payment cancels and restores reserved product stock', async () => {
  await Product.findByIdAndUpdate(productId, { status: 'ACTIVE', quantity: 8 });
  const response = await api.post('/api/orders').set(authHeader(buyerToken)).send({ items: [{ product: productId, quantity: 3 }], deliveryAddress: address }).expect(201);
  const order = response.body.orders[0];
  const payment = await api.post('/api/payments/create').set(authHeader(buyerToken)).send({ orderId: order._id, method: 'UPI' }).expect(201);
  const failure = await api.post('/api/payments/verify').set(authHeader(buyerToken)).send({ paymentId: payment.body.payment._id, success: false }).expect(200);
  assert.equal(failure.body.order.orderStatus, 'CANCELLED');
  assert.equal((await Product.findById(productId)).quantity, 8);
  await api.post('/api/orders').set(authHeader(buyerToken)).send({ items: [{ product: productId, quantity: 9 }], deliveryAddress: address }).expect(409);
  assert.equal((await Product.findById(productId)).quantity, 8);
});

test('seed command creates repeatable demo accounts and marketplace data', async () => {
  const seedPath = fileURLToPath(new URL('../seed/seed.js', import.meta.url));
  const serverPath = fileURLToPath(new URL('..', import.meta.url));
  const output = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [seedPath], {
      cwd: serverPath,
      env: { ...process.env, MONGO_URI: mongo.getUri(), JWT_SECRET: process.env.JWT_SECRET }
    });
    let logs = '';
    child.stdout.on('data', (chunk) => { logs += chunk; });
    child.stderr.on('data', (chunk) => { logs += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(logs) : reject(new Error(logs)));
  });
  assert.match(output, /Seed complete/);
  assert.equal(await User.countDocuments({ role: 'farmer', email: /^farmer\d*@example\.com$/ }), 5);
  assert.equal(await User.countDocuments({ role: 'buyer', email: { $in: ['buyer@example.com', 'ravi@example.com', 'basket@example.com', 'prakash@example.com', 'greenleaf@example.com'] } }), 5);
  const cropNames = [
    'Tomato', 'Potato', 'Onion', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Spinach', 'Cucumber', 'Green Chilli',
    'Apple', 'Banana', 'Mango', 'Orange', 'Grapes', 'Watermelon', 'Papaya', 'Pineapple', 'Pomegranate', 'Guava',
    'Rice', 'Wheat', 'Maize', 'Millet', 'Ragi', 'Lentils', 'Chickpeas', 'Green Gram', 'Groundnuts',
    'Milk', 'Curd', 'Paneer', 'Butter', 'Ghee', 'Cheese', 'Buttermilk'
  ];
  const seedFarmers = await User.find({ email: { $in: ['farmer@example.com', 'farmer2@example.com', 'farmer3@example.com', 'farmer4@example.com'] } }).select('_id');
  const seededProducts = await Product.find({ farmer: { $in: seedFarmers.map((farmer) => farmer._id) }, name: { $in: cropNames } }).populate('category', 'name');
  assert.equal(seededProducts.length, 36);
  assert.deepEqual(new Set(seededProducts.map((product) => product.name)), new Set(cropNames));
  assert.deepEqual(seededProducts.filter((product) => !(product.price > 0 && product.quantity > 0 && product.description && product.priceUnit && product.quantityUnit))
    .map((product) => ({ name: product.name, price: product.price, quantity: product.quantity, description: product.description, priceUnit: product.priceUnit, quantityUnit: product.quantityUnit })), []);
  assert.ok(seededProducts.every((product) => existsSync(path.resolve(serverPath, '..', 'client', 'public', product.images[0].slice(1)))));
  assert.deepEqual(new Set(seededProducts.map((product) => product.category.name)), new Set(['Vegetables', 'Fruits', 'Grains and Pulses', 'Dairy Products']));
  const cropPhotos = {
    Tomato: 'tomato.jpg', Potato: 'potato.jpg', Onion: 'red-onion.jpg', Carrot: 'carrot.jpg',
    Cabbage: 'cabbage.jpg', Cauliflower: 'cauliflower.jpg', Brinjal: 'brinjal.jpg',
    Spinach: 'spinach.jpg', Cucumber: 'cucumber.jpg', 'Green Chilli': 'green-chili.jpg',
    Apple: 'apple.jpg', Banana: 'banana.jpg', Mango: 'mango.jpg', Orange: 'orange.jpg',
    Grapes: 'grapes.jpg', Watermelon: 'watermelon.jpg', Papaya: 'papaya.jpg',
    Pineapple: 'pineapple.jpg', Pomegranate: 'pomegranate.jpg', Guava: 'guava.jpg',
    Rice: 'rice.jpg', Wheat: 'wheat.jpg', Maize: 'maize.jpg', Millet: 'millet.jpg',
    Ragi: 'ragi.jpg', Lentils: 'lentils.jpg', Chickpeas: 'chickpeas.jpg',
    'Green Gram': 'green-gram.jpg', Groundnuts: 'groundnuts.jpg', Milk: 'milk.jpg',
    Curd: 'curd.jpg', Paneer: 'paneer.jpg', Butter: 'butter.jpg', Ghee: 'ghee.jpg',
    Cheese: 'cheese.jpg', Buttermilk: 'buttermilk.jpg'
  };
  for (const product of seededProducts) {
    assert.equal(product.images[0], `/images/produce/${cropPhotos[product.name]}`, `${product.name} should use its real produce photo`);
  }

  const vegetableCategory = await Category.findOne({ name: 'Vegetables' });
  const vegetables = await api.get('/api/products').query({ category: vegetableCategory._id, sort: 'price_asc', page: 1, limit: 3 }).expect(200);
  assert.equal(vegetables.body.products.length, 3);
  assert.ok(vegetables.body.pagination.total >= 10);
  assert.deepEqual(vegetables.body.products.map((product) => product.price), [...vegetables.body.products.map((product) => product.price)].sort((a, b) => a - b));
  const secondPage = await api.get('/api/products').query({ page: 2, limit: 12 }).expect(200);
  assert.equal(secondPage.body.products.length, 12);
  assert.equal(secondPage.body.pagination.page, 2);
  const searchResult = await api.get('/api/products').query({ search: 'Green Gram' }).expect(200);
  assert.equal(searchResult.body.products[0].name, 'Green Gram');

  const adminDashboard = await api.get('/api/admin/stats').set(authHeader(adminToken)).expect(200);
  assert.ok(adminDashboard.body.stats.products >= 36);
  for (const resource of ['farmers', 'buyers', 'products', 'orders', 'payments', 'logistics', 'reviews', 'categories', 'market-prices']) {
    await api.get(`/api/admin/${resource}`).set(authHeader(adminToken)).expect(200);
  }

  const totalProductsBeforeRerun = await Product.countDocuments();
  const demoPricesBeforeRerun = await MarketPrice.countDocuments({ isDemoData: true });
  const { seedDatabase } = await import('../seed/seed.js');
  await seedDatabase();
  assert.equal(await Product.countDocuments(), totalProductsBeforeRerun);
  assert.equal(await MarketPrice.countDocuments({ isDemoData: true }), demoPricesBeforeRerun);
  assert.equal(await Product.countDocuments({ farmer: { $in: seedFarmers.map((farmer) => farmer._id) }, name: { $in: cropNames } }), 36);
  assert.equal((await Product.findOne({ name: 'Brinjal' })).images[0], '/images/produce/brinjal.jpg');
  assert.equal((await Product.findOne({ name: 'Onion' })).images[0], '/images/produce/red-onion.jpg');
  const demoLogin = await api.post('/api/auth/login').send({ email: 'farmer@example.com', password: 'Farmer@123' }).expect(200);
  assert.equal(demoLogin.body.user.isVerified, true);
});
