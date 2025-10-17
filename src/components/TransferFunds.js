import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send,
  User,
  MessageSquare,
  IndianRupee,
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { bankingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PINInput from './PINInput';

const TransferFunds = ({ onTransfer, user, onClose }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If no user prop is passed, use the authenticated user
  // const currentUser = user || authUser;
  
  // If no onTransfer is passed, handle transfer internally
  const handleTransferInternal = async (transferData, pin) => {
    try {
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
        selectedAccountId
      );
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result?.message || 'Transfer failed');
      }
    } catch (error) {
      throw error;
    }
  };
  
  const transferHandler = onTransfer || handleTransferInternal;
  const [formData, setFormData] = useState({
    recipientPublicId: '',
    recipientAccountNumber: '',
    recipientProfileUrl: '',
    recipientMobileNumber: '',
    amount: '',
    description: '',
    category: 'Other'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showPINInput, setShowPINInput] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // <-- NEW: Modal state to show processing & success
  const [showPopup, setShowPopup] = useState(false); // <-- NEW
  const [popupStage, setPopupStage] = useState('loading'); // 'loading' | 'success' <-- NEW
  const [lastTransferAmount, setLastTransferAmount] = useState(null); // to show amount in success modal <-- NEW

  // Fetch user balance
  useEffect(() => {
    // Prefill from navigation state
    const pf = location.state?.prefill;
    if (pf) {
      setFormData(prev => ({
        ...prev,
        amount: pf.amount ?? prev.amount,
        description: pf.description ?? prev.description,
        category: pf.category ?? prev.category,
      }));
    }

    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        const response = await bankingAPI.getBalance(token);
        if (response.success) {
          setBalance(response.totalBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setBalanceLoading(false);
      }
    };
    const fetchAccounts = async () => {
      try {
        const res = await bankingAPI.getAccounts(token);
        if (res.success) {
          setUserAccounts(res.bankAccounts || []);
          if (res.bankAccounts && res.bankAccounts.length > 0) {
            setSelectedAccountId(res.bankAccounts[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching accounts:', e);
      }
    };

    fetchBalance();
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Show PIN input dialog
      setShowPINInput(true);

    } catch (error) {
      console.error('Transfer error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to process transfer. Please try again.');
    }
  };

  const handlePINVerification = async (pin) => {
    setLoading(true);

    try {
      // Attempt transfer with PIN
      await transferHandler(formData, pin);

      // Close PIN dialog and show success popup
      setShowPINInput(false);
      setShowPopup(true);
      setPopupStage('loading');

      // Keep the modal loading animation for ~2 seconds, then show success.
      setTimeout(() => {
        setPopupStage('success');
        setSuccess('Transfer completed successfully!');
        try { window.dispatchEvent(new Event('transactions-updated')); } catch {}

        // Save last transfer amount for modal text before resetting form
        const amount = parseFloat(formData.amount);
        setLastTransferAmount(amount);

        // Reset form
        setFormData({
          recipientPublicId: '',
          recipientAccountNumber: '',
          recipientProfileUrl: '',
          amount: '',
          description: '',
          category: 'Other'
        });

        // Close modal and navigate after a short delay
        setTimeout(() => {
          setShowPopup(false);
          if (typeof onClose === 'function') {
            onClose();
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      }, 2000);

    } catch (error) {
      console.error('Transfer error:', error);
      
      // Check if it's a PIN error (401) or other error
      if (error.response?.status === 401) {
        // For authentication errors (wrong PIN), throw error to PIN dialog
        const errorMessage = error.response?.data?.error || 'Invalid PIN';
        throw new Error(errorMessage);
      } else {
        // For other errors, show in the main form
        setError(error.response?.data?.error || error.message || 'Failed to process transfer. Please try again.');
        setShowPINInput(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {!onClose && (
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Funds</h1>
              <p className="text-gray-600">Send money to other users securely</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Money</h3>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Available Balance</span>
            <span className="text-lg font-bold text-blue-900">
              {balanceLoading ? (
                <div className="animate-pulse bg-blue-200 h-6 w-24 rounded"></div>
              ) : (
                formatCurrency(balance)
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select sender account */}
          <div>
            <label className="form-label" htmlFor="senderAccount">Pay From</label>
            <select
              id="senderAccount"
              className="input-field"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={loading || userAccounts.length === 0}
              required
            >
              {userAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.bank_name} — {acc.account_number}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="recipientPublicId" className="form-label">
                Recipient Public ID (Customer ID or URL)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="recipientPublicId"
                  name="recipientPublicId"
                  className="input-field pl-10"
                  placeholder="e.g. CUST_ABC123 or navin"
                  value={formData.recipientPublicId}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="recipientAccountNumber">Recipient Account Number</label>
              <input
                type="text"
                id="recipientAccountNumber"
                name="recipientAccountNumber"
                className="input-field"
                placeholder="e.g. 1234567890"
                value={formData.recipientAccountNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="recipientProfileUrl">Recipient Profile URL</label>
              <input
                type="text"
                id="recipientProfileUrl"
                name="recipientProfileUrl"
                className="input-field"
                placeholder="https://neobank.com/user/navin"
                value={formData.recipientProfileUrl}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="form-label">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0.01"
                step="0.01"
                className="input-field pl-10"
                placeholder="0.00 (₹)"
                value={formData.amount}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="description"
                name="description"
                className="input-field pl-10"
                placeholder="What's this payment for? (optional)"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="input-field"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
              required
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="flex space-x-3">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back to Dashboard
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !formData.recipientPublicId || !formData.amount || !formData.category || !selectedAccountId}
              className="btn-primary flex-1 flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Money
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How it works</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. Enter the recipient's public bank ID (shared by them)</p>
          <p>2. Specify the amount you want to send</p>
          <p>3. Add a description for the payment (optional)</p>
          <p>4. Confirm the transfer - funds will be sent instantly</p>
        </div>
      </div>
        </div>
      </div>

      {/* <-- NEW: Popup Modal (processing -> success) */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl shadow-lg p-6 w-80 text-center"
          >
            {popupStage === 'loading' ? (
              <div className="flex flex-col items-center space-y-4 min-h-[140px] justify-center">
                <div className="p-3 rounded-full bg-blue-50">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Processing transfer</h3>
                <p className="text-sm text-gray-500">We are processing your transfer — this usually takes about 2 seconds.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 min-h-[140px] justify-center">
                <div className="p-3 rounded-full bg-green-50">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Transfer Successful</h3>
                <p className="text-sm text-gray-600">
                  {lastTransferAmount ? `${formatCurrency(lastTransferAmount)} was sent successfully.` : 'Your transfer completed successfully.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIN Input Dialog */}
      <PINInput
        isOpen={showPINInput}
        onClose={() => setShowPINInput(false)}
        onVerify={handlePINVerification}
        title="Verify Transfer"
        subtitle="Enter your 4-digit PIN to complete the transfer"
      />
    </div>
  );
};

export default TransferFunds;
