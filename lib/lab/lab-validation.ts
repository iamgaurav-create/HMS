import { z } from "zod";

import { LAB_RESULT_FLAGS, type LabResultFlag } from "./lab-test-templates";

/**
 * The flags a single result parameter can carry.
 */
export const labFlagSchema = z.enum(LAB_RESULT_FLAGS);

/**
 * One parameter of a laboratory test. The name and the unit are validated
 * against the template of the test, the flag is recalculated by the server
 * from the configured reference range.
 */
export const labParameterSchema = z.object({
  name: z.string().trim().min(1).max(150),
  value: z.string().trim().max(500),
  unit: z.string().trim().max(100),
  referenceRange: z.string().trim().max(200),
  flag: z.string().trim().max(40),
});

/**
 * Everything the result entry form sends for a single test.
 */
export const labResultEntrySchema = z.object({
  testId: z.coerce.number().int().positive(),
  sampleType: z.string().trim().min(1, "Enter the specimen type.").max(120),
  sampleId: z.string().trim().max(120),
  sampleCollectedAt: z.string().trim().max(60),
  sampleStatus: z.string().trim().max(40),
  notes: z.string().trim().max(2000),
  parameters: z.array(labParameterSchema).min(1).max(100),
});

export type LabParameterInput = z.infer<typeof labParameterSchema>;
export type LabResultEntryInput = z.infer<typeof labResultEntrySchema>;

/**
 * The sample information the laboratory can correct on a test.
 */
export const labSampleUpdateSchema = z.object({
  testId: z.coerce.number().int().positive(),
  sampleType: z.string().trim().min(1, "Enter the specimen type.").max(120),
  sampleId: z.string().trim().max(120),
  sampleCollectedAt: z.string().trim().max(60),
  sampleStatus: z.string().trim().max(40),
});

/**
 * A parameter of a configurable result sheet.
 */
export const labTemplateParameterSchema = z.object({
  name: z.string().trim().min(1).max(150),
  unit: z.string().trim().max(100),
  referenceRange: z.string().trim().max(200),
});

/**
 * The result sheet of a laboratory service.
 */
export const labTemplateSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  templateKey: z.string().trim().min(1).max(60),
  specimen: z.string().trim().max(120),
  parameters: z.array(labTemplateParameterSchema).min(1).max(100),
});

/**
 * The status of a sample.
 */
export const LAB_SAMPLE_STATUSES = [
  "Awaiting Collection",
  "Collected",
  "Received",
  "Rejected",
  "Processed",
] as const;

export type LabSampleStatus = (typeof LAB_SAMPLE_STATUSES)[number];

export function isLabSampleStatus(value: string): value is LabSampleStatus {
  return (LAB_SAMPLE_STATUSES as readonly string[]).includes(value);
}

/**
 * The flag of a parameter is never trusted from the browser. A flag that is
 * not one of the known flags falls back to "Normal".
 */
export function normalizeResultFlag(value: string | null | undefined): LabResultFlag {
  const candidate = (value ?? "").trim().toLowerCase();

  const match = LAB_RESULT_FLAGS.find(
    (flag) => flag.toLowerCase() === candidate
  );

  return match ?? "Normal";
}

export type ParsedReferenceRange = {
  kind: "numeric" | "qualitative" | "unknown";
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
};

const NUMERIC = String.raw`-?\d+(?:\.\d+)?`;

function parseNumber(value: string): number | null {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Reads a configured reference range.
 *
 * Supported notations:
 * - `3.5 - 5.5`     a numeric interval
 * - `< 40`          an upper limit
 * - `> 5`           a lower limit
 * - `Negative`      a qualitative range, the technician sets the flag
 *
 * Critical limits are appended to the range and separated by a semicolon:
 * `3.5 - 5.5; critical < 2.8; critical > 6.5`
 */
export function parseReferenceRange(range: string | null | undefined): ParsedReferenceRange {
  const text = (range ?? "").trim();

  if (!text) {
    return { kind: "unknown" };
  }

  const parts = text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const base = parts[0] ?? "";
  const result: ParsedReferenceRange = { kind: "unknown" };

  const interval = new RegExp(`^(${NUMERIC})\\s*(?:-|–|—|to)\\s*(${NUMERIC})$`, "i");
  const upper = new RegExp(`^<\\s*(${NUMERIC})$`);
  const lower = new RegExp(`^>\\s*(${NUMERIC})$`);

  const intervalMatch = base.match(interval);

  if (intervalMatch) {
    const min = parseNumber(intervalMatch[1]);
    const max = parseNumber(intervalMatch[2]);

    if (min !== null && max !== null) {
      result.kind = "numeric";
      result.min = min;
      result.max = max;
    }
  } else if (upper.test(base)) {
    const max = parseNumber(base.replace("<", ""));

    if (max !== null) {
      result.kind = "numeric";
      result.max = max;
    }
  } else if (lower.test(base)) {
    const min = parseNumber(base.replace(">", ""));

    if (min !== null) {
      result.kind = "numeric";
      result.min = min;
    }
  }

  for (const part of parts.slice(1)) {
    const criticalMatch = part.match(
      new RegExp(`^critical\\s*([<>])\\s*(${NUMERIC})$`, "i")
    );

    if (!criticalMatch) {
      continue;
    }

    const limit = parseNumber(criticalMatch[2]);

    if (limit === null) {
      continue;
    }

    if (criticalMatch[1] === "<") {
      result.criticalMin = limit;
    } else {
      result.criticalMax = limit;
    }
  }

  return result;
}

/**
 * The flag of a single result value.
 *
 * A numeric value is compared against the configured reference range of the
 * laboratory, a qualitative value keeps the flag the technician selected.
 */
export function evaluateResultFlag({
  value,
  referenceRange,
  submittedFlag,
}: {
  value: string;
  referenceRange: string;
  submittedFlag: string;
}): LabResultFlag {
  const range = parseReferenceRange(referenceRange);

  if (range.kind !== "numeric") {
    return normalizeResultFlag(submittedFlag);
  }

  const numeric = parseNumber(value);

  if (numeric === null) {
    return normalizeResultFlag(submittedFlag);
  }

  if (range.criticalMin !== undefined && numeric < range.criticalMin) {
    return "Critical";
  }

  if (range.criticalMax !== undefined && numeric > range.criticalMax) {
    return "Critical";
  }

  if (range.min !== undefined && numeric < range.min) {
    return "Abnormal";
  }

  if (range.max !== undefined && numeric > range.max) {
    return "Abnormal";
  }

  return "Normal";
}

/**
 * A short summary of a reference range, used in the result tables.
 */
export function describeReferenceRange(range: string | null | undefined) {
  const text = (range ?? "").trim();

  return text.length > 0 ? text : "Not configured";
}

/**
 * A parameter that was already stored on a test.
 */
export const labStoredParameterSchema = z.object({
  name: z.string().trim().min(1).max(150),
  value: z.string().max(500),
  unit: z.string().max(100),
  referenceRange: z.string().max(200),
  flag: z.string().max(40),
});

/**
 * Reads the parameters that were stored on a test. Broken data is skipped
 * instead of breaking the whole report.
 */
export function parseResultData(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const parameters: z.infer<typeof labStoredParameterSchema>[] = [];

  for (const entry of value) {
    const parsed = labStoredParameterSchema.safeParse(entry);

    if (!parsed.success) {
      continue;
    }

    parameters.push(parsed.data);
  }

  return parameters;
}
