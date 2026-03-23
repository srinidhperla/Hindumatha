const parseSlotDateTime = (dateString, timeString) => {
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((value) => Number(value) || 0);
  const dateValue = new Date(dateString);
  dateValue.setHours(hours, minutes, 0, 0);
  return dateValue;
};

const formatTimeHHMM = (dateValue) => {
  const roundedDate = new Date(dateValue);
  if (roundedDate.getSeconds() > 0 || roundedDate.getMilliseconds() > 0) {
    roundedDate.setMinutes(roundedDate.getMinutes() + 1);
  }
  roundedDate.setSeconds(0, 0);
  const hours = String(roundedDate.getHours()).padStart(2, "0");
  const minutes = String(roundedDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const toLocalDateKey = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export const getAvailableSlotsForDateCore = ({
  normalizedSettings,
  dateString,
  now,
  dayLabels,
  leadTimeMinutes,
}) => {
  if (!normalizedSettings.enabled) {
    return {
      isAvailable: false,
      reason: "Delivery is currently turned off.",
      slots: [],
    };
  }

  if (!dateString) {
    return { isAvailable: true, reason: "", slots: [] };
  }

  let pauseMinimumDateTime = null;
  if (normalizedSettings.isPaused) {
    const pauseUntilDate = new Date(normalizedSettings.pauseUntil);
    const selectedDateKey = String(dateString).slice(0, 10);
    const pauseDateKey = toLocalDateKey(pauseUntilDate);

    if (selectedDateKey < pauseDateKey) {
      return {
        isAvailable: false,
        reason: `Delivery is paused until ${pauseUntilDate.toLocaleString("en-IN")}.`,
        slots: [],
      };
    }

    if (selectedDateKey === pauseDateKey) {
      pauseMinimumDateTime = pauseUntilDate;
    }
  }

  const dayKey = getDeliveryDayKey(dateString);
  const daySchedule = normalizedSettings.weeklySchedule[dayKey];

  if (!daySchedule?.isOpen) {
    return {
      isAvailable: false,
      reason: `Delivery is off on ${dayLabels[dayKey]}.`,
      slots: [],
    };
  }

  const leadTimeMinimumDateTime = new Date(
    now.getTime() + leadTimeMinutes * 60 * 1000,
  );
  const minimumDeliveryDateTime = pauseMinimumDateTime
    ? new Date(
        Math.max(
          leadTimeMinimumDateTime.getTime(),
          pauseMinimumDateTime.getTime(),
        ),
      )
    : leadTimeMinimumDateTime;

  const slots = (daySchedule.slots || [])
    .map((slot) => {
      const slotStart = parseSlotDateTime(dateString, slot.startTime);
      const slotEnd = parseSlotDateTime(dateString, slot.endTime);
      const effectiveStart =
        slotStart < minimumDeliveryDateTime
          ? minimumDeliveryDateTime
          : slotStart;

      if (!(slotStart < slotEnd) || !(slotEnd > minimumDeliveryDateTime)) {
        return null;
      }

      return {
        ...slot,
        startTime: formatTimeHHMM(effectiveStart),
      };
    })
    .filter(Boolean);

  if (!slots.length) {
    if (pauseMinimumDateTime) {
      return {
        isAvailable: false,
        reason: `Delivery is paused until ${pauseMinimumDateTime.toLocaleString("en-IN")}. Choose a time after resume.`,
        slots: [],
      };
    }

    return {
      isAvailable: false,
      reason:
        normalizedSettings.advanceNoticeUnit === "days"
          ? `No delivery slots are open for that day. Choose a date at least ${normalizedSettings.advanceNoticeValue} day(s) ahead.`
          : "No delivery slots remain after the current notice window. Choose a later date or slot.",
      slots: [],
    };
  }

  return {
    isAvailable: true,
    reason: "",
    slots,
  };
};
