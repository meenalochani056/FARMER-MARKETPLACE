import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDatabase from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import MarketPrice from '../models/MarketPrice.js';
import Notification from '../models/Notification.js';
import { pathToFileURL } from 'node:url';

const farmerData = [
  ['Kavitha Selvam', 'Kanchipuram'], ['Murugan R', 'Coimbatore'], ['Lakshmi Devi', 'Madurai'],
  ['Arun Kumar', 'Salem'], ['Meena Subramani', 'Erode']
];
const buyerData = [
  ['Ananya Rao', 'ananya@example.com'], ['Ravi Stores', 'ravi@example.com'], ['Fresh Basket Chennai', 'basket@example.com'],
  ['Prakash N', 'prakash@example.com'], ['Green Leaf Retail', 'greenleaf@example.com']
];
const cropData = [
  ['Tomato', 'Vegetables', 40, 160, 'kg', 'Summer', 'Firm, sun-ripened tomatoes harvested at peak color from our Tamil Nadu farm.'],
  ['Potato', 'Vegetables', 32, 250, 'kg', 'All season', 'All-season potatoes, carefully sorted and ready for everyday cooking.'],
  ['Onion', 'Vegetables', 36, 180, 'kg', 'All season', 'Pungent, well-cured red onions with a crisp texture and long keeping quality.'],
  ['Carrot', 'Vegetables', 48, 90, 'kg', 'Winter', 'Sweet, crunchy carrots freshly lifted from rich farm soil.'],
  ['Cabbage', 'Vegetables', 28, 75, 'kg', 'Winter', 'Compact green cabbage heads, freshly harvested and naturally crisp.'],
  ['Cauliflower', 'Vegetables', 42, 55, 'kg', 'Winter', 'Fresh white cauliflower with tight florets, harvested to order.'],
  ['Brinjal', 'Vegetables', 45, 80, 'kg', 'All season', 'Glossy purple brinjal, tender inside and freshly picked from the field.'],
  ['Spinach', 'Vegetables', 24, 70, 'bundle', 'All season', 'Tender spinach leaves, washed and bundled soon after harvest.'],
  ['Cucumber', 'Vegetables', 30, 90, 'kg', 'Summer', 'Cool, crisp cucumbers harvested young for a refreshing bite.'],
  ['Green Chilli', 'Vegetables', 68, 45, 'kg', 'Summer', 'Fresh green chillies with a bright aroma and a lively, balanced heat.'],
  ['Apple', 'Fruits', 180, 50, 'kg', 'Winter', 'Crisp, sweet apples selected for freshness and careful handling.'],
  ['Banana', 'Fruits', 55, 80, 'dozen', 'All season', 'Naturally ripened bananas, sweet and ready to enjoy.'],
  ['Mango', 'Fruits', 110, 60, 'kg', 'Summer', 'Seasonal mangoes picked mature for their fragrant aroma and rich flavor.'],
  ['Orange', 'Fruits', 85, 75, 'kg', 'Winter', 'Juicy oranges with bright citrus flavor, sorted fresh for your table.'],
  ['Grapes', 'Fruits', 120, 45, 'kg', 'Winter', 'Fresh bunches of sweet, plump grapes packed with care.'],
  ['Watermelon', 'Fruits', 28, 100, 'kg', 'Summer', 'Refreshing, ripe watermelon selected for a crisp and juicy center.'],
  ['Papaya', 'Fruits', 38, 80, 'kg', 'All season', 'Locally grown papaya with naturally sweet, tender flesh.'],
  ['Pineapple', 'Fruits', 60, 30, 'piece', 'All season', 'Fragrant whole pineapples, harvested ripe and handled gently.'],
  ['Pomegranate', 'Fruits', 160, 35, 'kg', 'Winter', 'Deep red pomegranates with crisp arils and a sweet-tart flavor.'],
  ['Guava', 'Fruits', 62, 55, 'kg', 'Winter', 'Aromatic guavas with a tender center, freshly picked from the orchard.'],
  ['Rice', 'Grains and Pulses', 68, 200, 'kg', 'All season', 'Clean, locally milled rice from the latest harvest, packed dry and fresh.'],
  ['Wheat', 'Grains and Pulses', 44, 180, 'kg', 'Winter', 'Whole wheat grain, naturally dried and carefully cleaned after harvest.'],
  ['Maize', 'Grains and Pulses', 32, 220, 'kg', 'Monsoon', 'Sun-dried maize kernels selected for consistent quality.'],
  ['Millet', 'Grains and Pulses', 70, 90, 'kg', 'All season', 'Wholesome locally grown millet, cleaned and ready for your kitchen.'],
  ['Ragi', 'Grains and Pulses', 58, 120, 'kg', 'All season', 'Nutritious finger millet (ragi), naturally dried and farm fresh.'],
  ['Lentils', 'Grains and Pulses', 110, 100, 'kg', 'All season', 'Carefully sorted whole lentils from a small-batch local harvest.'],
  ['Chickpeas', 'Grains and Pulses', 95, 95, 'kg', 'Winter', 'Firm, clean chickpeas with a naturally nutty flavor.'],
  ['Green Gram', 'Grains and Pulses', 125, 75, 'kg', 'All season', 'Freshly harvested green gram, sorted and stored in a dry place.'],
  ['Groundnuts', 'Grains and Pulses', 92, 110, 'kg', 'Winter', 'Locally grown groundnuts, carefully dried for a fresh, crunchy taste.'],
  ['Milk', 'Dairy Products', 60, 40, 'litre', 'Daily', 'Fresh pasteurized cow milk, chilled promptly and supplied in a clean container.'],
  ['Curd', 'Dairy Products', 80, 30, 'kg', 'Daily', 'Smooth, naturally set curd made in small batches from fresh milk.'],
  ['Paneer', 'Dairy Products', 360, 15, 'kg', 'Daily', 'Soft, fresh paneer made in small batches and kept chilled.'],
  ['Butter', 'Dairy Products', 560, 12, 'kg', 'Daily', 'Creamy farm-style butter churned from fresh dairy cream.'],
  ['Ghee', 'Dairy Products', 700, 10, 'kg', 'Daily', 'Aromatic small-batch ghee, slowly clarified for a rich, clean finish.'],
  ['Cheese', 'Dairy Products', 450, 10, 'kg', 'Daily', 'Mild, fresh farmhouse cheese prepared in small batches.'],
  ['Buttermilk', 'Dairy Products', 35, 25, 'litre', 'Daily', 'Cooling, lightly spiced buttermilk made fresh and kept chilled.']
];

const imageFiles = {
  Tomato: 'tomato.jpg',
  Potato: 'potato.jpg',
  Onion: 'red-onion.jpg',
  Carrot: 'carrot.jpg',
  Cabbage: 'cabbage.jpg',
  Cauliflower: 'cauliflower.jpg',
  Brinjal: 'brinjal.jpg',
  Spinach: 'spinach.jpg',
  Cucumber: 'cucumber.jpg',
  'Green Chilli': 'green-chili.jpg',
  Apple: 'apple.jpg',
  Banana: 'banana.jpg',
  Mango: 'mango.jpg',
  Orange: 'orange.jpg',
  Grapes: 'grapes.jpg',
  Watermelon: 'watermelon.jpg',
  Papaya: 'papaya.jpg',
  Pineapple: 'pineapple.jpg',
  Pomegranate: 'pomegranate.jpg',
  Guava: 'guava.jpg',
  Rice: 'rice.jpg',
  Wheat: 'wheat.jpg',
  Maize: 'maize.jpg',
  Millet: 'millet.jpg',
  Ragi: 'ragi.jpg',
  Lentils: 'lentils.jpg',
  Chickpeas: 'chickpeas.jpg',
  'Green Gram': 'green-gram.jpg',
  Groundnuts: 'groundnuts.jpg',
  Milk: 'milk.jpg',
  Curd: 'curd.jpg',
  Paneer: 'paneer.jpg',
  Butter: 'butter.jpg',
  Ghee: 'ghee.jpg',
  Cheese: 'cheese.jpg',
  Buttermilk: 'buttermilk.jpg'
};
const imageFor = (name) => `/images/produce/${imageFiles[name] || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`}`;

export async function seedDatabase() {
  const passwordHash = await bcrypt.hash('Farmer@123', 12);
  const farmerIds = [];
  for (let i = 0; i < farmerData.length; i += 1) {
    const [name, district] = farmerData[i];
    const email = i === 0 ? 'farmer@example.com' : `farmer${i + 1}@example.com`;
    const user = await User.findOneAndUpdate({ email }, {
      $setOnInsert: {
        name, email, phone: `+91 98765 4321${i}`, password: passwordHash, role: 'farmer',
        farmLocation: `${district} farms`, district, state: 'Tamil Nadu',
        isVerified: i !== 4, verificationStatus: i === 4 ? 'Pending' : 'Verified', rating: 4.5, ratingCount: 4
      }
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    farmerIds.push(user._id);
  }

  for (let i = 0; i < buyerData.length; i += 1) {
    const [name, email] = buyerData[i];
    await User.findOneAndUpdate({ email: i === 0 ? 'buyer@example.com' : email }, {
      $setOnInsert: {
        name, email: i === 0 ? 'buyer@example.com' : email, password: await bcrypt.hash('Buyer@123', 12),
        role: 'buyer', buyerType: i === 1 ? 'retailer' : i === 2 ? 'bulk' : 'individual', district: 'Chennai', state: 'Tamil Nadu'
      }
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  await User.findOneAndUpdate({ email: 'admin@example.com' }, {
    $setOnInsert: {
      name: 'Marketplace Admin', email: 'admin@example.com', password: await bcrypt.hash('Admin@123', 12),
      role: 'admin', isVerified: true
    }
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  const categoryNames = [...new Set(cropData.map((crop) => crop[1]))];
  const categories = await Promise.all(categoryNames.map((name) => Category.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));
  const categoryByName = new Map(categories.map((category) => [category.name, category._id]));

  const products = [];
  for (let i = 0; i < cropData.length; i += 1) {
    const [name, categoryName, price, quantity, unit, season, description] = cropData[i];
    const farmer = farmerIds[i % 4];
    const district = farmerData[i % 4][1];
    const product = await Product.findOneAndUpdate(
      { farmer, name, category: categoryByName.get(categoryName) },
      {
        $set: { description, images: [imageFor(name)] },
        $setOnInsert: {
          farmer, name, category: categoryByName.get(categoryName),
          price, priceUnit: unit, quantity, quantityUnit: unit, minimumOrderQuantity: 1,
          location: `${district}, Tamil Nadu`, district, state: 'Tamil Nadu', season,
          isOrganic: i % 4 === 0, status: 'ACTIVE'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    products.push(product);
  }

  const marketPriceData = [
    ['Tomato', 'Koyambedu Market', 'Chennai', 32, 48, 40, 'kg'],
    ['Rice', 'Gandhi Market', 'Trichy', 58, 78, 68, 'kg'],
    ['Onion', 'Mattuthavani Market', 'Madurai', 28, 45, 36, 'kg'],
    ['Banana', 'Salem Market', 'Salem', 40, 68, 55, 'dozen'],
    ['Milk', 'Ukkadam Dairy Market', 'Coimbatore', 52, 68, 60, 'litre'],
    ['Groundnuts', 'Regulated Market', 'Erode', 78, 110, 92, 'kg']
  ];
  for (const [crop, market, location, minimumPrice, maximumPrice, averagePrice, unit] of marketPriceData) {
    await MarketPrice.findOneAndUpdate(
      { crop, market, location },
      { $setOnInsert: { crop, market, location, minimumPrice, maximumPrice, averagePrice, unit, isDemoData: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const firstBuyer = await User.findOne({ email: 'buyer@example.com' });
  const reviewProduct = products[0];
  const reviewOrder = await Order.findOneAndUpdate(
    { buyer: firstBuyer._id, farmer: farmerIds[0] },
    {
      $setOnInsert: {
        buyer: firstBuyer._id, farmer: farmerIds[0],
        items: [{ product: reviewProduct._id, name: reviewProduct.name, quantity: 2, unit: reviewProduct.quantityUnit, price: reviewProduct.price }],
        deliveryAddress: { name: 'Ananya Rao', line1: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600040' },
        subtotal: reviewProduct.price * 2, deliveryFee: 0, totalAmount: reviewProduct.price * 2,
        paymentStatus: 'PAID', orderStatus: 'DELIVERED'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Review.findOneAndUpdate(
    { order: reviewOrder._id },
    { $setOnInsert: { order: reviewOrder._id, buyer: firstBuyer._id, farmer: farmerIds[0], rating: 5, comment: 'Fresh, delicious produce and a smooth delivery.' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  for (const user of [...farmerIds, firstBuyer._id]) {
    await Notification.findOneAndUpdate(
      { user, title: 'Welcome to FarmLink' },
      { $setOnInsert: { user, title: 'Welcome to FarmLink', message: 'Discover a fairer way to grow and shop local.', type: 'welcome' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  return { farmers: farmerIds.length, buyers: buyerData.length, products: cropData.length, categories: categories.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDatabase();
    const result = await seedDatabase();
    console.log(`Seed complete (${result.products} products). Demo accounts: farmer@example.com / Farmer@123, buyer@example.com / Buyer@123, admin@example.com / Admin@123`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
