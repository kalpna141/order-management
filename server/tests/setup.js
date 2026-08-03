import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';
import MenuItem from '../src/models/MenuItem.js';
import Order from '../src/models/Order.js';
import seedMenu from '../src/data/seedMenu.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([MenuItem.deleteMany({}), Order.deleteMany({})]);
  await MenuItem.insertMany(seedMenu);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
