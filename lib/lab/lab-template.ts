import {
  getLabTestTemplate,
  LAB_TEST_TEMPLATES,
  resolveTemplateKey,
  type LabTestTemplate,
} from "./lab-test-templates";
import { labTemplateParameterSchema } from "./lab-validation";

export type StoredLabTemplate = {
  template_key: string;
  specimen: string | null;
  parameters: unknown;
};

/**
 * Reads the parameters of a stored result sheet. Broken data never stops the
 * laboratory, the built in template is used instead.
 */
export function normalizeTemplateParameters(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const parameters: LabTestTemplate["parameters"] = [];

  for (const entry of value) {
    const parsed = labTemplateParameterSchema.safeParse(entry);

    if (!parsed.success) {
      continue;
    }

    parameters.push({
      name: parsed.data.name,
      unit: parsed.data.unit,
      referenceRange: parsed.data.referenceRange,
    });
  }

  return parameters;
}

/**
 * The result sheet of a laboratory service.
 *
 * The sheet the laboratory configured in the test catalog wins, because it
 * holds the reference ranges the hospital validated. A service without a
 * configured sheet falls back to the built in template, which only holds the
 * parameters and their unit.
 */
export function resolveLabTemplate(
  serviceName: string,
  storedTemplate?: StoredLabTemplate | null
): LabTestTemplate {
  const fallback = getLabTestTemplate(serviceName);

  if (!storedTemplate) {
    return fallback;
  }

  const parameters = normalizeTemplateParameters(storedTemplate.parameters);

  if (parameters.length === 0) {
    return fallback;
  }

  return {
    title: serviceName,
    specimen: storedTemplate.specimen?.trim() || fallback.specimen,
    parameters,
  };
}

/**
 * The templates the laboratory can pick from when a new test is added to the
 * catalog.
 */
export function listLabTemplateOptions() {
  return Object.entries(LAB_TEST_TEMPLATES).map(([key, template]) => ({
    key,
    title: template.title,
    specimen: template.specimen,
    parameters: template.parameters,
  }));
}

/**
 * The key of the built in template that matches a service name.
 */
export { resolveTemplateKey };
