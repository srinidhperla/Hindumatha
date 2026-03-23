export const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1/geocode";

export const toCoordinate = (value, min, max) => {
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

const toGeoapifyAddress = (entry = {}) => {
  const props = entry?.properties || entry || {};
  const streetParts = [
    props.housenumber,
    props.street,
    props.suburb,
    props.neighbourhood,
  ].filter(Boolean);

  return {
    label: "",
    street:
      streetParts.join(", ") || props.formatted || props.address_line1 || "",
    city: props.city || props.county || props.state_district || "Vizianagaram",
    state: props.state || "Andhra Pradesh",
    zipCode: props.postcode || "",
    landmark: props.address_line1 || props.suburb || "",
    placeId: String(props.place_id || props.datasource?.raw?.place_id || ""),
    latitude: toCoordinate(props.lat, -90, 90),
    longitude: toCoordinate(props.lon, -180, 180),
    formattedAddress: props.formatted || props.address_line2 || "",
  };
};

export const searchAddressSuggestions = async (query, options = {}) => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify API key missing");
  }

  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }

  const nearLat = toCoordinate(options?.near?.lat, -90, 90);
  const nearLng = toCoordinate(options?.near?.lng, -180, 180);
  const cityHint = String(options?.cityHint || "Vizianagaram").trim();
  const queryCandidates = [trimmed, `${trimmed}, ${cityHint}`];

  const runSearch = async (queryCandidate) => {
    const params = new URLSearchParams({
      text: queryCandidate,
      filter: "countrycode:in",
      format: "json",
      limit: "8",
      apiKey: GEOAPIFY_API_KEY,
    });

    if (nearLat !== null && nearLng !== null) {
      params.set("bias", `proximity:${nearLng},${nearLat}`);
    }

    const response = await fetch(
      `${GEOAPIFY_BASE_URL}/autocomplete?${params.toString()}`,
    );

    if (!response.ok) {
      return [];
    }

    const results = await response.json();
    return Array.isArray(results?.results) ? results.results : [];
  };

  for (const queryCandidate of queryCandidates) {
    const results = await runSearch(queryCandidate);

    if (results.length === 0) continue;

    const seen = new Set();
    return results
      .filter((entry) => {
        const key = String(entry.place_id || entry.formatted || "");
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((entry) => ({
        place_id: String(entry.place_id || entry.formatted),
        description: entry.formatted,
        _raw: entry,
      }));
  }

  throw new Error("Address search unavailable");
};

export const toAddressFromSuggestion = (prediction) => {
  if (prediction?._raw) {
    return toGeoapifyAddress(prediction._raw);
  }
  return null;
};

export const reverseGeocodeCoordinates = async (lat, lng) => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify API key missing");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    apiKey: GEOAPIFY_API_KEY,
  });
  const url = `${GEOAPIFY_BASE_URL}/reverse?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Reverse geocoding unavailable");
  }
  const result = await response.json();
  const entry = Array.isArray(result?.results) ? result.results[0] : null;
  if (!entry) {
    throw new Error("Reverse geocoding unavailable");
  }
  return toGeoapifyAddress(entry);
};
