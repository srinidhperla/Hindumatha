import {
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "../../../utils/productOptions";

const GOOGLE_MAPS_SCRIPT_ID = "bakery-google-maps-places";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const CHECKOUT_STORAGE_KEY = "bakeryPendingCheckout";

export { GOOGLE_MAPS_API_KEY, CHECKOUT_STORAGE_KEY };

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const toCoordinate = (value, min, max) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    return null;
  }
  return numeric;
};

export const hasValidCoordinates = (lat, lng) =>
  toCoordinate(lat, -90, 90) !== null && toCoordinate(lng, -180, 180) !== null;

export const getResolvedCheckoutItem = (item) => {
  const hasExplicitFlavors = normalizeFlavorOptions(item.product).length > 0;
  const availableEggTypes = [
    ...(item.product?.isEgg !== false ? ["egg"] : []),
    ...(item.product?.isEggless === true ? ["eggless"] : []),
  ];
  const selectedEggType = availableEggTypes.includes(item.selectedEggType)
    ? item.selectedEggType
    : availableEggTypes.length === 1
      ? availableEggTypes[0]
      : "";
  const availableFlavors = getAvailableFlavorOptions(item.product);
  const selectedFlavor = hasExplicitFlavors
    ? availableFlavors.find((option) => option.name === item.selectedFlavor)
        ?.name ||
      availableFlavors[0]?.name ||
      ""
    : "";
  const flavorForWeightFilter =
    selectedFlavor || availableFlavors[0]?.name || "";
  const availableWeights = getAvailableWeightOptions(
    item.product,
    flavorForWeightFilter,
    selectedEggType,
  );
  const selectedWeight =
    availableWeights.find((option) => option.label === item.selectedWeight)
      ?.label ||
    availableWeights[0]?.label ||
    "";
  const unitPrice = getVariantPrice(item.product, {
    flavorName: selectedFlavor,
    weightLabel: selectedWeight,
    eggType: selectedEggType,
  });

  return {
    ...item,
    portionTypeMeta: getPortionTypeMeta(item.product?.portionType),
    selectedEggType,
    selectedFlavor,
    selectedWeight,
    unitPrice,
    lineTotal: unitPrice * item.quantity,
    canOrder:
      isProductPurchasable(item.product) &&
      (!hasExplicitFlavors || Boolean(selectedFlavor)) &&
      (availableEggTypes.length <= 1 || Boolean(selectedEggType)) &&
      Boolean(selectedWeight),
  };
};

export const loadGoogleMapsPlaces = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window not available"));
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Google Maps API key is missing"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.google), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
};

const parsePlaceComponents = (components = []) => {
  const getValue = (type, useShortName = false) => {
    const component = components.find((entry) => entry.types?.includes(type));
    return component
      ? useShortName
        ? component.short_name
        : component.long_name
      : "";
  };

  const streetParts = [
    getValue("subpremise"),
    getValue("premise"),
    getValue("street_number"),
    getValue("route"),
    getValue("sublocality_level_1"),
    getValue("sublocality"),
  ].filter(Boolean);

  const city =
    getValue("locality") ||
    getValue("administrative_area_level_2") ||
    getValue("administrative_area_level_3");

  return {
    street: streetParts.join(", "),
    city,
    state: getValue("administrative_area_level_1"),
    zipCode: getValue("postal_code", true),
    landmark: getValue("point_of_interest") || getValue("neighborhood"),
  };
};

export const toAddressFromPlaceResult = (placeResult) => {
  const parsed = parsePlaceComponents(placeResult?.address_components || []);
  const location = placeResult?.geometry?.location;

  return {
    label: "",
    street: parsed.street || placeResult?.formatted_address || "",
    city: parsed.city || "Vizianagaram",
    state: parsed.state || "Andhra Pradesh",
    zipCode: parsed.zipCode || "",
    landmark: parsed.landmark || "",
    placeId: placeResult?.place_id || "",
    latitude: toCoordinate(
      typeof location?.lat === "function" ? location.lat() : null,
      -90,
      90,
    ),
    longitude: toCoordinate(
      typeof location?.lng === "function" ? location.lng() : null,
      -180,
      180,
    ),
    formattedAddress: placeResult?.formatted_address || "",
  };
};

const toNominatimAddress = (entry = {}) => {
  const address = entry.address || {};
  const streetParts = [
    address.house_number,
    address.road,
    address.suburb,
    address.neighbourhood,
  ].filter(Boolean);
  return {
    label: "",
    street: streetParts.join(", ") || entry.display_name || "",
    city:
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      "Vizianagaram",
    state: address.state || "Andhra Pradesh",
    zipCode: address.postcode || "",
    landmark: address.landmark || address.neighbourhood || "",
    placeId: String(entry.place_id || ""),
    latitude: toCoordinate(entry.lat, -90, 90),
    longitude: toCoordinate(entry.lon, -180, 180),
    formattedAddress: entry.display_name || "",
  };
};

export const searchAddressSuggestions = async (query, options = {}) => {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }

  const nearLat = toCoordinate(options?.near?.lat, -90, 90);
  const nearLng = toCoordinate(options?.near?.lng, -180, 180);
  const cityHint = String(options?.cityHint || "Vizianagaram").trim();
  const queryCandidates = [
    trimmed,
    `${trimmed}, ${cityHint}`,
    `${trimmed}, ${cityHint}, Andhra Pradesh`,
  ];

  for (const queryCandidate of queryCandidates) {
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "in",
      limit: "8",
      q: queryCandidate,
    });

    if (nearLat !== null && nearLng !== null) {
      const deltaLat = 0.12;
      const deltaLng = 0.12;
      params.set(
        "viewbox",
        `${nearLng - deltaLng},${nearLat + deltaLat},${nearLng + deltaLng},${nearLat - deltaLat}`,
      );
      params.set("bounded", "1");
    }

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          "Accept-Language": "en-IN",
        },
      },
    );

    if (!response.ok) {
      continue;
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      continue;
    }

    const seen = new Set();
    return results
      .filter((entry) => {
        const key = String(entry.place_id || "");
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((entry) => ({
        place_id: String(entry.place_id),
        description: entry.display_name,
        _raw: entry,
      }));
  }

  throw new Error("Address search unavailable");
};

export const toAddressFromSuggestion = (prediction) => {
  if (prediction?._raw) {
    return toNominatimAddress(prediction._raw);
  }
  return null;
};

export const reverseGeocodeCoordinates = async (lat, lng) => {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lng)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Reverse geocoding unavailable");
  }
  const result = await response.json();
  return toNominatimAddress(result || {});
};

export const normalizeUserSavedAddresses = (user) => {
  const saved = Array.isArray(user?.savedAddresses)
    ? user.savedAddresses.map((address, index) => ({
        id: address?._id || `saved-${index}`,
        label: address?.label || "Saved address",
        street: address?.street || "",
        city: address?.city || "Vizianagaram",
        state: address?.state || "Andhra Pradesh",
        zipCode: address?.zipCode || "",
        phone: address?.phone || "",
        landmark: address?.landmark || "",
        placeId: address?.placeId || "",
        latitude: toCoordinate(address?.latitude, -90, 90),
        longitude: toCoordinate(address?.longitude, -180, 180),
        formattedAddress: address?.formattedAddress || "",
        isDefault: address?.isDefault === true,
      }))
    : [];

  if (saved.length > 0) {
    return saved;
  }

  if (user?.address?.street) {
    return [
      {
        id: "default-profile-address",
        label: "Primary",
        street: user.address.street,
        city: user.address.city || "Vizianagaram",
        state: user.address.state || "Andhra Pradesh",
        zipCode: user.address.zipCode || "",
        phone: user.phone || "",
        landmark: "",
        placeId: "",
        latitude: null,
        longitude: null,
        formattedAddress: "",
        isDefault: true,
      },
    ];
  }

  return [];
};
