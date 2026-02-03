const express = require('express');
const router = express.Router();
const BillingEntry = require('../models/BillingEntry');
const Client = require('../models/Client');
const Settings = require('../models/Settings');
const { authenticateToken } = require('../middleware/auth');

// Protect all billing routes
router.use(authenticateToken);

// @route   GET /api/billing
// @desc    Get all billing entries with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { month, clientId, status, financialYear } = req.query;
    
    let query = {};
    
    if (month) query.month = month;
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (financialYear) query['financialYear.startYear'] = parseInt(financialYear);
    
    const entries = await BillingEntry.find(query)
      .sort({ clientName: 1, month: 1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching billing entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/:clientId/:month
// @desc    Get specific billing entry
// @access  Public
router.get('/:clientId/:month', async (req, res) => {
  try {
    const { clientId, month } = req.params;
    const { financialYear } = req.query;
    
    const fy = financialYear || (await Settings.getSetting('financialYear')).startYear;
    
    const entry = await BillingEntry.findOne({
      clientId,
      month,
      'financialYear.startYear': fy
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error fetching billing entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing
// @desc    Create or update a billing entry
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      clientId,
      month,
      iprsAmt,
      prsGbp,
      soundExAmt,
      isamraAmt,
      ascapAmt,
      pplAmt,
      iprsRemarks,
      prsRemarks,
      invoiceDate,
      invoiceStatus,
      status
    } = req.body;
    
    // Get client info
    const client = await Client.findOne({ clientId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Get settings
    const financialYear = await Settings.getSetting('financialYear');
    const gbpToInrRate = await Settings.getSetting('gbpToInrRate');
    
    // Calculate PRS in INR
    const prsAmt = (prsGbp || 0) * gbpToInrRate;
    
    const entryData = {
      clientId,
      clientName: client.name,
      month,
      monthLabel: getMonthLabel(month, financialYear),
      financialYear,
      iprsAmt: iprsAmt || 0,
      prsGbp: prsGbp || 0,
      prsAmt,
      soundExAmt: soundExAmt || 0,
      isamraAmt: isamraAmt || 0,
      ascapAmt: ascapAmt || 0,
      pplAmt: pplAmt || 0,
      serviceFee: client.fee,
      iprsRemarks: iprsRemarks || '',
      prsRemarks: prsRemarks || '',
      invoiceDate: invoiceDate || new Date(),
      invoiceStatus: invoiceStatus || 'draft',
      status: status || 'draft',
      gbpToInrRate
    };
    
    // Upsert: create or update
    const entry = await BillingEntry.findOneAndUpdate(
      { 
        clientId, 
        month, 
        'financialYear.startYear': financialYear.startYear 
      },
      entryData,
      { upsert: true, new: true, runValidators: true }
    );
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error saving billing entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/billing/:id
// @desc    Update billing entry status
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const entry = await BillingEntry.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating billing entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/billing/:clientId/:month
// @desc    Delete a billing entry
// @access  Public
router.delete('/:clientId/:month', async (req, res) => {
  try {
    const { clientId, month } = req.params;
    const { financialYear } = req.query;
    
    const fy = financialYear || (await Settings.getSetting('financialYear')).startYear;
    
    const result = await BillingEntry.findOneAndDelete({
      clientId,
      month,
      'financialYear.startYear': fy
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting billing entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/reports/summary
// @desc    Get billing summary report
// @access  Public
router.get('/reports/summary', async (req, res) => {
  try {
    const { month, financialYear } = req.query;
    
    const fy = financialYear || (await Settings.getSetting('financialYear')).startYear;
    
    let matchQuery = { 'financialYear.startYear': parseInt(fy) };
    if (month) matchQuery.month = month;
    
    const summary = await BillingEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          submittedCount: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          totalIprs: { $sum: '$iprsAmt' },
          totalPrs: { $sum: '$prsAmt' },
          totalSoundEx: { $sum: '$soundExAmt' },
          totalIsamra: { $sum: '$isamraAmt' },
          totalAscap: { $sum: '$ascapAmt' },
          totalPpl: { $sum: '$pplAmt' },
          totalCommission: { $sum: '$totalCommission' },
          totalGst: { $sum: '$gst' },
          totalInvoice: { $sum: '$totalInvoice' }
        }
      }
    ]);
    
    res.json(summary[0] || {
      totalEntries: 0,
      draftCount: 0,
      submittedCount: 0,
      totalIprs: 0,
      totalPrs: 0,
      totalSoundEx: 0,
      totalIsamra: 0,
      totalAscap: 0,
      totalPpl: 0,
      totalCommission: 0,
      totalGst: 0,
      totalInvoice: 0
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/reports/client/:clientId
// @desc    Get billing report for a specific client
// @access  Public
router.get('/reports/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { financialYear } = req.query;
    
    const fy = financialYear || (await Settings.getSetting('financialYear')).startYear;
    
    const entries = await BillingEntry.find({
      clientId,
      'financialYear.startYear': fy
    }).sort({ month: 1 });
    
    const summary = entries.reduce((acc, entry) => {
      acc.totalCommission += entry.totalCommission;
      acc.totalGst += entry.gst;
      acc.totalInvoice += entry.totalInvoice;
      acc.draftCount += entry.status === 'draft' ? 1 : 0;
      acc.submittedCount += entry.status === 'submitted' ? 1 : 0;
      return acc;
    }, {
      totalCommission: 0,
      totalGst: 0,
      totalInvoice: 0,
      draftCount: 0,
      submittedCount: 0
    });
    
    res.json({ entries, summary });
  } catch (error) {
    console.error('Error fetching client report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to get month label
function getMonthLabel(month, financialYear) {
  const monthNames = {
    apr: 'April', may: 'May', jun: 'June', jul: 'July',
    aug: 'August', sep: 'September', oct: 'October', nov: 'November',
    dec: 'December', jan: 'January', feb: 'February', mar: 'March'
  };
  
  const year = ['jan', 'feb', 'mar'].includes(month) 
    ? financialYear.endYear 
    : financialYear.startYear;
  
  return `${monthNames[month]} ${year}`;
}

module.exports = router;
