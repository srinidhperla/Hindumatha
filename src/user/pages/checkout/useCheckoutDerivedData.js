import { useEffect, useMemo, useState } from "react";
import { calculateOrderPricing, DEFAULT_COUPONS } from "@/utils/orderPricing";
import {
  getAvailableSlotsForDate,
  getLeadTimeMinutes,
  normalizeDeliverySettings,
} from "@/utils/deliverySettings";
import {
  calculateDistanceMatrix,
  getResolvedCheckoutItem,
  hasValidCoordinates,
} from "@/user/components/order/orderHelpers";
import {
  getDeliveryNowReason,
  isTimeInsideAnySlotWindow,
} from "./orderPageUtils";

export const useCheckoutDerivedData = ({
  items,
  coupons,
  deliverySettings,
  formData,
  scheduledDeliveryDate,
  setFormData,
  addressMeta,
}) => {
  const checkoutItems = useMemo(
    () => items.map((item) => getResolvedCheckoutItem(item)),
    [items],
  );
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalUnits = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const invalidItems = checkoutItems.filter((item) => !item.canOrder);

  const availableCoupons = (
    Array.isArray(coupons) ? coupons : DEFAULT_COUPONS
  ).filter((coupon) => coupon.isActive !== false);

  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );

  const minimumScheduleDateTime = useMemo(() => {
    const leadMinutes = getLeadTimeMinutes(normalizedDeliverySettings);
    const nextTime = new Date(Date.now() + leadMinutes * 60 * 1000);
    const offset = nextTime.getTimezoneOffset();
    const localDate = new Date(nextTime.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }, [normalizedDeliverySettings]);

  const minimumScheduleDate = minimumScheduleDateTime.slice(0, 10);
  const scheduledDate = scheduledDeliveryDate;
  const scheduledSlotStart = formData.deliveryDateTime
    ? (formData.deliveryDateTime.split("T")[1] || "").slice(0, 5)
    : "";

  const availableSlotsForSelectedDate = useMemo(
    () =>
      scheduledDate || normalizedDeliverySettings.enabled === false
        ? getAvailableSlotsForDate(
            normalizedDeliverySettings,
            scheduledDate,
            new Date(),
          )
        : { isAvailable: true, reason: "", slots: [] },
    [normalizedDeliverySettings, scheduledDate],
  );

  const availableScheduledSlots = availableSlotsForSelectedDate.slots || [];
  const scheduleAvailabilityReason = !availableSlotsForSelectedDate.isAvailable
    ? availableSlotsForSelectedDate.reason
    : "";

  const nowAvailabilityReason = useMemo(
    () =>
      formData.deliveryMode === "now"
        ? getDeliveryNowReason(normalizedDeliverySettings, new Date())
        : "",
    [formData.deliveryMode, normalizedDeliverySettings],
  );

  useEffect(() => {
    if (formData.deliveryMode !== "scheduled" || !scheduledDate) {
      return;
    }

    const isSelectedSlotStillValid = isTimeInsideAnySlotWindow(
      scheduledSlotStart,
      availableScheduledSlots,
    );

    if (!isSelectedSlotStillValid && scheduledSlotStart) {
      setFormData((prev) => ({
        ...prev,
        deliveryDateTime: "",
      }));
    }
  }, [
    availableScheduledSlots,
    formData.deliveryMode,
    scheduledDate,
    scheduledSlotStart,
    setFormData,
  ]);

  const pauseUntilLabel = normalizedDeliverySettings.pauseUntil
    ? new Date(normalizedDeliverySettings.pauseUntil).toLocaleString("en-IN")
    : "";

  const storeLocation = normalizedDeliverySettings.storeLocation || {
    lat: 0,
    lng: 0,
  };
  const storeLat = Number(storeLocation?.lat);
  const storeLng = Number(storeLocation?.lng);
  const hasConfiguredStoreLocation = hasValidCoordinates(storeLat, storeLng);

  const isAddressVerified = hasValidCoordinates(
    addressMeta.latitude,
    addressMeta.longitude,
  );

  const [distanceFromStoreKm, setDistanceFromStoreKm] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    if (!isAddressVerified || !hasConfiguredStoreLocation) {
      setDistanceFromStoreKm(null);
      return () => {
        isCancelled = true;
      };
    }

    const resolveDrivingDistance = async () => {
      setDistanceFromStoreKm(null);

      try {
        const result = await calculateDistanceMatrix({
          origin: {
            lat: storeLat,
            lng: storeLng,
          },
          destination: {
            lat: Number(addressMeta.latitude),
            lng: Number(addressMeta.longitude),
          },
        });

        if (!isCancelled) {
          setDistanceFromStoreKm(
            Number.isFinite(result?.distanceKm) ? result.distanceKm : null,
          );
        }
      } catch {
        if (!isCancelled) {
          setDistanceFromStoreKm(null);
        }
      }
    };

    resolveDrivingDistance();

    return () => {
      isCancelled = true;
    };
  }, [
    addressMeta.latitude,
    addressMeta.longitude,
    hasConfiguredStoreLocation,
    isAddressVerified,
    storeLat,
    storeLng,
  ]);

  const estimatedDeliveryDistanceKm = Number.isFinite(distanceFromStoreKm)
    ? distanceFromStoreKm
    : 0;

  const pricing = calculateOrderPricing({
    subtotal,
    couponCode: formData.couponCode,
    coupons: availableCoupons,
    deliveryDistanceKm: estimatedDeliveryDistanceKm,
    deliverySettings: normalizedDeliverySettings,
  });

  const freeDeliveryProgress = {
    enabled: normalizedDeliverySettings.freeDeliveryEnabled !== false,
    minAmount: Number(normalizedDeliverySettings.freeDeliveryMinAmount) || 0,
    remainingAmount: Math.max(
      0,
      (Number(normalizedDeliverySettings.freeDeliveryMinAmount) || 0) -
        Number(pricing.subtotal || 0),
    ),
  };

  const maxDeliveryRadiusKm = Math.max(
    0,
    Number(normalizedDeliverySettings.maxDeliveryRadiusKm) || 0,
  );

  const isAddressServiceable =
    isAddressVerified &&
    hasConfiguredStoreLocation &&
    Number.isFinite(distanceFromStoreKm) &&
    Number(distanceFromStoreKm) <= maxDeliveryRadiusKm;

  return {
    checkoutItems,
    subtotal,
    totalUnits,
    invalidItems,
    availableCoupons,
    normalizedDeliverySettings,
    minimumScheduleDate,
    scheduledDate,
    scheduledSlotStart,
    availableScheduledSlots,
    scheduleAvailabilityReason,
    nowAvailabilityReason,
    pauseUntilLabel,
    hasConfiguredStoreLocation,
    isAddressVerified,
    distanceFromStoreKm,
    pricing,
    freeDeliveryProgress,
    maxDeliveryRadiusKm,
    isAddressServiceable,
  };
};
