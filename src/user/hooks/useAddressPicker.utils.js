import { searchAddressSuggestions } from "@/user/components/order/orderHelpers";

export const createFormDataFromAddress = (initialAddress, userPhone) => ({
  street: initialAddress?.street || "",
  city: initialAddress?.city || "",
  pincode: initialAddress?.zipCode || initialAddress?.pincode || "",
  phone: initialAddress?.phone || userPhone || "",
  label: initialAddress?.label || "Home",
  landmark: initialAddress?.landmark || "",
});

export const createAddressMetaFromAddress = (initialAddress) => ({
  placeId: initialAddress?.placeId || "",
  latitude: initialAddress?.latitude ?? null,
  longitude: initialAddress?.longitude ?? null,
  formattedAddress: initialAddress?.formattedAddress || "",
});

export const createEmptyFormData = (userPhone) => ({
  street: "",
  city: "",
  pincode: "",
  phone: userPhone || "",
  label: "Home",
  landmark: "",
});

export const createEmptyAddressMeta = () => ({
  placeId: "",
  latitude: null,
  longitude: null,
  formattedAddress: "",
});

export const getCachedMatches = (cache, query) => {
  const normalized = query.toLowerCase();
  const directHit = cache.get(normalized);
  if (Array.isArray(directHit) && directHit.length > 0) return directHit;

  const matches = [];
  cache.forEach((entries, key) => {
    if (!key.includes(normalized) && !normalized.includes(key)) return;
    for (const entry of entries || []) {
      if (
        entry?.description?.toLowerCase().includes(normalized) &&
        !matches.some(
          (match) =>
            (match.place_id || match.description) ===
            (entry.place_id || entry.description),
        )
      ) {
        matches.push(entry);
      }
    }
  });

  return matches.slice(0, 8);
};

export const loadAddressSuggestions = async ({
  query,
  cache,
  hasConfiguredStoreLocation,
  storeLat,
  storeLng,
  city,
}) => {
  const suggestions = await searchAddressSuggestions(query, {
    near: hasConfiguredStoreLocation
      ? { lat: storeLat, lng: storeLng }
      : undefined,
    cityHint: city || "Vizianagaram",
  });
  cache.set(query.toLowerCase(), suggestions);
  return suggestions;
};

export const buildSaveAddressPayload = ({
  formData,
  addressMeta,
  addressQuery,
  isAddressVerified,
  isAddressServiceable,
  maxDeliveryRadiusKm,
}) => {
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

  return {
    success: true,
    data: {
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
    },
  };
};
