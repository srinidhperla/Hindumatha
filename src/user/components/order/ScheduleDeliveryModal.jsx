import React from "react";
import { HOURS_12, MINUTE_OPTIONS } from "./orderDeliveryTimeUtils";

const ScheduleDeliveryModal = ({
  isOpen,
  scheduledDate,
  minimumScheduleDate,
  scheduleAvailabilityReason,
  availableSlotLabels,
  availableScheduledSlots,
  draftTimeParts,
  draftHasTime,
  timeSelectionError,
  onDateChange,
  onTimePartChange,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/45 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-2xl border border-primary-200 bg-white p-4 shadow-[0_24px_50px_rgba(18,12,2,0.22)] sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary-800">
            Schedule Delivery
          </h3>
          <button
            type="button"
            onClick={onClose}
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
              onChange={onDateChange}
              min={minimumScheduleDate}
              required
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
                  onTimePartChange("hour", event.target.value)
                }
                required
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
                  onTimePartChange("minute", event.target.value)
                }
                required
                className="commerce-input"
                disabled={
                  !scheduledDate || availableScheduledSlots.length === 0
                }
              >
                <option value="">MM</option>
                {MINUTE_OPTIONS.map((minuteOption) => (
                  <option key={minuteOption.label} value={minuteOption.value}>
                    {minuteOption.label}
                  </option>
                ))}
              </select>
              <select
                value={draftTimeParts.period}
                onChange={(event) =>
                  onTimePartChange("period", event.target.value)
                }
                required
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
            {scheduledDate && !scheduleAvailabilityReason && !draftHasTime && (
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
          <button type="button" onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDeliveryModal;
