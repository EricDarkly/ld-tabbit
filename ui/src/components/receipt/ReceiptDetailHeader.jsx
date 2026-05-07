import { Link } from "react-router-dom";

export function ReceiptDetailHeader({ merchantName, createdAt }) {
  return (
    <>
      <p className="mb-4">
        <Link to="/" className="link link-hover link-primary text-sm">
          ← Upload
        </Link>
      </p>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        {merchantName || "Receipt"}
      </h1>
      <p className="text-base-content/70 mb-6 text-sm">{createdAt}</p>
    </>
  );
}
