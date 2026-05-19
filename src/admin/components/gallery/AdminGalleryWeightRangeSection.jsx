import React from "react";
import { StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

const AdminGalleryWeightRangeSection = ({
  weightRange,
  onWeightRangeChange,
}) => (
  <SurfaceCard className="p-4 sm:p-5">
    <fieldset className="rounded-3xl border-[4px] border-primary-900 px-4 pb-4 pt-2">
      <legend className="px-3 text-base font-semibold text-primary-900">
        Weight
      </legend>

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-primary-600">
          Set the minimum and maximum weight for this cake. Each gallery item can
          have its own range.
        </p>
        <StatusChip tone="info">Dynamic range</StatusChip>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-primary-700">
          Minimum weight
          <input
            type="number"
            min="0"
            step="0.5"
            value={weightRange?.min ?? ""}
            onChange={(event) => onWeightRangeChange("min", event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="text-sm font-medium text-primary-700">
          Maximum weight
          <input
            type="number"
            min="0"
            step="0.5"
            value={weightRange?.max ?? ""}
            onChange={(event) => onWeightRangeChange("max", event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="text-sm font-medium text-primary-700">
          Unit
          <input
            type="text"
            value={weightRange?.unit || "kg"}
            onChange={(event) => onWeightRangeChange("unit", event.target.value)}
            className={inputClassName}
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[#fffaf0] px-4 py-3 text-sm text-primary-700">
        Available range preview:{" "}
        <span className="font-semibold text-primary-900">
          {weightRange?.min ?? 0} - {weightRange?.max ?? 0}{" "}
          {String(weightRange?.unit || "kg").trim() || "kg"}
        </span>
      </div>
    </fieldset>
  </SurfaceCard>
);

export default AdminGalleryWeightRangeSection;
