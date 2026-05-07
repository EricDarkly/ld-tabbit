// LaunchDarkly configuration
// The client-side ID should be set via environment variable
// For development, you can create a .env.local file with:
// VITE_LAUNCHDARKLY_CLIENT_ID=your-client-side-id

export const ldClientId = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID || '';

// Default user context for anonymous users
export const defaultContext = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true,
};
