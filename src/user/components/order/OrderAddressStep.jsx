import React, { useMemo } from "react";
import AddressPickerModal from "@/user/components/address/AddressPickerModal";
import { formatAddressText } from "@/utils/mapsLinks";

const OrderAddressStep = ({
  savedAddresses,
  addressMode,
  editingAddressId,
  selectedAddressId,
  isAddressVerified,
  distanceFromStoreKm,
  isAddressServiceable,
  maxDeliveryRadiusKm,
  error,
  onSavedAddressSelect,
  onStartNewAddress,
  onEditSavedAddress,
  onDeleteSavedAddress,
  onSaveAddress,
  onCancelAddressModal,
  onBack,
}) => {
  const isAddressModalOpen = addressMode === "new" || addressMode === "edit";

  const hasDistanceFromStore = Number.isFinite(distanceFromStoreKm);

  const editingAddress = useMemo(() => {
    if (addressMode === "edit" && editingAddressId) {
      return savedAddresses.find((a) => a.id === editingAddressId) || null;
    }
    return null;
  }, [addressMode, editingAddressId, savedAddresses]);

  return (
    <div className="commerce-section-body">
      <h2 className="commerce-section-title">Contact and address</h2>
      <p className="commerce-section-copy">
        Pick a saved address, or add a new one. We verify the location and
        delivery radius before saving.
      </p>

      <div id="checkout-address-section" className="commerce-form-stack">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="commerce-field-label">Delivery addresses</p>
            <button
              type="button"
              onClick={onStartNewAddress}
              className="btn-secondary"
            >
              + Add New Address
            </button>
          </div>
          {savedAddresses.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedAddresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                const isEditing = editingAddressId === address.id;
                return (
                  <article
                    key={address.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-primary-400 bg-primary-50"
                        : "border-cream-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-primary-800">
                          {address.label}
                          {address.isDefault && (
                            <span className="ml-2 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold text-sage-700">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-primary-600">
                          {formatAddressText(address)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSavedAddressSelect(address)}
                        className="rounded-xl border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        {isSelected ? "Selected" : "Deliver Here"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditSavedAddress(address)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                          isEditing
                            ? "border-caramel-300 bg-caramel-50 text-caramel-700"
                            : "border-cream-300 text-primary-700 hover:bg-cream-100"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSavedAddress(address.id)}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 text-sm text-primary-600">
              No saved addresses yet. Add your first address.
            </div>
          )}
        </div>

        {/* Delivery status badges */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                isAddressVerified
                  ? "bg-sage-100 text-sage-700"
                  : "bg-caramel-100 text-caramel-700"
              }`}
            >
              {isAddressVerified
                ? "Verified location"
                : "Location not verified"}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                isAddressServiceable
                  ? "bg-sage-100 text-sage-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isAddressServiceable
                ? "Within delivery area"
                : "Outside delivery area"}
            </span>
            {hasDistanceFromStore && (
              <span className="rounded-full bg-cream-100 px-3 py-1 font-semibold text-primary-700">
                {distanceFromStoreKm.toFixed(2)} km away
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-primary-500">
            Delivery radius: {maxDeliveryRadiusKm} km from store location.
          </p>
        </div>
      </div>

      {error && (
        <div className="commerce-alert commerce-alert--danger">{error}</div>
      )}

      <div className="commerce-inline-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back to Review
        </button>
      </div>

      <AddressPickerModal
        isOpen={isAddressModalOpen}
        onClose={onCancelAddressModal}
        onSave={onSaveAddress}
        initialAddress={editingAddress}
      />
    </div>
  );
};

export default OrderAddressStep;
