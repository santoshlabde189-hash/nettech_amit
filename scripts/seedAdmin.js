require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const seedAdmin = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    let mongod = null;

    if (!uri || uri.includes('<username>') || uri.includes('user:pass@cluster')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
      } catch (err) {
        console.warn('Memory server initialization skipped:', err.message);
      }
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB for admin seeding.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nettech.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123';
    const adminName = process.env.ADMIN_NAME || 'Nettech Admin';

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log(`Admin account already exists (${adminEmail})`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      department: 'IT Administration'
    });

    console.log(`Admin user created successfully! (${adminEmail})`);
    process.exit(0);
  } catch (error) {
    console.error('Error during admin seeding:', error);
    process.exit(1);
  }
};

seedAdmin();
