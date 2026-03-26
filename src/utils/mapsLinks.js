export const formatAddressText = (address = {}) => {
  const formattedAddress = String(address?.formattedAddress || "").trim();
  if (formattedAddress) {
    return formattedAddress;
  }

  return [
    address?.label,
    address?.street,
    address?.landmark,
    address?.city,
    address?.state,
    address?.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
};

export const buildGoogleMapsSearchUrl = (address = {}) => {
  const query = formatAddressText(address);
  if (!query) {
    return "";
  }

  const params = new URLSearchParams({
    api: "1",
    query,
  });

  const placeId = String(address?.placeId || "").trim();
  if (placeId) {
    params.set("query_place_id", placeId);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
};
