"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FlaskConical,
  ListChecks,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TestCatalogForm } from "@/components/laboratory/catalog/test-catalog-form";
import { TestTemplateForm } from "@/components/laboratory/catalog/test-template-form";
import { cn } from "@/lib/utils";

type ServiceItem = {
  id: number;
  service_name: string;
  description: string;
  price: number;
  labTemplate: {
    template_key: string;
    specimen: string | null;
    parameters: unknown;
  } | null;
};

export function CatalogClient({
  services,
  canAddTests,
}: {
  services: ServiceItem[];
  canAddTests: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateServiceId, setTemplateServiceId] = useState<number | null>(null);

  const filteredServices = services.filter(
    (service) =>
      service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Test Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage laboratory test services and their prices.
          </p>
        </div>
        {canAddTests && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Test
          </button>
        )}
      </div>

      {showForm && (
        <div className="w-full">
          <TestCatalogForm onCancel={() => setShowForm(false)} />
        </div>
      )}

      <section
        className={cn(
          "rounded-2xl border shadow-sm",
          "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
        )}
      >
        <div className="border-b border-gray-100 p-5 sm:flex sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Laboratory Services
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filteredServices.length} service{
                filteredServices.length === 1 ? "" : "s"
              } found
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-400 dark:text-slate-400 w-full sm:w-80">
            <Search size={16} />
            <Input
              type="search"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-transparent border-none focus:ring-0 focus-visible:ring-0 outline-none px-0 py-0 text-sm w-full"
            />
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
              <FlaskConical size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
              No test services found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Try changing your search query."
                : "Add your first laboratory test to get started."}
            </p>
            {!searchQuery && canAddTests && (
              <Link
                href="/lab/catalog/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus size={16} />
                Add First Test
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    Test Name
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    Price
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      {service.service_name}
                      {service.labTemplate ? (
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                          Result sheet: {service.labTemplate.template_key}
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-sm px-5 py-4 text-slate-500 dark:text-slate-400">
                      <span className="line-clamp-2">
                        {service.description}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {service.price.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {canAddTests ? (
                          <button
                            type="button"
                            onClick={() =>
                              setTemplateServiceId(
                                templateServiceId === service.id ? null : service.id
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                          >
                            <ListChecks size={14} />
                            Result sheet
                          </button>
                        ) : null}
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          View
                          <ArrowUpRight size={15} />
                        </span>
                      </div>

                      {templateServiceId === service.id ? (
                        <div className="mt-4">
                          <TestTemplateForm
                            service={{
                              id: service.id,
                              service_name: service.service_name,
                            }}
                            template={service.labTemplate}
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredServices.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 flex items-center justify-between px-5 py-3 text-[11px] text-slate-500 dark:text-slate-400">
            <p>
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredServices.length}</span>{" "}
              service{filteredServices.length === 1 ? "" : "s"}
            </p>
            <p>Hospital Management System</p>
          </div>
        )}
      </section>
    </div>
  );
}
