import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  haversineDistance,
  isWithinDeliveryRadius,
  normalizeDeliverySettings,
} from "@/utils/deliverySettings";
import {
  hasValidCoordinates,
  GOOGLE_MAPS_API_KEY,
  reverseGeocodeCoordinates,
  toAddressFromSuggestion,
  calculateDistanceMatrix,
  waitForGoogleMapsSdk,
} from "@/user/components/order/orderHelpers";
import {
  buildSaveAddressPayload,
  createAddressMetaFromAddress,
  createEmptyAddressMeta,
  createEmptyFormData,
  createFormDataFromAddress,
} from "@/user/hooks/useAddressPicker.utils";
import useAddressPickerActions from "@/user/hooks/useAddressPickerActions";

export const useAddressPickerLegacy = (options = {}) => {
  const { initialAddress = null, onSave } = options;
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

  const [formData, setFormData] = useState(
    createFormDataFromAddress(initialAddress, user?.phone),
  );

  const [addressMeta, setAddressMeta] = useState(
    createAddressMetaFromAddress(initialAddress),
  );

  const [addressQuery, setAddressQuery] = useState(
    initialAddress?.formattedAddress || "",
  );
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLookupError, setAddressLookupError] = useState("");
  const [mapSdkReady, setMapSdkReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);

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

  // Validate Google key (legacy hook kept for backward compatibility)
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapSdkReady(false);
      setMapLoadError("Google Maps API key missing.");
      return;
    }
    setMapSdkReady(true);
    setMapLoadError("");
  }, []);

  // EDIT mode: fill form from saved address
  useEffect(() => {
    if (!initialAddress) return;
    setFormData(createFormDataFromAddress(initialAddress, user?.phone));
    setAddressMeta(createAddressMetaFromAddress(initialAddress));
    setAddressQuery(initialAddress.formattedAddress || "");
    setAddressPredictions([]);
    setAddressLookupError("");
  }, [initialAddress, user?.phone]);

  // ADD mode: reset form & auto-detect city/pincode from GPS
  useEffect(() => {
    if (initialAddress) return;

    // Reset all fields so edit data doesn't leak into add mode
    setFormData(createEmptyFormData(user?.phone));
    setAddressMeta(createEmptyAddressMeta());
    setAddressQuery("");
    setAddressPredictions([]);
    setAddressLookupError("");

    // Auto-detect GPS -- fills only city, pincode, and coordinates
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
      landmark: resolved.landmark || prev.landmark,
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

  const {
    handleAddressQueryChange,
    handleUseCurrentLocation,
    handleMapPinChange,
  } = useAddressPickerActions({
    formDataCity: formData.city,
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
  });

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

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const result = buildSaveAddressPayload({
      formData,
      addressMeta,
      addressQuery,
      isAddressVerified,
      isAddressServiceable,
      maxDeliveryRadiusKm,
    });

    if (!result.success) {
      return result;
    }

    onSave?.(result.data);
    return { success: true };
  }, [
    formData,
    addressMeta,
    addressQuery,
    isAddressVerified,
    isAddressServiceable,
    onSave,
    maxDeliveryRadiusKm,
  ]);

  return {
    formData,
    addressMeta,
    addressQuery,
    addressPredictions,
    addressLookupError,
    mapSdkReady,
    mapSdkConfigured: Boolean(GOOGLE_MAPS_API_KEY),
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

const useAddressPickerGoogle = (options = {}) => {
  const { initialAddress = null, onSave } = options;
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

  const [formData, setFormData] = useState(
    createFormDataFromAddress(initialAddress, user?.phone),
  );
  const [addressMeta, setAddressMeta] = useState(
    createAddressMetaFromAddress(initialAddress),
  );
  const [addressQuery, setAddressQuery] = useState(
    initialAddress?.formattedAddress || "",
  );
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLookupError, setAddressLookupError] = useState("");

  const [mapSdkReady, setMapSdkReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [distanceFromStoreKm, setDistanceFromStoreKm] = useState(null);

  const hasResolvedLookup = Boolean(
    String(
      addressMeta.placeId ||
        addressMeta.formattedAddress ||
        initialAddress?.placeId ||
        initialAddress?.formattedAddress ||
        "",
    ).trim(),
  );

  const isAddressVerified =
    hasValidCoordinates(addressMeta.latitude, addressMeta.longitude) &&
    (hasResolvedLookup ||
      (Boolean(initialAddress) &&
        hasValidCoordinates(
          initialAddress?.latitude,
          initialAddress?.longitude,
        )));

  const isAddressServiceable =
    isAddressVerified &&
    hasConfiguredStoreLocation &&
    Number.isFinite(distanceFromStoreKm) &&
    Number(distanceFromStoreKm) <= maxDeliveryRadiusKm;

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapSdkReady(false);
      setMapLoadError("Google Maps API key missing.");
      return undefined;
    }

    let isCancelled = false;
    setMapLoadError("Loading Google Maps...");

    waitForGoogleMapsSdk()
      .then(() => {
        if (isCancelled) return;
        setMapSdkReady(true);
        setMapLoadError("");
      })
      .catch((error) => {
        if (isCancelled) return;
        setMapSdkReady(false);
        setMapLoadError(
          String(error?.message || "").trim() || "Map SDK unavailable.",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isAddressVerified || !hasConfiguredStoreLocation) {
      setDistanceFromStoreKm(null);
      return () => {
        isCancelled = true;
      };
    }

    const calculateDistance = async () => {
      try {
        const result = await calculateDistanceMatrix({
          origin: { lat: storeLat, lng: storeLng },
          destination: {
            lat: Number(addressMeta.latitude),
            lng: Number(addressMeta.longitude),
          },
        });

        if (!isCancelled) {
          setDistanceFromStoreKm(
            Number.isFinite(result?.distanceKm) ? result.distanceKm : null,
          );
        }
      } catch {
        if (!isCancelled) {
          setDistanceFromStoreKm(null);
        }
      }
    };

    calculateDistance();

    return () => {
      isCancelled = true;
    };
  }, [
    addressMeta.latitude,
    addressMeta.longitude,
    hasConfiguredStoreLocation,
    isAddressVerified,
    storeLat,
    storeLng,
  ]);

  useEffect(() => {
    if (!initialAddress) return;
    setFormData(createFormDataFromAddress(initialAddress, user?.phone));
    setAddressMeta(createAddressMetaFromAddress(initialAddress));
    setAddressQuery(initialAddress.formattedAddress || "");
    setAddressPredictions([]);
    setAddressLookupError("");
  }, [initialAddress, user?.phone]);

  useEffect(() => {
    if (initialAddress) return;

    setFormData(createEmptyFormData(user?.phone));
    setAddressMeta(createEmptyAddressMeta());
    setAddressQuery("");
    setAddressPredictions([]);
    setAddressLookupError("");

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
            street: resolved.street || prev.street,
            city: resolved.city || prev.city,
            pincode: resolved.zipCode || prev.pincode,
            landmark: resolved.landmark || prev.landmark,
          }));
          setAddressMeta({
            placeId: resolved.placeId || "",
            latitude: lat ?? resolved.latitude,
            longitude: lng ?? resolved.longitude,
            formattedAddress: resolved.formattedAddress || "",
          });
          setAddressQuery(resolved.formattedAddress || "");
        } catch {
          setAddressMeta({
            placeId: "",
            latitude: lat,
            longitude: lng,
            formattedAddress: "",
          });
          setAddressLookupError(
            "Unable to verify your exact address right now. Please search again or retry current location.",
          );
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
      landmark: resolved.landmark || prev.landmark,
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

  const {
    handleAddressQueryChange,
    handleUseCurrentLocation,
    handleMapPinChange,
  } =
    useAddressPickerActions({
      formDataCity: formData.city,
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
    });

  const handleSelectPrediction = useCallback(
    async (prediction) => {
      try {
        const resolved = await toAddressFromSuggestion(prediction);

        if (
          !hasValidCoordinates(resolved?.latitude, resolved?.longitude) ||
          !String(resolved?.formattedAddress || "").trim()
        ) {
          setAddressLookupError("Unable to resolve selected location.");
          return;
        }

        applyResolvedAddress(
          resolved,
          Number(resolved.latitude),
          Number(resolved.longitude),
        );
        setAddressQuery(
          resolved.formattedAddress || prediction.description || "",
        );
        setAddressPredictions([]);
      } catch {
        setAddressLookupError("Unable to resolve selected location.");
      }
    },
    [applyResolvedAddress],
  );

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const result = buildSaveAddressPayload({
      formData,
      addressMeta,
      addressQuery,
      isAddressVerified,
      isAddressServiceable,
      maxDeliveryRadiusKm,
    });

    if (!result.success) {
      return result;
    }

    onSave?.(result.data);
    return { success: true };
  }, [
    formData,
    addressMeta,
    addressQuery,
    isAddressVerified,
    isAddressServiceable,
    onSave,
    maxDeliveryRadiusKm,
  ]);

  return {
    formData,
    addressMeta,
    addressQuery,
    addressPredictions,
    addressLookupError,
    mapSdkReady,
    mapSdkConfigured: Boolean(GOOGLE_MAPS_API_KEY),
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

export default useAddressPickerGoogle;
