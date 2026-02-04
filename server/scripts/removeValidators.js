/**
 * Script to remove JSON schema validators from MongoDB collections
 * Run with: node scripts/removeValidators.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function removeValidators() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections\n`);

    for (const collection of collections) {
      try {
        // Remove validator by setting it to an empty schema
        await db.command({
          collMod: collection.name,
          validator: {},
          validationLevel: 'off'
        });
        console.log(`✓ Removed validator from: ${collection.name}`);
      } catch (error) {
        console.log(`  Skipped ${collection.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Validators removed successfully!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeValidators();
