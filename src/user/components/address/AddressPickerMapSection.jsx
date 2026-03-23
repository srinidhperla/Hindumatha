import React from "react";
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

const AddressPickerMapSection = ({
  mapSdkReady,
  autoDetecting,
  mapLoadError,
  mapSdkConfigured,
  tileUrl,
  markerPosition,
  hasAddressCoordinates,
  handleMapPinChange,
  handleUseCurrentLocation,
  locationLoading,
}) => (
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
);

export default AddressPickerMapSection;
