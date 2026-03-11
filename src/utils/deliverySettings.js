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

const parseSlotDateTime = (dateString, timeString) => {
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((value) => Number(value) || 0);
  const dateValue = new Date(dateString);
  dateValue.setHours(hours, minutes, 0, 0);
  return dateValue;
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

export const getDeliveryDayKey = (dateString) => {
  const dateValue = new Date(dateString);
  const dayIndex = dateValue.getDay();
  return (
    [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][dayIndex] || "monday"
  );
};

export const getAvailableSlotsForDate = (
  deliverySettings,
  dateString,
  now = new Date(),
) => {
  const normalizedSettings = normalizeDeliverySettings(deliverySettings);

  if (!normalizedSettings.enabled) {
    return {
      isAvailable: false,
      reason: "Delivery is currently turned off.",
      slots: [],
    };
  }

  if (normalizedSettings.isPaused) {
    return {
      isAvailable: false,
      reason: `Delivery is paused until ${new Date(normalizedSettings.pauseUntil).toLocaleString("en-IN")}.`,
      slots: [],
    };
  }

  if (!dateString) {
    return { isAvailable: true, reason: "", slots: [] };
  }

  const dayKey = getDeliveryDayKey(dateString);
  const daySchedule = normalizedSettings.weeklySchedule[dayKey];

  if (!daySchedule?.isOpen) {
    return {
      isAvailable: false,
      reason: `Delivery is off on ${DAY_LABELS[dayKey]}.`,
      slots: [],
    };
  }

  const minimumDeliveryDateTime = new Date(
    now.getTime() + getLeadTimeMinutes(normalizedSettings) * 60 * 1000,
  );
  const slots = (daySchedule.slots || []).filter((slot) => {
    const slotStart = parseSlotDateTime(dateString, slot.startTime);
    const slotEnd = parseSlotDateTime(dateString, slot.endTime);
    return slotStart < slotEnd && slotStart >= minimumDeliveryDateTime;
  });

  if (!slots.length) {
    return {
      isAvailable: false,
      reason:
        normalizedSettings.advanceNoticeUnit === "days"
          ? `No delivery slots are open for that day. Choose a date at least ${normalizedSettings.advanceNoticeValue} day(s) ahead.`
          : `No delivery slots remain after the current notice window. Choose a later date or slot.`,
      slots: [],
    };
  }

  return {
    isAvailable: true,
    reason: "",
    slots,
  };
};

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
