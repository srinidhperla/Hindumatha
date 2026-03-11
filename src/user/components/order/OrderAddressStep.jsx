import React, { useEffect, useMemo, useRef, useState } from "react";
import { hasValidCoordinates } from "./orderHelpers";

const OrderAddressStep = ({
  formData,
  savedAddresses,
  addressMode,
  editingAddressId,
  selectedAddressId,
  addressQuery,
  addressPredictions,
  addressLookupError,
  googleMapsReady,
  googleMapsConfigured,
  mapLoadError,
  locationLoading,
  addressLabel,
  isAddressVerified,
  distanceFromStoreKm,
  isAddressServiceable,
  maxDeliveryRadiusKm,
  storeLocation,
  addressLatitude,
  addressLongitude,
  hasConfiguredStoreLocation,
  saveAddressForNextTime,
  loading,
  error,
  invalidItems,
  pricing,
  onChange,
  onSavedAddressSelect,
  onStartNewAddress,
  onEditSavedAddress,
  onDeleteSavedAddress,
  onAddressQueryChange,
  onSelectPrediction,
  onUseCurrentLocation,
  onMapPinChange,
  onAddressLabelChange,
  onSaveAddressToggle,
  onSaveAddress,
  onCancelAddressModal,
  onBack,
}) => {
  const isAddressModalOpen = addressMode === "new" || addressMode === "edit";
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [modalStep, setModalStep] = useState(1);

  useEffect(() => {
    if (!isAddressModalOpen) {
      setModalStep(1);
    }
  }, [isAddressModalOpen]);

  const hasAddressCoordinates = hasValidCoordinates(
    addressLatitude,
    addressLongitude,
  );
  const hasDistanceFromStore = Number.isFinite(distanceFromStoreKm);

  const initialMapCenter = useMemo(() => {
    if (hasAddressCoordinates) {
      return {
        lat: Number(addressLatitude),
        lng: Number(addressLongitude),
      };
    }

    const storeLat = Number(storeLocation?.lat);
    const storeLng = Number(storeLocation?.lng);
    if (
      Number.isFinite(storeLat) &&
      Number.isFinite(storeLng) &&
      !(storeLat === 0 && storeLng === 0)
    ) {
      return { lat: storeLat, lng: storeLng };
    }

    return { lat: 18.1067, lng: 83.3956 };
  }, [addressLatitude, addressLongitude, hasAddressCoordinates, storeLocation]);

  useEffect(() => {
    if (
      !isAddressModalOpen ||
      !googleMapsReady ||
      !window.google ||
      !mapRef.current
    ) {
      return;
    }

    const map =
      mapInstanceRef.current ||
      new window.google.maps.Map(mapRef.current, {
        center: initialMapCenter,
        zoom: hasAddressCoordinates ? 16 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

    mapInstanceRef.current = map;

    const marker =
      markerRef.current ||
      new window.google.maps.Marker({
        map,
        position: initialMapCenter,
        draggable: true,
        title: "Delivery location",
      });

    markerRef.current = marker;
    marker.setPosition(initialMapCenter);
    map.setCenter(initialMapCenter);

    const dragEndListener = marker.addListener("dragend", (event) => {
      onMapPinChange?.({
        lat: event.latLng?.lat(),
        lng: event.latLng?.lng(),
      });
    });

    const clickListener = map.addListener("click", (event) => {
      const nextPosition = {
        lat: event.latLng?.lat(),
        lng: event.latLng?.lng(),
      };
      marker.setPosition(nextPosition);
      onMapPinChange?.(nextPosition);
    });

    return () => {
      window.google.maps.event.removeListener(dragEndListener);
      window.google.maps.event.removeListener(clickListener);
    };
  }, [
    googleMapsReady,
    hasAddressCoordinates,
    initialMapCenter,
    isAddressModalOpen,
    onMapPinChange,
  ]);

  return (
    <div className="commerce-section-body">
      <h2 className="commerce-section-title">Contact and address</h2>
      <p className="commerce-section-copy">
        Pick a saved address, or add a new one. We verify the location and
        delivery radius before saving.
      </p>

      <div className="commerce-form-stack">
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
                          {[address.street, address.city, address.zipCode]
                            .filter(Boolean)
                            .join(", ")}
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

        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary-800">
              Verify with current location
            </p>
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={locationLoading}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locationLoading ? "Detecting..." : "Use Current Address"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
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
          <p className="mt-2 text-xs text-slate-500">
            Delivery radius: {maxDeliveryRadiusKm} km from store location.
          </p>
        </div>

        <div className="commerce-form-grid">
          <label className="block">
            <span className="commerce-field-label">Full Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              required
              className="commerce-input"
            />
          </label>

          <label className="block">
            <span className="commerce-field-label">Phone Number</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              required
              className="commerce-input"
            />
          </label>
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

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {addressMode === "edit" ? "Edit address" : "Add new address"}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Step {modalStep} of 3
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelAddressModal}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5 flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= modalStep ? "bg-primary-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Find address via search or location */}
            {modalStep === 1 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="commerce-field-label">Search Address</span>
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={onAddressQueryChange}
                    placeholder="Search for area, street name…"
                    className="commerce-input"
                    autoFocus
                  />
                </label>

                {addressPredictions?.length > 0 && (
                  <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                    {addressPredictions.map((prediction) => {
                      const predictionKey =
                        prediction.place_id || prediction.description;
                      return (
                        <button
                          key={predictionKey}
                          type="button"
                          onClick={() => {
                            onSelectPrediction(prediction);
                            setModalStep(2);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {prediction.description}
                        </button>
                      );
                    })}
                  </div>
                )}

                {addressLookupError ? (
                  <p className="text-sm text-amber-700">{addressLookupError}</p>
                ) : null}

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  {googleMapsReady ? (
                    <div
                      ref={mapRef}
                      className="h-56 w-full bg-slate-100"
                      aria-label="Delivery location map"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-slate-100 p-4 text-center text-sm text-slate-600">
                      {mapLoadError ||
                        (googleMapsConfigured
                          ? "Loading map…"
                          : "Google map key missing. Use current location instead.")}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Tap on the map or drag the pin to set exact delivery location.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onUseCurrentLocation(false)}
                    disabled={locationLoading}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locationLoading ? "Detecting…" : "Use Current Location"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    disabled={!formData.address && !addressQuery}
                    className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next: Confirm Details →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Address details */}
            {modalStep === 2 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="commerce-field-label">
                    Street / House No.
                  </span>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    rows={3}
                    required
                    className="commerce-input"
                    placeholder="House no, street, area, landmark"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="commerce-field-label">City</span>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={onChange}
                      required
                      className="commerce-input"
                    />
                  </label>

                  <label className="block">
                    <span className="commerce-field-label">Pincode</span>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={onChange}
                      required
                      className="commerce-input"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 font-semibold ${
                      isAddressVerified
                        ? "bg-sage-100 text-sage-700"
                        : "bg-caramel-100 text-caramel-700"
                    }`}
                  >
                    {isAddressVerified ? "Location verified" : "Not verified"}
                  </span>
                  {hasDistanceFromStore && (
                    <span className="rounded-full bg-cream-100 px-3 py-1 font-semibold text-primary-700">
                      {distanceFromStoreKm.toFixed(2)} km away
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 font-semibold ${
                      isAddressServiceable
                        ? "bg-sage-100 text-sage-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isAddressServiceable ? "Serviceable" : "Out of range"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="btn-secondary"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    disabled={
                      !formData.address.trim() ||
                      !formData.city.trim() ||
                      !formData.pincode.trim()
                    }
                    className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next: Contact Info →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact + label + save */}
            {modalStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="commerce-field-label">Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={onChange}
                      required
                      className="commerce-input"
                    />
                  </label>

                  <label className="block">
                    <span className="commerce-field-label">Address Label</span>
                    <select
                      value={addressLabel}
                      onChange={(event) =>
                        onAddressLabelChange(event.target.value)
                      }
                      className="commerce-input"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="inline-flex items-center gap-3 text-sm text-primary-700">
                  <input
                    type="checkbox"
                    checked={saveAddressForNextTime}
                    onChange={(event) =>
                      onSaveAddressToggle(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-cream-300 text-primary-600 focus:ring-primary-500"
                  />
                  Save this address for faster checkout next time
                </label>

                {!hasConfiguredStoreLocation && (
                  <p className="rounded-xl border border-caramel-200 bg-caramel-50 px-3 py-2 text-sm text-caramel-700">
                    Store location is not configured. Please contact support.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="btn-secondary"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={onSaveAddress}
                    disabled={loading}
                    className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Saving…"
                      : addressMode === "edit"
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAddressStep;
