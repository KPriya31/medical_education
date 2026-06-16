// Small shared helpers used across pages/components.
import { BOARD_ROLES } from "./data.js";

// Groups an array of objects by the given field name, e.g. groupByField(routes, "group").
export function groupByField(items, field) {
  return items.reduce((groups, item) => {
    const key = item[field] || "Other";
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

// "uploadedOn" -> "Uploaded On" (fallback label for keys not present in FIELD_LABELS)
export function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

// Builds a blank row object from a field-definition list, defaulting select fields
// to their first option and text fields to "".
export function emptyRowFromFields(fields) {
  return fields.reduce((row, [key, , options]) => {
    row[key] = options ? options[0] : "";
    return row;
  }, {});
}

// Ensures a row always has a status, defaulting to "Active".
export function withDefaultStatus(row) {
  return { ...row, status: row.status || "Active" };
}

// Generates a random 5-character captcha code.
export function randomCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Role-based permission checks used to gate the Verify/Approve row actions in DataTable.
export function canVerify(role) {
  return ["Board Verifier", "BOME", "BOEN", "Super Admin"].includes(role);
}

export function canApprove(role) {
  return ["Board Approver", "BOME", "BOEN", "Super Admin"].includes(role);
}

// Determines whether a workflow item's status should be visible for the given role
// (used to filter the Dashboard's workflow task queue).
export function isStatusVisibleForRole(status, role) {
  if (role === "Board Verifier") return ["Submitted", "Sent Back"].includes(status);
  if (role === "Board Approver") return ["Verified", "Submitted"].includes(status);
  if (BOARD_ROLES.includes(role)) {
    return ["Submitted", "Verified", "Sent Back"].includes(status);
  }
  return true;
}
