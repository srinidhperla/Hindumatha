import React from "react";
import { StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-2.5 text-sm text-[#1f1709] shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]";

const AdminGalleryWeightRangeSection = ({
  weightRange,
  onWeightRangeChange,
}) => (
  <SurfaceCard className="p-4 sm:p-5">
    <fieldset className="rounded-2xl border border-[#e3d7bb] px-4 pb-4 pt-2">
      <legend className="px-3 text-base font-semibold text-[#1f1709]">
        Weight
      </legend>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-[#5c4a26]">
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

        <label className="text-sm font-medium text-[#5c4a26]">
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

        <label className="text-sm font-medium text-[#5c4a26]">
          Unit
          <input
            type="text"
            value={weightRange?.unit || "kg"}
            onChange={(event) =>
              onWeightRangeChange("unit", event.target.value)
            }
            className={inputClassName}
          />
        </label>
      </div>
    </fieldset>
  </SurfaceCard>
);

export default AdminGalleryWeightRangeSection;
