export const HOURS_12 = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

export const MINUTE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "40", label: "40" },
  { value: "50", label: "50" },
  { value: "00", label: "60" },
];

export const EMPTY_TIME_PARTS = { hour: "", minute: "", period: "" };

export const to12HourParts = (time24) => {
  if (!time24 || !time24.includes(":")) {
    return EMPTY_TIME_PARTS;
  }

  const [hourPart, minutePart] = time24.split(":");
  const hour24 = Number(hourPart);
  const minute = String(minutePart || "").slice(0, 2);

  if (!Number.isFinite(hour24) || !minute) {
    return EMPTY_TIME_PARTS;
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return {
    hour: String(hour12).padStart(2, "0"),
    minute,
    period,
  };
};

export const to24HourTime = ({ hour, minute, period }) => {
  if (!hour || !minute || !period) {
    return "";
  }

  const parsedHour = Number(hour);
  if (!Number.isFinite(parsedHour) || parsedHour < 1 || parsedHour > 12) {
    return "";
  }

  let hour24 = parsedHour % 12;
  if (period === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${minute}`;
};

const toMinutes = (timeValue) => {
  if (!timeValue || !timeValue.includes(":")) {
    return null;
  }

  const [hours, minutes] = timeValue.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

export const isTimeInsideSlots = (timeValue, slots) => {
  const selectedMinutes = toMinutes(timeValue);
  if (selectedMinutes === null || !Array.isArray(slots) || slots.length === 0) {
    return false;
  }

  return slots.some((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    if (slotStart === null || slotEnd === null) {
      return false;
    }
    return selectedMinutes >= slotStart && selectedMinutes < slotEnd;
  });
};
