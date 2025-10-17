const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true
  },
  // For separate transaction storage per user
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  related_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy fields for backward compatibility
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Transfers', 'Education', 'Grocery', 'Rent', 'EMI', 'Utilities', 'Income', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    trim: true,
    default: 'Fund transfer'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'scheduled', 'recurring', 'processing'],
    default: 'completed'
  },
  transaction_type: {
    type: String,
    enum: ['instant', 'scheduled', 'recurring', 'deposit', 'withdrawal', 'transfer'],
    default: 'instant'
  },
  direction: {
    type: String,
    enum: ['sent', 'received'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  processing_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  scheduled_date: {
    type: Date
  },
  recurring_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  recurring_end_date: {
    type: Date
  },
  security_code: {
    type: String,
    minlength: 4,
    maxlength: 6
  },
  transfer_metadata: {
    transfer_type: String,
    priority: String,
    processing_fee: Number,
    scheduled_date: Date,
    recurring_frequency: String,
    recurring_end_date: Date
  },
  sender_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount'
  },
  recipient_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount'
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
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

// Virtual for total amount (including fees)
transactionSchema.virtual('total_amount').get(function() {
  return this.amount + this.fees;
});

// Method to get transaction summary
transactionSchema.methods.toSummaryJSON = function() {
  return {
    id: this._id,
    transaction_id: this.transaction_id,
    user_id: this.user_id,
    related_user_id: this.related_user_id,
    amount: this.amount,
    category: this.category,
    description: this.description,
    status: this.status,
    transaction_type: this.transaction_type,
    direction: this.direction,
    fees: this.fees,
    total_amount: this.total_amount,
    created_at: this.created_at
  };
};

// Method to get transaction with user details
transactionSchema.methods.toDetailedJSON = function() {
  return {
    id: this._id,
    transaction_id: this.transaction_id,
    user_id: this.user_id,
    related_user_id: this.related_user_id,
    sender_id: this.sender_id,
    recipient_id: this.recipient_id,
    amount: this.amount,
    category: this.category,
    description: this.description,
    status: this.status,
    transaction_type: this.transaction_type,
    direction: this.direction,
    priority: this.priority,
    processing_fee: this.processing_fee,
    scheduled_date: this.scheduled_date,
    recurring_frequency: this.recurring_frequency,
    recurring_end_date: this.recurring_end_date,
    fees: this.fees,
    total_amount: this.total_amount,
    transfer_metadata: this.transfer_metadata,
    created_at: this.created_at
  };
};

module.exports = mongoose.model('Transaction', transactionSchema); 