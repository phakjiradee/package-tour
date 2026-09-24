/**
 * Date / Time helper for database timestamps
 *
 * NOTE: The database already stores timestamps in Thailand (+7) local time.
 * When serialized to JSON, timestamps often contain 'Z' (e.g. "2026-09-25T00:49:43.824Z"),
 * which causes browser `new Date()` to treat it as UTC and add +7 hours AGAIN.
 *
 * These helpers parse the exact stored values without adding +7 again.
 */

export function parseDbDateParts(dateStr) {
  if (!dateStr) return null;

  if (typeof dateStr === "string") {
    // Matches "YYYY-MM-DD[T ]HH:mm:ss"
    const match = dateStr.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: match[2],
        day: match[3],
        hours: match[4] || "00",
        minutes: match[5] || "00",
        seconds: match[6] || "00",
      };
    }
  }

  // Fallback for Date objects: read UTC values so no local timezone offset is added
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  return {
    year: d.getUTCFullYear(),
    month: String(d.getUTCMonth() + 1).padStart(2, "0"),
    day: String(d.getUTCDate()).padStart(2, "0"),
    hours: String(d.getUTCHours()).padStart(2, "0"),
    minutes: String(d.getUTCMinutes()).padStart(2, "0"),
    seconds: String(d.getUTCSeconds()).padStart(2, "0"),
  };
}

/**
 * Format to Thai DateTime: DD/MM/BBBB HH:mm (e.g. 25/09/2569 00:49)
 */
export function formatThaiDateTime(dateStr) {
  const parts = parseDbDateParts(dateStr);
  if (!parts) return "-";
  const thaiYear = parts.year + 543;
  return `${parts.day}/${parts.month}/${thaiYear} ${parts.hours}:${parts.minutes}`;
}

/**
 * Format to Thai Date only: DD/MM/BBBB (e.g. 25/09/2569)
 */
export function formatThaiDate(dateStr) {
  const parts = parseDbDateParts(dateStr);
  if (!parts) return "-";
  const thaiYear = parts.year + 543;
  return `${parts.day}/${parts.month}/${thaiYear}`;
}

/**
 * Format to Time only: HH:mm (e.g. 00:49)
 */
export function formatThaiTime(dateStr) {
  const parts = parseDbDateParts(dateStr);
  if (!parts) return "-";
  return `${parts.hours}:${parts.minutes}`;
}

export default formatThaiDateTime;
