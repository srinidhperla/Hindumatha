import React, { useMemo, useState } from "react";
import AddressPickerModal from "@/user/components/address/AddressPickerModal";
import { formatAddressText } from "@/utils/mapsLinks";

/**
 * Shows only the address being delivered to. Every other saved address lives
 * behind "Change", so the checkout list stays short on phones.
 */
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
}) => {
  const isAddressModalOpen = addressMode === "new" || addressMode === "edit";
  const hasDistanceFromStore = Number.isFinite(distanceFromStoreKm);
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  const editingAddress = useMemo(() => {
    if (addressMode === "edit" && editingAddressId) {
      return savedAddresses.find((a) => a.id === editingAddressId) || null;
    }
    return null;
  }, [addressMode, editingAddressId, savedAddresses]);

  // Falls back to the default address so the page always shows one target.
  const activeAddress = useMemo(() => {
    if (!Array.isArray(savedAddresses) || savedAddresses.length === 0) {
      return null;
    }

    return (
      savedAddresses.find((address) => address.id === selectedAddressId) ||
      savedAddresses.find((address) => address.isDefault) ||
      savedAddresses[0]
    );
  }, [savedAddresses, selectedAddressId]);

  const handleChooseAddress = (address) => {
    onSavedAddressSelect(address);
    setIsChooserOpen(false);
  };

  return (
    <>
      <div id="checkout-address-section" className="checkout-group">
        <div className="checkout-group-head">
          <p className="checkout-group-label">Deliver to</p>
          {activeAddress ? (
            <button
              type="button"
              onClick={() =>
                savedAddresses.length > 1
                  ? setIsChooserOpen(true)
                  : onEditSavedAddress(activeAddress)
              }
              className="checkout-group-action"
            >
              {savedAddresses.length > 1 ? "Change" : "Edit"}
            </button>
          ) : null}
        </div>

        {activeAddress ? (
          <>
            <div className="checkout-addr">
              <div className="min-w-0">
                <p className="checkout-addr-label">
                  {activeAddress.label}
                  {activeAddress.isDefault ? (
                    <span className="checkout-chip ml-2 bg-sage-100 text-sage-700">
                      Default
                    </span>
                  ) : null}
                </p>
                <p className="checkout-addr-text">
                  {formatAddressText(activeAddress)}
                </p>
              </div>
            </div>

            <div className="checkout-status">
              <span
                className={
                  isAddressVerified ? "text-sage-700" : "text-caramel-700"
                }
              >
                {isAddressVerified ? "✓ Verified" : "! Not verified"}
              </span>
              <span className="text-primary-300">·</span>
              <span
                className={
                  isAddressServiceable ? "text-sage-700" : "text-rose-600"
                }
              >
                {isAddressServiceable
                  ? "Within delivery area"
                  : `Outside ${maxDeliveryRadiusKm} km delivery area`}
              </span>
              {hasDistanceFromStore ? (
                <>
                  <span className="text-primary-300">·</span>
                  <span className="text-primary-600">
                    {distanceFromStoreKm.toFixed(1)} km away
                  </span>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onStartNewAddress}
              className="mt-2.5 text-xs font-bold text-caramel-700 underline underline-offset-2"
            >
              + Add new address
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartNewAddress}
            className="w-full rounded-xl border border-dashed border-caramel-400 bg-caramel-50/50 px-3 py-3 text-sm font-bold text-caramel-800 transition active:scale-[0.99]"
          >
            + Add delivery address
          </button>
        )}

        {error ? <p className="checkout-inline-note">{error}</p> : null}
      </div>

      {isChooserOpen ? (
        <div
          className="checkout-sheet"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsChooserOpen(false);
            }
          }}
        >
          <div className="checkout-sheet-card">
            <div className="checkout-sheet-head">
              <p className="text-sm font-bold text-primary-900">
                Choose delivery address
              </p>
              <button
                type="button"
                onClick={() => setIsChooserOpen(false)}
                className="text-xs font-bold text-primary-500"
              >
                Close
              </button>
            </div>

            <div className="checkout-sheet-body">
              {savedAddresses.map((address) => (
                <div key={address.id} className="checkout-sheet-row">
                  <button
                    type="button"
                    onClick={() => handleChooseAddress(address)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="checkout-addr-label">
                      {address.label}
                      {address.id === activeAddress?.id ? (
                        <span className="checkout-chip ml-2 bg-caramel-100 text-caramel-800">
                          Selected
                        </span>
                      ) : null}
                    </p>
                    <p className="checkout-addr-text">
                      {formatAddressText(address)}
                    </p>
                  </button>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChooserOpen(false);
                        onEditSavedAddress(address);
                      }}
                      className="text-xs font-bold text-caramel-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedAddress(address.id)}
                      className="text-xs font-bold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-primary-100 p-3">
              <button
                type="button"
                onClick={() => {
                  setIsChooserOpen(false);
                  onStartNewAddress();
                }}
                className="w-full rounded-xl border border-dashed border-caramel-400 bg-caramel-50/50 px-3 py-2.5 text-sm font-bold text-caramel-800"
              >
                + Add new address
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddressPickerModal
        isOpen={isAddressModalOpen}
        onClose={onCancelAddressModal}
        onSave={onSaveAddress}
        initialAddress={editingAddress}
      />
    </>
  );
};

export default OrderAddressStep;
