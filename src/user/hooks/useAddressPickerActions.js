import { useCallback, useEffect, useRef } from "react";
import {
  getCachedMatches,
  loadAddressSuggestions,
} from "@/user/hooks/useAddressPicker.utils";
import { resetAutocompleteSession } from "@/user/components/order/orderHelpers";

const LOCATION_BLOCKED_MESSAGE = `Location access is blocked. Please enable to use current location feature`;

const useAddressPickerActions = ({
  formDataCity,
  hasConfiguredStoreLocation,
  storeLat,
  storeLng,
  setAddressMeta,
  setAddressPredictions,
  setAddressQuery,
  setAddressLookupError,
  setLocationPermissionMessage,
  setLocationLoading,
  applyResolvedAddress,
  resolveAddressFromCoordinates,
}) => {
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleAddressQueryChange = useCallback(
    (event) => {
      const query = event.target.value;
      const trimmed = query.trim();

      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      setAddressQuery(query);
      setLocationPermissionMessage("");

      if (trimmed.length < 2) {
        requestIdRef.current += 1;
        resetAutocompleteSession();
        setAddressPredictions([]);
        setAddressLookupError("");
        return;
      }

      const cached = getCachedMatches(cacheRef.current, trimmed);
      if (cached.length > 0) {
        setAddressPredictions(cached);
        setAddressLookupError("");
      }

      const reqId = ++requestIdRef.current;

      const loadSuggestions = async () => {
        try {
          const suggestions = await loadAddressSuggestions({
            query: trimmed,
            cache: cacheRef.current,
            hasConfiguredStoreLocation,
            storeLat,
            storeLng,
            city: formDataCity,
          });
          if (reqId !== requestIdRef.current) return;
          setAddressPredictions(suggestions);
          setAddressLookupError(
            suggestions.length === 0
              ? "No results found. Try a different search."
              : "",
          );
        } catch {
          if (reqId !== requestIdRef.current) return;
          const fallback = getCachedMatches(cacheRef.current, trimmed);
          if (fallback.length > 0) {
            setAddressPredictions(fallback);
            setAddressLookupError("Showing cached results.");
          } else {
            setAddressPredictions([]);
            setAddressLookupError("Search temporarily unavailable.");
          }
        }
      };

      debounceRef.current = window.setTimeout(() => {
        loadSuggestions();
      }, 350);
    },
    [
      formDataCity,
      hasConfiguredStoreLocation,
      setAddressLookupError,
      setAddressPredictions,
      setAddressQuery,
      setLocationPermissionMessage,
      storeLat,
      storeLng,
    ],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setAddressLookupError(
        "Location services are not available in this browser.",
      );
      return;
    }

    setLocationLoading(true);
    setAddressQuery("");
    setAddressPredictions([]);
    setAddressLookupError("");
    setLocationPermissionMessage("");

    if (navigator.permissions?.query) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus?.state === "denied") {
          setLocationLoading(false);
          setLocationPermissionMessage(LOCATION_BLOCKED_MESSAGE);
          return;
        }
      } catch {
        // Permission API can fail in some browsers; continue to geolocation API.
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const resolved = await resolveAddressFromCoordinates(lat, lng);
          resetAutocompleteSession();
          applyResolvedAddress(resolved, lat, lng);
          setLocationPermissionMessage("");
        } catch {
          setAddressLookupError("Unable to detect your address.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        if (error?.code === 1) {
          setLocationPermissionMessage(LOCATION_BLOCKED_MESSAGE);
          return;
        }
        setAddressLookupError("Unable to detect your address.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [
    applyResolvedAddress,
    resolveAddressFromCoordinates,
    setAddressLookupError,
    setAddressPredictions,
    setAddressQuery,
    setLocationPermissionMessage,
    setLocationLoading,
  ]);

  const handleMapPinChange = useCallback(
    async ({ lat, lng }) => {
      const nextLat = Number(lat);
      const nextLng = Number(lng);
      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

      try {
        const resolved = await resolveAddressFromCoordinates(nextLat, nextLng);
        resetAutocompleteSession();
        applyResolvedAddress(resolved, nextLat, nextLng);
        setLocationPermissionMessage("");
      } catch {
        setAddressMeta((prev) => ({
          ...prev,
          latitude: nextLat,
          longitude: nextLng,
        }));
        setAddressLookupError(
          "Unable to resolve location. Try moving the pin.",
        );
      }
    },
    [
      applyResolvedAddress,
      resolveAddressFromCoordinates,
      setAddressLookupError,
      setAddressMeta,
      setLocationPermissionMessage,
    ],
  );

  return {
    handleAddressQueryChange,
    handleUseCurrentLocation,
    handleMapPinChange,
  };
};

export default useAddressPickerActions;
