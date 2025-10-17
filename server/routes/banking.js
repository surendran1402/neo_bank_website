const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const insightsService = require('../services/insightsService');

const router = express.Router();

// Link bank account
router.post('/link-account', authenticateToken, [
  body('bankName').notEmpty(),
  body('institution').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { bankName, institution } = req.body;
    const userId = req.user.id;

    // Generate bank account data
    const bankAccountId = uuidv4();
    const accountId = `ACC_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const accessToken = `access_token_${Math.random().toString(36).substr(2, 20)}`;
    const balance = Math.floor(Math.random() * 500000) + 10000;
    const accountNumber = `****${Math.floor(Math.random() * 9000) + 1000}`;

    // Create new bank account with Mongoose
    const newBankAccount = new BankAccount({
      user_id: userId,
      bank_name: bankName,
      institution,
      account_number: accountNumber,
      account_type: 'checking',
      balance,
      is_active: true
    });

    await newBankAccount.save();

    res.status(201).json({
      success: true,
      bankAccount: newBankAccount.toSummaryJSON(),
      message: 'Bank account linked successfully'
    });

  } catch (error) {
    console.error('Link account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's bank accounts
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ 
      user_id: req.user.id, 
      is_active: true 
    });

    res.json({
      success: true,
      bankAccounts: bankAccounts.map(account => account.toSummaryJSON())
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Advanced Transfer funds with multiple features
router.post('/transfer', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().isLength({ max: 255 }),
  body('category').notEmpty().isIn(['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Transfers', 'Education', 'Grocery', 'Rent', 'EMI', 'Utilities', 'Income', 'Other']),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric(),
  body('senderAccountId').optional().isString(),
  body('transferType').optional().isIn(['instant', 'scheduled', 'recurring']),
  body('scheduledDate').optional().isISO8601(),
  body('recurringFrequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  body('recurringEndDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('securityCode').optional().isLength({ min: 4, max: 6 }),
  // Recipient identification - at least one must be provided
  body().custom((value) => {
    const { recipientPublicId, recipientAccountNumber, recipientProfileUrl, recipientMobileNumber } = value;
    if (!recipientPublicId && !recipientAccountNumber && !recipientProfileUrl && !recipientMobileNumber) {
      throw new Error('At least one recipient identifier is required (customer ID, account number, profile URL, or mobile number)');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('Transfer request body:', req.body);
    console.log('Transfer request user:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { 
      recipientPublicId, 
      recipientAccountNumber,
      recipientProfileUrl,
      recipientMobileNumber,
      amount, 
      description = '', 
      category, 
      pin,
      transferType = 'instant',
      scheduledDate,
      recurringFrequency,
      recurringEndDate,
      priority = 'normal',
      securityCode,
      senderAccountId
    } = req.body;
    
    const senderId = req.user.id;

    // Verify PIN before proceeding
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isPINValid = await sender.comparePIN(pin);
    if (!isPINValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    // Resolve recipient by multiple methods: account number, profile URL, customer ID, or mobile number
    let recipient = null;
    console.log('Looking for recipient with:', { recipientPublicId, recipientAccountNumber, recipientProfileUrl, recipientMobileNumber });

    // Method 1: Search by account number
    if (recipientAccountNumber && !recipient) {
      const recAccount = await BankAccount.findOne({ account_number: recipientAccountNumber, is_active: true });
      console.log('Found account by number:', recAccount);
      if (recAccount) {
        recipient = await User.findById(recAccount.user_id);
        console.log('Found user by account:', recipient);
      }
    }

    // Method 2: Search by profile URL
    if (recipientProfileUrl && !recipient) {
      recipient = await User.findOne({ public_url: recipientProfileUrl });
      console.log('Found user by profile URL:', recipient);
      if (!recipient && typeof recipientProfileUrl === 'string') {
        // Try to match by tail segment of URL
        const tail = recipientProfileUrl.split('/').filter(Boolean).pop();
        if (tail) {
          recipient = await User.findOne({ public_url: { $regex: tail, $options: 'i' } });
          console.log('Found user by URL tail:', recipient);
        }
      }
    }

    // Method 3: Search by customer ID or public ID
    if (recipientPublicId && !recipient) {
      recipient = await User.findOne({
        $or: [
          { customer_id: recipientPublicId },
          { public_url: { $regex: recipientPublicId, $options: 'i' } }
        ]
      });
      console.log('Found user by public ID:', recipient);
    }

    // Method 4: Search by mobile number
    if (recipientMobileNumber && !recipient) {
      // Clean the mobile number (remove spaces, dashes, etc.)
      const cleanMobileNumber = recipientMobileNumber.replace(/[\s\-\(\)\+]/g, '');
      console.log('Searching by mobile number:', cleanMobileNumber);
      
      recipient = await User.findOne({
        $or: [
          { phone_number: { $regex: cleanMobileNumber, $options: 'i' } },
          { 'phoneNumbers.mobile': { $regex: cleanMobileNumber, $options: 'i' } }
        ]
      });
      console.log('Found user by mobile number:', recipient);
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    
    console.log('Found recipient:', {
      id: recipient._id,
      name: recipient.name,
      email: recipient.email,
      customer_id: recipient.customer_id
    });

    if (recipient.id === senderId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer to yourself'
      });
    }

    // Check sender's balance
    const senderAccounts = await BankAccount.find({ 
      user_id: senderId, 
      is_active: true 
    });

    console.log('Sender accounts:', senderAccounts.length, 'accounts found');

    if (senderAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active bank accounts found'
      });
    }

    const totalBalance = senderAccounts.reduce((sum, account) => sum + account.balance, 0);
    if (totalBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds'
      });
    }

    // Advanced transaction processing based on transfer type
    let transactionStatus = 'completed';
    let processingFee = 0;
    
    // Calculate processing fees based on priority and amount
    if (priority === 'urgent') {
      processingFee = Math.min(amount * 0.02, 100); // 2% or max ₹100
    } else if (priority === 'high') {
      processingFee = Math.min(amount * 0.01, 50); // 1% or max ₹50
    }
    
    // Handle different transfer types
    if (transferType === 'scheduled') {
      transactionStatus = 'scheduled';
      // Schedule the transfer for later processing
      // In production, you'd use a job queue like Bull or Agenda
    } else if (transferType === 'recurring') {
      transactionStatus = 'recurring';
      // Set up recurring transfer logic
      // In production, you'd use a cron job or scheduler
    }
    
    // Create separate transaction records for sender and recipient
    
    // 1. Sender's transaction record (money going out)
    // pick sender account (specified or first)
    let senderAccount = senderAccounts[0];
    if (senderAccountId) {
      const match = senderAccounts.find(a => String(a._id) === String(senderAccountId) || a.id === senderAccountId);
      if (match) senderAccount = match;
    }

    const senderTransaction = new Transaction({
      transaction_id: `TXN_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      user_id: new mongoose.Types.ObjectId(String(senderId)), // Store in sender's account
      related_user_id: recipient._id, // Who they sent money to
      sender_id: new mongoose.Types.ObjectId(String(senderId)), // Legacy field
      recipient_id: recipient._id, // Legacy field
      amount: amount, // Save positive amount; direction indicates sign
      category: category || 'Other',
      description: description || `Transfer to ${recipient.name || recipient.email || 'Unknown'}`,
      status: transactionStatus,
      transaction_type: transferType,
      direction: 'sent', // Direction for sender
      priority,
      processing_fee: processingFee,
      scheduled_date: scheduledDate,
      recurring_frequency: recurringFrequency,
      recurring_end_date: recurringEndDate,
      sender_account_id: senderAccount?._id,
      security_code: securityCode,
      transfer_metadata: {
        transfer_type: transferType,
        priority,
        processing_fee: processingFee,
        scheduled_date: scheduledDate,
        recurring_frequency: recurringFrequency,
        recurring_end_date: recurringEndDate
      }
    });

    // 2. Recipient's transaction record (money coming in)
    const recipientTransaction = new Transaction({
      transaction_id: `TXN_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      user_id: recipient._id, // Store in recipient's account
      related_user_id: new mongoose.Types.ObjectId(String(senderId)), // Who sent them money
      sender_id: new mongoose.Types.ObjectId(String(senderId)), // Legacy field
      recipient_id: recipient._id, // Legacy field
      amount: amount, // Positive for money coming in
      category: 'Transfers',
      description: `Payment from ${req.user.name || req.user.email || 'Unknown'}`,
      status: 'completed',
      transaction_type: 'deposit',
      direction: 'received', // Direction for recipient
      priority,
      processing_fee: 0,
      transfer_metadata: {
        transfer_type: transferType,
        priority,
        processing_fee: processingFee,
        scheduled_date: scheduledDate,
        recurring_frequency: recurringFrequency,
        recurring_end_date: recurringEndDate
      }
    });

    // Save both transactions
    await senderTransaction.save();
    await recipientTransaction.save();

    // Update sender's account balance (deduct from selected account)
    await BankAccount.findByIdAndUpdate(
      senderAccount._id,
      { $inc: { balance: -amount } }
    );

    // Update or create recipient's account balance
    const recipientAccounts = await BankAccount.find({ 
      user_id: recipient._id, 
      is_active: true 
    });

    if (recipientAccounts.length > 0) {
      // Add to first account
      await BankAccount.findByIdAndUpdate(
        recipientAccounts[0]._id,
        { $inc: { balance: amount } }
      );
    } else {
      // Create a default account for recipient
      const newRecipientAccount = new BankAccount({
        user_id: recipient._id,
        bank_name: 'Primary Account',
        institution: 'NeoBank',
        account_number: `****${Math.floor(Math.random() * 9000) + 1000}`,
        account_type: 'checking',
        balance: amount,
        is_active: true
      });
      
      await newRecipientAccount.save();
    }

    res.status(201).json({
      success: true,
      transaction: senderTransaction.toDetailedJSON(),
      message: 'Transfer completed successfully'
    });

  } catch (error) {
    console.error('Transfer error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const userObjectId = (() => {
      try { return new mongoose.Types.ObjectId(String(req.user.id)); } catch { return null; }
    })();

    // Show only transactions stored in this user's account
    // Each user has their own separate transaction records
    const idFilter = userObjectId ? {
      user_id: userObjectId
    } : { 
      user_id: String(req.user.id)
    };

    const transactions = await Transaction.find(idFilter)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(idFilter);

    res.json({
      success: true,
      transactions: transactions.map(transaction => transaction.toDetailedJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Personalized Insights: Income-based spending analysis
router.get('/ai-insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.query;

    // Date ranges for current and last month
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);

    // Pull transactions for analysis (last 3 months)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    // Base filter for last 3 months
    const baseFilter = {
      user_id: userId,
      created_at: { $gte: threeMonthsAgo }
    };
    // If a specific account is requested, restrict spending transactions to that account at DB level
    if (accountId) {
      // Only sent (spending) transactions contribute to the pie
      baseFilter.direction = 'sent';
      try { baseFilter.sender_account_id = new mongoose.Types.ObjectId(String(accountId)); } catch {}
    }
    let allTransactions = await Transaction.find(baseFilter).sort({ created_at: -1 });

    // Auto-categorize transactions that don't have categories
    const updatePromises = allTransactions.map(async (transaction) => {
      if (!transaction.category || transaction.category === 'Other') {
        const predictedCategory = insightsService.categorizeTransaction(transaction);
        if (predictedCategory !== 'Other') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            category: predictedCategory
          });
        }
      }
    });
    await Promise.all(updatePromises);

    // Get user's current balance
    const userAccounts = await BankAccount.find({ 
      user_id: userId, 
      is_active: true 
    });
    const userBalance = userAccounts.reduce((sum, account) => sum + account.balance, 0);

    // Get spending summary
    const summary = insightsService.getSpendingSummary(allTransactions, userBalance);

    // Accurate category spending for current month from stored categories
    // Category spend aggregation for current month; filter by sender_account_id if provided
    const matchFilter = {
      user_id: new mongoose.Types.ObjectId(String(userId)),
      direction: 'sent',
      created_at: { $gte: firstOfThisMonth, $lte: now }
    };
    if (accountId) {
      try { matchFilter.sender_account_id = new mongoose.Types.ObjectId(String(accountId)); } catch {}
    }
    const categorySpendAgg = await Transaction.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    const categorySpendMap = categorySpendAgg.reduce((acc, row) => {
      const key = row._id || 'Other';
      acc[key] = row.total || 0;
      return acc;
    }, {});
    
    // Generate personalized insights
    const insights = insightsService.generatePersonalizedInsights(allTransactions, userBalance);

    // Helper functions
    const sumBy = (list, fn) => list.reduce((s, x) => s + (fn ? fn(x) : Number(x.amount) || 0), 0);
    const inRange = (d, s, e) => (new Date(d)) >= s && (new Date(d)) <= e;

    // Calculate totals
    const currentMonthTxns = allTransactions.filter(t => 
      t.direction === 'sent' && inRange(t.created_at, firstOfThisMonth, now)
    );
    const currentMonthIncome = allTransactions.filter(t => 
      t.direction === 'received' && inRange(t.created_at, firstOfThisMonth, now)
    );
    
    const totalOutThis = sumBy(currentMonthTxns);
    const totalInThis = sumBy(currentMonthIncome);
    const surplusThis = Math.max(0, totalInThis - totalOutThis);

    // Detect recurring transactions
    const recurring = [];
    const frequencyMap = new Map();
    
    currentMonthTxns.forEach(txn => {
      const key = (txn.description || 'Unknown').toLowerCase();
      frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
    });

    frequencyMap.forEach((count, description) => {
      if (count >= 2) {
        recurring.push({ description, count });
      }
    });

    // Convert insights to suggestions format
    const suggestions = insights.map(insight => ({
      title: insight.message,
      detail: insight.detail,
      category: insight.category,
      priority: insight.priority,
      emoji: insight.emoji,
      type: insight.type
    }));

    res.json({
      success: true,
      period: {
        this_month: { start: firstOfThisMonth, end: now },
        last_month: { start: firstOfLastMonth, end: endOfLastMonth }
      },
      category_spend: (accountId ? categorySpendMap : (Object.keys(categorySpendMap).length ? categorySpendMap : summary.currentSpending)),
      category_spend_last: summary.lastMonthSpending,
      surplus_this_month: surplusThis,
      recurring,
      suggestions,
      spending_summary: {
        total_balance: userBalance,
        current_spending: totalOutThis,
        remaining_balance: userBalance - totalOutThis,
        balance_usage_percentage: userBalance > 0 ? (totalOutThis / userBalance) * 100 : 0,
        category_limits: summary.categoryLimits
      }
    });
  } catch (error) {
    console.error('Personalized insights error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// Get account balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const accounts = await BankAccount.find({ 
      user_id: req.user.id, 
      is_active: true 
    });

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    res.json({
      success: true,
      accounts: accounts.map(account => account.toSummaryJSON()),
      totalBalance
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Simulate an incoming credit and record it in transaction history
router.post('/simulate-credit', authenticateToken, async (req, res) => {
  try {
    // Find a target account
    const account = await BankAccount.findOne({ user_id: req.user.id, is_active: true });
    if (!account) {
      return res.status(400).json({ success: false, error: 'No active bank accounts found' });
    }

    // Determine credit amount (or accept one from body)
    const amount = Math.max(0.01, Number(req.body?.amount) || Math.round((Math.random() * 90 + 10) * 100) / 100);

    // Update balance
    await BankAccount.findByIdAndUpdate(account._id, { $inc: { balance: amount } });

    // Create a deposit transaction for the user
    const creditTxn = new Transaction({
      transaction_id: `TXN_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      user_id: new mongoose.Types.ObjectId(String(req.user.id)),
      related_user_id: new mongoose.Types.ObjectId(String(req.user.id)),
      sender_id: new mongoose.Types.ObjectId(String(req.user.id)),
      recipient_id: new mongoose.Types.ObjectId(String(req.user.id)),
      amount,
      description: req.body?.description || 'Automated credit',
      status: 'completed',
      transaction_type: 'deposit',
      direction: 'received',
      priority: 'normal',
      processing_fee: 0
    });
    await creditTxn.save();

    const accounts = await BankAccount.find({ user_id: req.user.id, is_active: true });
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    res.status(201).json({
      success: true,
      transaction: creditTxn.toDetailedJSON ? creditTxn.toDetailedJSON() : {
        id: creditTxn._id,
        transaction_id: creditTxn.transaction_id,
        amount: creditTxn.amount,
        description: creditTxn.description,
        status: creditTxn.status,
        transaction_type: creditTxn.transaction_type,
        created_at: creditTxn.created_at
      },
      totalBalance
    });
  } catch (error) {
    console.error('Simulate credit error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Find user by public ID, mobile number, or other identifier (for transfers)
router.get('/find-user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let user = null;

    // Try different search methods
    // Method 1: Customer ID or public URL
    user = await User.findOne({
      $or: [
        { customer_id: identifier },
        { public_url: { $regex: identifier, $options: 'i' } }
      ]
    });

    // Method 2: Mobile number (if not found by customer ID)
    if (!user) {
      const cleanMobileNumber = identifier.replace(/[\s\-\(\)\+]/g, '');
      user = await User.findOne({
        $or: [
          { phone_number: { $regex: cleanMobileNumber, $options: 'i' } },
          { 'phoneNumbers.mobile': { $regex: cleanMobileNumber, $options: 'i' } }
        ]
      });
    }

    // Method 3: Account number lookup
    if (!user) {
      const account = await BankAccount.findOne({ 
        account_number: identifier, 
        is_active: true 
      });
      if (account) {
        user = await User.findById(account.user_id);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        customer_id: user.customer_id,
        public_id: user.customer_id,
        public_url: user.public_url,
        account_number: user.customer_id, // Use customer_id as account number for now
        profile_url: user.public_url,
        phone_number: user.phone_number,
        phoneNumbers: user.phoneNumbers
      }
    });

  } catch (error) {
    console.error('Find user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Advanced Bulk Transfer
router.post('/bulk-transfer', authenticateToken, [
  body('transfers').isArray({ min: 2, max: 50 }),
  body('transfers.*.recipientPublicId').notEmpty(),
  body('transfers.*.amount').isFloat({ min: 0.01 }),
  body('transfers.*.description').optional().isLength({ max: 255 }),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { transfers, priority = 'normal' } = req.body;
    const senderId = req.user.id;

    // Check sender's total balance
    const senderAccounts = await BankAccount.find({ 
      user_id: senderId, 
      is_active: true 
    });

    if (senderAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active bank accounts found'
      });
    }

    const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = senderAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    if (totalBalance < totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds for bulk transfer'
      });
    }

    // Process bulk transfers
    const results = [];
    const batchId = `BATCH_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

    for (const transfer of transfers) {
      try {
        // Find recipient
        const recipient = await User.findOne({
          $or: [
            { customer_id: transfer.recipientPublicId },
            { public_url: { $regex: transfer.recipientPublicId, $options: 'i' } }
          ]
        });

        if (!recipient) {
          results.push({
            recipient: transfer.recipientPublicId,
            status: 'failed',
            error: 'Recipient not found'
          });
          continue;
        }

        // Create transaction
        const newTransaction = new Transaction({
          transaction_id: `TXN_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
          sender_id: senderId,
          recipient_id: recipient._id,
          amount: transfer.amount,
          description: transfer.description || 'Bulk transfer',
          status: 'completed',
          transaction_type: 'instant',
          priority,
          batch_id: batchId
        });

        await newTransaction.save();
        results.push({
          recipient: recipient.name,
          amount: transfer.amount,
          status: 'completed',
          transaction_id: newTransaction.transaction_id
        });

      } catch (error) {
        results.push({
          recipient: transfer.recipientPublicId,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update sender's balance
    await BankAccount.findByIdAndUpdate(
      senderAccounts[0]._id,
      { $inc: { balance: -totalAmount } }
    );

    res.status(201).json({
      success: true,
      batch_id: batchId,
      total_amount: totalAmount,
      total_transfers: transfers.length,
      results,
      message: 'Bulk transfer completed'
    });

  } catch (error) {
    console.error('Bulk transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Transfer Analytics
router.get('/transfer-analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.id;

    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { created_at: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { created_at: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
        break;
      case 'year':
        dateFilter = { created_at: { $gte: new Date(now.getFullYear(), 0, 1) } };
        break;
    }

    const transactions = await Transaction.find({
      $or: [{ sender_id: userId }, { recipient_id: userId }],
      ...dateFilter
    });

    const analytics = {
      total_transfers: transactions.length,
      total_sent: transactions
        .filter(t => t.sender_id.toString() === userId)
        .reduce((sum, t) => sum + t.amount, 0),
      total_received: transactions
        .filter(t => t.recipient_id.toString() === userId)
        .reduce((sum, t) => sum + t.amount, 0),
      average_amount: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0,
      priority_breakdown: {
        low: transactions.filter(t => t.priority === 'low').length,
        normal: transactions.filter(t => t.priority === 'normal').length,
        high: transactions.filter(t => t.priority === 'high').length,
        urgent: transactions.filter(t => t.priority === 'urgent').length
      },
      transfer_types: {
        instant: transactions.filter(t => t.transaction_type === 'instant').length,
        scheduled: transactions.filter(t => t.transaction_type === 'scheduled').length,
        recurring: transactions.filter(t => t.transaction_type === 'recurring').length
      }
    };

    res.json({
      success: true,
      analytics,
      period
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 