/**
 * Script to check what data exists in MongoDB
 * Run with: node scripts/checkDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const BillingEntry = require('../models/BillingEntry');
const Settings = require('../models/Settings');
const User = require('../models/User');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    console.log('Database:', process.env.MONGODB_URI);
    console.log('\n' + '='.repeat(50));

    // Check Users
    const userCount = await User.countDocuments();
    console.log(`\n📊 Users: ${userCount}`);
    if (userCount > 0) {
      const users = await User.find().select('email name role isActive');
      users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    }

    // Check Clients
    const clientCount = await Client.countDocuments();
    console.log(`\n📊 Clients: ${clientCount}`);
    if (clientCount > 0) {
      const clients = await Client.find().limit(10);
      clients.forEach(c => console.log(`  - ${c.clientId}: ${c.name}`));
      if (clientCount > 10) console.log(`  ... and ${clientCount - 10} more`);
    }

    // Check Billing Entries
    const billingCount = await BillingEntry.countDocuments();
    console.log(`\n📊 Billing Entries: ${billingCount}`);
    if (billingCount > 0) {
      const entries = await BillingEntry.find().limit(5);
      entries.forEach(e => console.log(`  - ${e.clientId} (${e.month}): ₹${e.totalInvoice}`));
      if (billingCount > 5) console.log(`  ... and ${billingCount - 5} more`);
    }

    // Check Settings
    const settingsCount = await Settings.countDocuments();
    console.log(`\n📊 Settings: ${settingsCount}`);
    if (settingsCount > 0) {
      const settings = await Settings.find();
      settings.forEach(s => console.log(`  - ${s.key}: ${JSON.stringify(s.value)}`));
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✓ Database check complete\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
