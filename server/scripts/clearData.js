/**
 * Script to clear all clients and billing data from MongoDB
 * Keeps: Users, Settings
 * Deletes: Clients, Billing Entries
 *
 * Run with: node scripts/clearData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const BillingEntry = require('../models/BillingEntry');

async function clearData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    console.log('Database:', process.env.MONGODB_URI);

    // Count current data
    const clientCount = await Client.countDocuments();
    const billingCount = await BillingEntry.countDocuments();

    console.log('\n📊 Current data:');
    console.log(`   Clients: ${clientCount}`);
    console.log(`   Billing Entries: ${billingCount}`);

    if (clientCount === 0 && billingCount === 0) {
      console.log('\n✓ Database is already clean!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will DELETE all clients and billing entries!');
    console.log('   Users and Settings will be KEPT.');
    console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete data
    console.log('🗑️  Deleting data...');

    const deletedClients = await Client.deleteMany({});
    console.log(`✓ Deleted ${deletedClients.deletedCount} clients`);

    const deletedBilling = await BillingEntry.deleteMany({});
    console.log(`✓ Deleted ${deletedBilling.deletedCount} billing entries`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)');
    console.log('   2. Login and start adding clients\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearData();
