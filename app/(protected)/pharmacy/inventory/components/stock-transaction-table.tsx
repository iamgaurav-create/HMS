"use client";

import { useMemo, useState } from "react";

type TransactionRow = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_by: string;
  created_at: Date | string;
  medicine: {
    name: string;
  };
  batch: {
    batch_number: string;
  };
  staff: {
    name: string | null;
  }
};

type Props = {
  transactions: TransactionRow[];
};

const PAGE_SIZE = 10;

export default function StockTransactionTable({ transactions }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return transactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [transactions, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(transactions.length / PAGE_SIZE)
  );

  const totalItems = transactions.length;
  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold"> Stock Transiction History</h2>
        <p className="mt-1 text-sm  text-muted-foreground">
          Recent stock changes, reasons, and staff records
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Medicine</th>
              <th className="px-5 py-3 font-medium">Batch</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Quantity</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Staff ID</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-shadow-muted-foreground"
                >
                  No Stock transiction found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transactions) => (
                <tr key={transactions.id}>
                  <td className="whitespace-nowrap px-5 py-4">
                    {new Date(transactions.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {transactions.medicine.name}
                  </td>
                  <td className="px-5 py-4">
                    {transactions.batch.batch_number}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {transactions.type}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-4 font-semibold ${
                      transactions.type === "ADJUSTMENT" &&
                      transactions.quantity < 0
                        ? "text-red-600"
                        : "text-foreground"
                    }`}
                  >
                    {transactions.quantity > 0 ? "+" : ""}
                    {transactions.quantity}
                  </td>
                  <td className="max-w-xs px-5 py-4">
                    <span className="break-words">
                      {transactions.reason || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">{transactions.staff?.name || transactions.created_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startItem} to {endItem} of {totalItems} transactions
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                    page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
