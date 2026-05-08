import { LDProvider } from "launchdarkly-react-client-sdk";
import { getLaunchDarklyContext } from "../ld/launchDarklyContext.js";

/**
 * Wraps the app with LaunchDarkly when `VITE_LAUNCHDARKLY_CLIENT_SIDE_ID` is set.
 * Without it, children render unchanged (use `useFlags` only behind a configured client ID).
 */
export default function LaunchDarklyProvider({ children }) {
  const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_SIDE_ID;

  if (!clientSideID) {
    if (import.meta.env.DEV) {
      console.warn(
        "[LaunchDarkly] Set VITE_LAUNCHDARKLY_CLIENT_SIDE_ID in .env to enable the client SDK.",
      );
    }
    return children;
  }

  return (
    <LDProvider
      clientSideID={clientSideID}
      context={getLaunchDarklyContext()}
      timeout={10}
    >
      {children}
    </LDProvider>
  );
}
