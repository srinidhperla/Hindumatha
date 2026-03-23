import { DAY_LABELS, getDeliveryDayKey } from "@/utils/deliverySettings";

export const stepLabels = ["Review", "Checkout"];

export const scrollToPageTop = () => {
  window.scrollTo({ top: 0, behavior: "auto" });
};

export const scrollToValidationTarget = (targetId) => {
  if (!targetId) {
    scrollToPageTop();
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) {
    scrollToPageTop();
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const toMinutes = (timeValue = "") => {
  const [hours, minutes] = String(timeValue)
    .split(":")
    .map((value) => Number(value) || 0);
  return hours * 60 + minutes;
};

export const isTimeInsideAnySlotWindow = (timeValue, slots = []) => {
  if (!timeValue) {
    return false;
  }

  const candidateMinutes = toMinutes(String(timeValue).slice(0, 5));
  return slots.some((slot) => {
    const startMinutes = toMinutes(slot.startTime);
    const endMinutes = toMinutes(slot.endTime);
    return candidateMinutes >= startMinutes && candidateMinutes < endMinutes;
  });
};

export const toLocalDateKey = (dateValue = new Date()) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayTime = (timeValue = "00:00") => {
  const [hours, minutes] = String(timeValue)
    .split(":")
    .map((value) => Number(value) || 0);
  const dateValue = new Date();
  dateValue.setHours(hours, minutes, 0, 0);
  return dateValue.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getDeliveryNowReason = (
  normalizedDeliverySettings,
  now = new Date(),
) => {
  if (!normalizedDeliverySettings?.enabled) {
    return "Delivery is currently turned off.";
  }

  if (normalizedDeliverySettings?.isPaused) {
    return `Delivery is temporarily paused until ${new Date(normalizedDeliverySettings.pauseUntil).toLocaleString("en-IN")}.`;
  }

  const todayDateKey = toLocalDateKey(now);
  const todayDayKey = getDeliveryDayKey(todayDateKey);
  const daySchedule = normalizedDeliverySettings?.weeklySchedule?.[todayDayKey];

  if (!daySchedule?.isOpen) {
    return `Delivery is closed on ${DAY_LABELS[todayDayKey]}.`;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = (daySchedule.slots || [])
    .map((slot) => ({
      ...slot,
      startMinutes: toMinutes(slot.startTime),
      endMinutes: toMinutes(slot.endTime),
    }))
    .filter((slot) => slot.endMinutes > slot.startMinutes)
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const inActiveWindow = slots.some(
    (slot) => nowMinutes >= slot.startMinutes && nowMinutes < slot.endMinutes,
  );

  if (inActiveWindow) {
    return "";
  }

  const nextWindow = slots.find((slot) => slot.startMinutes > nowMinutes);
  if (nextWindow) {
    return `Delivery opens today at ${formatDisplayTime(nextWindow.startTime)}.`;
  }

  return "Delivery is closed for today. Please schedule delivery.";
};
