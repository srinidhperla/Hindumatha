import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
import StoreLocationPicker from "../components/StoreLocationPicker";

const isFiniteCoordinate = (value) => Number.isFinite(Number(value));

export const AdminSettingsDeliverySection = ({
  deliverySettings,
  onDeliverySettingsChange,
  onStoreLocationSelect,
  onUseCurrentStoreLocation,
  onCopyMapsLink,
  onCopyDeliveryConfig,
  onDownloadDeliveryConfig,
  onResetToVizianagaram,
  onSave,
  saving,
}) => {
  const hasValidCoordinates =
    isFiniteCoordinate(deliverySettings.storeLocation?.lat) &&
    isFiniteCoordinate(deliverySettings.storeLocation?.lng);

  return (
    <SurfaceCard className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1709]">
            Delivery Coverage
          </h2>
          <p className="mt-1 text-sm text-[#5c4a26]">
            Configure store GPS location and delivery radius used for checkout
            serviceability checks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton type="button" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Delivery Settings"}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onUseCurrentStoreLocation}
            variant="secondary"
          >
            Use Current Browser Location
          </ActionButton>
          <ActionButton type="button" onClick={onCopyMapsLink} variant="soft">
            Copy Maps Link
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onCopyDeliveryConfig}
            variant="soft"
          >
            Copy Delivery Config
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onDownloadDeliveryConfig}
            variant="success"
          >
            Download Delivery Config
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onResetToVizianagaram}
            variant="soft"
          >
            Reset to Vizianagaram
          </ActionButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-[#5c4a26]">
            Delivery Enabled
          </span>
          <input
            type="checkbox"
            name="enabled"
            checked={deliverySettings.enabled !== false}
            onChange={onDeliverySettingsChange}
            className="mt-3 h-4 w-4 rounded border-[#ebe1cb] text-[#5c4a26] focus:ring-[rgba(201,168,76,0.25)]"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-[#5c4a26]">
            Max Radius (km)
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            name="maxDeliveryRadiusKm"
            value={deliverySettings.maxDeliveryRadiusKm ?? ""}
            onChange={onDeliverySettingsChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] px-3 py-2 text-sm text-[#5c4a26]">
        Search for the store area below, use current browser location, or drop
        the pin on the map. The system keeps coordinates internally for radius
        checks, but the admin flow stays address-first.
      </div>

      <div className="mt-3">
        <p className="mb-2 text-sm font-medium text-[#5c4a26]">
          Click on the map to set store location and preview delivery radius
        </p>
        <StoreLocationPicker
          lat={deliverySettings.storeLocation?.lat}
          lng={deliverySettings.storeLocation?.lng}
          radiusKm={deliverySettings.maxDeliveryRadiusKm}
          onPickLocation={onStoreLocationSelect}
        />
      </div>

      {hasValidCoordinates && (
        <div className="mt-4">
          <a
            href={`https://maps.google.com/?q=${deliverySettings.storeLocation.lat},${deliverySettings.storeLocation.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#5c4a26] hover:text-[#1f1709]"
          >
            Open Store Location in Maps
          </a>
        </div>
      )}
    </SurfaceCard>
  );
};
