import { MAX_RATING_COMMENT_LENGTH, type AppRatingInsert } from "@/lib/feedback/rating-record";

/**
 * Reads a CSV downloaded from the old ratings Google Sheet (File > Download >
 * Comma-separated values) into rows for the `app_ratings` table. Used by Admin >
 * Ratings' "Import from the old sheet", once, so the ratings gathered before the
 * database existed are not lost.
 *
 * The sheet's columns are the ones submitAppRatingAction used to send, after a
 * leading timestamp: date, rating, comment, lesson id, mode, locale, user type,
 * anonymous browser id. The sheet never kept an account id or an email, so
 * imported rows can be listed, filtered and shown on the site but not answered.
 */

/** RFC 4180: quoted fields may hold commas, quotes ("" is one quote) and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * "09/10/2026 20:42:55" (day/month/year, as the sheet shows it) to an ISO
 * instant. The sheet doesn't say which time zone it shows, so the caller says
 * (`utcOffset`, like "+03:00"). Null when the text isn't a real date.
 */
export function parseSheetTimestamp(text: string, utcOffset: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    text.trim(),
  );
  if (!match || !/^[+-]\d{2}:\d{2}$/.test(utcOffset)) return null;

  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const pad = (value: string) => value.padStart(2, "0");
  const iso = `${year}-${pad(month!)}-${pad(day!)}T${pad(hour)}:${pad(minute)}:${pad(second)}${utcOffset}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  // new Date() rolls 31/02 over to March; the day must come back unchanged.
  const local = new Date(`${year}-${pad(month!)}-${pad(day!)}T00:00:00Z`);
  if (local.getUTCDate() !== Number(day)) return null;
  return date.toISOString();
}

export interface SheetImportResult {
  records: AppRatingInsert[];
  skipped: { line: number; reason: string }[];
}

/** Maps the CSV's rows to table rows; a row that can't be trusted is skipped with its line number, never guessed at. */
export function rowsToRatings(rows: string[][], utcOffset: string): SheetImportResult {
  const records: AppRatingInsert[] = [];
  const skipped: SheetImportResult["skipped"] = [];

  rows.forEach((row, index) => {
    const line = index + 1;
    const [
      when = "",
      stars = "",
      comment = "",
      lessonId = "",
      mode = "",
      locale = "",
      userType = "",
      anonId = "",
    ] = row.map((cell) => cell.trim());

    // The header row (if the sheet has one): its "rating" cell isn't a number.
    if (index === 0 && !/^\d+(\.\d+)?$/.test(stars)) return;

    const rating = Math.round(Number(stars));
    if (!(rating >= 1 && rating <= 5)) {
      skipped.push({ line, reason: `rating "${stars}" is not 1 to 5` });
      return;
    }
    const createdAt = parseSheetTimestamp(when, utcOffset);
    if (!createdAt) {
      skipped.push({ line, reason: `date "${when}" is not day/month/year` });
      return;
    }

    records.push({
      rating,
      comment: comment.slice(0, MAX_RATING_COMMENT_LENGTH),
      lesson_id: lessonId.slice(0, 100),
      mode: mode.slice(0, 40),
      locale: (locale || "en").slice(0, 10),
      user_type: userType.toLowerCase() === "member" ? "member" : "guest",
      anon_id: anonId.slice(0, 100),
      // Already seen on the sheet: they shouldn't light up the "new" badge.
      status: "read",
      created_at: createdAt,
      updated_at: createdAt,
    });
  });

  return { records, skipped };
}

/** What identifies a rating: the browser that gave it and the exact moment. Two imports of the same sheet agree on it. */
export function ratingKey(anonId: string | undefined, createdAt: string | undefined): string {
  return `${anonId ?? ""}|${new Date(createdAt ?? 0).toISOString()}`;
}

/**
 * Keeps only the ratings whose key isn't already in `existingKeys`, so importing
 * the same sheet twice adds nothing the second time. A rating repeated inside
 * the file itself counts once too.
 */
export function filterNewRatings(
  records: readonly AppRatingInsert[],
  existingKeys: ReadonlySet<string>,
): AppRatingInsert[] {
  const seen = new Set(existingKeys);
  return records.filter((record) => {
    const key = ratingKey(record.anon_id, record.created_at);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
