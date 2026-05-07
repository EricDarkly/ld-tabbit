import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";
import "./index.css";
import App from "./App.jsx";
import { ldClientId, defaultContext } from "./ldConfig.js";

// Initialize LaunchDarkly asynchronously
(async () => {
  let LDProvider;
  
  // Only initialize LaunchDarkly if client ID is provided
  if (ldClientId) {
    try {
      LDProvider = await asyncWithLDProvider({
        clientSideID: ldClientId,
        context: defaultContext,
        options: {
          // Bootstrap from localStorage for faster initial load
          bootstrap: 'localStorage',
        },
      });
    } catch (error) {
      console.error('Failed to initialize LaunchDarkly:', error);
    }
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        {LDProvider ? (
          <LDProvider>
            <App />
          </LDProvider>
        ) : (
          <App />
        )}
      </BrowserRouter>
    </StrictMode>,
  );
})();
