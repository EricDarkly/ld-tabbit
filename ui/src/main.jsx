import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";
import "./index.css";
import App from "./App.jsx";

const ldClientSideId = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID || "";

(async () => {
  let LDProvider;

  if (ldClientSideId) {
    LDProvider = await asyncWithLDProvider({
      clientSideID: ldClientSideId,
      context: {
        kind: "user",
        key: "anonymous-user",
        anonymous: true,
      },
      options: {
        bootstrap: "localStorage",
      },
    });
  } else {
    console.warn(
      "VITE_LAUNCHDARKLY_CLIENT_ID is not set. Feature flags will not be available.",
    );
    // Fallback provider that returns empty flags
    LDProvider = ({ children }) => children;
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <LDProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LDProvider>
    </StrictMode>,
  );
})();
