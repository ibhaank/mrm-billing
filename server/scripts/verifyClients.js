require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

async function verifyClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const rawClients = await db.collection('clients').find({}).limit(3).toArray();

    console.log('Sample from raw collection:\n');
    rawClients.forEach(c => {
      console.log(`ClientId: ${c.clientId}`);
      console.log(`  name: ${c.name}`);
      console.log(`  type: ${c.type}`);
      console.log(`  fee: ${c.fee}`);
      console.log(`  isActive: ${c.isActive}`);
      console.log(`  Has client_name: ${c.client_name !== undefined}`);
      console.log('');
    });

    console.log('\nUsing Mongoose Client model:');
    const clients = await Client.find({}).limit(3);
    console.log(`Found ${clients.length} clients via Mongoose`);
    clients.forEach(c => {
      console.log(`  - ${c.name} (${c.clientId})`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyClients();
