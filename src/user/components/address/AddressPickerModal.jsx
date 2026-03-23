import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@/features/uiSlice";
import {
  GEOAPIFY_API_KEY,
  hasValidCoordinates,
} from "@/user/components/order/orderHelpers";
import useAddressPicker from "@/user/hooks/useAddressPicker";
import AddressPickerDetailsSection from "./AddressPickerDetailsSection";
import AddressPickerMapSection from "./AddressPickerMapSection";
import AddressPickerSearchSection from "./AddressPickerSearchSection";

const AddressPickerModal = ({ isOpen, onClose, onSave, initialAddress }) => {
  const dispatch = useDispatch();

  const handleSaveAddress = (addressData) => {
    onSave(addressData);
    onClose();
  };

  const picker = useAddressPicker({
    initialAddress,
    onSave: handleSaveAddress,
  });

  const {
    formData,
    addressMeta,
    addressQuery,
    addressPredictions,
    addressLookupError,
    mapSdkReady,
    mapSdkConfigured,
    mapLoadError,
    locationLoading,
    autoDetecting,
    isAddressVerified,
    distanceFromStoreKm,
    isAddressServiceable,
    maxDeliveryRadiusKm,
    storeLocation,
    handleAddressQueryChange,
    handleSelectPrediction,
    handleUseCurrentLocation,
    handleMapPinChange,
    handleFormChange,
    handleSave,
  } = picker;

  const hasAddressCoordinates = hasValidCoordinates(
    addressMeta.latitude,
    addressMeta.longitude,
  );

  const initialMapCenter = useMemo(() => {
    if (hasAddressCoordinates) {
      return {
        lat: Number(addressMeta.latitude),
        lng: Number(addressMeta.longitude),
      };
    }
    const sLat = Number(storeLocation?.lat);
    const sLng = Number(storeLocation?.lng);
    if (
      Number.isFinite(sLat) &&
      Number.isFinite(sLng) &&
      !(sLat === 0 && sLng === 0)
    ) {
      return { lat: sLat, lng: sLng };
    }
    return { lat: 18.1067, lng: 83.3956 };
  }, [
    addressMeta.latitude,
    addressMeta.longitude,
    hasAddressCoordinates,
    storeLocation,
  ]);

  const markerPosition = hasAddressCoordinates
    ? [Number(addressMeta.latitude), Number(addressMeta.longitude)]
    : [initialMapCenter.lat, initialMapCenter.lng];

  const tileUrl = `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(
    GEOAPIFY_API_KEY,
  )}`;

  const onSaveClick = () => {
    const result = handleSave();
    if (!result.success) {
      dispatch(showToast({ type: "error", message: result.error }));
    }
  };

  if (!isOpen) return null;

  const hasDistance = Number.isFinite(distanceFromStoreKm);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream-50 sm:items-center sm:justify-center sm:bg-[rgba(18,12,2,0.68)] sm:p-4">
      <div className="flex h-full w-full flex-col sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-lg sm:overflow-hidden sm:rounded-3xl sm:border sm:border-gold-200/70 sm:bg-[linear-gradient(160deg,#fffefb_0%,#f9f1e4_100%)] sm:shadow-[0_30px_70px_rgba(18,12,2,0.32)]">
        <div className="flex items-center gap-3 border-b border-gold-200/60 bg-white/80 px-4 py-3 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-primary-600 transition hover:bg-caramel-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="font-playfair text-lg font-bold text-primary-900">
            Select delivery location
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AddressPickerSearchSection
            addressQuery={addressQuery}
            handleAddressQueryChange={handleAddressQueryChange}
            addressPredictions={addressPredictions}
            handleSelectPrediction={handleSelectPrediction}
            addressLookupError={addressLookupError}
          />

          <AddressPickerMapSection
            mapSdkReady={mapSdkReady}
            autoDetecting={autoDetecting}
            mapLoadError={mapLoadError}
            mapSdkConfigured={mapSdkConfigured}
            tileUrl={tileUrl}
            markerPosition={markerPosition}
            hasAddressCoordinates={hasAddressCoordinates}
            handleMapPinChange={handleMapPinChange}
            handleUseCurrentLocation={handleUseCurrentLocation}
            locationLoading={locationLoading}
          />

          <AddressPickerDetailsSection
            autoDetecting={autoDetecting}
            addressMeta={addressMeta}
            formData={formData}
            isAddressVerified={isAddressVerified}
            isAddressServiceable={isAddressServiceable}
            hasDistance={hasDistance}
            distanceFromStoreKm={distanceFromStoreKm}
            maxDeliveryRadiusKm={maxDeliveryRadiusKm}
            handleFormChange={handleFormChange}
          />
        </div>

        <div className="border-t border-gold-200/70 bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onSaveClick}
            disabled={
              !formData.street.trim() ||
              !formData.city.trim() ||
              !formData.pincode.trim() ||
              !formData.phone.trim() ||
              !isAddressVerified ||
              !isAddressServiceable
            }
            className="w-full rounded-2xl bg-primary-600 px-6 py-3.5 text-base font-bold text-white shadow-warm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save address
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressPickerModal;
