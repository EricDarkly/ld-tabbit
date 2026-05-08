import { useState } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api.js";

export default function ReceiptUploadPage() {
  const navigate = useNavigate();
  const flags = useFlags();
  const showHeroFlag = Boolean(flags.heroFlag ?? flags["hero-flag"]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a receipt image first.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Upload failed (${res.status})`);
        return;
      }
      const receiptSlug = data.slug;
      if (receiptSlug == null) {
        setError(
          "Upload succeeded but the server did not return a receipt slug.",
        );
        return;
      }
      setFile(null);
      const input = document.getElementById("receipt-input");
      if (input) input.value = "";
      navigate(`/receipts/${receiptSlug}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error — is the API running?",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-5 py-10 text-left">
      <header className="mb-4 text-center">
        <h1 className="mb-4 text-center text-5xl font-semibold tracking-tight">
          Tabbit
        </h1>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">
          Split the tab without the spreadsheet
        </h2>
        <p className="text-base-content/80 mx-auto max-w-md text-base leading-relaxed">
          Tabbit reads a photo of your receipt, pulls out line items and totals,
          and gives you a link everyone can use. Each person says what they had
          in plain language; we map it to the bill so you can settle up fairly.
        </p>
      </header>

      {showHeroFlag ? (
        <h2 className="mb-3 text-center text-lg font-semibold text-base-content/90">
          Upload a receipt
        </h2>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="card border-base-300 bg-base-100 border shadow-md">
          <div className="card-body gap-4">
            <div className="form-control w-full">
              <label className="label px-0 pt-0" htmlFor="receipt-input">
                <span className="label-text font-medium">Receipt image</span>
              </label>
              <input
                id="receipt-input"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="file-input file-input-bordered w-full"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
                disabled={uploading}
              />
            </div>

            <div className="form-control w-full">
              <label className="label px-0 pt-0" htmlFor="split-party-size">
                <span className="label-text font-medium">
                  Split between how many people?
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary w-full"
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Uploading…
                </>
              ) : (
                "Upload receipt"
              )}
            </button>

            {error ? (
              <div role="alert" className="alert alert-error text-sm">
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
