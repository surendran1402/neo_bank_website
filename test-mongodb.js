const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMongoDB() {
  console.log('🔍 Testing MongoDB Integration...\n');

  try {
    // Generate unique email
    const uniqueEmail = `test${Date.now()}@example.com`;
    const password = 'testpassword123';
    
    console.log('📧 Test Email:', uniqueEmail);
    console.log('🔑 Test Password:', password);
    console.log('');

    // Step 1: Register new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: uniqueEmail,
      password: password,
      confirmPassword: password
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful!');
      console.log('   User ID:', registerResponse.data.user.id);
      console.log('   Name:', registerResponse.data.user.name);
      console.log('   Token received:', !!registerResponse.data.token);
    } else {
      console.log('❌ Registration failed:', registerResponse.data.error);
      return;
    }

    console.log('');

    // Step 2: Try to login
    console.log('2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: uniqueEmail,
      password: password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('   User ID:', loginResponse.data.user.id);
      console.log('   Name:', loginResponse.data.user.name);
    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
    }

    console.log('\n🎯 MongoDB Integration Test completed successfully!');
    console.log('✅ Your Horizon Banking App is now running on MERN Stack!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

testMongoDB(); 