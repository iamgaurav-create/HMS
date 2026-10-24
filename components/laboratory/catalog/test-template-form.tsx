"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveLabTestTemplate } from "@/lib/actions/laboratory/catalog.action";
import {
  LAB_TEMPLATE_KEYS,
  LAB_TEST_TEMPLATES,
} from "@/lib/lab/lab-test-templates";
import { resolveTemplateKey } from "@/lib/lab/lab-template";
import { normalizeTemplateParameters } from "@/lib/lab/lab-template";

type Parameter = {
  name: string;
  unit: string;
  referenceRange: string;
};

export type TestTemplateFormProps = {
  service: {
    id: number;
    service_name: string;
  };
  template: {
    template_key: string;
    specimen: string | null;
    parameters: unknown;
  } | null;
};

/**
 * The result sheet of a laboratory service.
 *
 * The laboratory decides which parameters a test holds and which reference
 * range belongs to every parameter. The ranges are never taken from a
 * result, they are configured here and validated by the laboratory.
 */
export function TestTemplateForm({ service, template }: TestTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const storedParameters = useMemo(
    () => normalizeTemplateParameters(template?.parameters ?? null),
    [template]
  );

  const [templateKey, setTemplateKey] = useState(
    template?.template_key || resolveTemplateKey(service.service_name)
  );
  const [specimen, setSpecimen] = useState(
    template?.specimen ?? LAB_TEST_TEMPLATES[templateKey]?.specimen ?? ""
  );
  const [parameters, setParameters] = useState<Parameter[]>(
    storedParameters.length > 0
      ? storedParameters
      : (LAB_TEST_TEMPLATES[templateKey]?.parameters.map((parameter) => ({
          ...parameter,
        })) ?? [{ name: "Result", unit: "", referenceRange: "" }])
  );

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    setSpecimen(LAB_TEST_TEMPLATES[key]?.specimen ?? specimen);
    setParameters(
      LAB_TEST_TEMPLATES[key]?.parameters.map((parameter) => ({
        ...parameter,
      })) ?? [{ name: "Result", unit: "", referenceRange: "" }]
    );
  }

  function updateParameter(index: number, key: keyof Parameter, value: string) {
    setParameters((current) =>
      current.map((parameter, position) =>
        position === index ? { ...parameter, [key]: value } : parameter
      )
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveLabTestTemplate({
        serviceId: service.id,
        templateKey,
        specimen,
        parameters,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const inputClass =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5"
    >
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Result sheet of {service.service_name}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          The parameters and the reference ranges the laboratory uses for this
          test. Every result is entered against this sheet.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`template-key-${service.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Result sheet
          </label>
          <select
            id={`template-key-${service.id}`}
            value={templateKey}
            onChange={(event) => handleTemplateChange(event.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            {LAB_TEMPLATE_KEYS.map((key) => (
              <option key={key} value={key}>
                {LAB_TEST_TEMPLATES[key].title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`specimen-${service.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Specimen
          </label>
          <Input
            id={`specimen-${service.id}`}
            value={specimen}
            onChange={(event) => setSpecimen(event.target.value)}
            className={`${inputClass} mt-1.5`}
            placeholder="e.g. Serum"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Parameter</th>
              <th className="px-4 py-3 font-semibold">Unit</th>
              <th className="px-4 py-3 font-semibold">Reference range</th>
              <th className="px-4 py-3 text-right font-semibold">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {parameters.map((parameter, index) => (
              <tr key={`${index}-${parameter.name}`}>
                <td className="px-4 py-2">
                  <label className="sr-only" htmlFor={`parameter-name-${service.id}-${index}`}>
                    Parameter name
                  </label>
                  <Input
                    id={`parameter-name-${service.id}-${index}`}
                    value={parameter.name}
                    onChange={(event) =>
                      updateParameter(index, "name", event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </td>
                <td className="px-4 py-2">
                  <label className="sr-only" htmlFor={`parameter-unit-${service.id}-${index}`}>
                    Unit
                  </label>
                  <Input
                    id={`parameter-unit-${service.id}-${index}`}
                    value={parameter.unit}
                    onChange={(event) =>
                      updateParameter(index, "unit", event.target.value)
                    }
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-2">
                  <label
                    className="sr-only"
                    htmlFor={`parameter-range-${service.id}-${index}`}
                  >
                    Reference range
                  </label>
                  <Input
                    id={`parameter-range-${service.id}-${index}`}
                    value={parameter.referenceRange}
                    onChange={(event) =>
                      updateParameter(index, "referenceRange", event.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. 3.5 - 5.5"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setParameters((current) =>
                        current.filter((_, position) => position !== index)
                      )
                    }
                    className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    aria-label={`Remove ${parameter.name}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setParameters((current) => [
              ...current,
              { name: "", unit: "", referenceRange: "" },
            ])
          }
          className="h-9 gap-1.5"
        >
          <Plus size={15} />
          Add parameter
        </Button>

        <Button type="submit" disabled={isPending} className="h-9 gap-1.5">
          {isPending ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          Save result sheet
        </Button>

        <p className="text-xs text-slate-500">
          A range can hold a critical limit, for example
          &nbsp;<code>3.5 - 5.5; critical &lt; 2.8</code>.
        </p>
      </div>
    </form>
  );
}
