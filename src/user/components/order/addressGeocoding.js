export const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

export {
  GOOGLE_MAPS_API_KEY,
  attachGoogleMapClickListener,
  attachGoogleMarkerDragEnd,
  calculateDistanceMatrix,
  createGoogleInfoWindow,
  createGoogleMap,
  createGoogleMarker,
  flyToGoogleLocation,
  hasValidCoordinates,
  isGoogleMapsSdkReady,
  removeGoogleInstance,
  reverseGeocodeCoordinates,
  searchAddressSuggestions,
  setGoogleMarkerCoordinates,
  toAddressFromSuggestion,
  toCoordinate,
  waitForGoogleMapsSdk,
} from "@/services/googleMapsAPI";

