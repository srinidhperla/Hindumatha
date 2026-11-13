import readXlsxFile from "read-excel-file";

/* Reads a PhonePe Business transaction export (Excel .xlsx or CSV).
 *
 * The exact column names in the export are not assumed. The header row is
 * found by looking for a row that has an "amount" column, each column we need
 * is guessed from its heading, and the screen shows those guesses in
 * drop-downs so they can be corrected before anything is used. */

const cellText = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

/** Returns the file as rows of cells (values kept as read: text, number, Date). */
export const readSheet = async (file) => {
  const name = String(file?.name || "").toLowerCase();

  if (name.endsWith(".xlsx")) {
    return readXlsxFile(file);
  }
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    // Drop the byte-order mark some exports start with.
    return parseCsv(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  }
  if (name.endsWith(".xls")) {
    throw new Error(
      "This is an old-format .xls file. In Excel choose Save As → .xlsx or .csv, then import that.",
    );
  }
  throw new Error("Please choose an Excel (.xlsx) or CSV file.");
};

const findColumn = (headers, patterns) => {
  for (const pattern of patterns) {
    const index = headers.findIndex((header) => pattern.test(header));
    if (index >= 0) return index;
  }
  return -1;
};

/** Finds the header row and guesses which column is which. -1 = not found.
 *
 * Tuned for the PhonePe Business settlement export, whose columns are:
 *   PaymentType, MerchantReferenceId, PhonePeReferenceId, From, Instrument,
 *   CreationDate, TransactionDate, SettlementDate, BankReferenceNo, Amount, …
 * In that file one customer payment can appear on two rows with the same
 * PhonePeReferenceId — UPI plus a PhonePe gift voucher (EGV) — and the date
 * columns hold no clock time; the time is inside the PhonePe reference
 * (T + YYMMDDHHMMSS…). Other exports are matched by their headings. */
export const detectColumns = (rows) => {
  const headerIndex = rows.findIndex(
    (row) =>
      row.filter((cell) => cellText(cell)).length >= 2 &&
      row.some((cell) => /amount|amt/i.test(cellText(cell))),
  );
  if (headerIndex < 0) {
    return {
      headerIndex: -1,
      headers: [],
      amount: -1,
      time: -1,
      date: -1,
      reference: -1,
      status: -1,
      type: -1,
    };
  }

  const headers = rows[headerIndex].map(cellText);
  return {
    headerIndex,
    headers,
    amount: findColumn(headers, [
      /^(transaction |txn |total |paid |credit )?amount$/i,
      /^(transaction |txn |total |paid |credit )?amount/i,
      /amount|amt/i,
    ]),
    time: findColumn(headers, [/date.*time|time.*date/i, /^time$|txn time/i]),
    date: findColumn(headers, [
      /^transaction ?date$/i,
      /^creation ?date$/i,
      /^txn ?date$/i,
      /^date$/i,
    ]),
    reference: findColumn(headers, [
      /phonepe ?reference/i,
      /utr/i,
      /transaction id|txn id|transaction ref/i,
      /reference/i,
      /\bid\b/i,
    ]),
    status: findColumn(headers, [/status/i]),
    // Rows like "REFUND" or "REVERSAL" are not sales.
    type: findColumn(headers, [/payment ?type|transaction ?type|^type$/i]),
  };
};

export const parseAmount = (value) => {
  if (typeof value === "number") return value;
  const cleaned = cellText(value).replace(/[^0-9.-]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
};

const pad = (value) => String(value).padStart(2, "0");

/** "HH:MM" (24h) from a Date cell or any text that contains a clock time. */
export const parseTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Excel dates are read as UTC wall-clock values.
    return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
  }
  const match = cellText(value).match(
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?/i,
  );
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = (match[3] || "").toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return "";
  return `${pad(hours)}:${pad(minutes)}`;
};

/** "YYYY-MM-DD" from a Date cell, "10-11-2026" / "10/11/2026" (day first, as
 * PhonePe India writes it) or "2026-11-10". */
export const parseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  const text = cellText(value);
  let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
  match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`;
  return "";
};

/** PhonePe references carry the payment time: T2611102133318… is
 * 2026-11-10 21:33. Returns { date, time } or null. */
export const timeFromPhonePeReference = (value) => {
  const match = cellText(value).match(/^T(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match;
  if (
    Number(month) > 12 ||
    Number(day) > 31 ||
    Number(hours) > 23 ||
    Number(minutes) > 59
  ) {
    return null;
  }
  return { date: `20${year}-${month}-${day}`, time: `${hours}:${minutes}` };
};

const SUCCESS_PATTERN = /success|complete|paid|settled|credit/i;
const NOT_A_SALE_PATTERN = /refund|reversal|chargeback|reverse/i;

/** Turns the data rows into transactions using the chosen columns.
 * Rows sharing a reference are one payment and are added together. */
export const buildTransactions = (
  rows,
  columns,
  { onlySuccessful = true } = {},
) => {
  if (columns.headerIndex < 0 || columns.amount < 0) {
    return { entries: [], skipped: 0, merged: 0, dates: [] };
  }

  const byReference = new Map();
  const entries = [];
  let skipped = 0;
  let merged = 0;

  rows.slice(columns.headerIndex + 1).forEach((row) => {
    if (!row || !row.some((cell) => cellText(cell))) return;

    const amount = parseAmount(row[columns.amount]);
    const status = columns.status >= 0 ? cellText(row[columns.status]) : "";
    const type = columns.type >= 0 ? cellText(row[columns.type]) : "";

    if (!(amount > 0)) {
      skipped += 1;
      return;
    }
    if (type && NOT_A_SALE_PATTERN.test(type)) {
      skipped += 1;
      return;
    }
    if (
      onlySuccessful &&
      columns.status >= 0 &&
      !SUCCESS_PATTERN.test(status)
    ) {
      skipped += 1;
      return;
    }

    const reference =
      columns.reference >= 0
        ? cellText(row[columns.reference]).slice(0, 80)
        : "";
    const fromReference = timeFromPhonePeReference(reference);
    const time =
      (columns.time >= 0 && parseTime(row[columns.time])) ||
      fromReference?.time ||
      "";
    const date =
      (columns.date >= 0 && parseDate(row[columns.date])) ||
      fromReference?.date ||
      "";

    const existing = reference ? byReference.get(reference) : null;
    if (existing) {
      // Same payment split over UPI and a gift voucher: one bill.
      existing.amount = Math.round((existing.amount + amount) * 100) / 100;
      existing.parts += 1;
      merged += 1;
      return;
    }

    const entry = {
      amount: Math.round(amount * 100) / 100,
      time,
      date,
      when: [date, time].filter(Boolean).join(" "),
      reference,
      status,
      parts: 1,
    };
    entries.push(entry);
    if (reference) byReference.set(reference, entry);
  });

  const dates = [
    ...new Set(entries.map((entry) => entry.date).filter(Boolean)),
  ].sort();
  return { entries, skipped, merged, dates };
};
