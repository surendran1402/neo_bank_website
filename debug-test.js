const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function debugTest() {
  console.log('🔍 Debug Test...\n');

  try {
    console.log('Testing registration...');
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: `debug${Date.now()}@example.com`,
      password: 'testpassword123',
      confirmPassword: 'testpassword123'
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.response?.data?.error || error.message);
    console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

debugTest(); 