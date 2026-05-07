import crypto from "node:crypto";
import { db } from "./connection.js";

function numOrNull(value) {
  if (value == null) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    return value.trim() === "" ? null : value;
  }
  return String(value);
}

function splitPartySizeOrDefault(value) {
  const n = Number.parseInt(String(value ?? 1), 10);
  if (!Number.isInteger(n) || n < 1) {
    return 1;
  }
  return Math.min(n, 100);
}

export function insertReceiptUpload(
  storedFilename,
  originalFilename,
  mimetype,
  sizeBytes,
  itemization,
  splitPartySizeRaw,
) {
  const merchantName = strOrNull(itemization?.merchantName);
  const transactionDate = strOrNull(itemization?.transactionDate);
  const currency = strOrNull(itemization?.currency);
  const subtotal = numOrNull(itemization?.subtotal);
  const taxTotal = numOrNull(itemization?.taxTotal);
  const tipTotal = numOrNull(itemization?.tipTotal);
  const miscellaneousChargesTotal = numOrNull(
    itemization?.miscellaneousChargesTotal,
  );
  const total = numOrNull(itemization?.total);
  const grandTotal = numOrNull(itemization?.grandTotal);
  const splitPartySize = splitPartySizeOrDefault(splitPartySizeRaw);
  const visionErrorMessage =
    typeof itemization?.errorMessage === "string"
      ? strOrNull(itemization.errorMessage)
      : null;
  const slug = crypto.randomUUID();

  const stmt = db.prepare(
    `INSERT INTO receipt_uploads (
       slug, stored_filename, original_filename, mimetype, size_bytes,
       merchant_name, transaction_date, currency,
       subtotal, tax_total, tip_total, miscellaneous_charges_total, total, grand_total,
       split_party_size, vision_error_message
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, slug, created_at`,
  );
  const row = stmt.get(
    slug,
    storedFilename,
    originalFilename ?? null,
    mimetype,
    sizeBytes,
    merchantName,
    transactionDate,
    currency,
    subtotal,
    taxTotal,
    tipTotal,
    miscellaneousChargesTotal,
    total,
    grandTotal,
    splitPartySize,
    visionErrorMessage,
  );
  return row;
}

export function listReceiptUploads(limit) {
  const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const stmt = db.prepare(
    `SELECT id, slug, stored_filename, original_filename, mimetype, size_bytes,
            merchant_name, transaction_date, currency,
            subtotal, tax_total, tip_total, miscellaneous_charges_total, total, grand_total,
            split_party_size, vision_error_message, created_at
     FROM receipt_uploads
     ORDER BY id DESC
     LIMIT ?`,
  );
  return stmt.all(n);
}

export function getReceiptById(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) {
    return undefined;
  }
  const stmt = db.prepare(
    `SELECT id, slug, stored_filename, original_filename, mimetype, size_bytes,
              merchant_name, transaction_date, currency,
              subtotal, tax_total, tip_total, miscellaneous_charges_total, total, grand_total,
              split_party_size, vision_error_message, created_at
      FROM receipt_uploads
      WHERE id = ?`,
  );
  return stmt.get(n);
}

export function getReceiptBySlug(slug) {
  const stmt = db.prepare(
    `SELECT id, slug, stored_filename, original_filename, mimetype, size_bytes,
              merchant_name, transaction_date, currency,
              subtotal, tax_total, tip_total, miscellaneous_charges_total, total, grand_total,
              split_party_size, vision_error_message, created_at
       FROM receipt_uploads
       WHERE slug = ?`,
  );
  return stmt.get(slug);
}
