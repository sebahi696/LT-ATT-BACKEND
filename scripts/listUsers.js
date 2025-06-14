const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function diagnosticCheck() {
  try {
    console.log('🔍 Starting MongoDB Diagnostic Check...\n');
    
    // Show connection string (without password)
    const mongoUri = process.env.MONGO_URI;
    const safeUri = mongoUri ? mongoUri.replace(/:[^:@]*@/, ':****@') : 'UNDEFINED';
    console.log('📡 Connection URI:', safeUri);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected successfully!');
    console.log('🏛️  Connected to database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // List all databases in the cluster
    console.log('\n📚 All databases in cluster:');
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List all collections in current database
    console.log(`\n📁 Collections in "${mongoose.connection.db.databaseName}" database:`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('  ❌ No collections found!');
    } else {
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name} (${count} documents)`);
      }
    }
    
    // Check users collection specifically
    console.log('\n👥 Checking users collection:');
    
    // Method 1: Using Mongoose model
    console.log('  Method 1 - Using User model:');
    const usersViaModel = await User.find({});
    console.log(`    Found ${usersViaModel.length} users via model`);
    usersViaModel.forEach((u, index) => {
      console.log(`    ${index + 1}. ${u.email} (${u.role}) - ID: ${u._id}`);
    });
    
    // Method 2: Direct collection access
    console.log('  Method 2 - Direct collection access:');
    const usersCollection = mongoose.connection.db.collection('users');
    const usersViaDirect = await usersCollection.find({}).toArray();
    console.log(`    Found ${usersViaDirect.length} users via direct access`);
    usersViaDirect.forEach((u, index) => {
      console.log(`    ${index + 1}. ${u.email} (${u.role}) - ID: ${u._id}`);
    });
    
    // Check if there are any documents with different field names
    console.log('  Method 3 - Check for any documents:');
    const allDocs = await usersCollection.find({}).limit(5).toArray();
    if (allDocs.length > 0) {
      console.log('    Sample documents:');
      allDocs.forEach((doc, index) => {
        console.log(`    ${index + 1}.`, JSON.stringify(doc, null, 2));
      });
    } else {
      console.log('    ❌ No documents found at all in users collection');
    }
    
    console.log('\n✅ Diagnostic check complete!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error during diagnostic check:', err);
    process.exit(1);
  }
}

diagnosticCheck(); 