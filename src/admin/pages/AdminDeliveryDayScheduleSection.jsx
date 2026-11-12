import React from "react";
import { ActionButton, Toggle } from "@/shared/ui/Primitives";
import { fieldClass } from "@/shared/workspace/Form";
import {
  createDefaultSlot,
  DAY_KEYS,
  DAY_LABELS,
} from "@/utils/deliverySettings";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

/* Hour / minute / AM-PM pickers for one end of a delivery slot. */
const SlotTime = ({ label, parts, onPartChange }) => (
  <span className="flex items-center gap-1.5">
    <select
      value={parts.hour}
      onChange={(event) => onPartChange("hour", event.target.value)}
      className={`${fieldClass} w-[64px]`}
      aria-label={`${label} hour`}
    >
      {HOURS.map((hour) => (
        <option key={hour} value={hour}>
          {hour}
        </option>
      ))}
    </select>
    <select
      value={parts.minute}
      onChange={(event) => onPartChange("minute", event.target.value)}
      className={`${fieldClass} w-[64px]`}
      aria-label={`${label} minute`}
    >
      {MINUTES.map((minute) => (
        <option key={minute} value={minute}>
          {minute}
        </option>
      ))}
    </select>
    <select
      value={parts.period}
      onChange={(event) => onPartChange("period", event.target.value)}
      className={`${fieldClass} w-[70px]`}
      aria-label={`${label} AM or PM`}
    >
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  </span>
);

const AdminDeliveryDayScheduleSection = ({
  activeDeliveryDay,
  setActiveDeliveryDay,
  normalizedEditorDeliverySettings,
  activeDaySchedule,
  formatTimeRangeLabel,
  toTwelveHourParts,
  handleDeliveryDayOpenChange,
  handleCopyDayToAll,
  handleAddDeliverySlot,
  handleDeliverySlotTimePartChange,
  handleRemoveDeliverySlot,
  handleSaveDeliveryTiming,
  saving,
}) => {
  const changeSlotPart = (slotIndex, field, currentValue) => (part, value) =>
    handleDeliverySlotTimePartChange(
      activeDeliveryDay,
      slotIndex,
      field,
      part,
      value,
      currentValue,
      toTwelveHourParts,
    );

  return (
    <div className="mt-4 border-t border-[#ebe1cb] pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-playfair text-lg font-bold text-[#1f1709]">
          Weekly schedule
        </h2>
        <ActionButton
          type="button"
          onClick={handleSaveDeliveryTiming}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save timing"}
        </ActionButton>
      </div>

      {/* Day picker */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAY_KEYS.map((dayKey) => {
          const daySchedule = normalizedEditorDeliverySettings.weeklySchedule?.[
            dayKey
          ] || {
            isOpen: true,
            slots: [createDefaultSlot()],
          };
          const isActive = activeDeliveryDay === dayKey;

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setActiveDeliveryDay(dayKey)}
              className={`rounded-xl border px-2.5 py-2 text-left admin-motion ${
                isActive
                  ? "border-[#1f1709] bg-[#1f1709] text-white"
                  : "border-[#ebe1cb] bg-white text-[#1f1709] hover:bg-[#faf6ec]"
              }`}
            >
              <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                {DAY_LABELS[dayKey].slice(0, 3)}
                <span
                  className={`h-2 w-2 rounded-full ${
                    daySchedule.isOpen ? "bg-emerald-500" : "bg-[#c9bb97]"
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span
                className={`mt-0.5 block truncate text-[11px] ${
                  isActive ? "text-[#e8d08a]" : "text-[#7d6c4d]"
                }`}
              >
                {daySchedule.isOpen
                  ? daySchedule.slots
                      .map((slot) =>
                        formatTimeRangeLabel(slot.startTime, slot.endTime),
                      )
                      .join(", ")
                  : "Closed"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected day */}
      <div className="mt-3 rounded-xl border border-[#ebe1cb] p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="text-sm font-bold text-[#1f1709]">
            {DAY_LABELS[activeDeliveryDay]}
          </h3>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1f1709]">
            <Toggle
              size="sm"
              checked={activeDaySchedule.isOpen}
              onClick={() =>
                handleDeliveryDayOpenChange(
                  activeDeliveryDay,
                  !activeDaySchedule.isOpen,
                )
              }
              label="toggle day delivery status"
            />
            Open for delivery
          </label>
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={() => handleAddDeliverySlot(activeDeliveryDay)}
              className="text-xs font-semibold text-[#8b6914] hover:underline"
            >
              + Add slot
            </button>
            <button
              type="button"
              onClick={() => handleCopyDayToAll(activeDeliveryDay)}
              className="text-xs font-semibold text-[#8b6914] hover:underline"
            >
              Copy to all days
            </button>
          </div>
        </div>

        <div className="mt-2.5 space-y-2">
          {activeDaySchedule.slots.map((slot, slotIndex) => (
            <div
              key={`${activeDeliveryDay}-${slotIndex}`}
              className="flex flex-wrap items-center gap-2"
            >
              <SlotTime
                label="Start"
                parts={toTwelveHourParts(slot.startTime)}
                onPartChange={changeSlotPart(
                  slotIndex,
                  "startTime",
                  slot.startTime,
                )}
              />
              <span className="text-sm text-[#7d6c4d]">to</span>
              <SlotTime
                label="End"
                parts={toTwelveHourParts(slot.endTime)}
                onPartChange={changeSlotPart(
                  slotIndex,
                  "endTime",
                  slot.endTime,
                )}
              />
              <button
                type="button"
                onClick={() =>
                  handleRemoveDeliverySlot(activeDeliveryDay, slotIndex)
                }
                disabled={activeDaySchedule.slots.length === 1}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#a3271b] hover:bg-[#fdf1ef] disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryDayScheduleSection;
