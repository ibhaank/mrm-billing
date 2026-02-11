const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Composer', 'Film Composer', 'Lyricist', 'Music Director', 'Singer', 'Producer', 'Publisher', 'Other'],
    default: 'Composer'
  },
  fee: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.10 // 10% default service fee
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String
  },
  billingEntries: [{
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingEntry' },
    month: String,
    monthLabel: String,
    financialYear: {
      startYear: Number,
      endYear: Number
    },
    iprsAmt: { type: Number, default: 0 },
    prsAmt: { type: Number, default: 0 },
    soundExAmt: { type: Number, default: 0 },
    isamraAmt: { type: Number, default: 0 },
    ascapAmt: { type: Number, default: 0 },
    pplAmt: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    totalInvoice: { type: Number, default: 0 },
    invoiceStatus: { type: String, default: 'draft' },
    status: { type: String, default: 'draft' },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster searches
clientSchema.index({ name: 'text' });
clientSchema.index({ clientId: 1 });

// Pre-save middleware to update the updatedAt field
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for display name with ID
clientSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.clientId})`;
});

// Method to get fee as percentage
clientSchema.methods.getFeePercentage = function() {
  return (this.fee * 100).toFixed(0) + '%';
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
