/**
 * Migrate old client schema to new schema
 * - Renames client_name to name
 * - Removes monthly_data (should be in separate BillingEntry collection)
 * - Cleans up old fields
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrateClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const clientsCollection = db.collection('clients');

    // Find all clients with old schema
    const oldClients = await clientsCollection.find({ client_name: { $exists: true } }).toArray();
    console.log(`📊 Found ${oldClients.length} clients to migrate\n`);

    if (oldClients.length === 0) {
      console.log('No clients need migration.');
      await mongoose.disconnect();
      process.exit(0);
    }

    let migrated = 0;
    let errors = 0;

    for (const client of oldClients) {
      try {
        // Update: rename client_name to name and remove monthly_data
        await clientsCollection.updateOne(
          { _id: client._id },
          {
            $set: {
              name: client.client_name,
              updatedAt: new Date()
            },
            $unset: {
              client_name: "",
              monthly_data: "",
              client_type: "",
              servicing_percentage: "",
              previous_balance: ""
            }
          }
        );

        migrated++;
        if (migrated % 50 === 0) {
          console.log(`  Migrated ${migrated}/${oldClients.length} clients...`);
        }
      } catch (error) {
        console.error(`  Error migrating client ${client.clientId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Errors: ${errors}`);

    // Verify
    const verifyCount = await clientsCollection.countDocuments({ name: { $exists: true } });
    console.log(`\n✓ Verified: ${verifyCount} clients now have 'name' field\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateClients();
