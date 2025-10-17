import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Building, Lock, ArrowLeft, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { bankingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PINInput from './PINInput';

const LinkBankAccount = ({ onLink, onClose }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    institution: '',
    accountType: 'checking',
    accountNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('idle'); // popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupStage, setPopupStage] = useState("loading");
  const [showPINSetup, setShowPINSetup] = useState(false);
  // Internal handler
  const handleLinkInternal = async (bankCredentials) => {
    try {
      const result = await bankingAPI.linkBankAccount(
        bankCredentials.institution, // Use Financial Institution as bank name
        bankCredentials.institution,
        token
      );

      if (result.success) {
        setStatus('processing');
        setTimeout(() => {
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }, 2000);
      } else {
        setStatus('failure');
      }
    } catch (error) {
      console.error('Link account error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to link account. Please try again.');
      setStatus('failure');
    }
  };

  const linkHandler = onLink || handleLinkInternal;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.institution) {
        throw new Error('Please fill in all required fields');
      }

      // Show PIN setup dialog
      setShowPINSetup(true);
    } catch (error) {
      console.error('Link account error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to link account. Please try again.');
    }
  };

  const handlePINSetup = async (pin) => {
    setLoading(true);
    setShowPINSetup(false);

    try {
      // First set the PIN, then link the account
      await bankingAPI.setPIN(pin, token);
      await linkHandler(formData);
    } catch (error) {
      console.error('PIN setup or link account error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to set PIN or link account. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Bank Account</h1>
              <p className="text-gray-600">Connect your bank account to start using NeoBank</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Link Bank Account</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                disabled={loading}
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="institution" className="form-label">
                Financial Institution *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  required
                  className="input-field pl-10"
                  placeholder="e.g., Chase Bank, Wells Fargo, HDFC Bank"
                  value={formData.institution}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountType" className="form-label">
                Account Type
              </label>
              <select
                id="accountType"
                name="accountType"
                className="input-field"
                value={formData.accountType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="business">Business</option>
              </select>
            </div>


            <div>
              <label htmlFor="accountNumber" className="form-label">
                Account Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  className="input-field pl-10"
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
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
                disabled={loading || !formData.institution}
                className="btn-primary flex-1 flex justify-center items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Link Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Security Notice</h4>
            <p className="text-xs text-blue-700">
              Your banking credentials are encrypted and securely transmitted. 
              We use industry-standard security protocols to protect your information.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Popup */}
      {status !== 'idle' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
            {status === 'processing' && (
              <div>
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-semibold">Processing Transaction...</h2>
                <p className="text-gray-500 mt-2">Please wait while we confirm your account linking.</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold">Bank Account Linked</h2>
                <p className="text-gray-500 mt-2">Your account has been linked successfully.</p>
              </div>
            )}

            {status === 'failure' && (
              <div>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold">Failed to Link Account</h2>
                <p className="text-gray-500 mt-2">Please check details and try again.</p>
              </div>
            )}

            {(status === 'success' || status === 'failure') && (
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* PIN Setup Dialog */}
      <PINInput
        isOpen={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        onVerify={handlePINSetup}
        title="Set Your PIN"
        subtitle="Create a 4-digit PIN for secure transactions"
      />
    </div>
  );
};

export default LinkBankAccount;
