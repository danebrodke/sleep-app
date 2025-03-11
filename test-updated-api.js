// Test script to verify our updated data mapping logic for the Oura API
// This will help ensure we correctly extract the sleep score

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

console.log(`Testing updated Oura API mapping with date range: ${startDate} to ${endDate}`);
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

// Function to extract sleep score using our updated logic
function extractSleepScore(sleepData) {
  console.log('\nExtracting sleep score from:', sleepData.id || 'unknown');
  
  // Try to find the sleep score in various possible locations
  let extractedScore = 0;
  
  // Check direct score property
  if (sleepData.score !== undefined && sleepData.score !== null) {
    console.log('- Using direct score:', sleepData.score);
    extractedScore = sleepData.score;
  } 
  // Check contributors.score.value
  else if (sleepData.contributors?.score?.value !== undefined) {
    console.log('- Using contributors.score.value:', sleepData.contributors.score.value);
    extractedScore = sleepData.contributors.score.value;
  }
  // Check sleep_score property
  else if (sleepData.sleep_score !== undefined) {
    console.log('- Using sleep_score property:', sleepData.sleep_score);
    extractedScore = sleepData.sleep_score;
  }
  // Check sleep_score_delta property
  else if (sleepData.sleep_score_delta !== undefined) {
    console.log('- Using sleep_score_delta property:', sleepData.sleep_score_delta);
    extractedScore = sleepData.sleep_score_delta;
  }
  
  console.log('- Final extracted score:', extractedScore);
  return extractedScore;
}

// Function to test our updated mapping logic
function testUpdatedMapping(data, type) {
  console.log(`\n=== Testing Updated Mapping for ${type} ===`);
  
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    console.log('No data found or invalid response structure');
    return;
  }
  
  console.log(`Processing ${data.data.length} records`);
  
  // Process each record and extract the sleep score
  const mappedRecords = data.data.map(item => {
    const sleepData = item.sleep || item;
    const score = extractSleepScore(sleepData);
    
    return {
      id: sleepData.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
      day: sleepData.day || 'unknown',
      score: score
    };
  });
  
  // Print the mapped records
  console.log('\nMapped Records:');
  mappedRecords.forEach(record => {
    console.log(`- ${record.day}: Score = ${record.score || 'N/A'}`);
  });
  
  // Check if any records have a score of 0 or undefined
  const missingScores = mappedRecords.filter(record => !record.score);
  if (missingScores.length > 0) {
    console.log(`\n⚠️ Warning: ${missingScores.length} records have missing scores!`);
  } else {
    console.log('\n✅ All records have valid scores!');
  }
  
  return mappedRecords;
}

// Main function to run the tests
async function runTests() {
  // Test the detailed sleep API
  console.log('\nTesting detailed sleep API with updated mapping...');
  const detailedData = await fetchOuraData(OURA_DETAILED_SLEEP_URL, startDate, endDate);
  const detailedMapped = testUpdatedMapping(detailedData, 'Detailed Sleep');
  
  // Test the daily sleep summary API
  console.log('\nTesting daily sleep summary API with updated mapping...');
  const dailyData = await fetchOuraData(OURA_DAILY_SLEEP_URL, startDate, endDate);
  const dailyMapped = testUpdatedMapping(dailyData, 'Daily Sleep Summary');
  
  // Compare the results
  if (detailedMapped && dailyMapped) {
    console.log('\n=== Comparison of Detailed vs Daily Sleep Scores ===');
    
    // Create a map of daily scores by date
    const dailyScoresByDate = {};
    dailyMapped.forEach(record => {
      dailyScoresByDate[record.day] = record.score;
    });
    
    // Compare with detailed scores
    detailedMapped.forEach(record => {
      const dailyScore = dailyScoresByDate[record.day];
      if (dailyScore !== undefined) {
        console.log(`- ${record.day}: Detailed = ${record.score || 'N/A'}, Daily = ${dailyScore || 'N/A'}`);
      }
    });
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
}); 