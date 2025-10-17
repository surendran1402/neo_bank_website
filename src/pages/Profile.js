import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import dhilipImage from './dhilip.jpg';
import johnDoeImage from '../john-doe.jpg';
import sanjayImage from '../sanjay.jpg';
import kabileshImage from "../kabilesh.jpg";
import profile1Image from '../default.jpg';
import surendranImage from '../surendran.jpg';
import { 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  CreditCard, 
  Shield, 
  Settings,
  Edit3,
  X,
  DollarSign,
  Briefcase,
  
} from 'lucide-react';

const Profile = () => {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showSensitiveData, setShowSensitiveData] = useState({});


  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile(token);
      if (response.success) {
        setUserDetails(response.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple Photo Display - Use imported images for specific users
  const SimplePhotoDisplay = ({ userName, getInitials }) => {
    // Get the image based on username - check for all available images
    let photoUrl = null;
    
    if (userName && userName.toLowerCase().includes('dhilip')) {
      photoUrl = dhilipImage;
    } else if (userName && userName.toLowerCase().includes('john')) {
      photoUrl = johnDoeImage;
    } else if (userName && userName.toLowerCase().includes('kabilesh')) {
      photoUrl = kabileshImage;
    } else if (userName && userName.toLowerCase().includes('sanjay')) {
      photoUrl = sanjayImage;
    }else if (userName && userName.toLowerCase().includes('surendran')) {
      photoUrl = surendranImage;
    } else {
      // Default profile image for all other users
      photoUrl = profile1Image;
    }
    
    return (
      <img 
        src={photoUrl} 
        alt="Profile" 
        className="w-full h-full object-cover object-center"
      />
    );
  };

  // Handle comprehensive profile update
  const handleComprehensiveProfileUpdate = async (profileData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateComprehensiveProfile(profileData, token);
      if (response.success) {
        setUserDetails(response.user);
        setShowEditModal(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle sensitive data visibility
  const toggleSensitiveData = (field) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Mask sensitive data
  const maskData = (data, type = 'default') => {
    if (!data) return 'Not provided';
    if (showSensitiveData[type]) return data;
    
    switch (type) {
      case 'phone':
        return data.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
      case 'account':
        return data.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2');
      case 'pan':
        return data.replace(/(\w{2})\w{3}(\w{2})/, '$1***$2');
      case 'aadhaar':
        return data.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2');
      default:
        return '••••••••';
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Populate edit form when user data loads
  useEffect(() => {
    if (userDetails) {
      setEditForm({
        dateOfBirth: userDetails.dateOfBirth || '',
        gender: userDetails.gender || '',
        nationality: userDetails.nationality || '',
        maritalStatus: userDetails.maritalStatus || '',
        occupation: userDetails.occupation || '',
        phoneNumbers: {
          mobile: userDetails.phoneNumbers?.mobile || '',
          landline: userDetails.phoneNumbers?.landline || ''
        },
        preferredLanguage: userDetails.preferredLanguage || '',
        kyc: {
          panNumber: userDetails.kyc?.panNumber || '',
          aadhaarNumber: userDetails.kyc?.aadhaarNumber || '',
          passportNumber: userDetails.kyc?.passportNumber || '',
          kycStatus: userDetails.kyc?.kycStatus || ''
        },
        linkedServices: {
          internetBanking: userDetails.linkedServices?.internetBanking || false,
          mobileBanking: userDetails.linkedServices?.mobileBanking || false,
          smsAlerts: userDetails.linkedServices?.smsAlerts || false,
          eStatements: userDetails.linkedServices?.eStatements || false
        }
      });
    }
  }, [userDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Profile</h1>
              <p className="text-gray-600 text-lg">Complete banking profile and account information</p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Edit3 className="h-5 w-5" />
              <span>Edit Profile</span>
            </button>
          </div>
          </div>

        {/* Profile Overview Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8 backdrop-blur-sm bg-white/95">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Profile Photo */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-white/20">
                  <SimplePhotoDisplay 
                    userName={userDetails.name}
                    getInitials={getInitials}
                  />
                </div>
                
                {/* Photo Status Badge */}
               
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {userDetails.name.charAt(0).toUpperCase()+userDetails.name.slice(1,) || 'Account Holder'}
                </h2>
                <p className="text-blue-100 text-lg mb-4">
                  Customer ID: {userDetails.customer_id || 'Not provided'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                      <CreditCard className="h-6 w-6 text-blue-200" />
                <div>
                        <p className="text-blue-200 text-sm">Account Number</p>
                        <p className="text-white font-semibold">
                          {userDetails.account_number || '954563421345'}
                        </p>
                </div>
              </div>
            </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                      <Phone className="h-6 w-6 text-blue-200" />
                <div>
                        <p className="text-blue-200 text-sm">Phone Number</p>
                        <p className="text-white font-semibold">
                          {userDetails.Phone || "9566328139"}
                  </p>
                </div>
              </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                      <DollarSign className="h-6 w-6 text-blue-200" />
                      <div>
                        <p className="text-blue-200 text-sm">Account Balance</p>
                        <p className="text-white font-semibold">₹0.00</p>
                      </div>
                    </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Content Sections - No Navigation Needed */}
          <div className="p-8 space-y-12">
            {/* Personal Information */}
            <div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="h-6 w-6 mr-3 text-blue-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        Basic Details
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Full Name:</span>
                          <span className="font-semibold">{userDetails.name.charAt(0).toUpperCase()+userDetails.name.slice(1,) || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date of Birth:</span>
                          <span className="font-semibold">{userDetails.dateOfBirth || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-semibold">{userDetails.gender || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nationality:</span>
                          <span className="font-semibold">{userDetails.nationality || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                        Additional Details
                      </h4>
          <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marital Status:</span>
                          <span className="font-semibold">{userDetails.maritalStatus || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Occupation:</span>
                          <span className="font-semibold">{userDetails.occupation || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Phone className="h-6 w-6 mr-3 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Phone Numbers</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mobile:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{maskData(userDetails.phoneNumbers?.mobile, 'phone')}</span>
                          <button
                            onClick={() => toggleSensitiveData('mobile')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Landline:</span>
                        <span className="font-semibold">{userDetails.phoneNumbers?.landline || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Communication</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preferred Language:</span>
                        <span className="font-semibold">{userDetails.preferredLanguage || 'Not provided'}</span>
                      </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

            {/* KYC Details */}
            <div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-blue-600" />
                  KYC Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Identity Documents</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">PAN Number:</span>
                        <span className="font-semibold">{userDetails.kyc?.panNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aadhaar Number:</span>
                        <span className="font-semibold">{userDetails.kyc?.aadhaarNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passport Number:</span>
                        <span className="font-semibold">{userDetails.kyc?.passportNumber || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">KYC Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          userDetails.kyc?.kycStatus === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : userDetails.kyc?.kycStatus === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userDetails.kyc?.kycStatus || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Services */}
            <div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-blue-600" />
                  Linked Services & Preferences
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Banking Services</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Internet Banking:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          userDetails.linkedServices?.internetBanking 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.linkedServices?.internetBanking ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mobile Banking:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          userDetails.linkedServices?.mobileBanking 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.linkedServices?.mobileBanking ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br blue-300 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">SMS Alerts:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          userDetails.linkedServices?.smsAlerts 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.linkedServices?.smsAlerts ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">E-Statements:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                          userDetails.linkedServices?.eStatements 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.linkedServices?.eStatements ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h3>
                  <p className="text-gray-600">Fill in your banking details to complete your profile</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleComprehensiveProfileUpdate(editForm); }} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={editForm.nationality}
                        onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                        placeholder="Enter nationality"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marital Status
                      </label>
                      <select
                        value={editForm.maritalStatus}
                        onChange={(e) => setEditForm({...editForm, maritalStatus: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Occupation
                      </label>
                      <input
                        type="text"
                        value={editForm.occupation}
                        onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                        placeholder="Enter your occupation"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-blue-600" />
                    Contact Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumbers?.mobile || ''}
                        onChange={(e) => setEditForm({...editForm, phoneNumbers: {...editForm.phoneNumbers, mobile: e.target.value}})}
                        placeholder="Enter mobile number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Landline Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumbers?.landline || ''}
                        onChange={(e) => setEditForm({...editForm, phoneNumbers: {...editForm.phoneNumbers, landline: e.target.value}})}
                        placeholder="Enter landline number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Language
                      </label>
                      <select
                        value={editForm.preferredLanguage}
                        onChange={(e) => setEditForm({...editForm, preferredLanguage: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Language</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Kannada">Kannada</option>
                        <option value="Malayalam">Malayalam</option>
                        <option value="Punjabi">Punjabi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* KYC Information */}
                <div className="space-y-6">
                  <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    KYC Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={editForm.kyc?.panNumber || ''}
                        onChange={(e) => setEditForm({...editForm, kyc: {...editForm.kyc, panNumber: e.target.value}})}
                        placeholder="Enter PAN number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={editForm.kyc?.aadhaarNumber || ''}
                        onChange={(e) => setEditForm({...editForm, kyc: {...editForm.kyc, aadhaarNumber: e.target.value}})}
                        placeholder="Enter Aadhaar number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        value={editForm.kyc?.passportNumber || ''}
                        onChange={(e) => setEditForm({...editForm, kyc: {...editForm.kyc, passportNumber: e.target.value}})}
                        placeholder="Enter passport number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KYC Status
                      </label>
                      <select
                        value={editForm.kyc?.kycStatus || ''}
                        onChange={(e) => setEditForm({...editForm, kyc: {...editForm.kyc, kycStatus: e.target.value}})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Incomplete">Incomplete</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Linked Services */}
                <div className="space-y-6">
                  <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-600" />
                    Linked Services
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="internetBanking"
                        checked={editForm.linkedServices?.internetBanking || false}
                        onChange={(e) => setEditForm({...editForm, linkedServices: {...editForm.linkedServices, internetBanking: e.target.checked}})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="internetBanking" className="text-sm font-medium text-gray-700">
                        Internet Banking
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="mobileBanking"
                        checked={editForm.linkedServices?.mobileBanking || false}
                        onChange={(e) => setEditForm({...editForm, linkedServices: {...editForm.linkedServices, mobileBanking: e.target.checked}})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="mobileBanking" className="text-sm font-medium text-gray-700">
                        Mobile Banking
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="smsAlerts"
                        checked={editForm.linkedServices?.smsAlerts || false}
                        onChange={(e) => setEditForm({...editForm, linkedServices: {...editForm.linkedServices, smsAlerts: e.target.checked}})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="smsAlerts" className="text-sm font-medium text-gray-700">
                        SMS Alerts
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="eStatements"
                        checked={editForm.linkedServices?.eStatements || false}
                        onChange={(e) => setEditForm({...editForm, linkedServices: {...editForm.linkedServices, eStatements: e.target.checked}})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="eStatements" className="text-sm font-medium text-gray-700">
                        E-Statements
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profile;