// Test script to verify the updated API client
// Run this with: node test-updated-api.js

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

// Test both endpoints
async function testBothEndpoints() {
  console.log('=== Testing Updated Oura API Client ===');
  console.log(`Using token: ${ouraToken.substring(0, 5)}...${ouraToken.substring(ouraToken.length - 5)}`);
  console.log(`Date range: ${startDate} to ${endDate}`);
  
  // Test the detailed sleep endpoint
  console.log('\n1. Testing detailed sleep endpoint...');
  const detailedData = await testDetailedSleepEndpoint();
  
  // Test the daily sleep summary endpoint
  console.log('\n2. Testing daily sleep summary endpoint...');
  const summaryData = await testDailySleepSummaryEndpoint();
  
  console.log('\n=== Test Summary ===');
  console.log(`Detailed sleep data: ${detailedData ? 'Available' : 'Not available'} (${detailedData ? detailedData.length : 0} records)`);
  console.log(`Daily sleep summary: ${summaryData ? 'Available' : 'Not available'} (${summaryData ? summaryData.length : 0} records)`);
  
  if (detailedData || summaryData) {
    console.log('\n✅ At least one endpoint returned data. Your updated API client should work!');
    console.log('Next steps:');
    console.log('1. Restart your Next.js development server');
    console.log('2. Test the app in your browser');
  } else {
    console.log('\n❌ No data available from either endpoint.');
    console.log('This could be because:');
    console.log('1. Your Oura Ring hasn\'t synced data for this period');
    console.log('2. You haven\'t worn your ring during this period');
    console.log('3. Your token doesn\'t have the necessary permissions');
  }
}

// Test the detailed sleep endpoint
async function testDetailedSleepEndpoint() {
  try {
    const url = new URL('https://api.ouraring.com/v2/usercollection/sleep');
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      return null;
    }
    
    console.log(`Found ${data.data.length} detailed sleep records`);
    
    if (data.data.length > 0) {
      console.log('First record keys:', Object.keys(data.data[0]));
      console.log('First record sample:', JSON.stringify(data.data[0]).substring(0, 200) + '...');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error testing detailed sleep endpoint:', error);
    return null;
  }
}

// Test the daily sleep summary endpoint
async function testDailySleepSummaryEndpoint() {
  try {
    const url = new URL('https://api.ouraring.com/v2/usercollection/daily_sleep');
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      return null;
    }
    
    console.log(`Found ${data.data.length} daily sleep summary records`);
    
    if (data.data.length > 0) {
      console.log('First record keys:', Object.keys(data.data[0]));
      console.log('First record sample:', JSON.stringify(data.data[0]).substring(0, 200) + '...');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error testing daily sleep summary endpoint:', error);
    return null;
  }
}

// Run the tests
testBothEndpoints().catch(error => {
  console.error('Test script error:', error);
}); 