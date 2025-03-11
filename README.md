# Sleep Tracker App

A web application that collects sleep data from the Oura API and displays detailed sleep metrics with the ability to add personal notes.

## Features

- Fetches sleep data from your Oura Ring via the Oura API
- Displays sleep metrics including:
  - Hypnogram visualization
  - Total sleep time
  - REM sleep time
  - Deep sleep time
  - Light sleep time
  - Sleep latency
  - Sleep efficiency
- Add and edit personal notes for each night's sleep
- Filter data by date range (last week, last month, last 3 months)
- Navigate through your sleep history
- Responsive design for both desktop and mobile

## Setup Instructions

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Oura Ring and access to the Oura API
- Supabase account

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd sleep-tracker
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Set Up Supabase

1. Log in to your Supabase account at https://app.supabase.io/
2. Navigate to the SQL Editor
3. Copy and paste the contents of the `supabase-setup.sql` file into the SQL Editor
4. Click "Run" to execute the SQL and create the necessary table and functions

### Step 4: Configure Environment Variables

The app is already configured with your Supabase URL, API key, and Oura API token. If you need to change these:

1. Open `.env.local` file in the project root
2. Update the values as needed:
   ```
   NEXT_PUBLIC_OURA_TOKEN=your_new_token_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_KEY=your_supabase_key
   ```

#### Updating Your Oura API Token

If you're seeing "Using mock data" or connection errors, you likely need to update your Oura API token:

1. Go to [Oura Cloud Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Sign in with your Oura account
3. Click "Create New Personal Access Token"
4. Select the following scopes:
   - daily
   - personal
   - session
5. Give your token a name (e.g., "Sleep Tracker App")
6. Copy the newly generated token
7. Update the `.env.local` file with your new token
8. Restart the development server

### Step 5: Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Step 6: Build for Production (Optional)

```bash
npm run build
# or
yarn build
```

## Deploying to Vercel

1. Create an account on [Vercel](https://vercel.com) if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy the app:
   ```bash
   vercel
   ```
4. Follow the prompts to complete the deployment

## Using the App

### Viewing Sleep Data

- When you first open the app, it will display your sleep data from the last month
- Use the date range selector to choose different time periods
- Toggle between grid and list views using the tabs at the top

### Adding Notes

1. Click the "Add Notes" button on any sleep card
2. Enter your notes in the dialog that appears
3. Click "Save Notes" to save your changes

### Navigating Through Data

- Use the arrow buttons to navigate to previous or next time periods
- Click "Last Week", "Last Month", or "Last 3 Months" to quickly jump to those time ranges

## Troubleshooting

### Sleep Score Not Displaying

If you're seeing "N/A" instead of actual sleep scores in the app, you can use the included test scripts to diagnose the issue:

1. First, make sure your Oura API token is correctly set in `.env.local`

2. Run the test script to examine the API response structure:
   ```bash
   node test-oura-api.js
   ```
   This will show you exactly where the sleep score is located in the API response.

3. Run the updated mapping test to verify our extraction logic:
   ```bash
   node test-updated-api.js
   ```
   This will show if our code can successfully extract the sleep scores.

4. If the tests show that sleep scores are available but not displaying in the app, try:
   - Clearing your browser cache
   - Restarting the development server
   - Checking the browser console for any errors

### Common Issues

1. **Missing Sleep Score**: The Oura API v2 might return the sleep score in different locations:
   - As a direct `score` property
   - Inside `contributors.score.value`
   - As `sleep_score` or `sleep_score_delta`

2. **API Token Permissions**: Make sure your token has the necessary scopes:
   - daily
   - personal
   - session

3. **No Data Available**: If you're not seeing any data:
   - Ensure your Oura Ring has synced recently
   - Try a different date range
   - Verify your token hasn't expired

### API Connection Issues

If you see "Using mock data" or encounter API connection errors:

1. Use the "Troubleshoot API connection" link in the app
2. Follow the step-by-step guide to diagnose and fix the issue
3. Make sure your Oura API token is valid and has the correct permissions
4. Check that your Oura Ring is synced and has data for the selected date range

#### Oura API v2 Changes

The Oura API v2 has a different structure than v1. If you're seeing issues with the API connection:

1. Make sure your token has the following scopes:
   - daily
   - personal
   - session
   - heartrate
   - workout
   - tag

2. If you're still having issues, try running the test scripts:
   ```bash
   node test-oura-api.js
   node test-updated-api.js
   ```

3. Check the console output in your browser (F12 > Console) for any error messages

4. Try selecting a different date range - you might not have data for the current range

5. Restart your development server after updating your token:
   ```bash
   npm run dev
   ```

### Database Issues

- If sleep notes aren't saving, verify your Supabase connection and that the SQL setup was completed successfully
- For any other issues, check the browser console for error messages

## Privacy and Security

- Your Oura API token and Supabase credentials are stored in the `.env.local` file
- The app does not share your sleep data with any third parties

## License

MIT
