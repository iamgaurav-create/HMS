/**
 * The result sheets the laboratory supports out of the box. A template only
 * describes the parameters of a test, the specimen it is measured from and
 * the unit of every parameter.
 *
 * The reference ranges are deliberately empty here: a range is clinical
 * guidance and has to be configured by the laboratory in the test catalog
 * (`LabTestTemplate`) so it always follows the validated policy of the
 * hospital.
 */
export type LabParameterDefinition = {
  name: string;
  unit: string;
  referenceRange: string;
};

export type LabTestTemplate = {
  title: string;
  specimen: string;
  parameters: LabParameterDefinition[];
};

/**
 * The flags a result parameter can carry.
 */
export const LAB_RESULT_FLAGS = ["Normal", "Abnormal", "Critical"] as const;

export type LabResultFlag = (typeof LAB_RESULT_FLAGS)[number];

const genericParameter = (
  name: string,
  unit = ""
): LabParameterDefinition => ({
  name,
  unit,
  referenceRange: "",
});

export const LAB_TEST_TEMPLATES: Record<string, LabTestTemplate> = {
  cbc: {
    title: "Complete Blood Count (CBC)",
    specimen: "Whole blood (EDTA)",
    parameters: [
      genericParameter("Hemoglobin", "g/dL"),
      genericParameter("RBC count", "10^6/µL"),
      genericParameter("WBC count", "cells/µL"),
      genericParameter("Hematocrit", "%"),
      genericParameter("MCV", "fL"),
      genericParameter("MCH", "pg"),
      genericParameter("MCHC", "g/dL"),
      genericParameter("Platelet count", "cells/µL"),
      genericParameter("Neutrophils", "%"),
      genericParameter("Lymphocytes", "%"),
      genericParameter("Monocytes", "%"),
      genericParameter("Eosinophils", "%"),
      genericParameter("Basophils", "%"),
    ],
  },
  glucose: {
    title: "Blood Glucose",
    specimen: "Serum or plasma",
    parameters: [genericParameter("Glucose", "mg/dL")],
  },
  renal: {
    title: "Renal Function Test",
    specimen: "Serum",
    parameters: [
      genericParameter("Urea", "mg/dL"),
      genericParameter("Creatinine", "mg/dL"),
      genericParameter("Uric acid", "mg/dL"),
    ],
  },
  liver: {
    title: "Liver Function Test",
    specimen: "Serum",
    parameters: [
      genericParameter("Total bilirubin", "mg/dL"),
      genericParameter("Direct bilirubin", "mg/dL"),
      genericParameter("ALT / SGPT", "U/L"),
      genericParameter("AST / SGOT", "U/L"),
      genericParameter("Alkaline phosphatase", "U/L"),
      genericParameter("Total protein", "g/dL"),
      genericParameter("Albumin", "g/dL"),
    ],
  },
  thyroid: {
    title: "Thyroid Profile",
    specimen: "Serum",
    parameters: [
      genericParameter("TSH", "mIU/L"),
      genericParameter("Total T3", "ng/dL"),
      genericParameter("Total T4", "µg/dL"),
    ],
  },
  urine: {
    title: "Urine Routine Examination",
    specimen: "Urine",
    parameters: [
      genericParameter("Color"),
      genericParameter("Appearance"),
      genericParameter("Specific gravity"),
      genericParameter("pH"),
      genericParameter("Protein"),
      genericParameter("Glucose"),
      genericParameter("Ketones"),
      genericParameter("Blood"),
      genericParameter("Pus cells", "/HPF"),
      genericParameter("RBCs", "/HPF"),
      genericParameter("Epithelial cells", "/HPF"),
      genericParameter("Casts / crystals"),
    ],
  },
};

/**
 * The key of the template that matches a service name.
 */
export function resolveTemplateKey(serviceName: string): string {
  const name = serviceName.toLowerCase();

  if (name.includes("cbc") || name.includes("complete blood count")) {
    return "cbc";
  }

  if (name.includes("glucose") || name.includes("blood sugar")) {
    return "glucose";
  }

  if (name.includes("renal") || name.includes("kidney")) {
    return "renal";
  }

  if (name.includes("liver") || name.includes("lft")) {
    return "liver";
  }

  if (name.includes("thyroid") || name.includes("tft")) {
    return "thyroid";
  }

  if (name.includes("urine") || name.includes("urinalysis")) {
    return "urine";
  }

  return "generic";
}

/**
 * The template of a laboratory service.
 */
export function getLabTestTemplate(
  serviceName: string
): LabTestTemplate {
  const template = LAB_TEST_TEMPLATES[resolveTemplateKey(serviceName)];

  if (template) {
    return template;
  }

  return {
    title: serviceName,
    specimen: "Specify specimen",
    parameters: [genericParameter("Result")],
  };
}

/**
 * The template keys the laboratory can pick from in the test catalog.
 */
export const LAB_TEMPLATE_KEYS = Object.keys(LAB_TEST_TEMPLATES);
