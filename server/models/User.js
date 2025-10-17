const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  customer_id: {
    type: String,
    required: true,
    unique: true
  },
  public_url: {
    type: String,
    required: true,
    unique: true
  },
  pin_hash: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  // Profile Information
  profile_photo: {
    type: String,
    default: null
  },
  phone_number: {
    type: String,
    default: null
  },
  address: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  account_number: {
    type: String,
    default: null
  },
  // Personal Information
  dateOfBirth: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null
  },
  nationality: {
    type: String,
    default: null
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    default: null
  },
  occupation: {
    type: String,
    default: null
  },
  // Contact Information
  phoneNumbers: {
    mobile: { type: String, default: null },
    landline: { type: String, default: null }
  },
  preferredLanguage: {
    type: String,
    default: 'English'
  },
  // KYC Details
  kyc: {
    panNumber: { type: String, default: null },
    aadhaarNumber: { type: String, default: null },
    passportNumber: { type: String, default: null },
    drivingLicense: { type: String, default: null },
    voterId: { type: String, default: null },
    kycStatus: {
      type: String,
      enum: ['Completed', 'Pending', 'Not Available'],
      default: 'Pending'
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  // Linked Services
  linkedServices: {
    internetBanking: { type: Boolean, default: false },
    mobileBanking: { type: Boolean, default: false },
    debitCard: {
      number: { type: String, default: null },
      expiry: { type: String, default: null },
      status: { type: String, default: 'Inactive' }
    },
    smsAlerts: { type: Boolean, default: false },
    eStatements: { type: Boolean, default: false },
    upiIds: [{ type: String }],
    chequeBook: {
      status: { type: String, default: 'Inactive' },
      lastRequest: { type: Date, default: null }
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Method to set password (hashes it automatically)
userSchema.methods.setPassword = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password_hash = await bcrypt.hash(password, saltRounds);
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to set PIN (hashes it automatically)
userSchema.methods.setPIN = async function(pin) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.pin_hash = await bcrypt.hash(pin, saltRounds);
};

// Method to compare PIN
userSchema.methods.comparePIN = async function(candidatePIN) {
  if (!this.pin_hash) return false;
  return bcrypt.compare(candidatePIN, this.pin_hash);
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    customer_id: this.customer_id,
    public_url: this.public_url,
    profile_photo: this.profile_photo,
    phone_number: this.phone_number,
    address: this.address,
    account_number: this.account_number,
    // Personal Information
    dateOfBirth: this.dateOfBirth,
    gender: this.gender,
    nationality: this.nationality,
    maritalStatus: this.maritalStatus,
    occupation: this.occupation,
    // Contact Information
    phoneNumbers: this.phoneNumbers,
    preferredLanguage: this.preferredLanguage,
    // KYC Details
    kyc: this.kyc,
    // Linked Services
    linkedServices: this.linkedServices,
    created_at: this.created_at
  };
};

module.exports = mongoose.model('User', userSchema); 