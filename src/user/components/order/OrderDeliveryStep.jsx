import React, { useEffect, useMemo, useState } from "react";
import { formatSlotLabel } from "@/utils/deliverySettings";
import ScheduleDeliveryModal from "./ScheduleDeliveryModal";
import {
  EMPTY_TIME_PARTS,
  isTimeInsideSlots,
  to12HourParts,
  to24HourTime,
} from "./orderDeliveryTimeUtils";

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

        <ScheduleDeliveryModal
          isOpen={isScheduled && showScheduleModal}
          scheduledDate={scheduledDate}
          minimumScheduleDate={minimumScheduleDate}
          scheduleAvailabilityReason={scheduleAvailabilityReason}
          availableSlotLabels={availableSlotLabels}
          availableScheduledSlots={availableScheduledSlots}
          draftTimeParts={draftTimeParts}
          draftHasTime={draftHasTime}
          timeSelectionError={timeSelectionError}
          onDateChange={onChange}
          onTimePartChange={handleTimePartChange}
          onClose={() => setShowScheduleModal(false)}
        />

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
