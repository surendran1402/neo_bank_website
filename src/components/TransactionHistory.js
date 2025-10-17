import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Filter, Download, Search, FileText } from 'lucide-react';
import { bankingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import img from "../moneyicon.png"
const TransactionHistory = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 1000, total: 0, pages: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState('month');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (showDetails && selectedTransaction) {
      try {
        const keyN = `txn_notes_${selectedTransaction.transaction_id}`;
        const keyA = `txn_attachments_${selectedTransaction.transaction_id}`;
        setNotesText(localStorage.getItem(keyN) || '');
        const stored = localStorage.getItem(keyA);
        setAttachments(stored ? JSON.parse(stored) : []);
      } catch {}
    }
  }, [showDetails, selectedTransaction]);

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotesText(val);
    try { if (selectedTransaction) localStorage.setItem(`txn_notes_${selectedTransaction.transaction_id}`, val); } catch {}
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const next = [
      ...attachments,
      ...files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    ].slice(0, 10);
    setAttachments(next);
    try { if (selectedTransaction) localStorage.setItem(`txn_attachments_${selectedTransaction.transaction_id}`, JSON.stringify(next)); } catch {}
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    const next = attachments.filter((_, i) => i !== idx);
    setAttachments(next);
    try { if (selectedTransaction) localStorage.setItem(`txn_attachments_${selectedTransaction.transaction_id}`, JSON.stringify(next)); } catch {}
  };
  
  // Refresh on transfers
  useEffect(() => {
    const handler = () => fetchTransactions();
    window.addEventListener('transactions-updated', handler);
    return () => window.removeEventListener('transactions-updated', handler);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const result = await bankingAPI.getTransactions(pagination.page, pagination.limit, token);
      if (result.success) {
        setTransactions(result.transactions);
        setPagination(result.pagination);
      } else {
        setError('Failed to load transaction history');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('An error occurred while loading transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, pagination.limit]);

  const goToPage = () => {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'transfer':
        return 'Sent';
      case 'deposit':
        return 'Received';
      case 'instant':
        return 'Instant Transfer';
      case 'scheduled':
        return 'Scheduled Transfer';
      case 'recurring':
        return 'Recurring Transfer';
      default:
        return type;
    }
  };

  const generateProfileImage = (transaction) => {
    let name = '';
    
    if (transaction.transaction_type === 'transfer' || transaction.transaction_type === 'instant') {
      name = transaction.recipient_name || 'Unknown';
    } else {
      name = transaction.sender_name || 'Unknown';
    }
    
    // Generate a consistent color based on the name
    const nameHash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-green-400 to-green-600'
    ];
    
    const selectedColor = colors[Math.abs(nameHash) % colors.length];
    
         return (
       <div className={`w-10 h-10 rounded-full ${selectedColor} flex items-center justify-center font-bold text-white text-base shadow-md border-2 border-white relative overflow-hidden`}>
         {/* Add a subtle inner shadow for depth */}
         <div className="absolute inset-0 bg-black opacity-10 rounded-full"></div>
         
         {/* Add a highlight effect */}
         <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-20 rounded-t-full"></div>
         
         {/* Profile icon instead of initials */}
         <div className="relative z-10 flex items-center justify-center">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
           </svg>
         </div>
         
         {/* Add a subtle ring effect */}
         <div className="absolute inset-0 rounded-full border-2 border-white opacity-30"></div>
       </div>
     );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const generateStatement = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (statementPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const periodTransactions = transactions.filter(t => 
      new Date(t.created_at) >= startDate
    );

    const totalSent = periodTransactions
      .filter(t => t.transaction_type === 'transfer' || t.transaction_type === 'instant')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalReceived = periodTransactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      period: statementPeriod,
      startDate,
      endDate: now,
      totalTransactions: periodTransactions.length,
      totalSent,
      totalReceived,
      netAmount: totalReceived - totalSent,
      transactions: periodTransactions
    };
  };

  const exportStatement = () => {
    const statement = generateStatement();
    const csvContent = [
      ['Date', 'Transaction ID', 'Type', 'Description', 'Amount', 'Status', 'Priority', 'Processing Fee'],
      ...statement.transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.transaction_id,
        t.transaction_type,
        t.description || '',
        t.amount,
        t.status,
        t.priority || 'normal',
        t.processing_fee || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neobank-statement-${statementPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading transactions</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">Track your financial activity and manage transactions</p>
        </div>

        <div className="space-y-6">
          {/* Professional Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold mb-2">Transaction History</h2>
                <p className="text-blue-100 text-lg">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  {pagination.total > 0 && ` of ${pagination.total}`}
                </p>
                <p className="text-blue-200 text-sm mt-1">Track your financial activity</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowStatement(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  <span>Statement</span>
                </button>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
                <button
                  onClick={exportStatement}
                  className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200 font-semibold"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 placeholder-gray-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
                title="Clear"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="all">All Types</option>
                    <option value="instant">Instant Transfer</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="recurring">Recurring</option>
                    <option value="deposit">Deposit</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterStatus('all');
                      setDateRange('all');
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl px-4 py-3 transition-all duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Your transaction history will appear here once you make your first transfer or receive money.
          </p>
        </div>
      ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer" onClick={() => { setSelectedTransaction(transaction); setShowDetails(true); }}>
                  {/* Main transaction row */}
                  <div className="flex items-center p-4">
                    {/* Left side: Profile image and transaction info */}
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 mr-5">
                        <div><img src={img} alt='image' className="w-11 h-11  object-cover rounded-fit"></img></div>
                        </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(transaction.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {transaction.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {transaction.category && transaction.category !== 'Other' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {transaction.category}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            ID: {transaction.transaction_id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side: Amount and recipient/sender */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="text-right">
                        <p className={`text-base font-bold ${
                          transaction.transaction_type === 'transfer' || transaction.transaction_type === 'instant' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.transaction_type === 'transfer' || transaction.transaction_type === 'instant' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.processing_fee > 0 && (
                          <p className="text-xs text-orange-600 font-medium">
                            Fee: {formatCurrency(transaction.processing_fee)}
                          </p>
                          
                        )
                        }
                        <span className="flex items-center black-100">
                            
                            {formatDate(transaction.created_at)}
                          </span>
                      </div>
                      
                      {(transaction.recipient_name || transaction.sender_name) && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {transaction.transaction_type === 'transfer' || transaction.transaction_type === 'instant' ? 'To: ' : 'From: '}
                            <span className="font-medium text-gray-700">
                              {transaction.transaction_type === 'transfer' || transaction.transaction_type === 'instant' ? transaction.recipient_name : transaction.sender_name}
                            </span>
                          </p>
          {/* Full list loaded; no pager to click */}
        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Removed colored bottom border per transaction */}
                </div>
              ))}
            </div>
          )}

          {/* Transaction Details Info */}
          <div className="card">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• All transactions are processed instantly</p>
              <p>• Transfer fees may apply depending on your account type</p>
              <p>• Transaction IDs are provided for reference</p>
              <p>• Contact support if you notice any discrepancies</p>
            </div>
          </div>
        </div>

        {/* Statement Modal */}
        {showStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Account Statement</h3>
                  <button
                    onClick={() => setShowStatement(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-2">
                  <label className="block text-xl font-semibold text-gray-900 mb-4">Statement Period</label>
                  <div className="flex space-x-3">
                    {['week', 'month', 'quarter', 'year'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setStatementPeriod(period)}
                        className={`px-7 py-2 rounded-lg text-sm font-medium ${
                          statementPeriod === period
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const statement = generateStatement();
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900">Total Sent</h4>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(statement.totalSent)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-green-900">Total Received</h4>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(statement.totalReceived)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-purple-900">Net Amount</h4>
                          <p className={`text-2xl font-bold ${statement.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(statement.netAmount))}
                            {statement.netAmount >= 0 ? ' (Credit)' : ' (Debit)'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Statement Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Period:</span>
                            <span className="ml-2 font-medium">{statement.period.charAt(0).toUpperCase() + statement.period.slice(1)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">From:</span>
                            <span className="ml-2 font-medium">{statement.startDate.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">To:</span>
                            <span className="ml-2 font-medium">{statement.endDate.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Transactions:</span>
                            <span className="ml-2 font-medium">{statement.totalTransactions}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Details</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {statement.transactions.map((t) => (
                            <div key={t.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex-shrink-0">
                                <div><img src={img} alt='image' className="w-11 h-11  object-cover rounded-fit"></img></div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{t.description || 'No description'}</p>
                                <p className="text-xs text-gray-500">{formatDate(t.created_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  t.transaction_type === 'transfer' || t.transaction_type === 'instant' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {t.transaction_type === 'transfer' || t.transaction_type === 'instant' ? '-' : '+'}
                                  {formatCurrency(t.amount)}
                                </p>
                                <p className="text-xs text-gray-500">{t.transaction_id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                          onClick={exportStatement}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export Statement</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
              {/* Compact Header */}
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Transaction Details</h3>
                <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Summary pill */}
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full  flex items-center justify-center text-blue-600">
                    <div className="flex-shrink-0 mr-4">
                        <div><img src={img} alt='image' className="w-10 h-10  object-cover rounded-fit translate-x-1"></img></div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="truncate">
                        {((selectedTransaction.direction || '').toLowerCase() === 'sent' || selectedTransaction.transaction_type === 'transfer' || selectedTransaction.transaction_type === 'instant') ? 'Sending money' : 'Received money'}
                        {selectedTransaction.description ? ` • ${selectedTransaction.description}` : ''}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5 capitalize">{selectedTransaction.status || 'completed'}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${selectedTransaction.transaction_type === 'transfer' || selectedTransaction.transaction_type === 'instant' ? 'text-red-600' : 'text-green-600'}`}>
                    {(selectedTransaction.transaction_type === 'transfer' || selectedTransaction.transaction_type === 'instant') ? '-' : '+'}{formatCurrency(selectedTransaction.amount)}
                  </div>
                </div>

                {/* Details list */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 tracking-wide">Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Transaction ID</span>
                      <span className="font-medium font-mono text-gray-800">{selectedTransaction.transaction_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Transaction Date</span>
                      <span className="font-medium text-gray-800">{formatDate(selectedTransaction.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Recipient</span>
                      <span className="font-medium text-gray-800">{(selectedTransaction.direction || '').toLowerCase() === 'sent' ? (selectedTransaction.recipient_name || '—') : (selectedTransaction.sender_name || '—')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Status</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-300 text-black-900 capitalize">{selectedTransaction.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Amount {((selectedTransaction.direction || '').toLowerCase() === 'sent' || selectedTransaction.transaction_type === 'transfer' || selectedTransaction.transaction_type === 'instant') ? 'Sent' : 'Received'}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(selectedTransaction.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Fee</span>
                      <span className="font-medium text-gray-800">{formatCurrency(selectedTransaction.processing_fee || 0)}</span>
                    </div>
                    {selectedTransaction.category && selectedTransaction.category !== 'Other' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Category</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedTransaction.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 tracking-wide">Notes</h4>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a few notes to help you later"
                    value={notesText}
                    onChange={handleNotesChange}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 tracking-wide">Attachments</h4>
                  <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center text-xs text-gray-500">
                    <label className="cursor-pointer inline-block">
                      <input type="file" multiple className="hidden" onChange={handleFilesSelected} accept=".pdf,.jpg,.jpeg,.png" />
                      <div className="mb-1">Click here to upload or drag and drop</div>
                      <div className="text-[10px] text-gray-400">PDF, JPG, JPEG, PNG less than 10MB</div>
                    </label>
                    {attachments.length > 0 && (
                      <div className="mt-3 text-left space-y-2">
                        {attachments.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              <span className="text-gray-700 text-xs truncate max-w-[200px]">{f.name}</span>
                              <span className="text-gray-400 text-[10px]">{Math.ceil((f.size || 0)/1024)} KB</span>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 text-xs" onClick={() => removeAttachment(idx)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm" onClick={() => {
                    const prefill = {
                      amount: String(selectedTransaction.amount || ''),
                      description: selectedTransaction.description || '',
                      category: selectedTransaction.category || 'Other'
                    };
                    setShowDetails(false);
                    navigate('/transfer', { state: { prefill } });
                  }}>Repeat transfer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory; 
