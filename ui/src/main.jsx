import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";
import "./index.css";
import App from "./App.jsx";

const ldClientSideId = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID || "";

(async () => {
  const LDProvider = await asyncWithLDProvider({
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
