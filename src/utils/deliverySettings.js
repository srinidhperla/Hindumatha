import { haversineDistance, isWithinDeliveryRadius } from "./deliveryGeo";
import {
  getAvailableSlotsForDateCore,
  getDeliveryDayKey,
} from "./deliverySlots";

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const createDefaultSlot = (startTime = "09:00", endTime = "21:00") => ({
  startTime,
  endTime,
});

export const createDefaultWeeklySchedule = () => ({
  monday: { isOpen: true, slots: [createDefaultSlot("09:00", "21:00")] },
  tuesday: { isOpen: true, slots: [createDefaultSlot("09:00", "21:00")] },
  wednesday: { isOpen: true, slots: [createDefaultSlot("09:00", "21:00")] },
  thursday: { isOpen: true, slots: [createDefaultSlot("09:00", "21:00")] },
  friday: { isOpen: true, slots: [createDefaultSlot("09:00", "21:00")] },
  saturday: { isOpen: true, slots: [createDefaultSlot("09:00", "22:00")] },
  sunday: { isOpen: true, slots: [createDefaultSlot("09:00", "22:00")] },
});

const normalizeTimeValue = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmedValue)) {
    return fallback;
  }

  return trimmedValue;
};

const normalizeSlot = (slot, fallbackSlot) => ({
  startTime: normalizeTimeValue(slot?.startTime, fallbackSlot.startTime),
  endTime: normalizeTimeValue(slot?.endTime, fallbackSlot.endTime),
});

const normalizePauseUntil = (pauseUntil, now = new Date()) => {
  if (!pauseUntil) {
    return null;
  }

  const parsedDate = new Date(pauseUntil);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate <= now) {
    return null;
  }

  return parsedDate.toISOString();
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0
    ? numericValue
    : fallback;
};

export const normalizeDeliverySettings = (settings = {}) => {
  const pauseUntil = normalizePauseUntil(settings?.pauseUntil);
  const defaultWeeklySchedule = createDefaultWeeklySchedule();
  const weeklySchedule = {};

  DAY_KEYS.forEach((dayKey) => {
    const fallbackDay = defaultWeeklySchedule[dayKey];
    const sourceDay = settings?.weeklySchedule?.[dayKey] || {};
    weeklySchedule[dayKey] = {
      isOpen:
        typeof sourceDay.isOpen === "boolean"
          ? sourceDay.isOpen
          : fallbackDay.isOpen,
      slots:
        Array.isArray(sourceDay.slots) && sourceDay.slots.length
          ? sourceDay.slots.map((slot) =>
              normalizeSlot(slot, fallbackDay.slots[0]),
            )
          : fallbackDay.slots,
    };
  });

  return {
    enabled: settings?.enabled !== false,
    distanceFeeEnabled: settings?.distanceFeeEnabled !== false,
    pricePerKm: toNonNegativeNumber(settings?.pricePerKm, 20),
    firstKmFee: toNonNegativeNumber(
      settings?.firstKmFee,
      toNonNegativeNumber(settings?.pricePerKm, 20),
    ),
    pricePerKmBeyondFirstKm: toNonNegativeNumber(
      settings?.pricePerKmBeyondFirstKm,
      toNonNegativeNumber(settings?.pricePerKm, 20),
    ),
    freeDeliveryEnabled: settings?.freeDeliveryEnabled !== false,
    freeDeliveryMinAmount: toNonNegativeNumber(
      settings?.freeDeliveryMinAmount,
      1500,
    ),
    maxDeliveryRadiusKm: Number(settings?.maxDeliveryRadiusKm) || 3,
    storeLocation: settings?.storeLocation || { lat: 0, lng: 0 },
    pauseUntil,
    pauseDurationUnit:
      settings?.pauseDurationUnit === "days" ? "days" : "hours",
    pauseDurationValue: Math.max(0, Number(settings?.pauseDurationValue) || 0),
    isPaused: Boolean(pauseUntil),
    acceptingOrders: settings?.enabled !== false && !pauseUntil,
    prepTimeMinutes: Number(settings?.prepTimeMinutes) || 0,
    advanceNoticeUnit:
      settings?.advanceNoticeUnit === "days" ? "days" : "hours",
    advanceNoticeValue: Math.max(0, Number(settings?.advanceNoticeValue) || 0),
    timeSlots: Array.isArray(settings?.timeSlots) ? settings.timeSlots : [],
    weeklySchedule,
  };
};

export const getLeadTimeMinutes = (deliverySettings) => {
  const normalizedSettings = normalizeDeliverySettings(deliverySettings);
  const advanceNoticeMinutes =
    normalizedSettings.advanceNoticeUnit === "days"
      ? normalizedSettings.advanceNoticeValue * 24 * 60
      : normalizedSettings.advanceNoticeValue * 60;

  return Math.max(
    advanceNoticeMinutes,
    normalizedSettings.prepTimeMinutes || 0,
  );
};

export const formatSlotLabel = (slot) => {
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString
      .split(":")
      .map((value) => Number(value) || 0);
    const dateValue = new Date();
    dateValue.setHours(hours, minutes, 0, 0);
    return dateValue.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
};

export const getAvailableSlotsForDate = (
  deliverySettings,
  dateString,
  now = new Date(),
) => {
  const normalizedSettings = normalizeDeliverySettings(deliverySettings);
  return getAvailableSlotsForDateCore({
    normalizedSettings,
    dateString,
    now,
    dayLabels: DAY_LABELS,
    leadTimeMinutes: getLeadTimeMinutes(normalizedSettings),
  });
};

export const getMinimumDeliveryDate = (deliverySettings, now = new Date()) => {
  const minimumDeliveryDateTime = new Date(
    now.getTime() + getLeadTimeMinutes(deliverySettings) * 60 * 1000,
  );
  return minimumDeliveryDateTime.toISOString().split("T")[0];
};

export const getPauseUntilFromDuration = (
  durationValue,
  durationUnit,
  now = new Date(),
) => {
  const numericValue = Math.max(0, Number(durationValue) || 0);

  if (numericValue === 0) {
    return null;
  }

  const pauseUntil = new Date(now);
  pauseUntil.setMinutes(
    pauseUntil.getMinutes() +
      (durationUnit === "days" ? numericValue * 24 * 60 : numericValue * 60),
  );

  return pauseUntil.toISOString();
};

export { haversineDistance, isWithinDeliveryRadius };
export { getDeliveryDayKey };
