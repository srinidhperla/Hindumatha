const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

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

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinDeliveryRadius = (
  storeLocation,
  deliveryLat,
  deliveryLng,
  maxRadiusKm,
) => {
  const storeLat = toCoordinate(storeLocation?.lat, -90, 90);
  const storeLng = toCoordinate(storeLocation?.lng, -180, 180);
  const dropLat = toCoordinate(deliveryLat, -90, 90);
  const dropLng = toCoordinate(deliveryLng, -180, 180);
  const radius = Number(maxRadiusKm);

  if (storeLat === null || storeLng === null) return false;
  if (dropLat === null || dropLng === null) return false;
  if (!Number.isFinite(radius) || radius <= 0) return false;

  return haversineDistance(storeLat, storeLng, dropLat, dropLng) <= radius;
};
