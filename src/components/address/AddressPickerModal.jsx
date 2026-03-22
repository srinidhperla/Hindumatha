import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../features/uiSlice";
import {
  GEOAPIFY_API_KEY,
  hasValidCoordinates,
} from "../../user/components/order/orderHelpers";
import useAddressPicker from "./useAddressPicker";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const deliveryMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom, { animate: true });
  return null;
};

const MapClickHandler = ({ onSelect }) => {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

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
  const formattedAddr = addressMeta.formattedAddress || "";

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
          <div className="px-4 pt-3 sm:px-5">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={addressQuery}
                onChange={handleAddressQueryChange}
                placeholder="Search for area, street name..."
                className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-11 pr-4 text-sm text-primary-800 placeholder-primary-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                autoFocus
              />
            </div>

            {addressPredictions.length > 0 && (
              <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-primary-200 bg-white shadow-lg">
                {addressPredictions.map((prediction) => {
                  const key = prediction.place_id || prediction.description;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPrediction(prediction)}
                      className="flex w-full items-start gap-3 border-b border-cream-100 px-4 py-3 text-left text-sm text-primary-700 transition hover:bg-caramel-50 last:border-b-0"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="line-clamp-2">
                        {prediction.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {addressLookupError && (
              <p className="mt-2 text-xs text-amber-600">
                {addressLookupError}
              </p>
            )}
          </div>

          <div className="relative mt-3">
            {mapSdkReady ? (
              <div className="h-52 w-full overflow-hidden bg-cream-100 sm:h-56">
                <MapContainer
                  center={markerPosition}
                  zoom={hasAddressCoordinates ? 16 : 14}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.geoapify.com/">Geoapify</a>'
                    url={tileUrl}
                  />
                  <MapRecenter
                    center={markerPosition}
                    zoom={hasAddressCoordinates ? 16 : 14}
                  />
                  <MapClickHandler onSelect={handleMapPinChange} />
                  <Marker
                    position={markerPosition}
                    icon={deliveryMarkerIcon}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const point = event.target.getLatLng();
                        handleMapPinChange({ lat: point.lat, lng: point.lng });
                      },
                    }}
                  />
                </MapContainer>
              </div>
            ) : (
              <div className="flex h-52 w-full items-center justify-center bg-cream-100 text-center text-sm text-primary-600 sm:h-56">
                {autoDetecting
                  ? "Detecting your location..."
                  : mapLoadError ||
                    (mapSdkConfigured
                      ? "Loading map..."
                      : "Map unavailable. Use current location instead.")}
              </div>
            )}

            {mapSdkReady && (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
                <div className="rounded-full bg-primary-900/85 px-4 py-2 text-xs font-medium text-white shadow-lg">
                  Move pin to your exact delivery location
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-primary-50 disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v4m0 12v4m10-10h-4M6 12H2"
                />
              </svg>
              {locationLoading ? "Detecting..." : "Use current location"}
            </button>
          </div>

          <div className="mt-1 rounded-t-3xl border-t border-gold-200/60 bg-white px-4 pb-4 pt-5 sm:rounded-t-none sm:px-5">
            <div className="mb-4 flex justify-center sm:hidden">
              <div className="h-1 w-10 rounded-full bg-cream-300" />
            </div>

            <p className="text-sm font-semibold text-primary-600">
              Delivery details
            </p>

            {formattedAddr ? (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-caramel-200 bg-caramel-50/60 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <svg
                    className="h-4 w-4 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-primary-900">
                    {formattedAddr.split(",").slice(0, 2).join(",")}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-primary-600">
                    {formattedAddr.split(",").slice(2).join(",").trim()}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-1">
                  {isAddressVerified && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isAddressServiceable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isAddressServiceable ? "Deliverable" : "Out of range"}
                    </span>
                  )}
                  {hasDistance && (
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                      {distanceFromStoreKm.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-primary-200 bg-cream-50 p-4 text-center text-sm text-primary-500">
                {autoDetecting
                  ? "Detecting your location..."
                  : "Search or use current location to select address"}
              </div>
            )}

            {isAddressVerified && !isAddressServiceable && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                This address is outside our {maxDeliveryRadiusKm}km delivery
                area. Please choose a closer location.
              </div>
            )}

            <div className="mt-4">
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Address details<span className="text-red-400">*</span>
                </span>
                <textarea
                  name="street"
                  value={formData.street}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Floor, Flat no., Tower, Building name"
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  City
                </span>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Pincode
                </span>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleFormChange}
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>

            <div className="mt-3">
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Landmark <span className="text-primary-400">(optional)</span>
                </span>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleFormChange}
                  placeholder="Nearby landmark"
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>

            <p className="mt-5 text-sm font-semibold text-primary-600">
              Receiver details for this address
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Phone<span className="text-red-400">*</span>
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="10-digit phone"
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Label
                </span>
                <select
                  name="label"
                  value={formData.label}
                  onChange={handleFormChange}
                  className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
          </div>
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
