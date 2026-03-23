import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
import StoreLocationPicker from "../components/StoreLocationPicker";

const isFiniteCoordinate = (value) => Number.isFinite(Number(value));

export const AdminSettingsDeliverySection = ({
  deliverySettings,
  onDeliverySettingsChange,
  onStoreLocationSelect,
  onUseCurrentStoreLocation,
  onCopyCoordinates,
  onCopyMapsLink,
  onCopyDeliveryConfig,
  onDownloadDeliveryConfig,
  onResetToVizianagaram,
}) => {
  const hasValidCoordinates =
    isFiniteCoordinate(deliverySettings.storeLocation?.lat) &&
    isFiniteCoordinate(deliverySettings.storeLocation?.lng);

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">
            Delivery Coverage
          </h2>
          <p className="mt-1 text-sm text-primary-600">
            Configure store GPS location and delivery radius used for checkout
            serviceability checks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            type="button"
            onClick={onUseCurrentStoreLocation}
            variant="secondary"
          >
            Use Current Browser Location
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onCopyCoordinates}
            variant="soft"
          >
            Copy Lat/Lng
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

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="block text-sm font-medium text-primary-700">
            Delivery Enabled
          </span>
          <input
            type="checkbox"
            name="enabled"
            checked={deliverySettings.enabled !== false}
            onChange={onDeliverySettingsChange}
            className="mt-3 h-4 w-4 rounded border-gold-300 text-primary-700 focus:ring-gold-300"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-primary-700">
            Max Radius (km)
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            name="maxDeliveryRadiusKm"
            value={deliverySettings.maxDeliveryRadiusKm ?? ""}
            onChange={onDeliverySettingsChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-primary-700">
            Store Latitude
          </span>
          <input
            type="number"
            step="0.000001"
            name="storeLat"
            value={deliverySettings.storeLocation?.lat ?? ""}
            onChange={onDeliverySettingsChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-primary-700">
            Store Longitude
          </span>
          <input
            type="number"
            step="0.000001"
            name="storeLng"
            value={deliverySettings.storeLocation?.lng ?? ""}
            onChange={onDeliverySettingsChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </label>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-primary-700">
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
            className="text-sm font-semibold text-primary-700 hover:text-primary-900"
          >
            Open Store Location in Maps
          </a>
        </div>
      )}
    </SurfaceCard>
  );
};
