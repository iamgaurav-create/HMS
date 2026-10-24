"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FlaskConical, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ServiceItem = {
  id: number;
  service_name: string;
  description: string;
  price: number;
};

export function TestCatalogTable({
  services,
}: {
  services: ServiceItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;
    return services.filter(
      (service) =>
        service.service_name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query),
    );
  }, [services, searchQuery]);

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <FlaskConical size={17} />
            Laboratory Management
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight  text-gray-900 sm:text-3xl ">
            Test Catalog
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage laboratory test services and their prices.
          </p>
        </div>

        <Link
          href="/lab/catalog/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Test
        </Link>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-gray-900">
              Laboratory Services
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredServices.length} service{
                filteredServices.length === 1 ? "" : "s"
              } found
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-400 w-full sm:w-80">
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
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <FlaskConical size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              No test services found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery
                ? "Try changing your search query."
                : "Add your first laboratory test to get started."}
            </p>
            {!searchQuery && (
              <Link
                href="/lab/catalog/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Add First Test
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Test Name</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Price</th>
                  <th className="px-5 py-4 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {service.service_name}
                    </td>
                    <td className="max-w-sm px-5 py-4 text-gray-500">
                      <span className="line-clamp-2">
                        {service.description}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {service.price.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        View
                        <ArrowUpRight size={15} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
