const mongoose = require('mongoose');
const Client = require('../models/Client');
const BillingEntry = require('../models/BillingEntry');
require('dotenv').config();

async function migrateBillingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all clients with monthlyData (use raw collection to bypass Mongoose schema filtering)
    const clients = await mongoose.connection.db.collection('clients')
      .find({ monthlyData: { $exists: true, $ne: [] } })
      .toArray();
    console.log(`Found ${clients.length} clients with embedded monthlyData`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const client of clients) {
      if (!client.monthlyData || client.monthlyData.length === 0) continue;

      console.log(`\nProcessing ${client.clientId} - ${client.name}`);
      console.log(`  ${client.monthlyData.length} monthly records`);

      for (const monthData of client.monthlyData) {
        try {
          // Parse month from "2025-04" format
          const [year, monthNum] = monthData.month.split('-');
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthIndex = parseInt(monthNum, 10) - 1;
          const monthKey = monthNames[monthIndex];

          // Determine financial year (Apr-Mar)
          let fyStartYear, fyEndYear;
          if (monthIndex >= 3) { // Apr onwards
            fyStartYear = parseInt(year, 10);
            fyEndYear = fyStartYear + 1;
          } else { // Jan-Mar
            fyEndYear = parseInt(year, 10);
            fyStartYear = fyEndYear - 1;
          }

          // Check if billing entry already exists
          const existing = await BillingEntry.findOne({
            clientId: client.clientId,
            month: monthKey,
            'financialYear.startYear': fyStartYear
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Convert GBP to INR (using ~105 as exchange rate)
          const prsAmtInr = (monthData.prsAmtGbp || 0) * 105;

          // Calculate commission
          const serviceFee = client.fee || 0.15;
          const iprsComis = (monthData.iprsAmt || 0) * serviceFee;
          const prsComis = prsAmtInr * serviceFee;
          const totalCommission = iprsComis + prsComis;
          const gst = totalCommission * 0.18;
          const totalInvoice = totalCommission + gst;

          // Create billing entry
          const billingEntry = new BillingEntry({
            clientId: client.clientId,
            clientName: client.name,
            month: monthKey,
            monthLabel: monthKey.charAt(0).toUpperCase() + monthKey.slice(1),
            financialYear: {
              startYear: fyStartYear,
              endYear: fyEndYear
            },
            iprsAmt: monthData.iprsAmt || 0,
            prsGbp: monthData.prsAmtGbp || 0,
            prsAmt: prsAmtInr,
            soundExUsd: 0,
            soundExAmt: monthData.soundExAmt || 0,
            isamraAmt: monthData.isamraAmt || 0,
            ascapUsd: 0,
            ascapAmt: monthData.ascapAmt || 0,
            pplAmt: monthData.pplAmt || 0,
            serviceFee,
            iprsComis,
            prsComis,
            soundExComis: 0,
            isamraComis: 0,
            ascapComis: 0,
            pplComis: 0,
            totalCommission,
            gst,
            totalInvoice,
            invoiceDate: monthData.invoiceDate || '',
            invoiceStatus: monthData.iprsRemark?.toLowerCase().includes('unbilled') ? 'outstanding' : 'draft',
            iprsRemarks: monthData.iprsRemark || '',
            prsRemarks: monthData.prsRemark || ''
          });

          await billingEntry.save();
          created++;
        } catch (error) {
          console.error(`  Error processing month ${monthData.month}:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Created: ${created} billing entries`);
    console.log(`Skipped: ${skipped} (already exist)`);
    console.log(`Errors: ${errors}`);

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateBillingData();
