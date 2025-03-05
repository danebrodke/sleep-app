// Test script to diagnose Oura API connection issues
// Run this with: node test-oura-api.js

// Get the token from .env.local or use the one provided as argument
const fs = require('fs');
const path = require('path');

// Try to read the token from .env.local
let ouraToken;
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const tokenMatch = envContent.match(/NEXT_PUBLIC_OURA_TOKEN=([^\s]+)/);
  if (tokenMatch && tokenMatch[1]) {
    ouraToken = tokenMatch[1];
    console.log('Found token in .env.local:', ouraToken);
  }
} catch (error) {
  console.log('Could not read .env.local file:', error.message);
}

// Use command line argument if provided
if (process.argv.length > 2) {
  ouraToken = process.argv[2];
  console.log('Using token from command line argument');
}

if (!ouraToken) {
  console.error('No Oura API token found. Please provide one as a command line argument.');
  process.exit(1);
}

// Get date ranges for testing
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const startDate = formatDate(oneMonthAgo);
const endDate = formatDate(today);

// Test endpoints
const endpoints = [
  {
    name: 'Personal Info',
    url: 'https://api.ouraring.com/v2/usercollection/personal_info',
    method: 'GET'
  },
  {
    name: 'Daily Sleep (Last Month)',
    url: `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`,
    method: 'GET'
  }
];

// Function to test an endpoint
async function testEndpoint(endpoint) {
  console.log(`\nTesting ${endpoint.name} endpoint: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // For sleep data, check if there are any records
      if (endpoint.url.includes('daily_sleep')) {
        if (data.data && data.data.length > 0) {
          console.log(`Found ${data.data.length} sleep records from ${startDate} to ${endDate}`);
          console.log('First record:', JSON.stringify(data.data[0], null, 2));
        } else {
          console.log('No sleep records found for the specified date range.');
          console.log('This could be because:');
          console.log('1. Your Oura Ring hasn\'t synced data for this period');
          console.log('2. You haven\'t worn your ring during this period');
          console.log('3. Your token doesn\'t have permission to access sleep data');
        }
      } else {
        console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
      return true;
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== Oura API Connection Test ===');
  console.log(`Using token: ${ouraToken.substring(0, 5)}...${ouraToken.substring(ouraToken.length - 5)}`);
  console.log(`Testing date range: ${startDate} to ${endDate}`);
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    const passed = await testEndpoint(endpoint);
    allPassed = allPassed && passed;
  }
  
  console.log('\n=== Test Summary ===');
  if (allPassed) {
    console.log('✅ All tests passed! Your Oura API token is working correctly.');
    console.log('If your app is still showing mock data, check:');
    console.log('1. The app might be using a cached version of the token');
    console.log('2. The date range you\'re viewing might not have data');
    console.log('3. There might be an issue with how the app is processing the API response');
    
    // Check if we need to restart the Next.js server
    console.log('\n=== Next Steps ===');
    console.log('Try restarting your Next.js development server:');
    console.log('1. Stop the current server (Ctrl+C)');
    console.log('2. Run: npm run dev');
    console.log('This will ensure the app uses the latest environment variables.');
  } else {
    console.log('❌ Some tests failed. Your Oura API token might be invalid or have insufficient permissions.');
    console.log('Please check:');
    console.log('1. Your token has the correct scopes (daily, personal, session)');
    console.log('2. Your token hasn\'t expired');
    console.log('3. Your Oura account is active and in good standing');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test script error:', error);
}); 