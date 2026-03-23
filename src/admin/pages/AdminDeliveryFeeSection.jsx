import React from "react";
import { ActionButton, SurfaceCard, Toggle } from "@/shared/ui/Primitives";

const AdminDeliveryFeeSection = ({
  normalizedEditorDeliverySettings,
  handleDistanceFeeEnabledChange,
  handleFreeDeliveryEnabledChange,
  handleDeliverySettingChange,
  handleSaveDeliveryFee,
  saving,
}) => {
  return (
    <SurfaceCard className="p-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Delivery Pricing
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Delivery Fee
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Configure distance-based delivery charges and optional free delivery
            above an order amount.
          </p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Delivery Fee by Distance
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Set fixed fee for first 1 km and extra fee per km beyond 1 km.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <Toggle
                  checked={normalizedEditorDeliverySettings.distanceFeeEnabled}
                  onClick={() =>
                    handleDistanceFeeEnabledChange(
                      !normalizedEditorDeliverySettings.distanceFeeEnabled,
                    )
                  }
                  label="toggle delivery fee by distance"
                />
                On
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Fee for first 1 km
              <input
                type="number"
                min="0"
                step="1"
                name="firstKmFee"
                value={normalizedEditorDeliverySettings.firstKmFee}
                onChange={handleDeliverySettingChange}
                className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Fee per km beyond 1 km
              <input
                type="number"
                min="0"
                step="1"
                name="pricePerKmBeyondFirstKm"
                value={normalizedEditorDeliverySettings.pricePerKmBeyondFirstKm}
                onChange={handleDeliverySettingChange}
                className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Free Delivery Above Amount
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  When enabled, orders at or above this subtotal get zero
                  delivery fee.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <Toggle
                  checked={normalizedEditorDeliverySettings.freeDeliveryEnabled}
                  onClick={() =>
                    handleFreeDeliveryEnabledChange(
                      !normalizedEditorDeliverySettings.freeDeliveryEnabled,
                    )
                  }
                  label="toggle free delivery threshold"
                />
                On
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Minimum subtotal for free delivery
              <input
                type="number"
                min="0"
                step="1"
                name="freeDeliveryMinAmount"
                value={normalizedEditorDeliverySettings.freeDeliveryMinAmount}
                onChange={handleDeliverySettingChange}
                className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <ActionButton
            type="button"
            onClick={handleSaveDeliveryFee}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Delivery Fee"}
          </ActionButton>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default AdminDeliveryFeeSection;
