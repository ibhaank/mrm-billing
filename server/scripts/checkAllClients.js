/**
 * Check all clients including inactive ones
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

async function checkAllClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const allClients = await Client.find({});

    console.log(`📊 Total Clients in DB: ${allClients.length}\n`);

    allClients.forEach(client => {
      console.log(`${client.clientId}: ${client.name}`);
      console.log(`  Active: ${client.isActive}`);
      console.log(`  Type: ${client.type}`);
      console.log(`  Fee: ${(client.fee * 100).toFixed(0)}%`);
      console.log('');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllClients();
