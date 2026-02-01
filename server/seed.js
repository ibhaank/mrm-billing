/**
 * Seed script to populate the database with all client data from Excel
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Client = require('./models/Client');
const Settings = require('./models/Settings');

// Load clients from JSON file
const clientsDataPath = path.join(__dirname, 'clients-data.json');
const defaultClients = JSON.parse(fs.readFileSync(clientsDataPath, 'utf8'));

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mrm_billing';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Initialize settings
    await Settings.initializeDefaults();
    console.log('Settings initialized');

    // Seed clients
    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const clientData of defaultClients) {
      const existing = await Client.findOne({ clientId: clientData.clientId });
      if (existing) {
        // Update existing client
        existing.name = clientData.name;
        existing.type = clientData.type;
        existing.fee = clientData.fee;
        await existing.save();
        updated++;
      } else {
        await Client.create(clientData);
        created++;
      }
    }

    console.log(`\nSeeding complete:`);
    console.log(`  Created: ${created} clients`);
    console.log(`  Updated: ${updated} clients`);
    console.log(`  Total: ${defaultClients.length} clients`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
