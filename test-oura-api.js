// Test script to directly pull data from the Oura API and examine the response structure
// This will help us identify where the sleep score is located

require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local

const OURA_TOKEN = process.env.NEXT_PUBLIC_OURA_TOKEN;
const OURA_DETAILED_SLEEP_URL = 'https://api.ouraring.com/v2/usercollection/sleep';
const OURA_DAILY_SLEEP_URL = 'https://api.ouraring.com/v2/usercollection/daily_sleep';

// Get today's date and 7 days ago for the date range
const today = new Date();
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(today.getDate() - 7);

const startDate = sevenDaysAgo.toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log(`Testing Oura API with date range: ${startDate} to ${endDate}`);
console.log(`Using token: ${OURA_TOKEN ? OURA_TOKEN.substring(0, 5) + '...' + OURA_TOKEN.substring(OURA_TOKEN.length - 5) : 'Not set'}`);

// Function to fetch data from the Oura API
async function fetchOuraData(url, startDate, endDate) {
  try {
    const fullUrl = `${url}?start_date=${startDate}&end_date=${endDate}`;
    console.log(`Fetching from: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${OURA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Error response from API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Function to examine the structure of the response
function examineStructure(data, type) {
  console.log(`\n=== ${type} API Response ===`);
  
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    console.log('No data found or invalid response structure');
    return;
  }
  
  console.log(`Found ${data.data.length} records`);
  
  // Examine the first record in detail
  const firstRecord = data.data[0];
  console.log('\nFirst record top-level keys:', Object.keys(firstRecord));
  
  // Check for sleep score in various possible locations
  console.log('\nPossible sleep score locations:');
  console.log('- Direct score:', firstRecord.score);
  console.log('- sleep_score:', firstRecord.sleep_score);
  console.log('- sleep_score_delta:', firstRecord.sleep_score_delta);
  
  // Check if contributors exists and examine its structure
  if (firstRecord.contributors) {
    console.log('\nContributors object keys:', Object.keys(firstRecord.contributors));
    
    if (firstRecord.contributors.score) {
      console.log('- contributors.score:', firstRecord.contributors.score);
      console.log('- contributors.score.value:', firstRecord.contributors.score.value);
    }
  }
  
  // Print the entire first record for detailed examination
  console.log('\nComplete first record:');
  console.log(JSON.stringify(firstRecord, null, 2));
}

// Main function to run the tests
async function runTests() {
  // Test the detailed sleep API
  console.log('\nTesting detailed sleep API...');
  const detailedData = await fetchOuraData(OURA_DETAILED_SLEEP_URL, startDate, endDate);
  examineStructure(detailedData, 'Detailed Sleep');
  
  // Test the daily sleep summary API
  console.log('\nTesting daily sleep summary API...');
  const dailyData = await fetchOuraData(OURA_DAILY_SLEEP_URL, startDate, endDate);
  examineStructure(dailyData, 'Daily Sleep Summary');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
}); 