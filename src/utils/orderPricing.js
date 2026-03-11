export const BASE_DELIVERY_FEE = 60;
export const FREE_DELIVERY_THRESHOLD = 1500;

export const DEFAULT_COUPONS = [
  {
    code: "SWEET10",
    type: "percent",
    value: 10,
    minSubtotal: 500,
    maxDiscount: 250,
    description: "10% off on orders above Rs.500",
    isActive: true,
  },
  {
    code: "WELCOME100",
    type: "flat",
    value: 100,
    minSubtotal: 800,
    description: "Rs.100 off on orders above Rs.800",
    isActive: true,
  },
  {
    code: "FREEDEL",
    type: "delivery",
    value: 0,
    minSubtotal: 400,
    description: "Free delivery on eligible orders",
    isActive: true,
  },
];

export const normalizeCouponCode = (couponCode = "") =>
  couponCode.trim().toUpperCase();

const calculateDiscount = (coupon, subtotal, deliveryFee) => {
  if (!coupon) {
    return 0;
  }

  if (coupon.type === "percent") {
    const discount = Math.round((subtotal * coupon.value) / 100);
    return coupon.maxDiscount
      ? Math.min(discount, coupon.maxDiscount)
      : discount;
  }

  if (coupon.type === "flat") {
    return Math.min(coupon.value, subtotal);
  }

  if (coupon.type === "delivery") {
    return deliveryFee;
  }

  return 0;
};

export const calculateOrderPricing = ({
  subtotal = 0,
  couponCode = "",
  coupons = DEFAULT_COUPONS,
}) => {
  const normalizedSubtotal = Number(subtotal) || 0;
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  const baseDeliveryFee =
    normalizedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_FEE;
  const couponLookup = (Array.isArray(coupons) ? coupons : DEFAULT_COUPONS)
    .filter((coupon) => coupon?.code)
    .reduce((accumulator, coupon) => {
      accumulator[normalizeCouponCode(coupon.code)] = coupon;
      return accumulator;
    }, {});

  if (!normalizedCouponCode) {
    return {
      subtotal: normalizedSubtotal,
      deliveryFee: baseDeliveryFee,
      discountAmount: 0,
      totalAmount: normalizedSubtotal + baseDeliveryFee,
      appliedCoupon: null,
      couponError: "",
    };
  }

  const coupon = couponLookup[normalizedCouponCode];

  if (!coupon) {
    return {
      subtotal: normalizedSubtotal,
      deliveryFee: baseDeliveryFee,
      discountAmount: 0,
      totalAmount: normalizedSubtotal + baseDeliveryFee,
      appliedCoupon: null,
      couponError: "Invalid coupon code",
    };
  }

  if (coupon.minSubtotal && normalizedSubtotal < coupon.minSubtotal) {
    return {
      subtotal: normalizedSubtotal,
      deliveryFee: baseDeliveryFee,
      discountAmount: 0,
      totalAmount: normalizedSubtotal + baseDeliveryFee,
      appliedCoupon: null,
      couponError: `Coupon requires a minimum subtotal of Rs.${coupon.minSubtotal}`,
    };
  }

  const discountAmount = calculateDiscount(
    coupon,
    normalizedSubtotal,
    baseDeliveryFee,
  );
  const deliveryFee = Math.max(
    0,
    baseDeliveryFee - (coupon.type === "delivery" ? discountAmount : 0),
  );
  const totalAmount = Math.max(
    0,
    normalizedSubtotal -
      (coupon.type === "delivery" ? 0 : discountAmount) +
      deliveryFee,
  );

  return {
    subtotal: normalizedSubtotal,
    deliveryFee,
    discountAmount:
      coupon.type === "delivery" ? baseDeliveryFee : discountAmount,
    totalAmount,
    appliedCoupon: coupon,
    couponError: "",
  };
};
