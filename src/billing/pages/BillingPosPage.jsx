import React, { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import Modal from "@/shared/ui/Modal";
import { billingAPI, billingError } from "@/services/billingAPI";
import { printReceipt } from "@/billing/printReceipt";
import {
  Field,
  PAYMENT_MODES,
  inputClass,
  money,
  titleCase,
} from "@/billing/billingShared";

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const chipClass = (active) =>
  `whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold admin-motion ${
    active
      ? "bg-[#1f1709] text-[#f3dd96]"
      : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
  }`;

const emptyCustomItem = { name: "", unitPrice: "", qty: 1 };

const BillingPosPage = ({ onToast }) => {
  const [catalog, setCatalog] = useState({
    items: [],
    categories: [],
    shop: {},
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [splitCash, setSplitCash] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [variantItem, setVariantItem] = useState(null);
  const [customItem, setCustomItem] = useState(null);
  const [lastBill, setLastBill] = useState(null);

  useEffect(() => {
    let mounted = true;
    billingAPI
      .getCatalog()
      .then((response) => {
        if (mounted) setCatalog(response);
      })
      .catch((error) =>
        onToast(billingError(error, "Could not load billing items."), "error"),
      )
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [onToast]);

  const billableItems = useMemo(
    () => catalog.items.filter((item) => item.billable),
    [catalog.items],
  );

  const categories = useMemo(
    () => [...new Set(billableItems.map((item) => item.category))].sort(),
    [billableItems],
  );

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return billableItems.filter(
      (item) =>
        (!category || item.category === category) &&
        (!term || item.name.toLowerCase().includes(term)),
    );
  }, [billableItems, category, search]);

  const addLine = (line) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.key === line.key);
      if (existing) {
        return current.map((entry) =>
          entry.key === line.key
            ? { ...entry, qty: entry.qty + line.qty }
            : entry,
        );
      }
      return [...current, line];
    });
  };

  const addVariant = (item, variant) => {
    addLine({
      key: `${item.id}|${variant.key}`,
      productId: item.id,
      variantKey: variant.key,
      name: item.name,
      variant: variant.label,
      unitPrice: variant.price,
      qty: 1,
    });
    setVariantItem(null);
  };

  const onItemClick = (item) => {
    if (item.variants.length > 1) {
      setVariantItem(item);
    } else {
      addVariant(item, item.variants[0]);
    }
  };

  const setQty = (key, qty) => {
    setCart((current) =>
      qty <= 0
        ? current.filter((entry) => entry.key !== key)
        : current.map((entry) =>
            entry.key === key ? { ...entry, qty } : entry,
          ),
    );
  };

  const addCustomItem = (event) => {
    event.preventDefault();
    const unitPrice = round2(customItem.unitPrice);
    const qty = Number(customItem.qty) || 1;
    if (!customItem.name.trim() || !(unitPrice > 0)) {
      onToast("A custom item needs a name and a price.", "error");
      return;
    }
    addLine({
      key: `custom-${Date.now()}`,
      productId: "",
      name: customItem.name.trim(),
      variant: "",
      unitPrice,
      qty,
    });
    setCustomItem(null);
  };

  const subTotal = round2(
    cart.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
  );
  const discountValue = Math.min(subTotal, Math.max(0, round2(discount)));
  const total = round2(subTotal - discountValue);
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const qtyByProduct = cart.reduce((map, line) => {
    if (line.productId) {
      map[line.productId] = (map[line.productId] || 0) + line.qty;
    }
    return map;
  }, {});
  const splitCashValue = Math.min(total, Math.max(0, round2(splitCash)));
  const change = round2(Number(cashReceived || 0) - total);

  const resetBill = () => {
    setCart([]);
    setDiscount("");
    setCustomerName("");
    setCustomerPhone("");
    setPayMode("cash");
    setSplitCash("");
    setCashReceived("");
    setReference("");
  };

  const buildPayments = () => {
    if (payMode !== "split") {
      return [{ mode: payMode, amount: total, reference }];
    }
    return [
      { mode: "cash", amount: splitCashValue },
      { mode: "phonepe", amount: round2(total - splitCashValue), reference },
    ].filter((payment) => payment.amount > 0);
  };

  const saveBill = async (shouldPrint) => {
    if (!cart.length || total <= 0 || saving) {
      return;
    }
    setSaving(true);
    try {
      const { bill } = await billingAPI.createBill({
        items: cart.map((line) =>
          line.productId
            ? {
                productId: line.productId,
                variantKey: line.variantKey,
                qty: line.qty,
              }
            : { name: line.name, unitPrice: line.unitPrice, qty: line.qty },
        ),
        discount: discountValue,
        payments: buildPayments(),
        customerName,
        customerPhone,
      });
      setLastBill(bill);
      resetBill();
      onToast(`Bill ${bill.billNo} saved · ${money(bill.grandTotal)}`);
      if (shouldPrint && !printReceipt(bill, catalog.shop)) {
        onToast("Bill saved. Allow pop-ups to print the receipt.", "error");
      }
    } catch (error) {
      onToast(billingError(error, "Could not save the bill."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items..."
            className={`${inputClass} min-w-[140px] flex-1`}
            autoFocus
          />
          <ActionButton
            variant="secondary"
            onClick={() => setCustomItem({ ...emptyCustomItem })}
          >
            + Custom item
          </ActionButton>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            className={chipClass(!category)}
            onClick={() => setCategory("")}
          >
            All
          </button>
          {categories.map((entry) => (
            <button
              type="button"
              key={entry}
              className={chipClass(category === entry)}
              onClick={() => setCategory(entry)}
            >
              {titleCase(entry)}
            </button>
          ))}
        </div>

        {visibleItems.length ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`relative overflow-hidden rounded-2xl border bg-white text-left admin-motion hover:border-[#c9a84c] hover:shadow-[0_8px_18px_rgba(31,23,9,0.1)] active:scale-[0.98] ${
                  qtyByProduct[item.id]
                    ? "border-[#c9a84c] ring-2 ring-[rgba(201,168,76,0.25)]"
                    : "border-[#ebe1cb]"
                }`}
              >
                {qtyByProduct[item.id] ? (
                  <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1f1709] px-1.5 text-xs font-bold text-[#f3dd96]">
                    {qtyByProduct[item.id]}
                  </span>
                ) : null}
                <div className="aspect-[4/3] w-full bg-[#f3ecdb]">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="px-3 pb-3 pt-2.5">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-[#1f1709]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-[#8b6914]">
                    {item.variants.length > 1
                      ? `from ${money(Math.min(...item.variants.map((variant) => variant.price)))}`
                      : money(item.variants[0].price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState message="No billing items match. Check the Items tab." />
        )}
      </div>

      <div className="md:sticky md:top-[72px] md:h-[calc(100vh-88px)] md:self-start">
        <div className="ws-card flex h-full flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-playfair text-lg font-bold text-[#1f1709]">
              Current bill
              {itemCount > 0 && (
                <span className="ml-2 rounded-full bg-[#f3ecdb] px-2 py-0.5 align-middle font-sans text-xs font-semibold text-[#5c4a26]">
                  {itemCount}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={resetBill}
                className="text-sm font-semibold text-rose-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {cart.length ? (
            <ul className="max-h-[40vh] min-h-0 flex-1 divide-y divide-[#f3ecdb] overflow-y-auto md:max-h-none">
              {cart.map((line) => (
                <li key={line.key} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1f1709]">
                      {line.name}
                    </p>
                    <p className="text-xs text-[#7d6c4d]">
                      {line.variant ? `${line.variant} · ` : ""}
                      {money(line.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(line.key, line.qty - 1)}
                      className="h-8 w-8 rounded-lg border border-[#e3d7bb] bg-white text-base font-bold text-[#5c4a26] hover:bg-[#faf6ec]"
                      aria-label={`Reduce ${line.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(line.key, line.qty + 1)}
                      className="h-8 w-8 rounded-lg border border-[#e3d7bb] bg-white text-base font-bold text-[#5c4a26] hover:bg-[#faf6ec]"
                      aria-label={`Add ${line.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold">
                    {money(line.qty * line.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex min-h-[96px] flex-1 items-center justify-center rounded-xl border border-dashed border-[#e3d7bb] px-4 text-center text-sm text-[#7d6c4d]">
              Tap an item to start the bill.
            </p>
          )}

          <div className="mt-3 space-y-2 border-t border-[#ebe1cb] pt-3 text-sm">
            <div className="flex justify-between text-[#7d6c4d]">
              <span>Sub total</span>
              <span>{money(subTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#7d6c4d]">
              <span>Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="0"
                className={`${inputClass} w-24 text-right`}
              />
            </div>
            <div className="flex items-end justify-between pt-1 text-[#1f1709]">
              <span className="text-base font-semibold">Total</span>
              <span className="font-playfair text-[32px] font-bold leading-none">
                {money(total)}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-[#f6f1e6] p-1">
            {[...PAYMENT_MODES, { id: "split", label: "Split" }].map((mode) => (
              <button
                type="button"
                key={mode.id}
                onClick={() => setPayMode(mode.id)}
                className={`rounded-lg px-1 py-2 text-xs font-semibold admin-motion ${
                  payMode === mode.id
                    ? "bg-[#1f1709] text-[#f3dd96] shadow-sm"
                    : "text-[#5c4a26] hover:bg-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {payMode === "cash" && (
              <>
                <Field label="Cash received">
                  <input
                    type="number"
                    min="0"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder={String(total || "")}
                    className={inputClass}
                  />
                </Field>
                <Field label="Change to give">
                  <p className="flex h-10 items-center rounded-[0.7rem] bg-[#f6f1e6] px-3 text-sm font-bold text-[#1f1709]">
                    {cashReceived && change >= 0 ? money(change) : "—"}
                  </p>
                </Field>
              </>
            )}
            {payMode === "split" && (
              <>
                <Field label="Cash part">
                  <input
                    type="number"
                    min="0"
                    value={splitCash}
                    onChange={(event) => setSplitCash(event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="PhonePe part">
                  <p className="flex h-10 items-center rounded-[0.7rem] bg-[#f6f1e6] px-3 text-sm font-bold text-[#1f1709]">
                    {money(total - splitCashValue)}
                  </p>
                </Field>
              </>
            )}
            {payMode !== "cash" && (
              <Field label="Reference / UTR (optional)" className="col-span-2">
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className={inputClass}
                  maxLength={80}
                />
              </Field>
            )}
            <Field label="Customer">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Name"
                className={inputClass}
                maxLength={80}
              />
            </Field>
            <Field label="Phone">
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Mobile"
                inputMode="tel"
                className={inputClass}
                maxLength={20}
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_1.6fr] gap-2">
            <ActionButton
              variant="secondary"
              disabled={!cart.length || total <= 0 || saving}
              onClick={() => saveBill(false)}
            >
              Save
            </ActionButton>
            <ActionButton
              disabled={!cart.length || total <= 0 || saving}
              onClick={() => saveBill(true)}
            >
              {saving ? "Saving..." : "Save & Print"}
            </ActionButton>
          </div>

          {lastBill && (
            <p className="mt-3 text-center text-xs text-[#7d6c4d]">
              Last bill {lastBill.billNo} · {money(lastBill.grandTotal)} ·{" "}
              <button
                type="button"
                className="font-semibold text-[#8b6914] hover:underline"
                onClick={() => printReceipt(lastBill, catalog.shop)}
              >
                Print again
              </button>
            </p>
          )}
        </div>
      </div>

      {variantItem && (
        <Modal
          title={variantItem.name}
          onClose={() => setVariantItem(null)}
          maxWidthClassName="max-w-md"
        >
          <div className="grid gap-2">
            {variantItem.variants.map((variant) => (
              <button
                type="button"
                key={variant.key}
                onClick={() => addVariant(variantItem, variant)}
                className="flex items-center justify-between rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 text-left admin-motion hover:border-[#c9a84c] hover:bg-[#f9f2df]"
              >
                <span className="text-sm font-semibold text-[#1f1709]">
                  {variant.label}
                </span>
                <span className="text-sm font-bold text-[#8b6914]">
                  {money(variant.price)}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {customItem && (
        <Modal
          title="Custom item"
          onClose={() => setCustomItem(null)}
          maxWidthClassName="max-w-md"
        >
          <form onSubmit={addCustomItem} className="grid gap-3">
            <Field
              label="Item name"
              hint="For one-off sales such as a custom cake."
            >
              <input
                value={customItem.name}
                onChange={(event) =>
                  setCustomItem({ ...customItem, name: event.target.value })
                }
                className={inputClass}
                maxLength={120}
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customItem.unitPrice}
                  onChange={(event) =>
                    setCustomItem({
                      ...customItem,
                      unitPrice: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  min="1"
                  value={customItem.qty}
                  onChange={(event) =>
                    setCustomItem({ ...customItem, qty: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <ActionButton type="submit">Add to bill</ActionButton>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BillingPosPage;
