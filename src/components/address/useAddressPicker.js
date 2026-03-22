import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  haversineDistance,
  isWithinDeliveryRadius,
  normalizeDeliverySettings,
} from "../../utils/deliverySettings";
import {
  hasValidCoordinates,
  reverseGeocodeCoordinates,
  searchAddressSuggestions,
  toAddressFromSuggestion,
  GEOAPIFY_API_KEY,
} from "../../user/components/order/orderHelpers";

const useAddressPicker = (options = {}) => {
  const { initialAddress = null, onSave, onClose } = options;
  const { user } = useSelector((state) => state.auth);
  const deliverySettings = useSelector((state) => state.site.deliverySettings);

  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );
  const storeLocation = normalizedDeliverySettings.storeLocation || {
    lat: 0,
    lng: 0,
  };
  const maxDeliveryRadiusKm = Math.max(
    0,
    Number(normalizedDeliverySettings?.maxDeliveryRadiusKm) || 0,
  );
  const storeLat = Number(storeLocation?.lat);
  const storeLng = Number(storeLocation?.lng);
  const hasConfiguredStoreLocation = hasValidCoordinates(storeLat, storeLng);

  const [formData, setFormData] = useState({
    street: initialAddress?.street || "",
    city: initialAddress?.city || "",
    pincode: initialAddress?.zipCode || initialAddress?.pincode || "",
    phone: initialAddress?.phone || user?.phone || "",
    label: initialAddress?.label || "Home",
    landmark: initialAddress?.landmark || "",
  });

  const [addressMeta, setAddressMeta] = useState({
    placeId: initialAddress?.placeId || "",
    latitude: initialAddress?.latitude ?? null,
    longitude: initialAddress?.longitude ?? null,
    formattedAddress: initialAddress?.formattedAddress || "",
  });

  const [addressQuery, setAddressQuery] = useState(
    initialAddress?.formattedAddress || "",
  );
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLookupError, setAddressLookupError] = useState("");
  const [mapSdkReady, setMapSdkReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());

  const isAddressVerified = hasValidCoordinates(
    addressMeta.latitude,
    addressMeta.longitude,
  );

  const distanceFromStoreKm =
    isAddressVerified && hasConfiguredStoreLocation
      ? haversineDistance(
          storeLat,
          storeLng,
          Number(addressMeta.latitude),
          Number(addressMeta.longitude),
        )
      : null;

  const isAddressServiceable =
    hasConfiguredStoreLocation &&
    isWithinDeliveryRadius(
      storeLocation,
      Number(addressMeta.latitude),
      Number(addressMeta.longitude),
      maxDeliveryRadiusKm,
    );

  // Validate Geoapify key
  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      setMapSdkReady(false);
      setMapLoadError("Geoapify API key missing.");
      return;
    }
    setMapSdkReady(true);
    setMapLoadError("");
  }, []);

  // Cleanup debounce on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    [],
  );

  // ── EDIT mode: fill form from saved address ──
  useEffect(() => {
    if (!initialAddress) return;
    setFormData({
      street: initialAddress.street || "",
      city: initialAddress.city || "",
      pincode: initialAddress.zipCode || initialAddress.pincode || "",
      phone: initialAddress.phone || user?.phone || "",
      label: initialAddress.label || "Home",
      landmark: initialAddress.landmark || "",
    });
    setAddressMeta({
      placeId: initialAddress.placeId || "",
      latitude: initialAddress.latitude ?? null,
      longitude: initialAddress.longitude ?? null,
      formattedAddress: initialAddress.formattedAddress || "",
    });
    setAddressQuery(initialAddress.formattedAddress || "");
    setAddressPredictions([]);
    setAddressLookupError("");
  }, [initialAddress, user?.phone]);

  // ── ADD mode: reset form & auto-detect city/pincode from GPS ──
  useEffect(() => {
    if (initialAddress) return;

    // Reset all fields so edit data doesn't leak into add mode
    setFormData({
      street: "",
      city: "",
      pincode: "",
      phone: user?.phone || "",
      label: "Home",
      landmark: "",
    });
    setAddressMeta({
      placeId: "",
      latitude: null,
      longitude: null,
      formattedAddress: "",
    });
    setAddressQuery("");
    setAddressPredictions([]);
    setAddressLookupError("");

    // Auto-detect GPS — fills only city, pincode, and coordinates
    if (!navigator.geolocation) return;
    setAutoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const resolved = await resolveAddressFromCoordinates(lat, lng);
          setFormData((prev) => ({
            ...prev,
            city: resolved.city || prev.city,
            pincode: resolved.zipCode || prev.pincode,
          }));
          setAddressMeta({
            placeId: resolved.placeId || "",
            latitude: lat ?? resolved.latitude,
            longitude: lng ?? resolved.longitude,
            formattedAddress: resolved.formattedAddress || "",
          });
        } catch {
          // silently fail auto-detect
        } finally {
          setAutoDetecting(false);
        }
      },
      () => setAutoDetecting(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  const applyResolvedAddress = useCallback((resolved, lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      street: resolved.street || prev.street,
      city: resolved.city || prev.city,
      pincode: resolved.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: resolved.placeId || "",
      latitude: lat ?? resolved.latitude,
      longitude: lng ?? resolved.longitude,
      formattedAddress: resolved.formattedAddress || "",
    });
    setAddressQuery(resolved.formattedAddress || "");
    setAddressLookupError("");
  }, []);

  const resolveAddressFromCoordinates = useCallback(
    async (lat, lng) => reverseGeocodeCoordinates(lat, lng),
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

      const getCachedMatches = () => {
        const normalized = trimmed.toLowerCase();
        const directHit = cacheRef.current.get(normalized);
        if (Array.isArray(directHit) && directHit.length > 0) return directHit;

        const matches = [];
        cacheRef.current.forEach((entries, key) => {
          if (!key.includes(normalized) && !normalized.includes(key)) return;
          for (const entry of entries || []) {
            if (
              entry?.description?.toLowerCase().includes(normalized) &&
              !matches.some(
                (m) =>
                  (m.place_id || m.description) ===
                  (entry.place_id || entry.description),
              )
            ) {
              matches.push(entry);
            }
          }
        });
        return matches.slice(0, 8);
      };

      const cached = getCachedMatches();
      if (cached.length > 0) {
        setAddressPredictions(cached);
        setAddressLookupError("");
      }

      const reqId = ++requestIdRef.current;

      const loadSuggestions = async () => {
        try {
          const suggestions = await searchAddressSuggestions(trimmed, {
            near: hasConfiguredStoreLocation
              ? { lat: storeLat, lng: storeLng }
              : undefined,
            cityHint: formData.city || "Vizianagaram",
          });
          if (reqId !== requestIdRef.current) return;
          cacheRef.current.set(trimmed.toLowerCase(), suggestions);
          setAddressPredictions(suggestions);
          setAddressLookupError(
            suggestions.length === 0
              ? "No results found. Try a different search."
              : "",
          );
        } catch {
          if (reqId !== requestIdRef.current) return;
          const fallback = getCachedMatches();
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
    [formData.city, hasConfiguredStoreLocation, storeLat, storeLng],
  );

  const handleSelectPrediction = useCallback(
    (prediction) => {
      const fallback = toAddressFromSuggestion(prediction);
      if (fallback) {
        applyResolvedAddress(fallback);
        setAddressQuery(prediction.description || "");
        setAddressPredictions([]);
        return;
      }

      setAddressLookupError("Unable to resolve selected location.");
    },
    [applyResolvedAddress],
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
  }, [applyResolvedAddress, resolveAddressFromCoordinates]);

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
        setAddressLookupError(
          "Unable to resolve location. Try moving the pin.",
        );
      }
    },
    [applyResolvedAddress, resolveAddressFromCoordinates],
  );

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const street = formData.street.trim();
    const city = formData.city.trim();
    const pincode = formData.pincode.trim();
    const phone = formData.phone.trim();

    if (!street || !city || !pincode) {
      return {
        success: false,
        error: "Street, city, and pincode are required.",
      };
    }

    if (!phone) {
      return { success: false, error: "Phone number is required." };
    }

    if (!isAddressVerified) {
      return {
        success: false,
        error: "Please verify your address using search or current location.",
      };
    }

    if (!isAddressServiceable) {
      return {
        success: false,
        error: `This address is outside our ${maxDeliveryRadiusKm}km delivery area.`,
      };
    }

    const addressData = {
      label: formData.label.trim() || "Home",
      street,
      city,
      state: "Andhra Pradesh",
      zipCode: pincode,
      phone,
      landmark: formData.landmark.trim(),
      placeId: addressMeta.placeId || "",
      latitude: Number(addressMeta.latitude),
      longitude: Number(addressMeta.longitude),
      formattedAddress: addressMeta.formattedAddress || addressQuery || "",
    };

    onSave?.(addressData);
    return { success: true };
  }, [
    formData,
    addressMeta,
    addressQuery,
    isAddressVerified,
    isAddressServiceable,
    onSave,
  ]);

  return {
    formData,
    addressMeta,
    addressQuery,
    addressPredictions,
    addressLookupError,
    mapSdkReady,
    mapSdkConfigured: Boolean(GEOAPIFY_API_KEY),
    mapLoadError,
    locationLoading,
    autoDetecting,
    isAddressVerified,
    distanceFromStoreKm,
    isAddressServiceable,
    maxDeliveryRadiusKm,
    storeLocation,
    hasConfiguredStoreLocation,
    handleAddressQueryChange,
    handleSelectPrediction,
    handleUseCurrentLocation,
    handleMapPinChange,
    handleFormChange,
    handleSave,
  };
};

export default useAddressPicker;
