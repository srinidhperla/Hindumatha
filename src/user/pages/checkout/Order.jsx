import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearCart } from "../../../features/cart/cartSlice";
import { createOrder } from "../../../features/orders/orderSlice";
import { showToast } from "../../../features/uiSlice";
import { updateProfile } from "../../../features/auth/authSlice";
import {
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "../../../utils/orderPricing";
import {
  haversineDistance,
  isWithinDeliveryRadius,
  normalizeDeliverySettings,
} from "../../../utils/deliverySettings";
import {
  getResolvedCheckoutItem,
  hasValidCoordinates,
  loadGoogleMapsPlaces,
  reverseGeocodeCoordinates,
  searchAddressSuggestions,
  toAddressFromSuggestion,
  toAddressFromPlaceResult,
  normalizeUserSavedAddresses,
  CHECKOUT_STORAGE_KEY,
  GOOGLE_MAPS_API_KEY,
} from "../../components/order/orderHelpers";
import OrderReviewStep from "../../components/order/OrderReviewStep";
import OrderDeliveryStep from "../../components/order/OrderDeliveryStep";
import OrderAddressStep from "../../components/order/OrderAddressStep";
import OrderSummary from "../../components/order/OrderSummary";

const stepLabels = ["Review", "Checkout"];
const ENFORCED_DELIVERY_RADIUS_KM = 4;

const Order = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);
  const coupons = useSelector((state) => state.site.coupons);
  const deliverySettings = useSelector((state) => state.site.deliverySettings);
  const [step, setStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [formData, setFormData] = useState({
    deliveryMode: "now",
    deliveryDateTime: "",
    paymentMethod: "cash",
    specialInstructions: "",
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "Vizianagaram",
    pincode: "",
    couponCode: normalizeCouponCode(location.state?.couponCode || ""),
  });
  const [savedAddresses, setSavedAddresses] = useState(() =>
    normalizeUserSavedAddresses(user),
  );
  const [addressMode, setAddressMode] = useState("saved");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressPredictions, setAddressPredictions] = useState([]);
  const [addressLookupError, setAddressLookupError] = useState("");
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [saveAddressForNextTime, setSaveAddressForNextTime] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressMeta, setAddressMeta] = useState({
    placeId: "",
    latitude: null,
    longitude: null,
  });
  const placesServiceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);
  const addressSearchDebounceRef = useRef(null);
  const addressSearchRequestIdRef = useRef(0);
  const addressSearchCacheRef = useRef(new Map());

  const checkoutItems = useMemo(
    () => items.map((item) => getResolvedCheckoutItem(item)),
    [items],
  );
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalUnits = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const invalidItems = checkoutItems.filter((item) => !item.canOrder);
  const availableCoupons = (coupons?.length ? coupons : DEFAULT_COUPONS).filter(
    (coupon) => coupon.isActive !== false,
  );
  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );
  const pricing = calculateOrderPricing({
    subtotal,
    couponCode: formData.couponCode,
    coupons: availableCoupons,
  });
  const minimumScheduleDateTime = useMemo(() => {
    const prepMinutes = Number(
      normalizedDeliverySettings.prepTimeMinutes || 45,
    );
    const nextTime = new Date(Date.now() + prepMinutes * 60 * 1000);
    const offset = nextTime.getTimezoneOffset();
    const localDate = new Date(nextTime.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }, [normalizedDeliverySettings.prepTimeMinutes]);
  const pauseUntilLabel = normalizedDeliverySettings.pauseUntil
    ? new Date(normalizedDeliverySettings.pauseUntil).toLocaleString("en-IN")
    : "";
  const storeLocation = normalizedDeliverySettings.storeLocation || {
    lat: 0,
    lng: 0,
  };
  const storeLat = Number(storeLocation?.lat);
  const storeLng = Number(storeLocation?.lng);
  const hasConfiguredStoreLocation = hasValidCoordinates(storeLat, storeLng);
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
      ENFORCED_DELIVERY_RADIUS_KM,
    );

  useEffect(() => {
    const normalizedAddresses = normalizeUserSavedAddresses(user);
    setSavedAddresses(normalizedAddresses);
    const defaultAddress =
      normalizedAddresses.find((address) => address.isDefault) ||
      normalizedAddresses[0];
    if (defaultAddress) {
      setAddressMode("saved");
      setSelectedAddressId(defaultAddress.id);
      setFormData((prev) => ({
        ...prev,
        phone: defaultAddress.phone || prev.phone || user?.phone || "",
        address: defaultAddress.street || prev.address,
        city: defaultAddress.city || prev.city,
        pincode: defaultAddress.zipCode || prev.pincode,
      }));
      setAddressMeta({
        placeId: defaultAddress.placeId || "",
        latitude: Number.isFinite(Number(defaultAddress.latitude))
          ? Number(defaultAddress.latitude)
          : null,
        longitude: Number.isFinite(Number(defaultAddress.longitude))
          ? Number(defaultAddress.longitude)
          : null,
      });
      setAddressLookupError("");
    }
  }, [user]);

  useEffect(() => {
    if (step !== 3) return;
    let isActive = true;

    if (!GOOGLE_MAPS_API_KEY) {
      setGoogleMapsReady(false);
      setMapLoadError(
        "Google map key missing. Set VITE_GOOGLE_MAPS_API_KEY in frontend/.env and restart frontend.",
      );
      return () => {
        isActive = false;
      };
    }

    loadGoogleMapsPlaces()
      .then(() => {
        if (!isActive || !window.google?.maps) return;
        autocompleteRef.current =
          new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement("div"),
        );
        geocoderRef.current = new window.google.maps.Geocoder();
        setGoogleMapsReady(true);
        setMapLoadError("");
      })
      .catch(() => {
        if (isActive) {
          setGoogleMapsReady(false);
          setMapLoadError(
            "Google map failed to load. Check API key restrictions, Places API, Maps JavaScript API, and billing.",
          );
        }
      });
    return () => {
      isActive = false;
    };
  }, [step]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user?.name || "",
      phone: prev.phone || user?.phone || "",
      address: prev.address || user?.address?.street || "",
      city: prev.city || user?.address?.city || "Vizianagaram",
      pincode: prev.pincode || user?.address?.zipCode || "",
    }));
  }, [
    user?.address?.city,
    user?.address?.street,
    user?.address?.zipCode,
    user?.name,
    user?.phone,
  ]);

  useEffect(
    () => () => {
      if (addressSearchDebounceRef.current) {
        window.clearTimeout(addressSearchDebounceRef.current);
      }
    },
    [],
  );

  const toSavedAddressPayload = (addresses) =>
    addresses.map((address) => ({
      label: address.label || "Saved address",
      street: address.street || "",
      city: address.city || "Vizianagaram",
      state: address.state || "Andhra Pradesh",
      zipCode: address.zipCode || "",
      phone: address.phone || "",
      landmark: address.landmark || "",
      placeId: address.placeId || "",
      latitude: Number.isFinite(Number(address.latitude))
        ? Number(address.latitude)
        : undefined,
      longitude: Number.isFinite(Number(address.longitude))
        ? Number(address.longitude)
        : undefined,
      formattedAddress: address.formattedAddress || "",
      isDefault: address.isDefault === true,
    }));

  const persistAddressesToProfile = async (nextAddresses, successMessage) => {
    const defaultAddress =
      nextAddresses.find((address) => address.isDefault) || nextAddresses[0];
    const profileAddress = defaultAddress
      ? {
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state || "Andhra Pradesh",
          zipCode: defaultAddress.zipCode,
          placeId: defaultAddress.placeId || "",
          latitude: Number.isFinite(Number(defaultAddress.latitude))
            ? Number(defaultAddress.latitude)
            : undefined,
          longitude: Number.isFinite(Number(defaultAddress.longitude))
            ? Number(defaultAddress.longitude)
            : undefined,
        }
      : user?.address || {};

    const payloadSavedAddresses = toSavedAddressPayload(nextAddresses);

    await dispatch(
      updateProfile({
        phone: formData.phone,
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    ).unwrap();

    setSavedAddresses(
      normalizeUserSavedAddresses({
        ...(user || {}),
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    );

    if (successMessage) {
      dispatch(showToast({ type: "success", message: successMessage }));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "deliveryMode") {
      setFormData((prev) => ({
        ...prev,
        deliveryMode: value,
        deliveryDateTime: value === "scheduled" ? prev.deliveryDateTime : "",
      }));
      return;
    }

    if (name === "address" || name === "city" || name === "pincode") {
      setAddressMode("new");
      setEditingAddressId("");
      setSelectedAddressId("");
      setSaveAddressForNextTime(true);
      setAddressMeta({ placeId: "", latitude: null, longitude: null });
      setAddressLookupError(
        "Please pick a verified suggestion or use current location.",
      );
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === "couponCode" ? normalizeCouponCode(value) : value,
    }));
  };

  const applySelectedAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      phone: address.phone || prev.phone,
      address: address.street || prev.address,
      city: address.city || prev.city,
      pincode: address.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: address.placeId || "",
      latitude: Number.isFinite(Number(address.latitude))
        ? Number(address.latitude)
        : null,
      longitude: Number.isFinite(Number(address.longitude))
        ? Number(address.longitude)
        : null,
    });
  };

  const handleSavedAddressSelect = (address) => {
    setAddressMode("saved");
    setEditingAddressId("");
    setSelectedAddressId(address.id);
    applySelectedAddress(address);
    setAddressLookupError("");
    setSaveAddressForNextTime(false);
  };

  const handleStartNewAddress = () => {
    setAddressMode("new");
    setEditingAddressId("");
    setSelectedAddressId("");
    setAddressQuery("");
    setAddressPredictions([]);
    setAddressMeta({ placeId: "", latitude: null, longitude: null });
    setAddressLookupError(
      GOOGLE_MAPS_API_KEY
        ? "Please pick a verified suggestion or use current location."
        : "Google map key missing. You can still use current location, or configure the map key.",
    );
    setFormData((prev) => ({
      ...prev,
      address: "",
      pincode: "",
    }));
    setSaveAddressForNextTime(true);
  };

  const handleEditSavedAddress = (address) => {
    setAddressMode("edit");
    setEditingAddressId(address.id);
    setSelectedAddressId("");
    applySelectedAddress(address);
    setAddressLabel(address.label || "Home");
    setAddressQuery(address.formattedAddress || "");
    setAddressLookupError("");
    setSaveAddressForNextTime(true);
  };

  const handleDeleteSavedAddress = async (addressId) => {
    const nextAddresses = savedAddresses.filter(
      (entry) => entry.id !== addressId,
    );

    if (
      nextAddresses.length > 0 &&
      !nextAddresses.some((address) => address.isDefault)
    ) {
      nextAddresses[0] = {
        ...nextAddresses[0],
        isDefault: true,
      };
    }

    try {
      await persistAddressesToProfile(nextAddresses, "Address deleted.");

      if (selectedAddressId === addressId) {
        const fallback =
          nextAddresses.find((entry) => entry.isDefault) || nextAddresses[0];
        if (fallback) {
          handleSavedAddressSelect(fallback);
        } else {
          handleStartNewAddress();
        }
      }
    } catch (error) {
      dispatch(
        showToast({
          type: "error",
          message: error?.message || "Failed to delete address.",
        }),
      );
    }
  };

  const handleSaveAddress = async () => {
    if (
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.pincode.trim()
    ) {
      dispatch(
        showToast({
          type: "error",
          message: "Address, city, and pincode are required.",
        }),
      );
      return;
    }

    if (!hasConfiguredStoreLocation) {
      dispatch(
        showToast({
          type: "error",
          message:
            "Store location is not configured in admin settings. Please contact support.",
        }),
      );
      return;
    }

    if (!isAddressVerified) {
      dispatch(
        showToast({
          type: "error",
          message: "Please verify address by suggestion or current location.",
        }),
      );
      return;
    }

    if (!isAddressServiceable) {
      dispatch(
        showToast({
          type: "error",
          message: `Address is outside our ${ENFORCED_DELIVERY_RADIUS_KM}km delivery area.`,
        }),
      );
      return;
    }

    const normalizedAddress = {
      id: editingAddressId || `saved-${Date.now()}`,
      label: addressLabel.trim() || "Saved address",
      street: formData.address.trim(),
      city: formData.city.trim(),
      state: "Andhra Pradesh",
      zipCode: formData.pincode.trim(),
      phone: formData.phone.trim(),
      landmark: "",
      placeId: addressMeta.placeId || "",
      latitude: Number(addressMeta.latitude),
      longitude: Number(addressMeta.longitude),
      formattedAddress: addressQuery || "",
      isDefault: true,
    };

    let nextAddresses;
    if (editingAddressId) {
      nextAddresses = savedAddresses.map((address) =>
        address.id === editingAddressId
          ? normalizedAddress
          : { ...address, isDefault: false },
      );
    } else {
      nextAddresses = [
        ...savedAddresses.map((address) => ({ ...address, isDefault: false })),
        normalizedAddress,
      ];
    }

    try {
      await persistAddressesToProfile(
        nextAddresses,
        editingAddressId ? "Address updated." : "Address saved.",
      );
      setSelectedAddressId(normalizedAddress.id);
      setAddressMode("saved");
      setEditingAddressId("");
      setSaveAddressForNextTime(false);
    } catch (error) {
      dispatch(
        showToast({
          type: "error",
          message: error?.message || "Failed to save address.",
        }),
      );
    }
  };

  const handleAddressQueryChange = (event) => {
    const nextQuery = event.target.value;
    const trimmedQuery = nextQuery.trim();

    if (addressSearchDebounceRef.current) {
      window.clearTimeout(addressSearchDebounceRef.current);
    }

    setAddressQuery(nextQuery);
    setAddressMode((prev) => (prev === "saved" ? "new" : prev));
    setSelectedAddressId("");
    setEditingAddressId("");

    if (trimmedQuery.length < 2) {
      addressSearchRequestIdRef.current += 1;
      setAddressPredictions([]);
      setAddressLookupError("");
      return;
    }

    const getCachedMatches = () => {
      const normalizedQuery = trimmedQuery.toLowerCase();
      const directHit = addressSearchCacheRef.current.get(normalizedQuery);

      if (Array.isArray(directHit) && directHit.length > 0) {
        return directHit;
      }

      const aggregateMatches = [];
      addressSearchCacheRef.current.forEach((entries, key) => {
        if (!key.includes(normalizedQuery) && !normalizedQuery.includes(key)) {
          return;
        }

        for (const entry of entries || []) {
          if (!entry?.description) {
            continue;
          }

          if (
            entry.description.toLowerCase().includes(normalizedQuery) &&
            !aggregateMatches.some(
              (existing) =>
                (existing.place_id || existing.description) ===
                (entry.place_id || entry.description),
            )
          ) {
            aggregateMatches.push(entry);
          }
        }
      });

      return aggregateMatches.slice(0, 8);
    };

    const cachedMatches = getCachedMatches();
    if (cachedMatches.length > 0) {
      setAddressPredictions(cachedMatches);
      setAddressLookupError("");
    }

    const requestId = addressSearchRequestIdRef.current + 1;
    addressSearchRequestIdRef.current = requestId;

    const loadFallbackSuggestions = async (googleStatus = "") => {
      try {
        const suggestions = await searchAddressSuggestions(trimmedQuery, {
          near: hasConfiguredStoreLocation
            ? { lat: storeLat, lng: storeLng }
            : undefined,
          cityHint: formData.city || "Vizianagaram",
        });

        if (requestId !== addressSearchRequestIdRef.current) {
          return;
        }

        addressSearchCacheRef.current.set(
          trimmedQuery.toLowerCase(),
          suggestions,
        );

        setAddressPredictions(suggestions);
        if (suggestions.length === 0) {
          const fallbackCached = getCachedMatches();
          if (fallbackCached.length > 0) {
            setAddressPredictions(fallbackCached);
            setAddressLookupError("Showing close matches from recent search.");
            return;
          }

          setAddressLookupError(
            "No address results found. Try adding area, city, or landmark.",
          );
          return;
        }

        setAddressLookupError(
          googleStatus && googleStatus !== "ZERO_RESULTS"
            ? "Using backup search results."
            : "",
        );
      } catch {
        if (requestId !== addressSearchRequestIdRef.current) {
          return;
        }

        const fallbackCached = getCachedMatches();
        if (fallbackCached.length > 0) {
          setAddressPredictions(fallbackCached);
          setAddressLookupError("Showing close matches from recent search.");
          return;
        }

        setAddressPredictions([]);
        setAddressLookupError("Address search is temporarily unavailable.");
      }
    };

    addressSearchDebounceRef.current = window.setTimeout(() => {
      if (!googleMapsReady || !autocompleteRef.current) {
        loadFallbackSuggestions();
        return;
      }

      const predictionRequest = {
        input: trimmedQuery,
        componentRestrictions: { country: "in" },
      };

      if (hasConfiguredStoreLocation && window.google?.maps?.LatLng) {
        predictionRequest.location = new window.google.maps.LatLng(
          storeLat,
          storeLng,
        );
        predictionRequest.radius = 12000;
      }

      autocompleteRef.current.getPlacePredictions(
        predictionRequest,
        (predictions, status) => {
          if (requestId !== addressSearchRequestIdRef.current) {
            return;
          }

          if (
            status === "OK" &&
            Array.isArray(predictions) &&
            predictions.length
          ) {
            addressSearchCacheRef.current.set(
              trimmedQuery.toLowerCase(),
              predictions,
            );
            setAddressPredictions(predictions);
            setAddressLookupError("");
            return;
          }

          loadFallbackSuggestions(status || "");
        },
      );
    }, 350);
  };

  const selectGooglePrediction = (prediction) => {
    const fallbackAddress = toAddressFromSuggestion(prediction);
    if (fallbackAddress) {
      applySelectedAddress(fallbackAddress);
      setAddressLabel((prev) => prev || "Home");
      setAddressQuery(prediction.description || "");
      setAddressPredictions([]);
      setAddressLookupError("");
      setSaveAddressForNextTime(true);
      return;
    }

    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "place_id",
        ],
      },
      (place, status) => {
        if (status !== "OK" || !place) return;
        const normalizedAddress = toAddressFromPlaceResult(place);
        applySelectedAddress(normalizedAddress);
        setAddressLabel((prev) => prev || "Home");
        setAddressQuery(prediction.description);
        setAddressPredictions([]);
        setAddressLookupError("");
        setSaveAddressForNextTime(true);
      },
    );
  };

  const resolveAddressFromCoordinates = async (lat, lng) => {
    if (geocoderRef.current) {
      const resultFromGoogle = await new Promise((resolve) => {
        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === "OK" && results?.length) {
              resolve(toAddressFromPlaceResult(results[0]));
              return;
            }

            resolve(null);
          },
        );
      });

      if (resultFromGoogle) {
        return resultFromGoogle;
      }
    }

    return reverseGeocodeCoordinates(lat, lng);
  };

  const handleMapPinChange = async ({ lat, lng }) => {
    const nextLat = Number(lat);
    const nextLng = Number(lng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    try {
      const resolvedAddress = await resolveAddressFromCoordinates(
        nextLat,
        nextLng,
      );
      applySelectedAddress({
        ...resolvedAddress,
        latitude: nextLat,
        longitude: nextLng,
      });
      setAddressQuery(resolvedAddress.formattedAddress || "");
      setAddressLookupError("");
      setSaveAddressForNextTime(true);
      setAddressMode((prev) => (prev === "saved" ? "new" : prev));
    } catch {
      setAddressMeta((prev) => ({
        ...prev,
        latitude: nextLat,
        longitude: nextLng,
      }));
      setAddressLookupError(
        "Unable to resolve selected map location. Try moving the pin slightly.",
      );
    }
  };

  const handleCancelAddressModal = () => {
    setAddressMode("saved");
    setEditingAddressId("");
    setAddressPredictions([]);
    setAddressLookupError("");
  };

  const handleUseCurrentLocation = (autoSave = false) => {
    if (!navigator.geolocation) {
      dispatch(
        showToast({
          type: "error",
          message:
            "Current location is unavailable. Enable location and Google Maps API.",
        }),
      );
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const handleResolvedAddress = async (resolvedAddress) => {
          applySelectedAddress(resolvedAddress);
          setAddressQuery(resolvedAddress.formattedAddress || "");
          setAddressLookupError("");
          setSaveAddressForNextTime(true);
          setAddressMode((prev) => (prev === "saved" ? "new" : prev));
          setLocationLoading(false);

          if (!autoSave) {
            dispatch(
              showToast({
                type: "success",
                message: "Current location captured.",
              }),
            );
            return;
          }

          if (!hasConfiguredStoreLocation) {
            dispatch(
              showToast({
                type: "error",
                message:
                  "Store location is not configured in admin settings. Please contact support.",
              }),
            );
            return;
          }

          const normalizedStreet = (resolvedAddress.street || "").trim();
          const normalizedCity = (
            resolvedAddress.city ||
            formData.city ||
            ""
          ).trim();
          const normalizedPincode = (resolvedAddress.zipCode || "").trim();
          const resolvedLat = Number(resolvedAddress.latitude);
          const resolvedLng = Number(resolvedAddress.longitude);

          if (!normalizedStreet || !normalizedCity || !normalizedPincode) {
            dispatch(
              showToast({
                type: "error",
                message:
                  "Detected address is incomplete. Please edit and save manually.",
              }),
            );
            return;
          }

          if (!hasValidCoordinates(resolvedLat, resolvedLng)) {
            dispatch(
              showToast({
                type: "error",
                message:
                  "Could not verify coordinates from current location. Please try again.",
              }),
            );
            return;
          }

          const serviceable = isWithinDeliveryRadius(
            storeLocation,
            resolvedLat,
            resolvedLng,
            ENFORCED_DELIVERY_RADIUS_KM,
          );

          if (!serviceable) {
            dispatch(
              showToast({
                type: "error",
                message: `Address is outside our ${ENFORCED_DELIVERY_RADIUS_KM}km delivery area.`,
              }),
            );
            return;
          }

          const normalizedAddress = {
            id: editingAddressId || `saved-${Date.now()}`,
            label: addressLabel.trim() || "Home",
            street: normalizedStreet,
            city: normalizedCity,
            state: "Andhra Pradesh",
            zipCode: normalizedPincode,
            phone: formData.phone.trim(),
            landmark: "",
            placeId: resolvedAddress.placeId || "",
            latitude: resolvedLat,
            longitude: resolvedLng,
            formattedAddress:
              resolvedAddress.formattedAddress ||
              [normalizedStreet, normalizedCity, normalizedPincode]
                .filter(Boolean)
                .join(", "),
            isDefault: true,
          };

          const nextAddresses = editingAddressId
            ? savedAddresses.map((address) =>
                address.id === editingAddressId
                  ? normalizedAddress
                  : { ...address, isDefault: false },
              )
            : [
                ...savedAddresses.map((address) => ({
                  ...address,
                  isDefault: false,
                })),
                normalizedAddress,
              ];

          try {
            await persistAddressesToProfile(
              nextAddresses,
              "Address auto-saved.",
            );
            setSelectedAddressId(normalizedAddress.id);
            setAddressMode("saved");
            setEditingAddressId("");
            setSaveAddressForNextTime(false);
          } catch (profileError) {
            dispatch(
              showToast({
                type: "error",
                message:
                  profileError?.message || "Failed to auto-save address.",
              }),
            );
          }
        };

        if (geocoderRef.current) {
          geocoderRef.current.geocode(
            { location: locationPoint },
            (results, status) => {
              if (status === "OK" && results?.length) {
                handleResolvedAddress(toAddressFromPlaceResult(results[0]));
                return;
              }

              reverseGeocodeCoordinates(locationPoint.lat, locationPoint.lng)
                .then((resolvedAddress) =>
                  handleResolvedAddress(resolvedAddress),
                )
                .catch(() => {
                  setLocationLoading(false);
                  dispatch(
                    showToast({
                      type: "error",
                      message: "Unable to detect your address from location.",
                    }),
                  );
                });
            },
          );
          return;
        }

        reverseGeocodeCoordinates(locationPoint.lat, locationPoint.lng)
          .then((resolvedAddress) => handleResolvedAddress(resolvedAddress))
          .catch(() => {
            setLocationLoading(false);
            dispatch(
              showToast({
                type: "error",
                message: "Unable to detect your address from location.",
              }),
            );
          });
      },
      () => {
        setLocationLoading(false);
        dispatch(
          showToast({
            type: "error",
            message: "Location access denied. Please allow GPS permission.",
          }),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!checkoutItems.length || invalidItems.length > 0 || pricing.couponError)
      return;

    if (formData.deliveryMode === "scheduled" && !formData.deliveryDateTime) {
      dispatch(
        showToast({
          message: "Please choose exact delivery date and time.",
          type: "error",
        }),
      );
      return;
    }

    if (!hasConfiguredStoreLocation) {
      dispatch(
        showToast({
          message:
            "Store location is missing in admin delivery settings. Unable to place order.",
          type: "error",
        }),
      );
      return;
    }

    if (!isAddressVerified) {
      dispatch(
        showToast({
          message:
            "Please select a verified address suggestion or use current location.",
          type: "error",
        }),
      );
      return;
    }

    if (!isAddressServiceable) {
      dispatch(
        showToast({
          message: `Sorry, this address is outside our ${ENFORCED_DELIVERY_RADIUS_KM}km delivery area.`,
          type: "error",
        }),
      );
      return;
    }

    try {
      const normalizedStreet = formData.address.trim();
      const normalizedCity = formData.city.trim();
      const normalizedPincode = formData.pincode.trim();
      const profileAddress = {
        street: normalizedStreet,
        city: normalizedCity,
        state: "Andhra Pradesh",
        zipCode: normalizedPincode,
        placeId: addressMeta.placeId || "",
        latitude: Number(addressMeta.latitude),
        longitude: Number(addressMeta.longitude),
      };
      let normalizedSavedAddresses = savedAddresses.map((address) => ({
        label: address.label || "Saved address",
        street: address.street,
        city: address.city,
        state: address.state || "Andhra Pradesh",
        zipCode: address.zipCode,
        phone: address.phone || "",
        landmark: address.landmark || "",
        placeId: address.placeId || "",
        latitude: Number.isFinite(Number(address.latitude))
          ? Number(address.latitude)
          : undefined,
        longitude: Number.isFinite(Number(address.longitude))
          ? Number(address.longitude)
          : undefined,
        formattedAddress: address.formattedAddress || "",
        isDefault: address.id === selectedAddressId,
      }));
      const isAlreadySaved = normalizedSavedAddresses.some(
        (address) =>
          address.street?.toLowerCase() === normalizedStreet.toLowerCase() &&
          address.city?.toLowerCase() === normalizedCity.toLowerCase() &&
          address.zipCode?.toLowerCase() === normalizedPincode.toLowerCase(),
      );
      const editingAddress = savedAddresses.find(
        (address) => address.id === editingAddressId,
      );
      if (saveAddressForNextTime && editingAddressId) {
        normalizedSavedAddresses = normalizedSavedAddresses.filter(
          (entry) =>
            !(
              entry.street?.toLowerCase() ===
                (editingAddress?.street || "").toLowerCase() &&
              entry.city?.toLowerCase() ===
                (editingAddress?.city || "").toLowerCase() &&
              entry.zipCode?.toLowerCase() ===
                (editingAddress?.zipCode || "").toLowerCase()
            ),
        );
        normalizedSavedAddresses = normalizedSavedAddresses.map((entry) => ({
          ...entry,
          isDefault: false,
        }));
        normalizedSavedAddresses.push({
          label: addressLabel.trim() || "Saved address",
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          landmark: "",
          placeId: addressMeta.placeId || "",
          latitude: Number.isFinite(Number(addressMeta.latitude))
            ? Number(addressMeta.latitude)
            : undefined,
          longitude: Number.isFinite(Number(addressMeta.longitude))
            ? Number(addressMeta.longitude)
            : undefined,
          formattedAddress: addressQuery || "",
          isDefault: true,
        });
      } else if (saveAddressForNextTime && !isAlreadySaved) {
        normalizedSavedAddresses.forEach((a) => {
          a.isDefault = false;
        });
        normalizedSavedAddresses.push({
          label: addressLabel.trim() || "Saved address",
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          landmark: "",
          placeId: addressMeta.placeId || "",
          latitude: Number.isFinite(Number(addressMeta.latitude))
            ? Number(addressMeta.latitude)
            : undefined,
          longitude: Number.isFinite(Number(addressMeta.longitude))
            ? Number(addressMeta.longitude)
            : undefined,
          formattedAddress: addressQuery || "",
          isDefault: true,
        });
      }

      const checkoutPayload = {
        items: checkoutItems.map((item) => ({
          product: item.product._id,
          quantity: Number(item.quantity),
          size: item.selectedWeight,
          flavor: item.selectedFlavor,
          price: item.unitPrice,
        })),
        deliveryAddress: {
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          placeId: addressMeta.placeId || "",
          lat: Number(addressMeta.latitude),
          lng: Number(addressMeta.longitude),
          label: addressLabel.trim() || "Home",
          formattedAddress: addressQuery || "",
        },
        deliveryMode: formData.deliveryMode,
        deliveryDateTime:
          formData.deliveryMode === "scheduled"
            ? formData.deliveryDateTime
            : null,
        paymentMethod: formData.paymentMethod,
        couponCode: normalizeCouponCode(formData.couponCode),
        specialInstructions: [
          formData.specialInstructions,
          formData.name ? `Contact name: ${formData.name}` : "",
          formData.phone ? `Phone: ${formData.phone}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      };

      await dispatch(
        updateProfile({
          phone: formData.phone,
          address: profileAddress,
          savedAddresses: normalizedSavedAddresses,
        }),
      ).unwrap();

      if (formData.paymentMethod !== "cash") {
        const pendingCheckout = {
          orderData: checkoutPayload,
          pricing,
          customer: {
            name: formData.name,
            email: user?.email || "",
            phone: formData.phone,
          },
        };
        sessionStorage.setItem(
          CHECKOUT_STORAGE_KEY,
          JSON.stringify(pendingCheckout),
        );
        navigate("/payment", { state: pendingCheckout });
        return;
      }

      await dispatch(createOrder(checkoutPayload)).unwrap();
      dispatch(clearCart());
      dispatch(
        showToast({ message: "Order placed successfully.", type: "success" }),
      );
      setOrderSuccess(true);
    } catch (submitError) {
      const errorMessage =
        submitError?.error || submitError?.message || "Failed to create order";
      console.error("Order failed:", errorMessage);
      dispatch(
        showToast({
          message: errorMessage,
          type: "error",
        }),
      );
    }
  };

  if (!checkoutItems.length) {
    return (
      <div className="commerce-page--empty">
        <div className="commerce-empty-shell">
          <div className="commerce-empty-card">
            <p className="commerce-kicker">Checkout</p>
            <h1 className="mt-4 text-4xl font-black text-primary-800">
              Your cart has no items to checkout
            </h1>
            <p className="commerce-copy mt-4">
              Add items from the menu first, then return here to place the
              order.
            </p>
            <Link to="/menu" className="btn-primary mt-8">
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="commerce-page--success flex items-center justify-center">
        <div className="commerce-success-card">
          <div className="commerce-success-icon">
            <svg
              className="h-10 w-10 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-black text-primary-800">
            Order placed successfully
          </h2>
          <p className="mt-3 text-primary-600">
            Your full cart was converted into one order with all selected
            flavors, weights, and quantities.
          </p>
          <div className="commerce-success-box">
            <p className="commerce-price-kicker">Order total</p>
            <p className="mt-2 text-3xl font-black text-primary-300">
              Rs.{pricing.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-primary mt-8 w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page commerce-page--checkout">
      <div className="commerce-shell">
        <div className="mb-10 text-center">
          <p className="commerce-kicker">Checkout</p>
          <h1 className="commerce-title">
            Place one order for your whole cart
          </h1>
          <p className="commerce-copy">
            Review your products, confirm delivery, and finish checkout like a
            standard store flow.
          </p>
        </div>

        <div className="commerce-stepper">
          {stepLabels.map((label, index) => {
            const currentStep = index + 1;
            return (
              <React.Fragment key={label}>
                <div className="commerce-step">
                  <div
                    className={`commerce-step-circle ${
                      step >= currentStep
                        ? "commerce-step-circle--active"
                        : "commerce-step-circle--inactive"
                    }`}
                  >
                    {currentStep}
                  </div>
                  <span
                    className={`commerce-step-label ${
                      step >= currentStep
                        ? "commerce-step-label--active"
                        : "commerce-step-label--inactive"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {currentStep < stepLabels.length && (
                  <div
                    className={`commerce-step-line ${
                      step > currentStep
                        ? "commerce-step-line--active"
                        : "commerce-step-line--inactive"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="commerce-grid">
            <div className="commerce-section">
              {step === 1 && (
                <OrderReviewStep
                  checkoutItems={checkoutItems}
                  invalidItems={invalidItems}
                />
              )}
              {step === 2 && (
                <>
                  <OrderDeliveryStep
                    formData={formData}
                    normalizedDeliverySettings={normalizedDeliverySettings}
                    minimumScheduleDateTime={minimumScheduleDateTime}
                    pauseUntilLabel={pauseUntilLabel}
                    pricing={pricing}
                    availableCoupons={availableCoupons}
                    onChange={handleChange}
                    onBack={() => setStep(1)}
                  />
                  <OrderAddressStep
                    formData={formData}
                    savedAddresses={savedAddresses}
                    addressMode={addressMode}
                    editingAddressId={editingAddressId}
                    selectedAddressId={selectedAddressId}
                    addressQuery={addressQuery}
                    addressPredictions={addressPredictions}
                    addressLookupError={addressLookupError}
                    googleMapsReady={googleMapsReady}
                    googleMapsConfigured={Boolean(GOOGLE_MAPS_API_KEY)}
                    mapLoadError={mapLoadError}
                    locationLoading={locationLoading}
                    addressLabel={addressLabel}
                    isAddressVerified={isAddressVerified}
                    distanceFromStoreKm={distanceFromStoreKm}
                    isAddressServiceable={isAddressServiceable}
                    maxDeliveryRadiusKm={ENFORCED_DELIVERY_RADIUS_KM}
                    storeLocation={normalizedDeliverySettings.storeLocation}
                    addressLatitude={addressMeta.latitude}
                    addressLongitude={addressMeta.longitude}
                    hasConfiguredStoreLocation={hasConfiguredStoreLocation}
                    saveAddressForNextTime={saveAddressForNextTime}
                    loading={loading}
                    error={error}
                    invalidItems={invalidItems}
                    pricing={pricing}
                    onChange={handleChange}
                    onSavedAddressSelect={handleSavedAddressSelect}
                    onStartNewAddress={handleStartNewAddress}
                    onEditSavedAddress={handleEditSavedAddress}
                    onDeleteSavedAddress={handleDeleteSavedAddress}
                    onAddressQueryChange={handleAddressQueryChange}
                    onSelectPrediction={selectGooglePrediction}
                    onUseCurrentLocation={handleUseCurrentLocation}
                    onMapPinChange={handleMapPinChange}
                    onAddressLabelChange={setAddressLabel}
                    onSaveAddressToggle={setSaveAddressForNextTime}
                    onSaveAddress={handleSaveAddress}
                    onCancelAddressModal={handleCancelAddressModal}
                    onBack={() => setStep(1)}
                  />
                </>
              )}
            </div>

            <OrderSummary
              checkoutItems={checkoutItems}
              totalUnits={totalUnits}
              pricing={pricing}
              step={step}
              invalidItems={invalidItems}
              onNext={() => setStep(2)}
              onBack={() => setStep(1)}
              loading={loading}
              isAddressVerified={isAddressVerified}
              isAddressServiceable={isAddressServiceable}
              paymentMethod={formData.paymentMethod}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Order;
