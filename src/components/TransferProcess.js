import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  IndianRupee,
  ArrowLeft,
  CheckCircle,
  Loader2,
  CreditCard,
  Building2,
  Phone,
  Hash
} from 'lucide-react';
import { bankingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PINInput from './PINInput';

const TransferProcess = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Recipient details
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState('');
  
  // Step 2: Amount and account selection
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  
  // Step 3: PIN verification
  const [showPINInput, setShowPINInput] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  
  // Step 4: Success receipt
  const [transferResult, setTransferResult] = useState(null);
  
  // Error handling
  const [error, setError] = useState('');

  // Fetch user accounts when component mounts
  useEffect(() => {
    const fetchUserAccounts = async () => {
      try {
        setAccountsLoading(true);
        const response = await bankingAPI.getAccounts(token);
        if (response.success) {
          setUserAccounts(response.bankAccounts || []);
          if (response.bankAccounts && response.bankAccounts.length > 0) {
            setSelectedAccount(response.bankAccounts[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setAccountsLoading(false);
      }
    };

    const fetchBalance = async () => {
      try {
        const response = await bankingAPI.getBalance(token);
        if (response.success) {
          setBalance(response.totalBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchUserAccounts();
    fetchBalance();
  }, [token]);

  // Helper function to detect if input is a mobile number
  const isMobileNumber = (input) => {
    const cleaned = input.replace(/[\s\-\(\)\+]/g, '');
    return /^\d{10}$/.test(cleaned);
  };

  // Helper function to detect if input is a customer ID
  const isCustomerId = (input) => {
    return /^CUST_[A-Z0-9]+$/i.test(input);
  };

  // Helper function to detect if input is an account number
  const isAccountNumber = (input) => {
    return /^\d+$/.test(input);
  };

  // Step 1: Find recipient
  const handleFindRecipient = async () => {
    if (!recipientInput.trim()) {
      setRecipientError('Please enter recipient details');
      return;
    }

    setRecipientLoading(true);
    setRecipientError('');

    try {
      const response = await bankingAPI.findUser(recipientInput.trim());
      if (response.success && response.user) {
        setRecipientInfo(response.user);
        setCurrentStep(2);
      } else {
        setRecipientError('Recipient not found. Please check the details and try again.');
      }
    } catch (error) {
      setRecipientError('Recipient not found. Please check the details and try again.');
    } finally {
      setRecipientLoading(false);
    }
  };

  // Step 2: Proceed to PIN verification
  const handleProceedToPIN = () => {
    if (!amount || !selectedAccount) {
      setError('Please enter amount and select an account');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > balance) {
      setError('Insufficient balance');
      return;
    }

    setError('');
    setCurrentStep(3);
    setShowPINInput(true);
  };

  // Step 3: Handle PIN verification and transfer
  const handlePINVerification = async (pin) => {
    setTransferLoading(true);
    setError(''); // Clear any previous errors

    try {
      console.log('Starting transfer with data:', {
        recipientPublicId: recipientInfo.public_id,
        recipientAccountNumber: recipientInfo.account_number,
        recipientProfileUrl: recipientInfo.profile_url,
        amount: parseFloat(amount),
        description,
        category,
        pin: '****' // Don't log actual PIN
      });

      const transferData = {
        recipientPublicId: recipientInfo.public_id,
        recipientAccountNumber: recipientInfo.account_number,
        recipientProfileUrl: recipientInfo.profile_url,
        recipientMobileNumber: recipientInput, // Use the input as mobile number if it's a phone number
        amount: parseFloat(amount),
        description,
        category
      };

      const result = await bankingAPI.transferFunds(
        transferData.recipientPublicId,
        transferData.amount,
        transferData.description,
        transferData.recipientAccountNumber,
        transferData.recipientProfileUrl,
        token,
        transferData.category,
        pin,
        transferData.recipientMobileNumber,
        selectedAccount
      );

      console.log('Transfer result:', result);

      if (result.success) {
        setTransferResult({
          transactionId: result.transaction_id,
          amount: transferData.amount,
          recipient: recipientInfo.name,
          date: new Date().toLocaleDateString(),
          status: 'Success'
        });
        setCurrentStep(4);
        setShowPINInput(false);
      } else {
        throw new Error(result.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        // Invalid PIN - stay on step 3 and show error
        setError('Invalid PIN. Please try again.');
        setCurrentStep(3);
        setShowPINInput(false);
        // Don't reset the form, just show error and allow retry
      } else {
        // Other errors - go back to step 1
        setError(error.response?.data?.error || error.message || 'Transfer failed');
        setCurrentStep(1);
        setRecipientInput('');
        setRecipientInfo(null);
        setAmount('');
        setDescription('');
        setCategory('Other');
        setShowPINInput(false);
      }
    } finally {
      setTransferLoading(false);
    }
  };

  // Close and navigate
  const handleClose = () => {
    navigate('/dashboard');
  };

  // Reset process
  const handleReset = () => {
    setCurrentStep(1);
    setRecipientInput('');
    setRecipientInfo(null);
    setAmount('');
    setDescription('');
    setCategory('Other');
    setError('');
    setRecipientError('');
    setTransferResult(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Recipient & Amount';
      case 2: return 'Select Account';
      case 3: return 'Verify Transfer';
      case 4: return 'Transfer Successful';
      default: return 'Transfer Funds';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Enter recipient details and transfer amount';
      case 2: return 'Select your bank account for the transfer';
      case 3: return 'Enter your 4-digit PIN to complete the transfer';
      case 4: return 'Your transfer has been completed successfully';
      default: return '';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Funds</h1>
              <p className="text-gray-600">Send money to other users securely</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
            <p className="text-gray-600">{getStepDescription()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Step 1: Recipient Details & Amount */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Details
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter mobile number (9876543210), customer ID (CUST_ABC123), or account number"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    disabled={recipientLoading}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      Mobile: 9876543210
                    </span>
                    <span className="flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      Customer ID: CUST_ABC123
                    </span>
                    <span className="flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      Account: 1234567890
                    </span>
                  </div>
                  {recipientInput && (
                    <div className="mt-2">
                      {isMobileNumber(recipientInput) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Phone className="h-3 w-3 mr-1" />
                          Mobile Number Detected
                        </span>
                      )}
                      {isCustomerId(recipientInput) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Hash className="h-3 w-3 mr-1" />
                          Customer ID Detected
                        </span>
                      )}
                      {isAccountNumber(recipientInput) && !isMobileNumber(recipientInput) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Building2 className="h-3 w-3 mr-1" />
                          Account Number Detected
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {recipientError && (
                  <p className="text-red-500 text-sm mt-1">{recipientError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    disabled={recipientLoading}
                  />
                </div>
              </div>

              <button
                onClick={handleFindRecipient}
                disabled={recipientLoading || !recipientInput.trim() || !amount}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {recipientLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Find Recipient & Continue'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Account Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Recipient Info Display */}
              {recipientInfo && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recipientInfo.name}</p>
                      <p className="text-sm text-gray-600">{recipientInfo.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Transfer Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(amount))}</span>
                </div>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account
                </label>
                {accountsLoading ? (
                  <div className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <select
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    {userAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        Bank Name: {account.bank_name} - Balance: ₹{formatCurrency(account.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What's this payment for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Grocery">Grocery</option>
                  <option value="Rent">Rent</option>
                  <option value="EMI">EMI</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Bills">Bills</option>
                  <option value="Food">Food</option>
                  <option value="Transfers">Transfers</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Balance Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Available Balance</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(balance)}</span>
                </div>
                {selectedAccount && userAccounts.find(acc => acc.id === selectedAccount) && (
                  <div className="text-xs text-gray-600">
                    Bank Name: {userAccounts.find(acc => acc.id === selectedAccount)?.bank_name} - 
                    Account: {userAccounts.find(acc => acc.id === selectedAccount)?.account_number}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleProceedToPIN}
                disabled={!selectedAccount}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* Step 3: PIN Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Transfer</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your 4-digit PIN to complete the transfer of {formatCurrency(parseFloat(amount))} to {recipientInfo?.name}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {transferLoading ? (
                <div className="flex flex-col items-center space-y-4 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Processing transfer...</p>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowPINInput(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Enter PIN
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Success Receipt */}
          {currentStep === 4 && transferResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer Successful</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your transfer has been completed successfully
                </p>
              </div>

              {/* Receipt Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaction ID</span>
                  <span className="text-sm font-medium text-gray-900">{transferResult.transactionId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm font-medium text-gray-900">{transferResult.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recipient</span>
                  <span className="text-sm font-medium text-gray-900">{transferResult.recipient}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(transferResult.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-green-600">{transferResult.status}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                >
                  New Transfer
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIN Input Dialog - Only this is a popup with blur */}
      <PINInput
        isOpen={showPINInput}
        onClose={() => setShowPINInput(false)}
        onVerify={handlePINVerification}
        title="Enter PIN"
        subtitle="Enter your 4-digit PIN to complete the transfer"
      />
    </div>
  );
};

export default TransferProcess;
