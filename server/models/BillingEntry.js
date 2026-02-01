const mongoose = require('mongoose');

const billingEntrySchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    ref: 'Client'
  },
  clientName: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true,
    enum: ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']
  },
  monthLabel: {
    type: String,
    required: true
  },
  financialYear: {
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true }
  },
  
  // Royalty Amounts
  iprsAmt: { type: Number, default: 0 },
  prsGbp: { type: Number, default: 0 },
  prsAmt: { type: Number, default: 0 },
  soundExAmt: { type: Number, default: 0 },
  isamraAmt: { type: Number, default: 0 },
  ascapAmt: { type: Number, default: 0 },
  pplAmt: { type: Number, default: 0 },
  
  // Commission Details
  serviceFee: { type: Number, required: true },
  iprsComis: { type: Number, default: 0 },
  prsComis: { type: Number, default: 0 },
  soundExComis: { type: Number, default: 0 },
  isamraComis: { type: Number, default: 0 },
  ascapComis: { type: Number, default: 0 },
  pplComis: { type: Number, default: 0 },
  
  // Totals
  totalCommission: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  totalInvoice: { type: Number, default: 0 },
  
  // Remarks
  iprsRemarks: { type: String, default: '' },
  prsRemarks: { type: String, default: '' },
  
  // Invoice Details
  invoiceDate: { type: Date },
  invoiceNumber: { type: String },
  invoiceStatus: {
    type: String,
    enum: ['draft', 'bill_sent', 'amount_received', 'outstanding', 'submitted'],
    default: 'draft'
  },
  
  // Legacy status field (for compatibility)
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft'
  },
  
  // Exchange rate used
  gbpToInrRate: { type: Number, default: 110.50 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for unique entries per client per month per financial year
billingEntrySchema.index(
  { clientId: 1, month: 1, 'financialYear.startYear': 1 },
  { unique: true }
);

// Index for common queries
billingEntrySchema.index({ month: 1, status: 1 });
billingEntrySchema.index({ clientId: 1 });
billingEntrySchema.index({ invoiceStatus: 1 });

// Pre-save middleware
billingEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate totals if not provided
  if (this.iprsAmt && this.serviceFee) {
    this.iprsComis = this.iprsAmt * this.serviceFee;
  }
  if (this.prsAmt && this.serviceFee) {
    this.prsComis = this.prsAmt * this.serviceFee;
  }
  if (this.soundExAmt && this.serviceFee) {
    this.soundExComis = this.soundExAmt * this.serviceFee;
  }
  if (this.isamraAmt && this.serviceFee) {
    this.isamraComis = this.isamraAmt * this.serviceFee;
  }
  if (this.ascapAmt && this.serviceFee) {
    this.ascapComis = this.ascapAmt * this.serviceFee;
  }
  if (this.pplAmt && this.serviceFee) {
    this.pplComis = this.pplAmt * this.serviceFee;
  }
  
  // Calculate total commission
  this.totalCommission = (this.iprsComis || 0) + 
                         (this.prsComis || 0) + 
                         (this.soundExComis || 0) + 
                         (this.isamraComis || 0) + 
                         (this.ascapComis || 0) + 
                         (this.pplComis || 0);
  
  // Calculate GST (18%)
  this.gst = this.totalCommission * 0.18;
  
  // Calculate total invoice
  this.totalInvoice = this.totalCommission + this.gst;
  
  next();
});

// Virtual for entry key (similar to localStorage key)
billingEntrySchema.virtual('entryKey').get(function() {
  return `${this.clientId}_${this.month}_${this.financialYear.startYear}`;
});

// Static method to get entries by month
billingEntrySchema.statics.getByMonth = function(month, financialYear) {
  return this.find({ 
    month, 
    'financialYear.startYear': financialYear 
  }).sort({ clientName: 1 });
};

// Static method to get client entries
billingEntrySchema.statics.getByClient = function(clientId) {
  return this.find({ clientId }).sort({ month: 1 });
};

const BillingEntry = mongoose.model('BillingEntry', billingEntrySchema);

module.exports = BillingEntry;
