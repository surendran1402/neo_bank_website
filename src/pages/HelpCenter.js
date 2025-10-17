import React, { useState } from 'react';
import { 
  Smile, 
  FileText, 
  X, 
  DollarSign, 
  Users, 
  Mail, 
  MessageSquare, 
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [expandedItems, setExpandedItems] = useState(new Set(['general-1']));

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const faqData = {
    general: [
      {
        id: 'general-1',
        question: 'How do I open a new account?',
        answer: 'You can open a new account directly through our mobile app or website. Simply click "Open Account" and follow the step-by-step process. No need to visit a branch!',
        icon: Smile
      },
      {
        id: 'general-2',
        question: 'Is my money safe with NeoBank?',
        answer: 'Absolutely! Your deposits are insured up to $250,000 by the FDIC. We use bank-level security with 256-bit encryption to protect your financial information.',
        icon: FileText
      },
      {
        id: 'general-3',
        question: 'What is the minimum balance requirement?',
        answer: 'There is no minimum balance requirement for our basic checking and savings accounts. You can start with any amount and grow your account from there.',
        icon: X
      },
      {
        id: 'general-4',
        question: 'Can I have multiple accounts?',
        answer: 'Yes! You can open multiple checking accounts, savings accounts, and even business accounts. Each account has its own account number and can be managed separately.',
        icon: Users
      }
    ],
    pricing: [
      {
        id: 'pricing-1',
        question: 'What fees do you charge?',
        answer: 'We offer fee-free banking with no monthly maintenance fees, no minimum balance fees, and no overdraft fees. Some services like wire transfers may have small fees.',
        icon: DollarSign
      },
      {
        id: 'pricing-2',
        question: 'Are there ATM fees?',
        answer: 'We provide free ATM access at over 55,000 ATMs nationwide. Out-of-network ATM fees are reimbursed up to $15 per month for premium accounts.',
        icon: DollarSign
      },
      {
        id: 'pricing-3',
        question: 'What are your interest rates?',
        answer: 'Our high-yield savings accounts offer competitive APY rates up to 4.5%. Interest rates are updated regularly and can be viewed in your account dashboard.',
        icon: DollarSign
      }
    ],
    dashboard: [
      {
        id: 'dashboard-1',
        question: 'How do I transfer money between accounts?',
        answer: 'Go to the "Transfer Funds" section in your dashboard. You can transfer between your own accounts instantly or to external accounts within 1-3 business days.',
        icon: Mail
      },
      {
        id: 'dashboard-2',
        question: 'How do I set up direct deposit?',
        answer: 'Navigate to Account Settings > Direct Deposit to get your account and routing numbers. Provide these to your employer for automatic paycheck deposits.',
        icon: MessageSquare
      },
      {
        id: 'dashboard-3',
        question: 'How do I view my transaction history?',
        answer: 'Click on "Transaction History" in your dashboard to see all your transactions. You can filter by date, amount, or transaction type for easy searching.',
        icon: FileText
      },
      {
        id: 'dashboard-4',
        question: 'How do I link an external bank account?',
        answer: 'Go to "Link Account" in your dashboard and follow the verification process. We use secure micro-deposits to verify your external account ownership.',
        icon: Users
      }
    ],
    api: [
      {
        id: 'api-1',
        question: 'How do I get a debit card?',
        answer: 'Your debit card is automatically ordered when you open an account. It will arrive within 7-10 business days. You can track shipping in your account dashboard.',
        icon: Play
      },
      {
        id: 'api-2',
        question: 'How do I activate my debit card?',
        answer: 'Call the number on the back of your card or use our mobile app to activate it. You\'ll need your card number, expiration date, and CVV code.',
        icon: FileText
      },
      {
        id: 'api-3',
        question: 'What if I lose my debit card?',
        answer: 'Immediately freeze your card in the mobile app or call customer service. We can issue a replacement card within 2-3 business days at no charge.',
        icon: X
      },
      {
        id: 'api-4',
        question: 'How do I set up mobile banking alerts?',
        answer: 'Go to Settings > Notifications to customize your alerts. You can receive notifications for deposits, withdrawals, low balances, and security events.',
        icon: MessageSquare
      }
    ]
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'pricing', label: 'Fees & Rates' },
    { id: 'dashboard', label: 'Account Management' },
    { id: 'api', label: 'Cards & Security' }
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-gray-600">
            These are the most commonly asked questions about NeoBank. Can't find what you're looking for? 
            <span className="font-medium text-gray-900"> Chat to our friendly team!</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData[activeTab]?.map((item) => {
            const IconComponent = item.icon;
            const isExpanded = expandedItems.has(item.id);
            
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">{item.question}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-4">
                    <div className="pl-12">
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat Button */}
        <div className="fixed bottom-6 right-6">
          <button className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;


