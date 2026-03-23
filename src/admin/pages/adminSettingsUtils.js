export const VIZIANAGARAM_DEFAULT_COORDS = {
  lat: 18.1067,
  lng: 83.3956,
};

export const createEmptyCoupon = () => ({
  code: "",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  maxDiscount: "",
  description: "",
  isActive: true,
});

export const normalizeCouponPayload = (coupon) => ({
  ...coupon,
  code: String(coupon.code || "")
    .trim()
    .toUpperCase(),
  value: Number(coupon.value) || 0,
  minSubtotal: Number(coupon.minSubtotal) || 0,
  maxDiscount:
    coupon.maxDiscount === "" || coupon.maxDiscount === null
      ? undefined
      : Number(coupon.maxDiscount) || 0,
});

export const buildMapsUrl = (lat, lng) =>
  `https://maps.google.com/?q=${lat},${lng}`;
