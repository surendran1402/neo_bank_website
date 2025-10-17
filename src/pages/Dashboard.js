import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bankingAPI } from '../services/api';
import { 
  CheckCircle,
  X,
  IndianRupee
} from 'lucide-react';
import CountUp from '../components/CountUp';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [incomingPayment, setIncomingPayment] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [spendingSummary, setSpendingSummary] = useState(null);
  const [categorySpend, setCategorySpend] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  // Load user's bank accounts and balance
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Get bank accounts
        const accountsResponse = await bankingAPI.getAccounts(token);
        if (accountsResponse.success) {
          setBankAccounts(accountsResponse.bankAccounts);
        }

        // Get balance
        const balanceResponse = await bankingAPI.getBalance(token);
        if (balanceResponse.success) {
          setTotalBalance(balanceResponse.totalBalance);
        }

        // Get recent transactions
        const txResponse = await bankingAPI.getTransactions(1, 5, token);
        if (txResponse.success) {
          setRecentTransactions(txResponse.transactions || []);
        }

        // Personalized insights
        setAiLoading(true);
        try {
          const insights = await bankingAPI.getAIInsights(token, selectedAccountId !== 'all' ? selectedAccountId : undefined);
          if (insights.success) {
            setAiSuggestions(insights.suggestions || []);
            setCategorySpend(insights.category_spend || {});
            setSpendingSummary(insights.spending_summary || null);
          }
        } catch (e) {
          console.error('Insights error:', e);
        }
        setAiLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user, token, selectedAccountId]);


  const refreshUserData = async () => {
    try {
      setLoading(true);
      
      // Get bank accounts
      const accountsResponse = await bankingAPI.getAccounts(token);
      if (accountsResponse.success) {
        setBankAccounts(accountsResponse.bankAccounts);
      }

      // Get balance
      const balanceResponse = await bankingAPI.getBalance(token);
      if (balanceResponse.success) {
        setTotalBalance(balanceResponse.totalBalance);
      }

      // Refresh recent transactions
      const txResponse = await bankingAPI.getTransactions(1, 5, token);
      if (txResponse.success) {
        setRecentTransactions(txResponse.transactions || []);
      }

      // Refresh AI insights
      setAiLoading(true);
      try {
        const insights = await bankingAPI.getAIInsights(token, selectedAccountId !== 'all' ? selectedAccountId : undefined);
        if (insights.success) {
          setAiSuggestions(insights.suggestions || []);
          setCategorySpend(insights.category_spend || {});
        }
      } catch (e) {
        // ignore
      }
      setAiLoading(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
  // Dynamic: compute this month's income and expenses from available transactions
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const isInThisMonth = (d) => {
    const dt = new Date(d);
    return dt >= startOfMonth && dt <= endOfMonth;
  };

  const incomeThisMonth = recentTransactions
    .filter(t => (t.direction === 'received' || t.transaction_type === 'deposit') && isInThisMonth(t.created_at))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const expensesThisMonth = recentTransactions
    .filter(t => (t.direction === 'sent' || t.transaction_type === 'transfer' || t.transaction_type === 'instant') && isInThisMonth(t.created_at))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
console.log(recentTransactions);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Good Morning, {user.name.charAt(0).toUpperCase() + user.name.slice(1,)}</h1>
              <p className="text-gray-600">Here's an overview of your financial health and recent activity.</p>
            </div>
            {/* <div className="flex items-center space-x-3">
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                This Month
                <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Export
              </button>
            </div> */}
          </div>
        </div>
        {/* Success Notification */}
        {transferSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Transfer completed successfully! Your balance has been updated.</span>
            </div>
            <button
              onClick={() => setTransferSuccess(false)}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Incoming Payment Notification */}
        {incomingPayment && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>🎉 You received money! Your balance has been updated.</span>
            </div>
            <button
              onClick={() => setIncomingPayment(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
              {/* <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button> */}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                ) : (
                  <CountUp value={totalBalance} currency duration={1200} />
                )}
              </p>
              <p className="text-sm text-gray-500">Net worth across all accounts</p>
              <p className="text-sm font-medium text-gray-700 mt-2">Total Balance</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              {/* <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button> */}
            </div>
            <div>
              <CountUp className="text-2xl font-bold text-green-600 mb-1" value={incomeThisMonth} currency duration={1200} />
              <p className="text-sm text-gray-500">Total income this month</p>
              <p className="text-sm font-medium text-gray-700 mt-2">Monthly Income</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              {/* <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button> */}
            </div>
            <div>
              <CountUp className="text-2xl font-bold text-red-600 mb-1" value={expensesThisMonth} currency duration={1200} />
              <p className="text-sm text-gray-500">Total expenses this month</p>
              <p className="text-sm font-medium text-gray-700 mt-2">Monthly Expenses</p>
            </div>
          </div>

          {/* Savings stays static */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                </svg>
              </div>
              {/* <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button> */}
            </div>
            <div>
              <CountUp className="text-2xl font-bold text-gray-900 mb-1" value={725} currency duration={1200} />
              <p className="text-sm text-gray-500">This month savings</p>
              <p className="text-sm font-medium text-gray-700 mt-2">Savings</p>
            </div>
          </div>
        </div>

        {/* Transactions Overview and AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Transactions Overview with Pie Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transactions Overview</h3>
              <div>
                <select
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  <option value="all">Overall</option>
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.bank_name} — {acc.account_number}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  <CountUp value={totalBalance} currency duration={1200} />
                </p>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-sm text-green-600 font-medium">
                    {totalBalance > 0 ? `${(Math.random() * 5 + 2).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
              
              {/* <div className="flex bg-gray-100 rounded-lg p-1">
                <button className="px-3 py-1 text-sm font-medium text-gray-500 rounded-md">Monthly</button>
                <button className="px-3 py-1 text-sm font-medium text-white bg-gray-900 rounded-md">Yearly</button>
              </div> */}
            </div>

            {/* Legend - dynamic from payment categories */}
            {Object.keys(categorySpend).length === 0 ? (
              <div className="flex items-center space-x-6 mb-6">
                <span className="text-sm text-gray-500">No category data</span>
              </div>
            ) : (
              (() => {
                const data = Object.entries(categorySpend);
                const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F472B6','#A3A3A3','#F97316','#22C55E','#EAB308','#0EA5E9'];
                return (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
                    {data.slice(0, 6).map(([label], idx) => (
                      <div key={label} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}

            {/* Pie Chart */}
            {aiLoading ? (
              <div className="py-12 text-gray-500 text-center">Loading chart…</div>
            ) : Object.keys(categorySpend).length === 0 ? (
              <div className="py-12 text-gray-500 text-center">No spending data yet.</div>
            ) : (
              <div className="flex items-center justify-center">
                {(() => {
                  const data = Object.entries(categorySpend);
                  const total = data.reduce((s, [, v]) => s + (Number(v) || 0), 0) || 1;
                  const radius = 80;
                  const circumference = 2 * Math.PI * radius;
                  let offset = 0;
                  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F472B6','#A3A3A3','#F97316','#22C55E','#EAB308','#0EA5E9'];
                  return (
                    <div className="flex items-center space-x-8">
                      <svg width="200" height="200" viewBox="0 0 200 200" className="relative">
                        <g transform="translate(100,100)">
                          {data.map(([label, value], idx) => {
                            const fraction = (Number(value) || 0) / total;
                            const dash = circumference * fraction;
                            const isHovered = hoveredIdx === idx;
                            const circle = (
                              <circle
                                key={label}
                                r={radius}
                                cx="0"
                                cy="0"
                                fill="transparent"
                                stroke={colors[idx % colors.length]}
                                strokeWidth={isHovered ? 24 : 20}
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={-offset}
                                transform="-90"
                                style={{ transform: 'rotate(-90deg)' }}
                                className="cursor-pointer hover:opacity-80 transition-all"
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(-1)}
                              />
                            );
                            offset += dash;
                            return circle;
                          })}
                        </g>
                      </svg>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {data.slice(0, 6).map(([label, value], idx) => {
                          const pct = total > 0 ? ((Number(value) || 0) / total) * 100 : 0;
                          const isActive = hoveredIdx === idx;
                          return (
                            <div key={label} className="flex items-center space-x-3">
                              <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: colors[idx % colors.length], outline: isActive ? '2px solid #111827' : 'none', outlineOffset: 2 }}></span>
                              <span className="text-gray-700 font-medium">{label}</span>
                              <span className="text-gray-500">({pct.toFixed(0)}%)</span>
                              <CountUp className="text-gray-500" value={Number(value) || 0} currency duration={1000} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Personalized Insights - Square Box */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Personalized Insights</h3>
              <div className="flex items-center space-x-2">
                {spendingSummary && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-300 text-black-800">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            {/* Balance Summary */}
            {spendingSummary && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Balance Used:</span>
                  <span className={`font-medium ${spendingSummary.balance_usage_percentage < 70 ? 'text-green-600' : spendingSummary.balance_usage_percentage < 90 ? 'text-orange-600' : 'text-red-600'}`}>
                    {spendingSummary.balance_usage_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-gray-800">₹{spendingSummary.remaining_balance.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-600">Total Balance:</span>
                  <span className="font-medium text-gray-800">₹{spendingSummary.total_balance.toFixed(0)}</span>
                </div>
              </div>
            )}
            
            {aiLoading ? (
              <div className="py-8 text-gray-500 text-center">Analyzing your spending…</div>
            ) : aiSuggestions.length === 0 ? (
              <div className="py-8 text-gray-500 text-center">No insights available yet.</div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.slice(0, 3).map((s, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                    s.priority === 'high' 
                      ? 'bg-red-50 border-red-400' 
                      : s.priority === 'medium'
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-green-50 border-green-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 text-sm flex items-center">
                        {s.emoji && <span className="mr-2">{s.emoji}</span>}
                        {s.title}
                      </div>
                      {s.priority === 'high' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">{s.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transaction</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                All Category
                <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
            </div>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {bankAccounts.length > 0 ? 'Your recent transactions will appear here' : 'No transactions yet. Link a bank account to get started!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Transfer</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Date</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Time</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t, index) => (
                    <tr key={t.id || t.transaction_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          
                          <span className=" text-sm font-semibold text-gray-700 py-4 px-4">
                            {t.direction === 'sent' ? ` ${t.description.charAt(12).toUpperCase() + t.description.slice(13,) || 'username'}` : ` ${t.description.charAt(12).toUpperCase() + t.description.slice(13,)}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-gray-700">{t.transaction_id || `INV_0000${75 + index}`}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-gray-700">{new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-gray-700">{new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </td>
                      <td className="py-4 px-4">
                        <CountUp className="text-sm font-semibold text-gray-700" value={Number(t.amount) || 0} currency duration={900} />
                      </td>
                      <td className="py-4 px-4">
                        {(() => {
                          const status = (t.status || '').toLowerCase();
                          const badge = status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800';
                          const dot = status === 'completed'
                            ? 'bg-green-400'
                            : status === 'failed'
                              ? 'bg-red-400'
                              : 'bg-yellow-400';
                          const label = status === 'completed' ? 'Success' : status === 'failed' ? 'Failed' : 'Pending';
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      </div>

    </div>
  );
};

export default Dashboard; 