// Detailed test script to examine the Oura API response structure
// Run this with: node test-oura-api-detailed.js

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

// Function to test the API and save the response to a file
async function testAndSaveResponse() {
  console.log(`Testing Oura API with token: ${ouraToken.substring(0, 5)}...${ouraToken.substring(ouraToken.length - 5)}`);
  console.log(`Date range: ${startDate} to ${endDate}`);
  
  try {
    // Test the daily sleep endpoint
    const url = `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;
    console.log(`Requesting: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    // Save the full response to a file for analysis
    const outputFile = path.join(__dirname, 'oura-api-response.json');
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`Full API response saved to: ${outputFile}`);
    
    // Print summary information
    if (data.data && Array.isArray(data.data)) {
      console.log(`Found ${data.data.length} sleep records`);
      
      if (data.data.length > 0) {
        // Analyze the first record to understand its structure
        const firstRecord = data.data[0];
        console.log('\nFirst record structure:');
        console.log('Keys:', Object.keys(firstRecord));
        
        // Check if it has the fields our app expects
        const expectedFields = [
          'id', 'day', 'bedtime_start', 'bedtime_end', 'latency',
          'total_sleep_duration', 'awake_time', 'light_sleep_duration',
          'rem_sleep_duration', 'deep_sleep_duration', 'efficiency',
          'hypnogram_5min', 'hr_lowest', 'hr_average', 'temperature_delta', 'score'
        ];
        
        const missingFields = expectedFields.filter(field => !(field in firstRecord));
        
        if (missingFields.length > 0) {
          console.log('\n⚠️ Missing fields in API response:');
          console.log(missingFields);
          console.log('\nThis indicates the API response structure has changed.');
          console.log('You need to update your app to handle the new structure.');
        } else {
          console.log('\n✅ API response contains all expected fields');
        }
        
        // Print the first record for reference
        console.log('\nFirst record data:');
        console.log(JSON.stringify(firstRecord, null, 2));
      }
    } else {
      console.log('Unexpected API response format:', data);
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. Examine the saved response file for detailed data structure');
    console.log('2. Update your app code to handle the API response format');
    console.log('3. Restart your Next.js development server');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testAndSaveResponse().catch(error => {
  console.error('Test script error:', error);
}); 