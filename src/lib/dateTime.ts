import { format } from "date-fns";

/**
 * Date/time inputs work in the user's local time ("2026-11-08T15:00"), but the database
 * stores absolute timestamps. Without converting, Postgres reads the local string as UTC
 * and times shift by the user's offset (e.g. +5:30 in India).
 */

/** Local "yyyy-MM-ddTHH:mm" for <input type="datetime-local"> style fields. */
export function toLocalInput(value: string | Date | null | undefined): string {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd'T'HH:mm");
}

/** Convert a local "yyyy-MM-ddTHH:mm" value to an ISO timestamp for saving. */
export function localInputToISO(value: string | null | undefined): string | null {
    if (!value) return null;
    const d = new Date(value); // parsed as local time
    return isNaN(d.getTime()) ? null : d.toISOString();
}
