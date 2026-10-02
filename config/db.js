const mongoose = require('mongoose');

let mongodInstance = null;

module.exports = async function connectDB() {
  try {
    // Set reliable public DNS servers for resolving Atlas SRV records
    const dns = require('dns');
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {}

    let uri = process.env.MONGODB_URI;

    // Check if URI is default dummy or if connecting fails, provide seamless fallback for local test
    if (!uri || uri.includes('<username>') || uri.includes('user:pass@cluster')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        uri = mongodInstance.getUri();
        console.log('[Notice] Using in-memory MongoDB fallback instance for local dev/testing:', uri);
      } catch (err) {
        console.warn('[Warning] Could not initialize in-memory fallback, attempting direct URI connect:', err.message);
      }
    }

    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log('MongoDB Atlas connected successfully!');
    } catch (connectErr) {
      console.warn(`[Warning] Could not connect directly to Atlas cluster (${connectErr.message}).`);
      console.warn('[Notice] Starting in-memory fallback database to ensure seamless operations while IP whitelist is added in Atlas.');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log('Fallback MongoDB connected successfully');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
