import React, { useEffect, useRef, useState } from "react";
import {
  createGoogleInfoWindow,
  createGoogleMap,
  createGoogleMarker,
  removeGoogleInstance,
  waitForGoogleMapsSdk,
} from "@/services/googleMapsAPI";

const STORE_COORDINATES = {
  lat: 18.116483,
  lng: 83.411487,
};

const ContactMapSection = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!mapRef.current) {
      return undefined;
    }

    let isCancelled = false;

    waitForGoogleMapsSdk()
      .then(() => {
        if (isCancelled) return;

        const map = createGoogleMap({
          container: mapRef.current,
          center: STORE_COORDINATES,
          zoom: 15,
        });

        const marker = createGoogleMarker({
          map,
          position: STORE_COORDINATES,
          title: "Hindumatha's Cake World",
        });

        const infoWindow = createGoogleInfoWindow({
          content: `
            <div style="min-width:190px">
              <strong>Hindumatha's Cake World</strong><br />
              MG Road, Vizianagaram, Andhra Pradesh
            </div>
          `,
        });
        marker.addListener?.("click", () => {
          infoWindow.open({ anchor: marker, map });
        });
        infoWindow.open({ anchor: marker, map });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        infoWindowRef.current = infoWindow;
        setMapError("");
      })
      .catch((error) => {
        if (isCancelled) return;
        setMapError(String(error?.message || "").trim() || "Map unavailable.");
      });

    return () => {
      isCancelled = true;
      removeGoogleInstance(infoWindowRef.current);
      infoWindowRef.current = null;
      removeGoogleInstance(markerRef.current);
      markerRef.current = null;
      removeGoogleInstance(mapInstanceRef.current);
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="mt-10 animate-fadeInUp sm:mt-16">
      <h2 className="font-playfair mb-4 text-center text-xl font-bold text-[#2a1f0e] sm:mb-6 sm:text-2xl">
        Find Us on the Map
      </h2>
      <div className="overflow-hidden rounded-2xl border border-[#c9a84c40] bg-white shadow-lg">
        {mapError ? (
          <div className="flex h-[350px] w-full items-center justify-center rounded-2xl bg-cream-100 px-4 text-center text-sm font-medium text-primary-700">
            {mapError}
          </div>
        ) : (
          <div
            ref={mapRef}
            className="h-[350px] w-full rounded-2xl bg-cream-100"
          />
        )}
      </div>
    </div>
  );
};

export default ContactMapSection;
