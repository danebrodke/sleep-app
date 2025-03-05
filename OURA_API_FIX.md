# Oura API Connection Fix

## Summary of Changes

We've updated the Sleep Tracker app to work with the Oura API v2, which has a different data structure than what the app was originally designed for. The key changes include:

1. **Updated API Client**: Modified `src/lib/oura-api.ts` to handle both detailed sleep data and daily sleep summaries
2. **Fallback Mechanism**: Added a fallback system that tries detailed data first, then summary data, and finally mock data
3. **Data Mapping**: Created mapping functions to transform the v2 API response to match the app's expected format
4. **Testing Scripts**: Added test scripts to verify API connections and examine response structures
5. **Documentation**: Updated the README with troubleshooting information

## How to Test the Fix

1. Make sure your Oura API token is updated in `.env.local`
2. Run the test scripts to verify your token works:
   ```bash
   node test-oura-api.js
   node test-updated-api.js
   ```
3. Restart your development server:
   ```bash
   npm run dev
   ```
4. Open the app in your browser and check if real data is displayed

## API Token Requirements

Your Oura API token needs the following scopes:
- daily
- personal
- session
- heartrate (optional, but recommended)
- workout (optional)
- tag (optional)

## Technical Details

### API Endpoints Used

1. **Detailed Sleep Data**: `https://api.ouraring.com/v2/usercollection/sleep`
   - Contains more detailed sleep information including sleep phases
   - Used as the primary data source

2. **Daily Sleep Summary**: `https://api.ouraring.com/v2/usercollection/daily_sleep`
   - Contains summary sleep scores and contributors
   - Used as a fallback when detailed data is not available

### Data Mapping

The v2 API has different field names than what our app expects:

| App Field | v2 API Detailed Field | v2 API Summary Field |
|-----------|----------------------|---------------------|
| id | id | id |
| day | day | day |
| bedtime_start | bedtime_start | (not available) |
| bedtime_end | bedtime_end | (not available) |
| latency | latency | contributors.latency |
| total_sleep_duration | total_sleep_duration | (estimated) |
| awake_time | awake_time | (not available) |
| light_sleep_duration | light_sleep_duration | (not available) |
| rem_sleep_duration | rem_sleep_duration | (estimated) |
| deep_sleep_duration | deep_sleep_duration | (estimated) |
| efficiency | efficiency | contributors.efficiency |
| hypnogram_5min | sleep_phase_5_min | (not available) |
| hr_lowest | lowest_heart_rate | (not available) |
| hr_average | average_heart_rate | (not available) |
| temperature_delta | (not available) | (not available) |
| score | sleep_score_delta | score |

## Troubleshooting

If you're still seeing issues:

1. Check the browser console (F12 > Console) for error messages
2. Make sure your Oura Ring has synced recently
3. Try a different date range - you might not have data for the current range
4. Verify your token has the correct permissions
5. Try generating a new token if the current one isn't working 