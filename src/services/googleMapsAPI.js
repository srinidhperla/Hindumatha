import { haversineDistance } from "@/utils/deliveryGeo";

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const API_BASE_URL = String(import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);
const MAPS_PROXY_BASE = `${API_BASE_URL}/maps`;

const GOOGLE_SCRIPT_SELECTOR = 'script[src*="maps.googleapis.com/maps/api/js"]';
const BAKERY_MAP_STYLES = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f7efe2" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#6c5a43" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#fffaf2" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e2d2ba" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#efe4ce" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dce8ce" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f2e5d3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#e6c48c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d0a35f" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bfdce8" }],
  },
];

let autocompleteSessionToken = null;

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildProxyUrl = (path, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return `${MAPS_PROXY_BASE}/${path}${query ? `?${query}` : ""}`;
};

const fetchProxyJson = async (path, params = {}) => {
  const response = await fetch(buildProxyUrl(path, params), {
    headers: GOOGLE_MAPS_API_KEY
      ? {
          "x-google-maps-key": GOOGLE_MAPS_API_KEY,
        }
      : undefined,
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    throw new Error(
      String(
        payload?.message ||
          payload?.error_message ||
          payload?.error ||
          `Maps proxy failed with status ${response.status}`,
      ).trim(),
    );
  }

  return payload || {};
};

const geocodeRequestViaProxy = async ({ address, placeId, location }) => {
  if (placeId) {
    const payload = await fetchProxyJson("geocode", { place_id: placeId });
    return Array.isArray(payload?.results) ? payload.results : [];
  }

  if (location && hasValidCoordinates(location?.lat, location?.lng)) {
    const payload = await fetchProxyJson("reverse-geocode", {
      lat: Number(location.lat),
      lng: Number(location.lng),
    });
    return Array.isArray(payload?.results) ? payload.results : [];
  }

  if (String(address || "").trim()) {
    const payload = await fetchProxyJson("geocode", { address });
    return Array.isArray(payload?.results) ? payload.results : [];
  }

  return [];
};

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

const getGoogleMapsScriptSrc = () =>
  `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
    GOOGLE_MAPS_API_KEY,
  )}&libraries=places&v=weekly&loading=async`;

const hasInvalidGoogleMapsScript = (scriptTag) =>
  String(scriptTag?.src || "").includes("%VITE_GOOGLE_MAPS_API_KEY%");

const getLocationBiasBounds = (near, radiusMeters = 15000) => {
  const latitude = Number(near?.lat);
  const longitude = Number(near?.lng);

  if (!hasValidCoordinates(latitude, longitude)) {
    return undefined;
  }

  const latDelta = radiusMeters / 111320;
  const lngDelta =
    radiusMeters /
    Math.max(
      111320 * Math.abs(Math.cos((latitude * Math.PI) / 180)),
      1e-6,
    );

  return {
    south: latitude - latDelta,
    west: longitude - lngDelta,
    north: latitude + latDelta,
    east: longitude + lngDelta,
  };
};

const loadGoogleLibrary = async (libraryName) => {
  await waitForGoogleMapsSdk();
  const maps = getGoogleMaps();

  if (typeof maps?.importLibrary === "function") {
    return maps.importLibrary(libraryName);
  }

  return libraryName === "places" ? maps?.places || {} : {};
};

const getAutocompleteSessionToken = async () => {
  const { AutocompleteSessionToken } = await loadGoogleLibrary("places");

  if (!AutocompleteSessionToken) {
    return null;
  }

  if (!autocompleteSessionToken) {
    autocompleteSessionToken = new AutocompleteSessionToken();
  }

  return autocompleteSessionToken;
};

const normalizeNewAddressComponents = (components = []) =>
  components.map((component) => ({
    long_name:
      component?.longText ||
      component?.long_name ||
      component?.componentName ||
      "",
    short_name: component?.shortText || component?.short_name || "",
    types: Array.isArray(component?.types)
      ? component.types
      : component?.componentType
        ? [component.componentType]
        : [],
  }));

export const resetAutocompleteSession = () => {
  autocompleteSessionToken = null;
};

const getGoogleMaps = () => window.google?.maps;

const readLatLng = (location) => {
  if (!location) {
    return { latitude: null, longitude: null };
  }

  const latitude =
    typeof location.lat === "function"
      ? toCoordinate(location.lat(), -90, 90)
      : toCoordinate(location.lat, -90, 90);
  const longitude =
    typeof location.lng === "function"
      ? toCoordinate(location.lng(), -180, 180)
      : toCoordinate(location.lng, -180, 180);

  return { latitude, longitude };
};

const findAddressComponent = (
  components = [],
  types = [],
  { short = false } = {},
) => {
  const match = components.find((component) =>
    types.some((type) => component?.types?.includes(type)),
  );

  if (!match) {
    return "";
  }

  return short ? match.short_name || "" : match.long_name || "";
};

const toGoogleAddress = (result = {}, fallbackDescription = "") => {
  const components = Array.isArray(result?.address_components)
    ? result.address_components
    : [];
  const streetNumber = findAddressComponent(components, ["street_number"]);
  const route = findAddressComponent(components, ["route"]);
  const subpremise = findAddressComponent(components, ["subpremise"]);
  const premise = findAddressComponent(components, ["premise"]);
  const neighborhood = findAddressComponent(components, ["neighborhood"]);
  const sublocality =
    findAddressComponent(components, ["sublocality_level_1"]) ||
    findAddressComponent(components, ["sublocality"]);
  const pointOfInterest =
    findAddressComponent(components, ["point_of_interest"]) ||
    findAddressComponent(components, ["establishment"]);
  const city =
    findAddressComponent(components, ["locality"]) ||
    findAddressComponent(components, ["postal_town"]) ||
    findAddressComponent(components, ["administrative_area_level_3"]) ||
    findAddressComponent(components, ["administrative_area_level_2"]) ||
    "Vizianagaram";
  const state =
    findAddressComponent(components, ["administrative_area_level_1"]) ||
    "Andhra Pradesh";
  const zipCode = findAddressComponent(components, ["postal_code"], {
    short: true,
  });
  const street = [
    [subpremise, premise].filter(Boolean).join(", "),
    [streetNumber, route].filter(Boolean).join(" ").trim(),
  ]
    .filter(Boolean)
    .join(", ");
  const formattedAddress = String(
    result?.formatted_address || fallbackDescription || "",
  ).trim();
  const { latitude, longitude } = readLatLng(result?.geometry?.location);

  return {
    label: "",
    street:
      street ||
      pointOfInterest ||
      sublocality ||
      formattedAddress ||
      fallbackDescription,
    city,
    state,
    zipCode: String(zipCode || "").trim(),
    landmark: pointOfInterest || premise || neighborhood || sublocality || "",
    placeId: String(result?.place_id || "").trim(),
    latitude,
    longitude,
    formattedAddress,
  };
};

export const isGoogleMapsSdkReady = () =>
  typeof window !== "undefined" &&
  Boolean(window.google?.maps?.Map && window.google?.maps?.places);

export const waitForGoogleMapsSdk = ({
  timeoutMs = 10000,
  intervalMs = 150,
} = {}) =>
  new Promise((resolve, reject) => {
    if (isGoogleMapsSdkReady()) {
      resolve(window.google.maps);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("Google Maps API key missing."));
      return;
    }

    if (typeof window === "undefined") {
      reject(new Error("Google Maps is unavailable."));
      return;
    }

    let settled = false;
    let timeoutId;
    let intervalId;
    let scriptTag = document.querySelector(GOOGLE_SCRIPT_SELECTOR);

    if (scriptTag && hasInvalidGoogleMapsScript(scriptTag)) {
      scriptTag.parentNode?.removeChild?.(scriptTag);
      scriptTag = null;
    }

    if (!scriptTag) {
      const script = document.createElement("script");
      script.src = getGoogleMapsScriptSrc();
      script.async = true;
      script.defer = true;
      scriptTag = script;
      document.head.appendChild(script);
    }

    const cleanup = () => {
      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      scriptTag?.removeEventListener?.("load", handleLoad);
      scriptTag?.removeEventListener?.("error", handleError);
    };

    const finishResolve = () => {
      if (settled) {
        return;
      }
      cleanup();
      resolve(window.google.maps);
    };

    const finishReject = (message) => {
      if (settled) {
        return;
      }
      cleanup();
      reject(new Error(message));
    };

    const checkReady = () => {
      if (isGoogleMapsSdkReady()) {
        finishResolve();
      }
    };

    const handleLoad = () => {
      window.setTimeout(checkReady, 0);
    };

    const handleError = () => {
      finishReject("Google Maps failed to load.");
    };

    scriptTag?.addEventListener?.("load", handleLoad);
    scriptTag?.addEventListener?.("error", handleError);

    intervalId = window.setInterval(checkReady, intervalMs);
    timeoutId = window.setTimeout(() => {
      finishReject("Google Maps is unavailable.");
    }, timeoutMs);

    checkReady();
  });

const geocodeRequest = async (request) => {
  await waitForGoogleMapsSdk();
  const maps = getGoogleMaps();

  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode(request, (results, status) => {
      if (status === "OK") {
        resolve(Array.isArray(results) ? results : []);
        return;
      }

      if (status === "ZERO_RESULTS") {
        resolve([]);
        return;
      }

      reject(new Error(`Geocoding failed: ${status}`));
    });
  });
};

export const searchAddressSuggestions = async (query, options = {}) => {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }

  let predictions = [];

  try {
    const { AutocompleteSuggestion } = await loadGoogleLibrary("places");

    if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      const request = {
        input: trimmed,
        includedRegionCodes: ["in"],
      };
      const sessionToken = await getAutocompleteSessionToken();
      const locationBias = getLocationBiasBounds(options?.near);

      if (sessionToken) {
        request.sessionToken = sessionToken;
      }

      if (locationBias) {
        request.locationBias = locationBias;
      }

      const response =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const suggestions = Array.isArray(response?.suggestions)
        ? response.suggestions
        : [];

      predictions = suggestions.map((suggestion) => {
        const placePrediction = suggestion?.placePrediction;
        const description = String(
          placePrediction?.text?.text || placePrediction?.text || "",
        ).trim();

        return {
          place_id: String(
            placePrediction?.placeId || placePrediction?.id || description,
          ).trim(),
          description: description || trimmed,
          _raw: suggestion,
          _placePrediction: placePrediction || null,
        };
      });
    }
  } catch {
    predictions = [];
  }

  if (!predictions.length) {
    try {
      await waitForGoogleMapsSdk();
      const maps = getGoogleMaps();

      predictions = await new Promise((resolve, reject) => {
        const service = new maps.places.AutocompleteService();
        const request = {
          input: trimmed,
          componentRestrictions: { country: "in" },
        };
        const locationBias = getLocationBiasBounds(options?.near);

        if (locationBias) {
          request.locationBias = locationBias;
        }

        service.getPlacePredictions(request, (results, status) => {
          if (status === "OK") {
            resolve(Array.isArray(results) ? results : []);
            return;
          }

          if (status === "ZERO_RESULTS") {
            resolve([]);
            return;
          }

          reject(new Error(`Places autocomplete failed: ${status}`));
        });
      });
    } catch {
      predictions = [];
    }
  }

  if (!predictions.length) {
    try {
      const proxyPayload = await fetchProxyJson("search", {
        query: trimmed,
        country: "in",
        location: hasValidCoordinates(options?.near?.lat, options?.near?.lng)
          ? `${Number(options.near.lat)},${Number(options.near.lng)}`
          : undefined,
      });

      predictions = Array.isArray(proxyPayload?.predictions)
        ? proxyPayload.predictions
        : [];
    } catch {
      predictions = [];
    }
  }

  if (predictions.length > 0) {
    return predictions.slice(0, 8).map((prediction) => ({
      place_id: String(prediction.place_id || prediction.description),
      description: prediction.description || trimmed,
      _raw: prediction,
      _placePrediction: prediction._placePrediction || null,
    }));
  }

  const geocodedResults = await geocodeRequest({
    address: trimmed,
    componentRestrictions: { country: "IN" },
  }).catch(async () => geocodeRequestViaProxy({ address: trimmed }));

  return geocodedResults.slice(0, 8).map((result) => ({
    place_id: String(result.place_id || result.formatted_address || trimmed),
    description: result.formatted_address || trimmed,
    _raw: result,
  }));
};

export const toAddressFromSuggestion = async (prediction) => {
  const placeId = String(
    prediction?.place_id || prediction?._raw?.place_id || "",
  ).trim();
  const description = String(prediction?.description || "").trim();
  const placePrediction = prediction?._placePrediction;

  if (typeof placePrediction?.toPlace === "function") {
    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: [
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
          "id",
        ],
      });

      return toGoogleAddress(
        {
          address_components: normalizeNewAddressComponents(
            Array.isArray(place?.addressComponents)
              ? place.addressComponents
              : [],
          ),
          geometry: {
            location: place?.location || null,
          },
          formatted_address: place?.formattedAddress || description,
          place_id: String(place?.id || placeId || "").trim(),
        },
        description,
      );
    } catch {
      // Fall back to place ID or address geocoding below.
    } finally {
      resetAutocompleteSession();
    }
  }

  if (placeId) {
    const placeResults = await geocodeRequest({ placeId }).catch(async () =>
      geocodeRequestViaProxy({ placeId }),
    );
    const resolvedByPlace = placeResults.find((result) =>
      hasValidCoordinates(
        result?.geometry?.location?.lat?.(),
        result?.geometry?.location?.lng?.(),
      ),
    );

    if (resolvedByPlace) {
      resetAutocompleteSession();
      return toGoogleAddress(resolvedByPlace, description);
    }
  }

  if (description) {
    const geocodedResults = await geocodeRequest({
      address: description,
      componentRestrictions: { country: "IN" },
    }).catch(async () => geocodeRequestViaProxy({ address: description }));
    const resolvedByAddress = geocodedResults.find((result) =>
      hasValidCoordinates(
        result?.geometry?.location?.lat?.(),
        result?.geometry?.location?.lng?.(),
      ),
    );

    if (resolvedByAddress) {
      resetAutocompleteSession();
      return toGoogleAddress(resolvedByAddress, description);
    }
  }

  resetAutocompleteSession();
  return {
    label: "",
    street: description,
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    zipCode: "",
    landmark: "",
    placeId,
    latitude: null,
    longitude: null,
    formattedAddress: description,
  };
};

export const reverseGeocodeCoordinates = async (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!hasValidCoordinates(latitude, longitude)) {
    throw new Error("Valid coordinates are required.");
  }

  const results = await geocodeRequest({
    location: { lat: latitude, lng: longitude },
  }).catch(async () =>
    geocodeRequestViaProxy({ location: { lat: latitude, lng: longitude } }),
  );
  const firstResult = results[0];

  if (!firstResult) {
    throw new Error("Reverse geocoding unavailable.");
  }

  return toGoogleAddress(firstResult, firstResult.formatted_address || "");
};

export const calculateDistanceMatrix = async ({ origin, destination }) => {
  const originLat = Number(origin?.lat);
  const originLng = Number(origin?.lng);
  const destinationLat = Number(destination?.lat);
  const destinationLng = Number(destination?.lng);

  if (
    !hasValidCoordinates(originLat, originLng) ||
    !hasValidCoordinates(destinationLat, destinationLng)
  ) {
    throw new Error("Valid origin and destination coordinates are required.");
  }

  try {
    await waitForGoogleMapsSdk();
    const maps = getGoogleMaps();

    if (typeof maps?.importLibrary === "function") {
      try {
        const { RouteMatrix } = await maps.importLibrary("routes");

        if (RouteMatrix?.computeRouteMatrix) {
          const { matrix } = await RouteMatrix.computeRouteMatrix({
            origins: [
              {
                location: {
                  lat: originLat,
                  lng: originLng,
                },
                displayName: "Store",
              },
            ],
            destinations: [
              {
                location: {
                  lat: destinationLat,
                  lng: destinationLng,
                },
                displayName: "Delivery address",
              },
            ],
            travelMode: "DRIVING",
            units: maps.UnitSystem.METRIC,
            fields: ["distanceMeters", "durationMillis", "condition"],
          });

          const item = matrix?.rows?.[0]?.items?.[0];
          const distanceMeters = Number(item?.distanceMeters);
          const durationMillis = Number(item?.durationMillis);

          if (
            item?.condition === "ROUTE_EXISTS" &&
            Number.isFinite(distanceMeters)
          ) {
            return {
              distanceKm: distanceMeters / 1000,
              durationSeconds: Number.isFinite(durationMillis)
                ? durationMillis / 1000
                : null,
            };
          }
        }
      } catch {
        // Fall back to DistanceMatrixService below if Routes isn't enabled yet.
      }
    }

    const response = await new Promise((resolve, reject) => {
      const service = new maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destinationLat, lng: destinationLng }],
          travelMode: maps.TravelMode.DRIVING,
          unitSystem: maps.UnitSystem.METRIC,
        },
        (result, status) => {
          if (status === "OK") {
            resolve(result);
            return;
          }

          reject(new Error(`Distance matrix failed: ${status}`));
        },
      );
    });

    const element = response?.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") {
      throw new Error(`Distance matrix element failed: ${element?.status}`);
    }

    const distanceMeters = Number(element?.distance?.value);
    const durationSeconds = Number(element?.duration?.value);
    if (!Number.isFinite(distanceMeters)) {
      throw new Error("Distance matrix returned invalid distance.");
    }

    return {
      distanceKm: distanceMeters / 1000,
      durationSeconds: Number.isFinite(durationSeconds)
        ? durationSeconds
        : null,
    };
  } catch {
    return {
      distanceKm: haversineDistance(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      ),
      durationSeconds: null,
    };
  }
};

export const createGoogleMap = ({ container, center, zoom = 14 }) => {
  const maps = getGoogleMaps();
  if (!maps || !container) {
    throw new Error("Google Maps container is required.");
  }

  return new maps.Map(container, {
    center: {
      lat: Number(center?.lat),
      lng: Number(center?.lng),
    },
    zoom,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: "greedy",
    styles: BAKERY_MAP_STYLES,
  });
};

export const createGoogleMarker = ({
  map,
  position,
  draggable = false,
  title = "",
}) => {
  const maps = getGoogleMaps();
  if (!maps) {
    throw new Error("Google Maps is unavailable.");
  }

  return new maps.Marker({
    map,
    position: {
      lat: Number(position?.lat),
      lng: Number(position?.lng),
    },
    draggable,
    title,
  });
};

export const createGoogleInfoWindow = ({ content }) => {
  const maps = getGoogleMaps();
  if (!maps) {
    throw new Error("Google Maps is unavailable.");
  }

  return new maps.InfoWindow({ content });
};

export const attachGoogleMapClickListener = (map, handler) => {
  const listener = map?.addListener?.("click", (event) => {
    const lat = event?.latLng?.lat?.();
    const lng = event?.latLng?.lng?.();

    if (hasValidCoordinates(lat, lng)) {
      handler({ lat: Number(lat), lng: Number(lng) }, event);
    }
  });

  return () => listener?.remove?.();
};

export const getGoogleMarkerCoordinates = (marker) => {
  const position = marker?.getPosition?.();
  const latitude = position?.lat?.();
  const longitude = position?.lng?.();

  if (!hasValidCoordinates(latitude, longitude)) {
    return null;
  }

  return {
    lat: Number(latitude),
    lng: Number(longitude),
  };
};

export const setGoogleMarkerCoordinates = (marker, position) => {
  marker?.setPosition?.({
    lat: Number(position?.lat),
    lng: Number(position?.lng),
  });
};

export const attachGoogleMarkerDragEnd = (marker, handler) => {
  const listener = marker?.addListener?.("dragend", (event) => {
    const lat = event?.latLng?.lat?.();
    const lng = event?.latLng?.lng?.();

    if (hasValidCoordinates(lat, lng)) {
      handler({ lat: Number(lat), lng: Number(lng) }, event);
    }
  });

  return () => listener?.remove?.();
};

export const flyToGoogleLocation = (map, position, zoom) => {
  map?.panTo?.({
    lat: Number(position?.lat),
    lng: Number(position?.lng),
  });

  if (typeof zoom === "number") {
    map?.setZoom?.(zoom);
  }
};

export const removeGoogleInstance = (instance) => {
  instance?.setMap?.(null);
  instance?.close?.();
};
