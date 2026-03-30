import React, { useEffect, useRef } from "react";
import {
  attachGoogleMapClickListener,
  attachGoogleMarkerDragEnd,
  createGoogleMap,
  createGoogleMarker,
  flyToGoogleLocation,
  removeGoogleInstance,
  setGoogleMarkerCoordinates,
} from "@/services/googleMapsAPI";

const AddressPickerMapSection = ({
  mapSdkReady,
  autoDetecting,
  mapLoadError,
  mapSdkConfigured,
  markerPosition,
  hasAddressCoordinates,
  handleMapPinChange,
  handleUseCurrentLocation,
  locationLoading,
  locationPermissionMessage,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapSdkReady || !mapRef.current || mapInstanceRef.current) {
      return undefined;
    }

    const [latitude, longitude] = markerPosition;
    const map = createGoogleMap({
      container: mapRef.current,
      center: { lat: latitude, lng: longitude },
      zoom: hasAddressCoordinates ? 16 : 14,
    });

    const detachClickListener = attachGoogleMapClickListener(
      map,
      handleMapPinChange,
    );

    mapInstanceRef.current = map;

    return () => {
      detachClickListener();
      removeGoogleInstance(markerRef.current);
      markerRef.current = null;
      removeGoogleInstance(mapInstanceRef.current);
      mapInstanceRef.current = null;
    };
  }, [handleMapPinChange, hasAddressCoordinates, mapSdkReady, markerPosition]);

  useEffect(() => {
    if (!mapSdkReady || !mapInstanceRef.current) {
      return undefined;
    }

    const [latitude, longitude] = markerPosition;
    removeGoogleInstance(markerRef.current);

    const marker = createGoogleMarker({
      map: mapInstanceRef.current,
      draggable: true,
      position: { lat: latitude, lng: longitude },
      title: "Delivery location pin",
    });

    const detachDragListener = attachGoogleMarkerDragEnd(
      marker,
      handleMapPinChange,
    );

    markerRef.current = marker;
    setGoogleMarkerCoordinates(markerRef.current, {
      lat: latitude,
      lng: longitude,
    });

    flyToGoogleLocation(
      mapInstanceRef.current,
      { lat: latitude, lng: longitude },
      hasAddressCoordinates ? 16 : 14,
    );

    return () => {
      detachDragListener();
    };
  }, [handleMapPinChange, hasAddressCoordinates, mapSdkReady, markerPosition]);

  return (
    <div className="relative mt-3">
      {mapSdkReady ? (
        <div
          ref={mapRef}
          className="h-56 w-full overflow-hidden rounded-[1.75rem] border border-white/60 bg-cream-100 shadow-[0_16px_36px_rgba(18,12,2,0.12)]"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center rounded-[1.75rem] bg-cream-100 px-4 text-center text-sm text-primary-600">
          {autoDetecting
            ? "Detecting your location..."
            : mapLoadError ||
              (mapSdkConfigured
                ? "Loading Google Maps..."
                : "Google Maps is unavailable right now. Use current location instead.")}
        </div>
      )}

      {mapSdkReady && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
          <div className="rounded-full bg-primary-900/85 px-4 py-2 text-xs font-medium text-white shadow-lg">
            Move the pin to your exact delivery location
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locationLoading}
        className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      {locationPermissionMessage && (
        <div className="mt-3 whitespace-pre-line rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
          {locationPermissionMessage}
        </div>
      )}
    </div>
  );
};

export default AddressPickerMapSection;
