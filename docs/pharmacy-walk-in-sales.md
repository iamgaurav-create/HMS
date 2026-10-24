# Pharmacy Walk-in Sales

Documentation for the **Walk-in Pharmacy Sales** module — a counter-dispensing feature that lets qualified staff sell non-prescription (OTC) medicines directly to walk-in customers and generate an immediate bill / receipt.

---

## 1. Overview

The Walk-in Sales module allows pharmacists and administrators to:

- Search and select from the **active, in-stock OTC medicine catalog**.
- Add items to a cart with per-line quantity and discount controls.
- Enter customer details (name, optional phone) and select a payment method.
- Process the sale atomically: create a bill, record payment, and deduct stock.
- Print / view a receipt for the completed sale.
- **Quick-add** a brand-new medicine + initial stock batch on the fly.

This flow is distinct from prescription-based dispensing: walk-in sales only apply to medicines flagged as `is_otc = true`.

---

## 2. File Map

| File | Responsibility |
|------|----------------|
| `app/(protected)/pharmacy/walk-in-sales/page.tsx` | Page shell — auth/role gating, catalog fetching, renders `<WalkInSaleForm>`. |
| `app/(protected)/pharmacy/walk-in-sales/components/walk-in-sale-form.tsx` | Client-side form: customer details, medicine search/catalog, cart, checkout, quick-add dialog. |
| `app/(protected)/pharmacy/walk-in-sales/receipt/[billId]/page.tsx` | Server-rendered printable receipt page (read-only). |
| `app/(protected)/pharmacy/walk-in-sales/receipt/[billId]/print-receipt-button.tsx` | Print button that triggers `window.print()`. |
| `lib/actions/pharmacy/walk-in-sales.actions.ts` | Server Actions: `createWalkInSale` and `quickAddMedicineWithBatch`. |

---

## 3. How It Works

### 3.1 Primary Workflow: Selecting from Existing Inventory

The walk-in sales form's **primary** workflow is selecting medicines from the
existing catalog — not adding new ones. On page load (`page.tsx`) the server
queries `medicine.findMany` for all medicines where:

- `is_active = true`
- `is_otc = true`
- Has at least one batch with `quantity > 0` and `expiry_date >= today`

This catalog is passed to the client (`<WalkInSaleForm catalog={catalog} />`).
The pharmacist then **searches + selects from in-stock batches**, exactly as
they would for a prescription. The Quick Add feature described below is only a
**fallback convenience** for the edge case where a walk-in customer requests a
medicine that does not yet exist in the system.

### 3.2 Access Control

Both the page (`page.tsx`) and the server actions (`walk-in-sales.actions.ts`) enforce that the caller is a **signed-in, Active** staff member with role `SuperAdmin`, `admin`, or `Pharmacist`. Any other role is redirected to `/unauthorized`.

### 3.2 Catalog Fetching (page.tsx)

On load the page queries for medicines where:

- `is_active = true`
- `is_otc = true`
- **Has at least one batch** with `quantity > 0` and `expiry_date >= today`

Only valid batches (in-stock, not expired) are returned, ordered by **expiry ascending** (FIFO). Medicine data is passed to the client as the `catalog` prop.

### 3.3 createWalkInSale (Server Action)

The core transactional logic lives in `lib/actions/pharmacy/walk-in-sales.actions.ts:58`. It is wrapped in a Prisma `$transaction` for atomicity.

**Steps:**

1. **Auth** — `requirePharmacist()` verifies the caller.
2. **Validation**
   - Customer name trimmed, max 120 chars.
   - Customer phone optional, max 10 digits.
   - Payment method must be `CASH`, `CARD`, or `ONLINE`.
   - At least one item; max 50 items.
   - Quantities must be positive whole numbers.
   - Discount 0–100%.
   - Duplicate batches: discounts must match (or an error is thrown).
3. **Per-batch processing** (inside the transaction):
   - Loads each `medicineBatch` with its `medicine` (name, unit, is_active, is_otc).
   - Rejects if batch not found, medicine inactive, medicine not OTC, or batch expired.
   - Rejects if `batch.quantity < requested quantity` (insufficient stock).
   - Computes line totals: `lineTotal = selling_price × qty`, `lineDiscount = lineTotal × (disc/100)`, `lineAmount = lineTotal − lineDiscount`.
4. **Bill creation** — creates a `pharmacyBill` record:
   - `bill_number` seeded as `WALK-{uuid}` (so receipts are distinguishable from prescription bills).
   - `patient_id` and `prescription_id` are `null` (pure walk-in).
   - `status = "PAID"`, `amount_paid = total`, `balance_amount = 0`.
   - Nested create of `pharmacyBillItem` rows.
5. **Payment record** — creates a `pharmacyPayment` row with the selected method and full amount.
6. **Stock deduction** — for each item an `updateMany` on `medicineBatch` decrements quantity with a **stock-level guard** (`quantity >= requested` AND `expiry_date >= today`). If `count !== 1`, the transaction aborts (concurrent sale safety — user must retry).
7. **Audit trail** — a `stockTransaction` of type `DISPENSE` is written for each line, referencing the staff member and bill number.
8. **Revalidation** — triggers `revalidatePath` for `/pharmacy`, `/pharmacy/inventory`, `/pharmacy/billing`, and `/pharmacy/walk-in-sales`.
9. **Returns** `{ success: true, billId }` — the UI then clears the cart and shows a link to the receipt.

### 3.5 Quick-Add Medicine — Design Rationale

The "Add New Medicine" button (top-right of the medicine catalog section) is a
**workflow shortcut**, not the primary path. Here's why it exists and why it
doesn't duplicate the regular inventory flow:

**The normal (non-walk-in) onboarding path is a 3-step, 2-page process:**

| Step | Location | What it does | What it does NOT do |
|------|----------|-------------|---------------------|
| 1 | `/pharmacy/medicines` | Creates the **medicine record** (name, generic, category, manufacturer, unit, reorder_level, `is_otc` flag, `is_active`) | Does **not** create a stock batch — no quantity, expiry, or prices |
| 2 | `/pharmacy/purchase-order` → "Receive Stock" | Creates a **medicineBatch** (batch_number, expiry_date, quantity, purchase_price, selling_price) | Requires a purchase order to exist first |
| 3 | `/pharmacy/walk-in-sales` | Pick from catalog, sell | — |

**Problem:** A walk-in customer requests a medicine that isn't in the system
yet. Forcing the pharmacist through steps 1→2 (create medicine, create PO,
receive stock, navigate back) just to serve one customer is friction-heavy.

**Solution — Quick Add:** The modal combines steps 1 and 2 into a single
atomic action. It creates:
- The **medicine** record with `is_otc = true` and `is_active = true`
  (immediately eligible for walk-in sale), **and**
- Its first **batch** with stock quantity, expiry date, and pricing.

It also writes a `stockTransaction` of type `PURCHASE` for audit, then
revalidates the catalog so the newly added medicine appears in the search
results instantly — all without leaving the walk-in sales screen.

**Guards:**
- Throws if a medicine with the same name (case-insensitive) already exists.
- Expiry date must be in the future.
- Quantity must be a positive integer; prices must be non-negative.

This mirrors the field set used by the "Receive Stock" dialog
(`receive-stock-dialog.tsx`) so the data model stays consistent.

- Validates all required fields (name, generic, category, manufacturer, unit, batch number, future expiry, positive quantity, valid prices).
- Throws if a medicine with the **same name (case-insensitive)** already exists.
- Creates a `medicine` record with `is_otc = true`, `is_active = true`.
- Creates a `medicineBatch` with the supplied purchase/selling price and quantity.
- Writes a `stockTransaction` of type `PURCHASE`.
- Revalidates catalog-related paths.
- Returns `{ success: true, medicine, batch }`.

---

## 4. Client-Side Form Behavior (walk-in-sale-form.tsx)

### 4.1 Layout
A two-column grid (`xl:grid-cols-[1fr_440px]`):
- **Left:** Customer details → Medicine catalog/search → Cart items.
- **Right (sticky):** Checkout summary, payment method, cash calculator, action button.

### 4.2 Medicine Catalog
- **Search** filters by medicine `name`, `generic_name`, or `category` (case-insensitive).
- **Category filter** dropdown (auto-populated, `ALL` default).
- Catalog is narrowed to active + OTC medicines that have at least one available batch.
- Each medicine card shows total available stock and price range across its batches.

### 4.3 Batch Selection
Two ways to add to cart:

1. **Quick Dispense button** — implements **FIFO**: picks the nearest-expiry available batch that still has capacity for one more unit. This is the recommended pharmacy practice for expiring stock.
2. **Per-batch "+ Add" button** — lets the dispenser manually choose a specific batch (batch number, expiry, price all shown).

### 4.4 Cart
- Quantity: stepper with min `1` and max = available batch quantity. Going above available stock shows an error.
- Per-item discount %: 0–100, editable inline. Line totals update live.
- Remove button (Trash2) clears a single line; "Clear all" empties the cart.

### 4.5 Checkout (Right Column)
- **Subtotal**, **Total Discount**, **Net Payable** computed live.
- **Payment Method** — three toggle buttons: `CASH`, `CARD`, `ONLINE`.
- **Cash Calculator** (CASH only) — enter cash tendered; system computes change due in real time. If cash < total, an error is shown and submission is blocked.

### 4.6 Submission
- `submitSale()` runs client-side validation then calls `createWalkInSale`.
- While pending the button shows a spinner (`Completing Counter Sale...`).
- On success: cart emptied, success banner with a direct link to `/pharmacy/walk-in-sales/receipt/[billId]`.
- On failure: error banner with the server-provided message.

### 4.7 Quick Add Medicine Dialog
- Triggered by the "+ Add New Medicine" button above the catalog.
- Modal form with medicine details (left) and batch details (right).
- On submit calls `quickAddMedicineWithBatch`, then closes the dialog, refreshes the catalog via `router.refresh()`, and shows a success banner.

---

## 5. Receipt Page (receipt/[billId]/page.tsx)

- **Server-rendered**, `force-dynamic`.
- Requires staff auth (same role guard as the form).
- Fetches the bill by `id` and includes `items` + `payments`.
- Only renders if `bill.bill_number` starts with `WALK-` (prevents prescription bills from being viewed here).
- **Layout:** Hospital Pharmacy header → walk-in receipt subtitle → bill metadata (number, date, customer, phone) → itemized table → pricing breakdown (subtotal, discount, total, paid, balance) → footer.
- **Print button** (top-right) calls `window.print()`.
- **Back link** returns to `/pharmacy/walk-in-sales`.

---

## 6. Usage Guide

### Selling a walk-in medicine

1. Navigate to `/pharmacy/walk-in-sales` (via the Pharmacy dashboard or sidebar link).
2. Fill in **Customer Name** (required). Phone is optional (10 digits, Indian format).
3. Search the medicine catalog by name, generic, or category.
4. Click **+ Add** on the desired batch, or use **Quick Dispense** for FIFO.
5. Adjust **Qty** and **Discount %** per line as needed.
6. Choose a **Payment Mode** (Cash / Card / Online).
7. If Cash, enter **Cash Received** — the change due is calculated automatically.
8. Click **Complete Sale**. The button shows progress, then confirms success.
9. Click **Print Walk-in Receipt** to view/print the receipt.

### Adding a new medicine from the fly

1. On the walk-in sales page, click **+ Add New Medicine**.
2. Fill the form: name, generic, category, manufacturer, unit, reorder level.
3. Fill the batch details: batch number, expiry date (must be in the future), quantity, purchase price, selling price.
4. Click **Add Medicine & Stock**.
5. The new medicine appears in the catalog immediately for sale.

---

## 7. Data Model Notes

Tables involved (Prima schema, `schema.prisma`):

- **`pharmacyBill`** — `bill_number`, `customer_name`, `customer_phone`, `subtotal`, `discount`, `total_amount`, `amount_paid`, `balance_amount`, `status`, plus optional `patient_id` / `prescription_id` (both null for walk-in).
- **`pharmacyBillItem`** — `medicine_id`, `batch_id`, `medicine_name`, `quantity`, `unit_price`, `total_price`, `discount`, `unit`.
- **`pharmacyPayment`** — `bill_id`, `amount`, `method` (`CASH`/`CARD`/`ONLINE`).
- **`medicineBatch`** — `medicine_id`, `batch_number`, `expiry_date`, `quantity`, `purchase_price`, `selling_price`.
- **`medicine`** — `name`, `generic_name`, `category`, `manufacturer`, `unit`, `reorder_level`, `is_otc`, `is_active`.
- **`stockTransaction`** — audit log: `medicine_id`, `batch_id`, `type` (`PURCHASE`/`DISPENSE`), `quantity`, `unit_price`, `reason`, `created_by`.

---

## 8. Validation & Error Handling Summary

| Rule | Enforcement |
|------|-------------|
| Staff must be Pharmacist / admin / SuperAdmin | Page + Server Action (`requirePharmacist`) |
| Medicine must be `is_otc = true` | Server (per batch) + client filter |
| Medicine must be `is_active = true` | Server (per batch) + client filter |
| Batch must be in stock (`quantity > 0`) | Server + client filter |
| Batch must not be expired | Server + client filter |
| Can't sell more than available | Client (stepper max) + Server (guard) |
| Duplicate batch IDs in one sale | Client merges if same discount; server throws if different discount |
| Cash tendered ≥ total (Cash mode) | Client validation only — server assumes full pre-payment |
| Max 50 items per sale | Server guard |
| Phone 10 digits (Indian) | Client regex + server length check |
| Quick-add: no duplicate medicine names | Server (`case-insensitive` check) |
| Quick-add: expiry must be future | Server |
| Stock decrement guard | `updateMany` with `count === 1` check — transaction aborts on mismatch |
