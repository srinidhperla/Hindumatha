import React from "react";
import { ActionButton, SurfaceCard, Toggle } from "@/shared/ui/Primitives";
import { FormField, fieldClass } from "@/shared/workspace/Form";

const AdminDeliveryFeeSection = ({
  normalizedEditorDeliverySettings,
  handleDistanceFeeEnabledChange,
  handleFreeDeliveryEnabledChange,
  handleDeliverySettingChange,
  handleSaveDeliveryFee,
  saving,
}) => {
  const settings = normalizedEditorDeliverySettings;

  return (
    <SurfaceCard className="p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-playfair text-lg font-bold text-[#1f1709]">
          Delivery fee
        </h2>
        <ActionButton
          type="button"
          onClick={handleSaveDeliveryFee}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save fee"}
        </ActionButton>
      </div>

      <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
        <div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#1f1709]">
            <Toggle
              size="sm"
              checked={settings.distanceFeeEnabled}
              onClick={() =>
                handleDistanceFeeEnabledChange(!settings.distanceFeeEnabled)
              }
              label="toggle delivery fee by distance"
            />
            Charge by distance
          </label>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <FormField label="First 1 km (₹)">
              <input
                type="number"
                min="0"
                step="1"
                name="firstKmFee"
                value={settings.firstKmFee}
                onChange={handleDeliverySettingChange}
                className={fieldClass}
              />
            </FormField>
            <FormField label="Each extra km (₹)">
              <input
                type="number"
                min="0"
                step="1"
                name="pricePerKmBeyondFirstKm"
                value={settings.pricePerKmBeyondFirstKm}
                onChange={handleDeliverySettingChange}
                className={fieldClass}
              />
            </FormField>
          </div>
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#1f1709]">
            <Toggle
              size="sm"
              checked={settings.freeDeliveryEnabled}
              onClick={() =>
                handleFreeDeliveryEnabledChange(!settings.freeDeliveryEnabled)
              }
              label="toggle free delivery threshold"
            />
            Free delivery above an amount
          </label>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <FormField label="Order subtotal (₹)">
              <input
                type="number"
                min="0"
                step="1"
                name="freeDeliveryMinAmount"
                value={settings.freeDeliveryMinAmount}
                onChange={handleDeliverySettingChange}
                className={fieldClass}
              />
            </FormField>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default AdminDeliveryFeeSection;
