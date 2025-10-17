import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import profile1Image from '../default.jpg';
import dhilipImage from '../dhilip.jpg';
import johnDoeImage from '../john-doe.jpg';
import sanjayImage from '../sanjay.jpg';
import kabileshImage from '../kabilesh.jpg';
import surendranImage from '../surendran.jpg';
import { 
  Home, 
  CreditCard, 
  ArrowUpDown, 
  History, 
  User, 
  LogOut,
  X,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// 👇 New component for profile photo
const SimplePhotoDisplay = ({ userName }) => {
  let photoUrl;

  if (userName?.toLowerCase().includes('dhilip')) {
    photoUrl = dhilipImage;
  } else if (userName?.toLowerCase().includes('john')) {
    photoUrl = johnDoeImage;
  }else if (userName?.toLowerCase().includes('kabilesh')) {
    photoUrl = kabileshImage;
  } else if (userName?.toLowerCase().includes('sanjay')) {
    photoUrl = sanjayImage;
  }
  else if (userName?.toLowerCase().includes('surendran')) {
    photoUrl = surendranImage;
  } else {
    photoUrl = profile1Image; // fallback
  }

  return (
    <img 
      src={photoUrl} 
      alt={`${userName || 'User'} Profile`} 
      className="w-10 h-10 object-cover rounded-full"
    />
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' },
    { name: 'My Cards', href: '/cards', icon: CreditCard, current: location.pathname === '/cards' },
    { name: 'Link Account', href: '/link-account', icon: CreditCard, current: location.pathname === '/link-account' },
    { name: 'Transfer Funds', href: '/transfer', icon: ArrowUpDown, current: location.pathname === '/transfer' },
    { name: 'Transaction History', href: '/history', icon: History, current: location.pathname === '/history' },
    { name: 'Profile', href: '/profile', icon: User, current: location.pathname === '/profile' },
    { name: 'Help Center', href: '/help', icon: HelpCircle, current: location.pathname === '/help' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">NeoBank</h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium
                  transform transition-all duration-200
                  ${item.current 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 scale-105 z-10 shadow-md' 
                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900 hover:scale-105 hover:z-10 hover:shadow-md'
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <Icon className={`h-5 w-5 ${item.current ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              {/* 👇 Changed only here */}
              <SimplePhotoDisplay userName={user.name} />
            </div>
          
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.name+'@gmail.com' || 'user@example.com'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 rounded-xl transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
