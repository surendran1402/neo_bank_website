const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bank_name: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  account_number: {
    type: String,
    required: true,
    trim: true
  },
  account_type: {
    type: String,
    enum: ['checking', 'savings', 'credit'],
    default: 'checking'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual for masked account number
bankAccountSchema.virtual('masked_account_number').get(function() {
  if (!this.account_number) return '';
  const last4 = this.account_number.slice(-4);
  return `****${last4}`;
});

// Method to get account summary
bankAccountSchema.methods.toSummaryJSON = function() {
  return {
    id: this._id,
    bank_name: this.bank_name,
    institution: this.institution,
    account_number: this.masked_account_number,
    account_type: this.account_type,
    balance: this.balance,
    is_active: this.is_active,
    created_at: this.created_at
  };
};

module.exports = mongoose.model('BankAccount', bankAccountSchema); 