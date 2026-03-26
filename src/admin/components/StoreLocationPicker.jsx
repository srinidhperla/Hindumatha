import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  reverseGeocodeCoordinates,
  searchAddressSuggestions,
  toAddressFromSuggestion,
} from "@/user/components/order/orderHelpers";
import {
  attachGoogleMapClickListener,
  attachGoogleMarkerDragEnd,
  createGoogleMap,
  createGoogleMarker,
  flyToGoogleLocation,
  removeGoogleInstance,
  waitForGoogleMapsSdk,
} from "@/services/googleMapsAPI";

const DEFAULT_CENTER = { lat: 18.1067, lng: 83.3956 };

const StoreLocationPicker = ({ lat, lng, radiusKm, onPickLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mapError, setMapError] = useState("");

  const normalizedLat = Number(lat);
  const normalizedLng = Number(lng);
  const hasCoordinates =
    Number.isFinite(normalizedLat) && Number.isFinite(normalizedLng);

  const center = useMemo(
    () =>
      hasCoordinates
        ? { lat: normalizedLat, lng: normalizedLng }
        : DEFAULT_CENTER,
    [hasCoordinates, normalizedLat, normalizedLng],
  );

  const resolveLocationLabel = useCallback(async (nextLat, nextLng) => {
    try {
      const resolved = await reverseGeocodeCoordinates(nextLat, nextLng);
      const label = String(resolved?.formattedAddress || "").trim();
      if (label) {
        setSearchQuery(label);
        setSearchError("");
        return;
      }
    } catch {
      // Fall through to a user-facing message below.
    }

    setSearchError(
      "Location selected. Search again or move the pin slightly to fetch a readable address.",
    );
  }, []);

  useEffect(() => {
    if (!hasCoordinates) {
      return;
    }

    resolveLocationLabel(center.lat, center.lng);
  }, [center, hasCoordinates, resolveLocationLabel]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return undefined;
    }

    let isCancelled = false;
    let detachClickListener = () => {};

    waitForGoogleMapsSdk()
      .then(() => {
        if (isCancelled) return;

        const map = createGoogleMap({
          container: mapRef.current,
          center,
          zoom: hasCoordinates ? 14 : 12,
        });

        detachClickListener = attachGoogleMapClickListener(
          map,
          async ({ lat: pickedLat, lng: pickedLng }) => {
            if (!Number.isFinite(pickedLat) || !Number.isFinite(pickedLng)) {
              return;
            }

            onPickLocation(pickedLat, pickedLng);
            resolveLocationLabel(pickedLat, pickedLng);
          },
        );

        mapInstanceRef.current = map;
        setMapError("");
      })
      .catch((error) => {
        if (isCancelled) return;
        setMapError(String(error?.message || "").trim() || "Map unavailable.");
      });

    return () => {
      isCancelled = true;
      detachClickListener();
      removeGoogleInstance(circleRef.current);
      circleRef.current = null;
      removeGoogleInstance(markerRef.current);
      markerRef.current = null;
      removeGoogleInstance(mapInstanceRef.current);
      mapInstanceRef.current = null;
    };
  }, [center, hasCoordinates, onPickLocation, resolveLocationLabel]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) {
      return undefined;
    }

    const map = mapInstanceRef.current;
    removeGoogleInstance(markerRef.current);
    removeGoogleInstance(circleRef.current);

    markerRef.current = createGoogleMarker({
      map,
      draggable: true,
      position: center,
      title: "Store location",
    });

    const detachDragListener = attachGoogleMarkerDragEnd(
      markerRef.current,
      async (nextLngLat) => {
        onPickLocation(nextLngLat.lat, nextLngLat.lng);
        resolveLocationLabel(nextLngLat.lat, nextLngLat.lng);
      },
    );

    circleRef.current = new window.google.maps.Circle({
      map,
      center,
      radius: Math.max(0, Number(radiusKm) || 0) * 1000,
      fillColor: "#f59e0b",
      fillOpacity: 0.12,
      strokeColor: "#b45309",
      strokeOpacity: 0.9,
      strokeWeight: 2,
    });

    flyToGoogleLocation(map, center, hasCoordinates ? 14 : 12);

    return () => {
      detachDragListener();
    };
  }, [center, hasCoordinates, onPickLocation, radiusKm, resolveLocationLabel]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 3) {
      setSearchError("Type at least 3 characters to search.");
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      const results = await searchAddressSuggestions(trimmedQuery, {
        near: center,
        cityHint: "Vizianagaram",
      });
      setSearchResults(results);
      if (!results.length) {
        setSearchError("No locations found. Try a nearby landmark or road.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Unable to search store locations right now.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    const resolved = await toAddressFromSuggestion(result, { near: center });

    if (
      !Number.isFinite(Number(resolved?.latitude)) ||
      !Number.isFinite(Number(resolved?.longitude))
    ) {
      setSearchError("Pick the result and then fine-tune the pin on the map.");
      return;
    }

    onPickLocation(Number(resolved.latitude), Number(resolved.longitude));
    setSearchQuery(resolved.formattedAddress || result.description || "");
    setSearchResults([]);
    setSearchError("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search area, landmark, street or city"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-xs font-medium text-amber-700">{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {searchResults.map((result) => (
              <button
                key={result.place_id || result.description}
                type="button"
                onClick={() => handleSelectSearchResult(result)}
                className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                {result.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {mapError ? (
        <div className="flex h-80 w-full items-center justify-center bg-cream-100 px-4 text-center text-sm font-medium text-primary-700">
          {mapError}
        </div>
      ) : (
        <div ref={mapRef} className="h-80 w-full bg-cream-100" />
      )}
    </div>
  );
};

export default StoreLocationPicker;
