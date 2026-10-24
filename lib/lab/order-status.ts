/**
 * Every status a laboratory order or a single laboratory test can hold.
 *
 * `Pending` -> `Sample Collected` -> `In Progress` -> `Under Review` ->
 * `Verified` -> `Released`.
 *
 * `Completed` is kept because results that were recorded before the review
 * workflow existed still carry it.
 */
export const LAB_ORDER_STATUSES = [
  "Pending",
  "Sample Collected",
  "In Progress",
  "Under Review",
  "Verified",
  "Released",
  "Completed",
  "Cancelled",
] as const;

/**
 * The status of a single laboratory test follows the same workflow.
 */
export const LAB_TEST_STATUSES = LAB_ORDER_STATUSES;

/**
 * The stages an order can be moved to by hand. The laboratory moves an order
 * from "Pending" to "Sample Collected" and from there to "In Progress". The
 * result itself is finished through the review, verification and release
 * workflow, so "Completed" is not a manual stage anymore.
 */
export const LAB_ORDER_STAGES = [
  "Pending",
  "Sample Collected",
  "In Progress",
] as const;

export type LabOrderStatus = (typeof LAB_ORDER_STATUSES)[number];
export type LabOrderStage = (typeof LAB_ORDER_STAGES)[number];
export type LabTestStatus = (typeof LAB_TEST_STATUSES)[number];

export function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

/**
 * The status an order shows. An order holds tests in different states, so the
 * order shows the state that still needs attention. The order is only
 * "Verified" or "Released" when every test of the order reached that state.
 */
export function resolveOrderStatus(statuses: string[]): string {
  const normalized = statuses.map(normalizeStatus);

  if (normalized.length === 0) {
    return "Pending";
  }

  if (normalized.every((status) => status === "cancelled")) {
    return "Cancelled";
  }

  const active = normalized.filter((status) => status !== "cancelled");

  if (active.length === 0) {
    return "Cancelled";
  }

  const finished = active.every(
    (status) =>
      status === "verified" || status === "released" || status === "completed"
  );

  if (finished) {
    if (active.every((status) => status === "released")) {
      return "Released";
    }

    if (active.every((status) => status === "completed")) {
      return "Completed";
    }

    return "Verified";
  }

  if (active.some((status) => status === "under review")) {
    return "Under Review";
  }

  if (
    active.some(
      (status) => status === "in progress" || status === "sample collected"
    )
  ) {
    return "In Progress";
  }

  if (active.some((status) => status === "pending")) {
    return "Pending";
  }

  return active[0] ?? "Pending";
}

/**
 * The stage an order is in. The order can only move forward when every test
 * of the order is ready for the next step, so the stage is derived from the
 * tests that are still outstanding.
 */
export function resolveOrderStage(statuses: string[]): string {
  return resolveOrderStatus(statuses);
}

/**
 * The statuses an order can move to from its current stage. An order that is
 * already finished, or that waits for the review workflow, cannot be moved
 * by hand.
 */
export function nextLabOrderStatuses(stage: string): string[] {
  switch (normalizeStatus(stage)) {
    case "pending":
      return ["Sample Collected", "Cancelled"];
    case "sample collected":
      return ["In Progress", "Cancelled"];
    case "in progress":
      return ["Cancelled"];
    default:
      return [];
  }
}

/**
 * The badge colour used for every status across the laboratory screens.
 */
export function labStatusVariant(
  status: string
): "success" | "warning" | "info" | "purple" | "destructive" | "secondary" | "default" {
  switch (normalizeStatus(status)) {
    case "completed":
      return "success";
    case "verified":
      return "success";
    case "released":
      return "default";
    case "cancelled":
      return "destructive";
    case "in progress":
      return "purple";
    case "sample collected":
      return "info";
    case "under review":
      return "warning";
    case "pending":
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * The button label for the next step of an order.
 */
export function labStatusActionLabel(status: string) {
  switch (normalizeStatus(status)) {
    case "sample collected":
      return "Collect sample";
    case "in progress":
      return "Start processing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancel";
    default:
      return status;
  }
}

/**
 * The statuses a test can still be worked on. A verified or a released test
 * is only changed through the audited amendment workflow.
 */
export function isEditableTestStatus(status: string): boolean {
  switch (normalizeStatus(status)) {
    case "pending":
    case "sample collected":
    case "in progress":
    case "under review":
      return true;
    default:
      return false;
  }
}

/**
 * The status a test moves to when the result of the test is stored.
 */
export const LAB_RESULT_ENTRY_STATUS = "In Progress";

/**
 * The status a test moves to when the result is handed over for review.
 */
export const LAB_REVIEW_STATUS = "Under Review";

/**
 * The status a test moves to after an authorised professional approved it.
 */
export const LAB_VERIFIED_STATUS = "Verified";

/**
 * The status a test moves to after the report of the order was released.
 */
export const LAB_RELEASED_STATUS = "Released";
