import React, { useEffect, useMemo, useState } from "react";
import { formatSlotLabel } from "../../../utils/deliverySettings";

const HOURS_12 = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const MINUTE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "40", label: "40" },
  { value: "50", label: "50" },
  { value: "00", label: "60" },
];
const EMPTY_TIME_PARTS = { hour: "", minute: "", period: "" };

const to12HourParts = (time24) => {
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

const to24HourTime = ({ hour, minute, period }) => {
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

const isTimeInsideSlots = (timeValue, slots) => {
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

const OrderDeliveryStep = ({
  formData,
  normalizedDeliverySettings,
  minimumScheduleDate,
  scheduledDate,
  scheduledSlotStart,
  availableScheduledSlots,
  scheduleAvailabilityReason,
  nowAvailabilityReason,
  pauseUntilLabel,
  pricing,
  availableCoupons,
  onChange,
  onBack,
}) => {
  const isDeliveryTurnedOff = normalizedDeliverySettings?.enabled === false;
  const isScheduled = formData.deliveryMode === "scheduled";
  const isNowSelected = formData.deliveryMode === "now";
  const hasSelectedDeliveryMode = isScheduled || isNowSelected;
  const effectiveNowReason = isDeliveryTurnedOff
    ? "Delivery is currently turned off."
    : nowAvailabilityReason;
  const effectiveScheduleReason = isDeliveryTurnedOff
    ? "Delivery is currently turned off."
    : scheduleAvailabilityReason;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [draftTimeParts, setDraftTimeParts] = useState(() =>
    to12HourParts(scheduledSlotStart),
  );
  const [timeSelectionError, setTimeSelectionError] = useState("");

  useEffect(() => {
    if (!isScheduled || isDeliveryTurnedOff) {
      setShowScheduleModal(false);
    }
  }, [isScheduled, isDeliveryTurnedOff]);

  useEffect(() => {
    if (showScheduleModal) {
      setDraftTimeParts(to12HourParts(scheduledSlotStart));
    }
  }, [scheduledSlotStart, showScheduleModal]);

  useEffect(() => {
    setTimeSelectionError("");
  }, [scheduledDate]);

  const availableSlotLabels = useMemo(
    () =>
      availableScheduledSlots.map((slot) =>
        typeof formatSlotLabel === "function"
          ? formatSlotLabel(slot)
          : `${slot.startTime} - ${slot.endTime}`,
      ),
    [availableScheduledSlots],
  );
  const handleTimePartChange = (part, value) => {
    setTimeSelectionError("");
    setDraftTimeParts((previous) => {
      const nextParts = {
        ...previous,
        [part]: value,
      };

      const hasCompleteTime = Boolean(
        nextParts.hour && nextParts.minute && nextParts.period,
      );

      onChange({
        target: {
          name: "deliverySlotTime",
          value: hasCompleteTime ? to24HourTime(nextParts) : "",
        },
      });

      return nextParts;
    });
  };
  const draftHasTime = Boolean(
    draftTimeParts.hour && draftTimeParts.minute && draftTimeParts.period,
  );
  const draftTime24 = draftHasTime ? to24HourTime(draftTimeParts) : "";
  const isDraftTimeRejected = Boolean(
    scheduledDate &&
    draftTime24 &&
    !isTimeInsideSlots(draftTime24, availableScheduledSlots),
  );

  useEffect(() => {
    if (!isDraftTimeRejected) {
      return;
    }

    setTimeSelectionError(
      scheduleAvailabilityReason ||
        "Selected wrong time. Please choose a time inside available windows.",
    );
    setDraftTimeParts(EMPTY_TIME_PARTS);
    onChange({
      target: {
        name: "deliverySlotTime",
        value: "",
      },
    });
  }, [isDraftTimeRejected, onChange, scheduleAvailabilityReason]);

  return (
    <div className="commerce-section-body">
      <h2 className="commerce-section-title">Delivery details</h2>
      <p className="commerce-section-copy">
        Choose instant delivery or schedule an exact delivery date and time.
      </p>

      <div className="commerce-form-stack">
        <div
          id="checkout-delivery-mode"
          className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3"
        >
          <p className="commerce-field-label mb-3">Delivery preference</p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                if (isDeliveryTurnedOff) {
                  return;
                }
                onChange({ target: { name: "deliveryMode", value: "now" } });
              }}
              disabled={isDeliveryTurnedOff}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isNowSelected
                  ? "border-sage-300 bg-sage-50"
                  : "border-primary-200 bg-white"
              } ${isDeliveryTurnedOff ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <p className="text-sm font-semibold text-primary-800">
                Deliver Now
              </p>
              <p className="text-xs text-primary-600">
                Fastest possible delivery after prep.
              </p>
              {(isNowSelected || isDeliveryTurnedOff) && effectiveNowReason && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {effectiveNowReason}
                </p>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDeliveryTurnedOff) {
                  return;
                }
                onChange({
                  target: { name: "deliveryMode", value: "scheduled" },
                });
                setShowScheduleModal(true);
              }}
              disabled={isDeliveryTurnedOff}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isScheduled
                  ? "border-caramel-300 bg-caramel-50"
                  : "border-primary-200 bg-white"
              } ${isDeliveryTurnedOff ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <p className="text-sm font-semibold text-primary-800">
                Schedule Delivery
              </p>
              <p className="text-xs text-primary-600">
                Choose exact date and time.
              </p>
              {(isScheduled || isDeliveryTurnedOff) &&
                effectiveScheduleReason && (
                  <p className="mt-2 text-xs font-medium text-rose-600">
                    {effectiveScheduleReason}
                  </p>
                )}
            </button>
          </div>
          {!hasSelectedDeliveryMode && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              Please select one delivery option to continue.
            </p>
          )}
        </div>

        {isScheduled && (
          <div
            id="checkout-schedule-section"
            className="rounded-2xl border border-caramel-200 bg-caramel-50/50 p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-800">
                  Scheduled delivery details
                </p>
                <p className="text-xs text-primary-600">
                  Select exact date and time in hours and minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="rounded-xl border border-caramel-200 bg-white px-3 py-2 text-sm font-semibold text-caramel-700 hover:bg-caramel-50"
              >
                {scheduledDate && scheduledSlotStart
                  ? "Edit schedule"
                  : "Choose schedule"}
              </button>
            </div>
            {scheduledDate && scheduledSlotStart && (
              <p className="mt-3 text-sm font-medium text-primary-700">
                Selected: {scheduledDate} at {scheduledSlotStart}
              </p>
            )}
          </div>
        )}

        {isScheduled && showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/45 p-3 sm:items-center sm:p-4">
            <div className="w-full max-w-lg rounded-2xl border border-primary-200 bg-white p-4 shadow-[0_24px_50px_rgba(18,12,2,0.22)] sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-800">
                  Schedule Delivery
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg px-2 py-1 text-primary-500 hover:bg-primary-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="commerce-field-label">Delivery Date</span>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={scheduledDate}
                    onChange={onChange}
                    min={minimumScheduleDate}
                    required={isScheduled}
                    className="commerce-input"
                  />
                  {scheduledDate && scheduleAvailabilityReason && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {scheduleAvailabilityReason}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="commerce-field-label">Delivery Time</span>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={draftTimeParts.hour}
                      onChange={(event) =>
                        handleTimePartChange("hour", event.target.value)
                      }
                      required={isScheduled}
                      className="commerce-input"
                      disabled={
                        !scheduledDate || availableScheduledSlots.length === 0
                      }
                    >
                      <option value="">HH</option>
                      {HOURS_12.map((hourValue) => (
                        <option key={hourValue} value={hourValue}>
                          {hourValue}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draftTimeParts.minute}
                      onChange={(event) =>
                        handleTimePartChange("minute", event.target.value)
                      }
                      required={isScheduled}
                      className="commerce-input"
                      disabled={
                        !scheduledDate || availableScheduledSlots.length === 0
                      }
                    >
                      <option value="">MM</option>
                      {MINUTE_OPTIONS.map((minuteOption) => (
                        <option
                          key={minuteOption.label}
                          value={minuteOption.value}
                        >
                          {minuteOption.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draftTimeParts.period}
                      onChange={(event) =>
                        handleTimePartChange("period", event.target.value)
                      }
                      required={isScheduled}
                      className="commerce-input"
                      disabled={
                        !scheduledDate || availableScheduledSlots.length === 0
                      }
                    >
                      <option value="" disabled>
                        AM/PM
                      </option>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  {!scheduledDate && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Please select a delivery date first.
                    </p>
                  )}
                  {scheduledDate &&
                    !scheduleAvailabilityReason &&
                    !draftHasTime && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Please choose hour, minute and AM/PM.
                      </p>
                    )}
                  {timeSelectionError && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {timeSelectionError}
                    </p>
                  )}
                </label>
              </div>

              {scheduledDate && availableSlotLabels.length > 0 && (
                <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
                    Available windows
                  </p>
                  <p className="mt-2 text-sm text-primary-700">
                    {availableSlotLabels.join(" | ")}
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <div id="checkout-payment-method" className="block">
          <p className="commerce-field-label mb-3">Payment Method</p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                onChange({ target: { name: "paymentMethod", value: "upi" } })
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                formData.paymentMethod === "upi"
                  ? "border-sage-300 bg-sage-50"
                  : "border-primary-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-primary-800">UPI</p>
              <p className="mt-1 text-xs text-primary-600">
                Pay securely online via UPI apps.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({ target: { name: "paymentMethod", value: "cash" } })
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                formData.paymentMethod === "cash"
                  ? "border-sage-300 bg-sage-50"
                  : "border-primary-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-primary-800">
                Cash on Delivery
              </p>
              <p className="mt-1 text-xs text-primary-600">
                Pay when your order is delivered.
              </p>
            </button>
          </div>
          {!formData.paymentMethod && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Please choose UPI or Cash on Delivery.
            </p>
          )}
        </div>

        <label className="block">
          <span className="commerce-field-label">Special Instructions</span>
          <textarea
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={onChange}
            rows={4}
            placeholder="Cake message, design notes, landmark, or anything the bakery should know"
            className="commerce-input"
          />
        </label>
      </div>
    </div>
  );
};

export default OrderDeliveryStep;
