import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import Modal from "@/shared/ui/Modal";
import { FormField, FormSection, fieldClass } from "@/shared/workspace/Form";
import { SearchInput } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  Panel,
  money,
  tableCellClass,
  tableHeadClass,
} from "@/billing/billingShared";

/* Categories & Tax — the billing categories with their HSN code and GST slab.
 * A category is billed either by the items placed in it, or (when it has no
 * items) as one line named after it, priced from fixed amounts or a range. */

const emptyForm = {
  id: "",
  name: "",
  hsnCode: "",
  gstRate: 5,
  productIds: [],
  valueMode: "none",
  fixedValues: "",
  rangeMin: "",
  rangeMax: "",
  endDigits: [0, 5],
};

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const DIGIT_PRESETS = [
  { label: "Any", digits: [] },
  { label: "0 and 5", digits: [0, 5] },
  { label: "Only 0", digits: [0] },
];

// Categories saved before last digits existed used a round-off step.
const digitsFromStep = (step) => {
  if (!step || step <= 1) return [];
  if (step === 5) return [0, 5];
  return [0];
};

// A few amounts the range allows, to show under the digit choice.
const sampleAmounts = (min, max, digits, count = 6) => {
  const low = Math.max(1, Math.ceil(Number(min) || 0));
  const high = Number(max) || 0;
  const values = [];
  for (let value = low; value <= high && values.length < count; value += 1) {
    if (!digits.length || digits.includes(value % 10)) values.push(value);
  }
  return values;
};

const toForm = (category) => ({
  id: category.id,
  name: category.name,
  hsnCode: category.hsnCode,
  gstRate: category.gstRate,
  productIds: category.productIds,
  valueMode: category.valueMode,
  fixedValues: category.fixedValues.join(", "),
  rangeMin: category.rangeMin || "",
  rangeMax: category.rangeMax || "",
  endDigits: category.endDigits?.length
    ? category.endDigits
    : digitsFromStep(category.roundTo),
});

const parseFixedValues = (text) =>
  String(text || "")
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);

const describeBilling = (category) => {
  if (category.productIds.length) {
    const count = category.productIds.length;
    return `${count} item${count === 1 ? "" : "s"}`;
  }
  if (category.valueMode === "fixed") {
    return `Billed as "${category.name}" at ${category.fixedValues.map(money).join(", ")}`;
  }
  if (category.valueMode === "range") {
    const digits = category.endDigits?.length
      ? `, ending in ${category.endDigits.join(" or ")}`
      : category.roundTo > 1
        ? `, in steps of ${money(category.roundTo)}`
        : "";
    return `Billed as "${category.name}" from ${money(category.rangeMin)} to ${money(category.rangeMax)}${digits}`;
  }
  return "No items and no amounts yet — not used in bills";
};

const BillingCategoriesPage = ({ onToast, canManage }) => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [categoryResponse, catalog] = await Promise.all([
        billingAPI.listCategories(),
        billingAPI.getCatalog(),
      ]);
      setCategories(categoryResponse.categories);
      setItems(catalog.items);
    } catch (error) {
      onToast(billingError(error, "Could not load categories."), "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryNameByItemId = useMemo(() => {
    const names = new Map();
    categories.forEach((category) => {
      category.productIds.forEach((productId) => {
        names.set(productId, category.name);
      });
    });
    return names;
  }, [categories]);

  const visibleItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    return items.filter(
      (item) => !term || item.name.toLowerCase().includes(term),
    );
  }, [items, itemSearch]);

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const toggleDigit = (digit) =>
    setForm((current) => ({
      ...current,
      endDigits: current.endDigits.includes(digit)
        ? current.endDigits.filter((entry) => entry !== digit)
        : [...current.endDigits, digit].sort((left, right) => left - right),
    }));

  const toggleItem = (itemId) =>
    setForm((current) => ({
      ...current,
      productIds: current.productIds.includes(itemId)
        ? current.productIds.filter((id) => id !== itemId)
        : [...current.productIds, itemId],
    }));

  const save = async (event) => {
    event.preventDefault();
    const hasItems = form.productIds.length > 0;
    const payload = {
      name: form.name,
      hsnCode: form.hsnCode,
      gstRate: Number(form.gstRate),
      productIds: form.productIds,
      // Amounts only apply while the category has no items.
      valueMode: hasItems ? "none" : form.valueMode,
    };
    if (payload.valueMode === "fixed") {
      payload.fixedValues = parseFixedValues(form.fixedValues);
    }
    if (payload.valueMode === "range") {
      payload.rangeMin = Number(form.rangeMin);
      payload.rangeMax = Number(form.rangeMax);
      payload.roundTo = 1;
      payload.endDigits = form.endDigits;
    }

    setSaving(true);
    try {
      if (form.id) {
        await billingAPI.updateCategory(form.id, payload);
        onToast(`${form.name} updated.`);
      } else {
        await billingAPI.createCategory(payload);
        onToast(`${form.name} added.`);
      }
      setForm(null);
      await load();
    } catch (error) {
      onToast(billingError(error, "Could not save the category."), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    const count = category.productIds.length;
    const confirmed = window.confirm(
      `Delete "${category.name}"?${count ? ` Its ${count} item${count === 1 ? "" : "s"} will become uncategorised.` : ""} Bills already saved keep this category.`,
    );
    if (!confirmed) return;
    try {
      await billingAPI.deleteCategory(category.id);
      onToast(`${category.name} deleted.`);
      await load();
    } catch (error) {
      onToast(billingError(error, "Could not delete the category."), "error");
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const uncategorised = items.filter(
    (item) => !categoryNameByItemId.has(item.id),
  ).length;
  const formHasItems = (form?.productIds.length || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#7d6c4d]">
          <strong className="text-[#1f1709]">{categories.length}</strong>{" "}
          categories ·{" "}
          <strong className="text-[#1f1709]">{uncategorised}</strong> items not
          in any category
        </p>
        {canManage && (
          <ActionButton onClick={() => setForm({ ...emptyForm })}>
            + Add category
          </ActionButton>
        )}
      </div>

      <Panel>
        {categories.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Category</th>
                  <th className={tableHeadClass}>HSN code</th>
                  <th className={`${tableHeadClass} text-right`}>GST %</th>
                  <th className={tableHeadClass}>Billed with</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const unused =
                    !category.productIds.length &&
                    category.valueMode === "none";
                  return (
                    <tr key={category.id}>
                      <td className={`${tableCellClass} font-semibold`}>
                        {category.name}
                      </td>
                      <td className={tableCellClass}>
                        {category.hsnCode || "—"}
                      </td>
                      <td className={`${tableCellClass} text-right`}>
                        {category.gstRate}%
                      </td>
                      <td
                        className={`${tableCellClass} ${
                          unused ? "text-[#a3271b]" : "text-[#7d6c4d]"
                        }`}
                      >
                        {describeBilling(category)}
                      </td>
                      <td
                        className={`${tableCellClass} whitespace-nowrap text-right`}
                      >
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setItemSearch("");
                                setForm(toForm(category));
                              }}
                              className="text-sm font-semibold text-[#8b6914] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(category)}
                              className="ml-4 text-sm font-semibold text-[#a3271b] hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No categories yet. Add your first category." />
        )}
      </Panel>

      {form && (
        <Modal
          title={form.id ? "Edit category" : "Add category"}
          onClose={() => setForm(null)}
          maxWidthClassName="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setForm(null)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                form="billing-category-form"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save category"}
              </ActionButton>
            </div>
          }
        >
          <form id="billing-category-form" onSubmit={save} className="ws-form">
            <FormSection>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <FormField label="Category name">
                  <input
                    value={form.name}
                    onChange={setField("name")}
                    className={fieldClass}
                    maxLength={80}
                    required
                    autoFocus
                  />
                </FormField>
                <FormField label="HSN code">
                  <input
                    value={form.hsnCode}
                    onChange={setField("hsnCode")}
                    className={fieldClass}
                    inputMode="numeric"
                    maxLength={8}
                  />
                </FormField>
                <FormField label="GST %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.gstRate}
                    onChange={setField("gstRate")}
                    className={fieldClass}
                    required
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title={`Items in this category (${form.productIds.length})`}
              action={
                <SearchInput
                  value={itemSearch}
                  onChange={setItemSearch}
                  placeholder="Search items"
                  className="w-48"
                />
              }
            >
              <div className="max-h-56 overflow-y-auto rounded-xl border border-[#ebe1cb]">
                {visibleItems.map((item) => {
                  const checked = form.productIds.includes(item.id);
                  const elsewhere = categoryNameByItemId.get(item.id);
                  const inOther =
                    elsewhere && elsewhere !== form.name && !checked;
                  return (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-2.5 border-b border-[#f3ecdb] px-3 py-1.5 text-sm last:border-b-0 hover:bg-[#fdfbf5]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 accent-[#1f1709]"
                      />
                      <span className="min-w-0 flex-1 truncate text-[#1f1709]">
                        {item.name}
                      </span>
                      {inOther && (
                        <span className="shrink-0 text-xs text-[#8a7a5c]">
                          now in {elsewhere}
                        </span>
                      )}
                    </label>
                  );
                })}
                {!visibleItems.length && (
                  <p className="px-3 py-4 text-center text-sm text-[#7d6c4d]">
                    No items match.
                  </p>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-[#8a7a5c]">
                An item can be in one category. Ticking one that is in another
                category moves it here.
              </p>
            </FormSection>

            <FormSection title="When this category has no items">
              {formHasItems ? (
                <p className="text-sm text-[#7d6c4d]">
                  This category is billed with its items. Amounts can be set
                  only when no items are ticked above.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f6f1e6] p-1">
                    {[
                      ["none", "Not billed"],
                      ["fixed", "Fixed amounts"],
                      ["range", "Range"],
                    ].map(([mode, label]) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            valueMode: mode,
                          }))
                        }
                        className={`rounded-lg py-2 text-xs font-semibold admin-motion ${
                          form.valueMode === mode
                            ? "bg-[#1f1709] text-[#f3dd96]"
                            : "text-[#5c4a26] hover:bg-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {form.valueMode === "fixed" && (
                    <FormField
                      label="Amounts (₹), separated by commas"
                      hint={`Bills show one line called "${form.name || "the category"}" at one of these amounts only.`}
                      className="mt-3"
                    >
                      <input
                        value={form.fixedValues}
                        onChange={setField("fixedValues")}
                        placeholder="10, 20, 50"
                        className={fieldClass}
                      />
                    </FormField>
                  )}

                  {form.valueMode === "range" && (
                    <>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <FormField label="Lowest (₹)">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.rangeMin}
                          onChange={setField("rangeMin")}
                          className={fieldClass}
                        />
                      </FormField>
                      <FormField label="Highest (₹)">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.rangeMax}
                          onChange={setField("rangeMax")}
                          className={fieldClass}
                        />
                      </FormField>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1f1709]">
                          Last digit of the amount
                        </span>
                        <div className="flex gap-1">
                          {DIGIT_PRESETS.map((preset) => {
                            const active =
                              preset.digits.join() === form.endDigits.join();
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    endDigits: preset.digits,
                                  }))
                                }
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  active
                                    ? "bg-[#1f1709] text-white"
                                    : "bg-[#f6f1e6] text-[#5c4a26] hover:bg-[#efe5cf]"
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-10 gap-1">
                        {DIGITS.map((digit) => {
                          const active = form.endDigits.includes(digit);
                          return (
                            <button
                              key={digit}
                              type="button"
                              onClick={() => toggleDigit(digit)}
                              aria-pressed={active}
                              className={`h-9 rounded-lg border text-sm font-bold ${
                                active
                                  ? "border-[#8b6914] bg-[#8b6914] text-white"
                                  : "border-[#e5d9bf] bg-white text-[#5c4a26] hover:border-[#c9b27a]"
                              }`}
                            >
                              {digit}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-xs text-[#8a7a5c]">
                        {(() => {
                          const samples = sampleAmounts(
                            form.rangeMin,
                            form.rangeMax,
                            form.endDigits,
                          );
                          const rule = form.endDigits.length
                            ? `Amounts ending in ${form.endDigits.join(" or ")}`
                            : "Any whole-rupee amount";
                          if (!form.rangeMin || !form.rangeMax) {
                            return `${rule}. Pick none for any amount.`;
                          }
                          return samples.length
                            ? `${rule}: ${samples.map(money).join(", ")} …`
                            : `No amount in this range ends in ${form.endDigits.join(" or ")}.`;
                        })()}
                      </p>
                    </div>
                    </>
                  )}
                </>
              )}
            </FormSection>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BillingCategoriesPage;
