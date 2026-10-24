"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ShoppingBag,
  ReceiptText,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
  ShoppingCart,
  UserRound,
  CreditCard,
  Banknote,
  Smartphone,
  X,
} from "lucide-react";
import { createWalkInSale } from "@/lib/actions/pharmacy/walk-in-sales.actions";

type Batch = {
  id: string;
  batch_number: string;
  quantity: number;
  selling_price: number;
  expiry_date: string;
};

type Medicine = {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  unit: string;
  is_active: boolean;
  is_otc: boolean;
  batches: Batch[];
};

type CartItem = {
  batchId: string;
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  batchNumber: string;
  expiryDate: string;
  unit: string;
  unitPrice: number;
  available: number;
  quantity: number;
  discountPercentage: number;
};

type Props = {
  catalog: Medicine[];
};

type PaymentMethod = "CASH" | "CARD" | "ONLINE";

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function isAvailable(batch: Batch) {
  const expiry = new Date(batch.expiry_date);
  const today = new Date();

  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return batch.quantity > 0 && expiry >= today;
}

function formatExpiry(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:bg-muted";

const cardClass = "rounded-2xl border border-border bg-card shadow-sm";

export default function WalkInSaleForm({ catalog }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashTendered, setCashTendered] = useState("");
  const [pendingQty, setPendingQty] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const [billId, setBillId] = useState("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          catalog
            .filter((medicine) => medicine.category)
            .map((medicine) => medicine.category as string),
        ),
      ).sort(),
    [catalog],
  );

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return catalog.filter((medicine) => {
      const matchesCategory =
        categoryFilter === "ALL" || medicine.category === categoryFilter;

      const matchesSearch =
        !query ||
        [
          medicine.name,
          medicine.generic_name ?? "",
          medicine.category ?? "",
        ].some((value) => value.toLowerCase().includes(query));

      return (
        medicine.is_active &&
        matchesCategory &&
        matchesSearch &&
        medicine.batches.some(isAvailable)
      );
    });
  }, [catalog, search, categoryFilter]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const totalDiscount = cart.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity * (item.discountPercentage / 100),
    0,
  );

  const totalAmount = Math.max(0, subtotal - totalDiscount);
  const cashGiven = Number(cashTendered) || 0;
  const changeDue = Math.max(0, cashGiven - totalAmount);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addMedicineToCart(medicine: Medicine, requestedQty: number) {
    setError("");
    setBillId("");

    if (!Number.isInteger(requestedQty) || requestedQty < 1) {
      setError("Please enter a valid quantity.");
      return;
    }

    const batches = [...medicine.batches]
      .filter(isAvailable)
      .sort(
        (a, b) =>
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime(),
      );

    const totalAvailable = batches.reduce((sum, batch) => {
      const inCart =
        cart.find((item) => item.batchId === batch.id)?.quantity ?? 0;
      return sum + Math.max(0, batch.quantity - inCart);
    }, 0);

    if (requestedQty > totalAvailable) {
      setError(
        `Only ${totalAvailable} ${medicine.unit} of ${medicine.name} are available.`,
      );
      return;
    }

    let remaining = requestedQty;
    const additions: CartItem[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const existing = cart.find((item) => item.batchId === batch.id);
      const alreadyInCart = existing?.quantity ?? 0;
      const available = batch.quantity - alreadyInCart;
      const take = Math.min(remaining, available);

      if (take <= 0) continue;

      if (existing) {
        additions.push({
          ...existing,
          quantity: existing.quantity + take,
        });
      } else {
        additions.push({
          batchId: batch.id,
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.generic_name,
          batchNumber: batch.batch_number,
          expiryDate: batch.expiry_date,
          unit: medicine.unit,
          unitPrice: batch.selling_price,
          available: batch.quantity,
          quantity: take,
          discountPercentage: 0,
        });
      }

      remaining -= take;
    }

    setCart((current) => {
      const updated = [...current];

      for (const addition of additions) {
        const index = updated.findIndex(
          (item) => item.batchId === addition.batchId,
        );

        if (index >= 0) {
          updated[index] = addition;
        } else {
          updated.push(addition);
        }
      }

      return updated;
    });

    setPendingQty((current) => ({
      ...current,
      [medicine.id]: "",
    }));
  }

  function changeQuantity(batchId: string, quantity: number) {
    setError("");
    setBillId("");

    const item = cart.find((entry) => entry.batchId === batchId);
    if (!item) return;

    if (quantity <= 0) {
      setCart((current) =>
        current.filter((entry) => entry.batchId !== batchId),
      );
      return;
    }

    if (!Number.isInteger(quantity)) {
      setError("Quantity must be a whole number.");
      return;
    }

    if (quantity > item.available) {
      setError(
        `Only ${item.available} units are available for ${item.medicineName}, batch ${item.batchNumber}.`,
      );
      return;
    }

    setCart((current) =>
      current.map((entry) =>
        entry.batchId === batchId ? { ...entry, quantity } : entry,
      ),
    );
  }

  function updateDiscount(batchId: string, value: string) {
    if (value === "") {
      setCart((current) =>
        current.map((item) =>
          item.batchId === batchId ? { ...item, discountPercentage: 0 } : item,
        ),
      );
      return;
    }

    const discount = Number(value);

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.batchId === batchId
          ? { ...item, discountPercentage: discount }
          : item,
      ),
    );

    setBillId("");
  }

  function removeItem(batchId: string) {
    setCart((current) => current.filter((item) => item.batchId !== batchId));
    setError("");
    setBillId("");
  }

  function clearCart() {
    setCart([]);
    setError("");
    setBillId("");
    setCashTendered("");
  }

  function submitSale() {
    setError("");
    setBillId("");

    if (!customerName.trim()) {
      setError("Please enter the customer's name.");
      return;
    }

    if (customerPhone.trim() && !/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (cart.length === 0) {
      setError("Add at least one medicine to continue.");
      return;
    }

    if (totalAmount <= 0) {
      setError("The payable amount must be greater than zero.");
      return;
    }

    if (paymentMethod === "CASH" && cashGiven < totalAmount) {
      setError("Cash received must be at least the payable amount.");
      return;
    }

    const items = cart.map((item) => ({
      batchId: item.batchId,
      quantity: item.quantity,
      discountPercentage: item.discountPercentage,
    }));

    startTransition(async () => {
      try {
        const result = await createWalkInSale({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod,
          items,
        });

        setCart([]);
        setBillId(result.billId);
        setCashTendered("");
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to complete the sale.",
        );
      }
    });
  }

  return (
    <div className="min-h-screen space-y-6 bg-background p-3 sm:p-5 lg:p-6">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Package size={16} />
            Pharmacy / Walk-in Sales
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Counter Sales
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create an OTC sale, manage quantities, and generate a receipt.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-900/200" />
          Pharmacy inventory
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className={cardClass + " p-4"}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Available medicines
            </span>
            <Package className="text-primary" size={19} />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {
              catalog.filter(
                (medicine) =>
                  medicine.is_active && medicine.batches.some(isAvailable),
              ).length
            }
          </p>
          <p className="mt-1 text-xs text-muted-foreground">With valid stock</p>
        </div>

        <div className={cardClass + " p-4"}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cart items</span>
            <ShoppingCart className="text-primary" size={19} />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {cart.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalUnits} total units
          </p>
        </div>

        <div className={cardClass + " col-span-2 p-4 lg:col-span-1"}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Current payable
            </span>
            <ReceiptText className="text-emerald-600 dark:text-emerald-400" size={19} />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {money(totalAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            After applicable discounts
          </p>
        </div>
      </div>

<div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">        {/* Left: customer, catalog and cart */}
        <section className="min-w-0 space-y-5">
          {/* Customer details */}
          <div className={cardClass + " p-5"}>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 dark:bg-sky-900/30 p-2.5 text-sky-600 dark:text-sky-400">
                <UserRound size={20} />
              </div>
              <div>
<h2 className="font-semibold text-slate-900 dark:text-slate-100">
                   Customer information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the details for this counter sale.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Customer name <span className="text-red-500 dark:text-red-400">*</span>
                </span>
                <input
                  className={inputClass}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={120}
                  placeholder="Enter customer name"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mobile number{" "}
                  <span className="text-slate-400 dark:text-slate-500">(optional)</span>
                </span>
                <input
                  className={inputClass}
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                />
              </label>
            </div>
          </div>

          {/* Medicine catalog */}
          <div className={cardClass + " p-5"}>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  Medicine catalog
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Search medicines and add the required quantity.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                <CheckCircle2 size={14} />
                FIFO batch selection
              </span>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  className={inputClass + " pl-10"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicine, generic name..."
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="relative sm:w-52">
                <Filter
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <select
                  className={inputClass + " pl-9"}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter medicine category"
                >
                  <option value="ALL">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMedicines.map((medicine) => {
                const batches = medicine.batches.filter(isAvailable);
                const stock = batches.reduce(
                  (sum, batch) => sum + batch.quantity,
                  0,
                );

                const prices = batches.map((batch) => batch.selling_price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                return (
                  <div
                    key={medicine.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition hover:border-sky-200 dark:hover:border-sky-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                          <Package size={21} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {medicine.name}
                            </h3>
                            {medicine.is_otc && (
                              <span className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                OTC
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {medicine.generic_name ||
                              medicine.category ||
                              "General medicine"}
                            {" · "}
                            {medicine.unit}
                          </p>

                          <p className="mt-2 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Stock: </span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {stock} {medicine.unit}
                            </span>
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {minPrice === maxPrice
                              ? money(minPrice)
                              : `${money(minPrice)} – ${money(maxPrice)}`}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {" "}
                              / {medicine.unit}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={stock}
                          step={1}
                          value={pendingQty[medicine.id] ?? ""}
                          onChange={(e) =>
                            setPendingQty((current) => ({
                              ...current,
                              [medicine.id]: e.target.value,
                            }))
                          }
                          className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-center text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                          placeholder="Qty"
                          aria-label={`Quantity for ${medicine.name}`}
                        />

                        <button
                          type="button"
                          disabled={isPending || stock <= 0}
                          onClick={() =>
                            addMedicineToCart(
                              medicine,
                              Number(pendingQty[medicine.id] || 1),
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>

                    <details className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <summary className="cursor-pointer text-sm font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300">
                        View batches ({batches.length})
                      </summary>

                      <div className="mt-3 space-y-2">
                        {batches.map((batch) => (
                          <div
                            key={batch.id}
                            className="flex flex-col justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 sm:flex-row sm:items-center"
                          >
                            <div className="text-sm">
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                Batch: {batch.batch_number}
                              </p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                  Stock: {batch.quantity} {medicine.unit}
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar size={12} />
                                  Exp: {formatExpiry(batch.expiry_date)}
                                </span>
                              </p>
                              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                {money(batch.selling_price)} / {medicine.unit}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => addMedicineToCart(medicine, 1)}
                              className="rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 disabled:opacity-50"
                            >
                              + Add 1
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}

              {filteredMedicines.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-12 text-center">
                  <Package size={30} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    No available medicines found
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Try another search or category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className={cardClass + " p-5"}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Current sale</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Review quantities and discounts.
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Clear cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center">
                <ShoppingBag
                  size={30}
                  className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                />
                <p className="font-medium text-slate-700 dark:text-slate-300">Your cart is empty</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add medicines from the catalog to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  const lineDiscount =
                    lineTotal * (item.discountPercentage / 100);

                  return (
                    <div
                      key={item.batchId}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.medicineName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.genericName ? `${item.genericName} · ` : ""}
                            Batch: {item.batchNumber}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Expires {formatExpiry(item.expiryDate)}
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {money(item.unitPrice)} / {item.unit}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.batchId)}
                          aria-label={`Remove ${item.medicineName}`}
                          className="rounded-lg p-2 text-slate-400 dark:text-slate-500 transition hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(item.batchId, item.quantity - 1)
                              }
                              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>

                            <input
                              type="number"
                              min={1}
                              max={item.available}
                              value={item.quantity}
                              onChange={(e) => {
                                if (e.target.value === "") return;
                                changeQuantity(
                                  item.batchId,
                                  Number(e.target.value),
                                );
                              }}
                               className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-center text-sm font-semibold outline-none focus:border-sky-500"
                              aria-label={`Quantity for ${item.medicineName}`}
                            />

                            <button
                              type="button"
                              disabled={item.quantity >= item.available}
                              onClick={() =>
                                changeQuantity(item.batchId, item.quantity + 1)
                              }
                              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {item.unit}
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={item.discountPercentage}
                            onChange={(e) =>
                              updateDiscount(item.batchId, e.target.value)
                            }
                            className={inputClass}
                            aria-label={`Discount for ${item.medicineName}`}
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 sm:text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Line total</p>
                          <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                            {money(lineTotal - lineDiscount)}
                          </p>
                          {lineDiscount > 0 && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">
                              Saved {money(lineDiscount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right: Checkout */}
<aside
  className={`${cardClass} self-start xl:sticky xl:top-20 xl:z-30 p-5`}
>
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="rounded-xl bg-sky-50 dark:bg-sky-900/30 p-2.5 text-sky-600 dark:text-sky-400">
              <ReceiptText size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Checkout</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Review and complete the sale
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="mb-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Items ({totalUnits} units)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{cart.length}</span>
            </div>

            <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => {
                const lineTotal =
                  item.unitPrice *
                  item.quantity *
                  (1 - item.discountPercentage / 100);

                return (
                  <div
                    key={item.batchId}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {item.medicineName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.quantity} {item.unit} · Batch {item.batchNumber}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-slate-900 dark:text-slate-100">
                      {money(lineTotal)}
                    </span>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <p className="py-3 text-sm text-slate-400 dark:text-slate-500">
                  No medicines added yet.
                </p>
              )}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200">{money(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Discount</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                -{money(totalDiscount)}
              </span>
            </div>

            <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Net payable
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Amount to collect</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {money(totalAmount)}
              </p>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Payment method
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "CASH", label: "Cash", Icon: Banknote },
                  { value: "CARD", label: "Card", Icon: CreditCard },
                  { value: "ONLINE", label: "Online", Icon: Smartphone },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    paymentMethod === value
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 ring-2 ring-sky-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash calculator */}
          {paymentMethod === "CASH" && (
            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Cash received (₹)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="Enter amount received"
                  className={inputClass + " mt-2"}
                />
              </label>

              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Change to return</span>
                <span
                  className={`font-bold ${
                    cashGiven >= totalAmount
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {money(changeDue)}
                </span>
              </div>

              {cashTendered !== "" && cashGiven < totalAmount && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Cash received is less than the payable amount.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-400"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {billId && (
            <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={18} />
                Sale completed successfully
              </div>

              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your sale was submitted. Open the receipt to print it.
              </p>

              <Link
                href={`/pharmacy/walk-in-sales/receipt/${billId}`}
                 className="inline-flex items-center gap-2 font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300"
              >
                <ReceiptText size={16} />
                View / print receipt
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {/* Complete sale */}
          <button
            type="button"
            onClick={submitSale}
            disabled={isPending || cart.length === 0 || totalAmount <= 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing sale...
              </>
            ) : (
              <>
                <ReceiptText size={18} />
                Complete sale · {money(totalAmount)}
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Confirm quantities, discounts, and payment before completing the
            sale.
          </p>
        </aside>
      </div>
    </div>
  );
}
