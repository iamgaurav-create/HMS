
"use client";

import { payPharmacyBillAction } from "@/lib/actions/pharmacy/billing.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Wallet, Loader2 } from "lucide-react";

import { ToWords } from "to-words";

const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});

type Props = {
  billId: string;
  balance: number;
};

type PaymentMethod = "CASH" | "CARD" | "ONLINE";

export default function PaymentForm({ billId, balance }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);

  const numericAmount = Number(amount);
  const isValidAmount =
    amount.trim() !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= balance;

  async function handlePayment() {
    if (!isValidAmount) {
      toast.error(
        numericAmount > balance
          ? "Payment cannot exceed balance"
          : "Enter a valid payment amount"
      );
      return;
    }

    if (method !== "CASH" && !transactionId.trim()) {
      toast.error("Enter the transaction ID");
      return;
    }

    try {
      setLoading(true);

      const result = await payPharmacyBillAction({
        billId,
        amount: numericAmount,
        method,
        transactionId: transactionId.trim() || undefined,
      });

      if (result.status === "PAID") {
        toast.success("Payment completed successfully");
      } else {
        toast.success("Partial payment recorded successfully");
      }

      setTransactionId("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Payment failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (balance <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle2 className="h-6 w-6 shrink-0" />
        <div>
          <h2 className="font-semibold">Payment Completed</h2>
          <p className="mt-1 text-sm">
            This bill has no outstanding balance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Collect Payment</h2>
            <p className="text-sm text-muted-foreground">
              Record payment for this pharmacy bill
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground">
            Outstanding Balance
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            ₹
            {balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Amount in Words: {toWords.convert(balance, { currency: true })}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <label
            htmlFor="payment-amount"
            className="text-sm font-medium"
          >
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <input
              id="payment-amount"
              type="number"
              min="0.01"
              max={balance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              required
              placeholder="Enter amount"
              className="w-full rounded-xl border bg-background py-3 pl-8 pr-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Maximum ₹{balance.toFixed(2)}</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => setAmount(balance.toFixed(2))}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              Pay full balance
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { value: "CASH", label: "Cash" },
              { value: "CARD", label: "Card" },
              { value: "ONLINE", label: "Online / UPI" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={loading}
                onClick={() => setMethod(item.value as PaymentMethod)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  method === item.value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {item.value === "CASH" ? (
                  <Wallet className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {method !== "CASH" && (
          <div className="space-y-2">
            <label
              htmlFor="transaction-id"
              className="text-sm font-medium"
            >
              Transaction ID
            </label>
            <input
              id="transaction-id"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction or reference ID"
              disabled={loading}
              required
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Payment to record
            </span>
            <span className="font-semibold">
              ₹
              {(Number.isFinite(numericAmount) && numericAmount > 0
                ? numericAmount
                : 0
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Balance after payment
            </span>
            <span className="font-semibold">
              ₹
              {Math.max(
                0,
                balance -
                  (Number.isFinite(numericAmount) && numericAmount > 0
                    ? numericAmount
                    : 0)
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePayment}
          disabled={loading || !isValidAmount}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Record Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
