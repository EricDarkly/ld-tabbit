# Feature Flag Setup Guide

This document provides instructions for creating and configuring the `showUploadHeading` feature flag in LaunchDarkly.

## Prerequisites

- A LaunchDarkly account with access to your project
- The client-side ID from your LaunchDarkly environment

## Step 1: Create the Feature Flag

1. Log in to your LaunchDarkly dashboard
2. Navigate to your project
3. Click on "Feature flags" in the left sidebar
4. Click "Create flag" button
5. Fill in the flag details:
   - **Name**: Show Upload Heading
   - **Key**: `showUploadHeading`
   - **Description**: Controls visibility of the "Upload a receipt" heading on the upload page
   - **Flag type**: Boolean
   - **Variations**:
     - `true` - Show the heading (default)
     - `false` - Hide the heading
6. Click "Save flag"

## Step 2: Configure the Flag

1. Select your environment (e.g., Production, Development)
2. Turn the flag **ON**
3. Set the default rule to serve `true` to all users
4. Click "Review and save"

## Step 3: Configure the UI Application

1. Get your **client-side ID** from LaunchDarkly:
   - Go to Account Settings → Projects → [Your Project]
   - Select your environment
   - Copy the "Client-side ID" (not the SDK key)

2. Set the environment variable in your UI application:
   ```bash
   # In ui/.env.local
   VITE_LAUNCHDARKLY_CLIENT_ID=your-client-side-id-here
   ```

3. Restart your development server if it's running

## Step 4: Test the Feature Flag

1. Start the UI application:
   ```bash
   cd ui
   npm run dev
   ```

2. Open the application in your browser (usually http://localhost:5173)

3. You should see the "Upload a receipt" heading on the upload page

4. In LaunchDarkly, toggle the flag to `false` and refresh the page
   - The heading should disappear

5. Toggle it back to `true` and refresh
   - The heading should reappear

## Targeting Rules (Optional)

You can create targeting rules to show/hide the heading for specific users or segments:

1. In the flag configuration, click "Add rule"
2. Define your targeting criteria (e.g., by user key, custom attributes, segments)
3. Set the variation to serve for matching users
4. Save your changes

## Rollout Strategy (Optional)

For a gradual rollout:

1. In the flag configuration, use the percentage rollout feature
2. Set a percentage of users to receive `true` (show heading)
3. Gradually increase the percentage as you gain confidence
4. Monitor user behavior and feedback

## Troubleshooting

### Flag not working

- Verify `VITE_LAUNCHDARKLY_CLIENT_ID` is set correctly
- Check browser console for LaunchDarkly initialization errors
- Ensure the flag key matches exactly: `showUploadHeading`
- Verify the flag is turned ON in your environment

### Default behavior

If LaunchDarkly is not configured or fails to initialize, the application will default to showing the heading (`true`). This ensures the application remains functional even without LaunchDarkly.

## Additional Resources

- [LaunchDarkly React SDK Documentation](https://docs.launchdarkly.com/sdk/client-side/react/react-web)
- [Feature Flag Best Practices](https://docs.launchdarkly.com/guides/flags/flag-best-practices)
