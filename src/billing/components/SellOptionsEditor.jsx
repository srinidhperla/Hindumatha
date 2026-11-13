import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { inputClass } from "@/billing/billingShared";
import { quantityLabel, round, sellPresets, shortBase } from "@/billing/stockUnits";

/* How the shop sells an item: one or more options, each a quantity of the
 * item's stock unit and a price — 1 pc ₹45, Box (24) ₹1,000, 250 g ₹60.
 * `pricePerBase` (from the MRP) fills the price of a new option. */

const SellOptionsEditor = ({ baseUnit, packUnits = [], options, pricePerBase, onChange, compact = false }) => {
  const [customQty, setCustomQty] = useState("");
  const add = (qty) => {
    const amount = Number(qty);
    if (!(amount > 0) || options.some((option) => Number(option.qty) === amount)) return;
    onChange([
      ...options,
      {
        qty: amount,
        label: quantityLabel(amount, baseUnit, packUnits),
        price: pricePerBase > 0 ? String(round(pricePerBase * amount, 2)) : "",
      },
    ]);
  };
  const presets = sellPresets(baseUnit, packUnits).filter(
    (preset) => !options.some((option) => Number(option.qty) === preset.qty),
  );
  // Weights are typed in grams / ml, pieces as a count.
  const customUnit = baseUnit === "pcs" ? "pcs" : baseUnit === "kg" ? "g" : "ml";
  const customToBase = (value) => (baseUnit === "pcs" ? Number(value) : Number(value) / 1000);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "text-sm"}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7d6c4d]">Sell</span>
      {options.map((option, index) => (
        <span
          key={option.qty}
          className="inline-flex items-center gap-1 rounded-lg border border-[#e5d9bf] bg-white py-0.5 pl-2 pr-0.5"
        >
          <span className="text-xs font-semibold text-[#1f1709]">{option.label}</span>
          <span className="text-xs text-[#8a7a5c]">₹</span>
          <input
            type="number"
            min="0"
            step="any"
            value={option.price}
            onChange={(event) =>
              onChange(options.map((entry, at) => (at === index ? { ...entry, price: event.target.value } : entry)))
            }
            placeholder="price"
            className={`w-[68px] rounded-md border px-1 py-0.5 text-right text-xs ${
              option.price === "" ? "border-amber-300 bg-amber-50" : "border-transparent bg-[#faf6ec]"
            }`}
            aria-label={`Price for ${option.label}`}
          />
          <button
            type="button"
            aria-label={`Remove ${option.label}`}
            onClick={() => onChange(options.filter((_, at) => at !== index))}
            className="rounded p-0.5 text-[#a3271b] hover:bg-rose-50"
          >
            <FiX className="text-xs" />
          </button>
        </span>
      ))}
      {presets.map((preset) => (
        <button
          key={preset.qty}
          type="button"
          onClick={() => add(preset.qty)}
          className="rounded-lg border border-dashed border-[#d9c48a] px-2 py-0.5 text-xs font-semibold text-[#8b6914] hover:bg-[#fffaf0]"
        >
          + {preset.label}
        </button>
      ))}
      <span className="inline-flex items-center gap-1">
        <input
          type="number"
          min="0"
          step="any"
          value={customQty}
          onChange={(event) => setCustomQty(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(customToBase(customQty));
              setCustomQty("");
            }
          }}
          placeholder={`other ${customUnit}`}
          className={`${inputClass} !w-[86px] !px-1.5 !py-0.5 text-xs`}
          aria-label={`Other quantity in ${customUnit}`}
        />
        {customQty && (
          <button
            type="button"
            onClick={() => {
              add(customToBase(customQty));
              setCustomQty("");
            }}
            className="rounded-lg bg-[#f6f1e6] px-2 py-0.5 text-xs font-semibold text-[#5c4a26]"
          >
            Add
          </button>
        )}
      </span>
      {!options.length && (
        <span className="text-xs font-semibold text-amber-700">
          No selling price yet ({shortBase(baseUnit)})
        </span>
      )}
    </div>
  );
};

export default SellOptionsEditor;
