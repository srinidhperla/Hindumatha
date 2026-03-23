const padTwo = (value) => String(value).padStart(2, "0");

export const EMPTY_PAUSE_TIME_PARTS = { hour: "", minute: "", period: "" };

export const formatTimeRangeLabel = (startTime, endTime) => {
  const formatTime = (value) => {
    const [hours, minutes] = String(value || "00:00")
      .split(":")
      .map((item) => Number(item) || 0);
    const dateValue = new Date();
    dateValue.setHours(hours, minutes, 0, 0);

    return dateValue.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const toTwelveHourParts = (value) => {
  const [hoursRaw, minutesRaw] = String(value || "00:00")
    .split(":")
    .map((item) => Number(item) || 0);
  const period = hoursRaw >= 12 ? "PM" : "AM";
  const hour12 = hoursRaw % 12 || 12;

  return {
    hour: String(hour12),
    minute: padTwo(minutesRaw),
    period,
  };
};

export const toTwentyFourHour = (hour12Value, minuteValue, periodValue) => {
  if (!hour12Value || !minuteValue || !periodValue) {
    return "";
  }

  const safeHour12 = Number(hour12Value);
  const safeMinute = Number(minuteValue);
  if (!Number.isFinite(safeHour12) || safeHour12 < 1 || safeHour12 > 12) {
    return "";
  }
  if (!Number.isFinite(safeMinute) || safeMinute < 0 || safeMinute > 59) {
    return "";
  }
  if (periodValue !== "AM" && periodValue !== "PM") {
    return "";
  }

  let hour24 = safeHour12 % 12;
  if (periodValue === "PM") {
    hour24 += 12;
  }

  return `${padTwo(hour24)}:${padTwo(safeMinute)}`;
};
