import { useCallback, useEffect, useRef } from "react";
import { getCachedMatches, loadAddressSuggestions } from "@/user/hooks/useAddressPicker.utils";

const useAddressPickerActions = ({
  formDataCity,
  hasConfiguredStoreLocation,
  storeLat,
  storeLng,
  setAddressMeta,
  setAddressPredictions,
  setAddressQuery,
  setAddressLookupError,
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

      if (trimmed.length < 2) {
        requestIdRef.current += 1;
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
      storeLat,
      storeLng,
    ],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const resolved = await resolveAddressFromCoordinates(lat, lng);
          applyResolvedAddress(resolved, lat, lng);
        } catch {
          setAddressLookupError("Unable to detect your address.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setAddressLookupError("Location access denied. Enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [
    applyResolvedAddress,
    resolveAddressFromCoordinates,
    setAddressLookupError,
    setLocationLoading,
  ]);

  const handleMapPinChange = useCallback(
    async ({ lat, lng }) => {
      const nextLat = Number(lat);
      const nextLng = Number(lng);
      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

      try {
        const resolved = await resolveAddressFromCoordinates(nextLat, nextLng);
        applyResolvedAddress(resolved, nextLat, nextLng);
      } catch {
        setAddressMeta((prev) => ({
          ...prev,
          latitude: nextLat,
          longitude: nextLng,
        }));
        setAddressLookupError("Unable to resolve location. Try moving the pin.");
      }
    },
    [
      applyResolvedAddress,
      resolveAddressFromCoordinates,
      setAddressLookupError,
      setAddressMeta,
    ],
  );

  return {
    handleAddressQueryChange,
    handleUseCurrentLocation,
    handleMapPinChange,
  };
};

export default useAddressPickerActions;
