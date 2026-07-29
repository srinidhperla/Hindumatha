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
  onChange,
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
  const [isNoteOpen, setIsNoteOpen] = useState(false);
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
    <>
      <div id="checkout-delivery-mode" className="checkout-group">
        <div className="checkout-group-head">
          <p className="checkout-group-label">When</p>
          {isScheduled ? (
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="checkout-group-action"
            >
              {scheduledDate && scheduledSlotStart ? "Change time" : "Pick time"}
            </button>
          ) : null}
        </div>

        <div className="checkout-choices">
          <button
            type="button"
            onClick={() => {
              if (isDeliveryTurnedOff) {
                return;
              }
              onChange({ target: { name: "deliveryMode", value: "now" } });
            }}
            disabled={isDeliveryTurnedOff}
            className={`checkout-pill ${isNowSelected ? "checkout-pill--active" : ""}`}
          >
            <p className="checkout-pill-title">Deliver Now</p>
            <p className="checkout-pill-note">Fastest after prep</p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isDeliveryTurnedOff) {
                return;
              }
              onChange({ target: { name: "deliveryMode", value: "scheduled" } });
              setShowScheduleModal(true);
            }}
            disabled={isDeliveryTurnedOff}
            className={`checkout-pill ${isScheduled ? "checkout-pill--active" : ""}`}
          >
            <p className="checkout-pill-title">Schedule</p>
            <p className="checkout-pill-note">Pick date &amp; time</p>
          </button>
        </div>

        {isScheduled && scheduledDate && scheduledSlotStart ? (
          <p className="mt-2 text-[13px] font-semibold text-primary-800">
            {scheduledDate} at {scheduledSlotStart}
          </p>
        ) : null}

        {isNowSelected || isDeliveryTurnedOff ? (
          effectiveNowReason && (
            <p className="checkout-inline-note">{effectiveNowReason}</p>
          )
        ) : null}
        {isScheduled && effectiveScheduleReason ? (
          <p className="checkout-inline-note">{effectiveScheduleReason}</p>
        ) : null}
        {!hasSelectedDeliveryMode ? (
          <p className="mt-1.5 text-xs font-medium text-amber-700">
            Select a delivery option to continue.
          </p>
        ) : null}
      </div>

      <div id="checkout-schedule-section" className="hidden" />

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

      <div id="checkout-payment-method" className="checkout-group">
        <p className="checkout-group-label mb-2.5">Payment</p>
        <div className="checkout-choices">
          <button
            type="button"
            onClick={() =>
              onChange({ target: { name: "paymentMethod", value: "upi" } })
            }
            className={`checkout-pill ${
              formData.paymentMethod === "upi" ? "checkout-pill--active" : ""
            }`}
          >
            <p className="checkout-pill-title">UPI</p>
            <p className="checkout-pill-note">Pay online</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({ target: { name: "paymentMethod", value: "cash" } })
            }
            className={`checkout-pill ${
              formData.paymentMethod === "cash" ? "checkout-pill--active" : ""
            }`}
          >
            <p className="checkout-pill-title">Cash</p>
            <p className="checkout-pill-note">Pay on delivery</p>
          </button>
        </div>
        {!formData.paymentMethod && (
          <p className="mt-1.5 text-xs font-medium text-amber-700">
            Choose UPI or Cash on Delivery.
          </p>
        )}
      </div>

      {/* Collapsed by default so the note field costs no vertical space. */}
      <div className="checkout-group">
        {isNoteOpen || formData.specialInstructions ? (
          <label className="block">
            <span className="checkout-group-label">Note for the bakery</span>
            <textarea
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={onChange}
              rows={2}
              placeholder="Cake message, design notes, landmark..."
              className="mt-2 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-caramel-400 focus:ring-2 focus:ring-caramel-200"
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setIsNoteOpen(true)}
            className="text-xs font-bold text-caramel-700 underline underline-offset-2"
          >
            + Add note for the bakery
          </button>
        )}
      </div>
    </>
  );
};

export default OrderDeliveryStep;
