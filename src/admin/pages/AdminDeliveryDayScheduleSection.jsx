import React from "react";
import { ActionButton, StatusChip, Toggle } from "@/shared/ui/Primitives";
import {
  createDefaultSlot,
  DAY_KEYS,
  DAY_LABELS,
} from "@/utils/deliverySettings";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
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
  return (
    <>
      <div className="mt-6 grid gap-3 lg:grid-cols-7">
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
              className={`rounded-2xl border px-4 py-4 text-left admin-motion ${
                isActive
                  ? "border-[#1f1709] bg-[#1f1709] text-white"
                  : "border-[#ebe1cb] bg-white text-[#1f1709] hover:border-[#e3d7bb] hover:bg-[#faf6ec]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {DAY_LABELS[dayKey].slice(0, 3)}
                </span>
                <StatusChip
                  tone={daySchedule.isOpen ? "success" : "neutral"}
                  className={isActive ? "bg-white/15 text-white" : ""}
                >
                  {daySchedule.isOpen ? "Open" : "Closed"}
                </StatusChip>
              </div>
              <p
                className={`mt-3 text-xs leading-5 ${
                  isActive ? "text-[#e8d08a]" : "text-[#7d6c4d]"
                }`}
              >
                {daySchedule.isOpen
                  ? daySchedule.slots
                      .map((slot) =>
                        formatTimeRangeLabel(slot.startTime, slot.endTime),
                      )
                      .join(" | ")
                  : "No delivery slots"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[28px] border border-[#ebe1cb] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7d6c4d]">
              Editing
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1709]">
              {DAY_LABELS[activeDeliveryDay]}
            </h3>
            <p className="mt-1 text-sm text-[#7d6c4d]">
              Use one or more time windows for this day. Customers will see only
              these slots at checkout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] px-4 py-3 text-sm font-medium text-[#1f1709]">
              <Toggle
                checked={activeDaySchedule.isOpen}
                onClick={() =>
                  handleDeliveryDayOpenChange(
                    activeDeliveryDay,
                    !activeDaySchedule.isOpen,
                  )
                }
                label="toggle day delivery status"
              />
              Accept delivery orders this day
            </label>
            <ActionButton
              type="button"
              onClick={() => handleCopyDayToAll(activeDeliveryDay)}
              variant="secondary"
            >
              Copy this day to all
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => handleAddDeliverySlot(activeDeliveryDay)}
              variant="soft"
            >
              Add slot
            </ActionButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {activeDaySchedule.slots.map((slot, slotIndex) => (
            <span
              key={`${activeDeliveryDay}-summary-${slotIndex}`}
              className="rounded-full border border-[#e3d7bb] bg-[#faf6ec] px-3 py-1 text-xs font-semibold text-[#5c4a26]"
            >
              {formatTimeRangeLabel(slot.startTime, slot.endTime)}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {activeDaySchedule.slots.map((slot, slotIndex) => {
            const startParts = toTwelveHourParts(slot.startTime);
            const endParts = toTwelveHourParts(slot.endTime);

            return (
              <div
                key={`${activeDeliveryDay}-${slotIndex}`}
                className="grid gap-3 rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]"
              >
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#7d6c4d]">
                    Start
                  </span>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select
                      value={startParts.hour}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "startTime",
                          "hour",
                          event.target.value,
                          slot.startTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      value={startParts.minute}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "startTime",
                          "minute",
                          event.target.value,
                          slot.startTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      {MINUTES.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <select
                      value={startParts.period}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "startTime",
                          "period",
                          event.target.value,
                          slot.startTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
                <div className="flex items-end justify-center pb-3 text-sm font-semibold text-[#7d6c4d]">
                  to
                </div>
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#7d6c4d]">
                    End
                  </span>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select
                      value={endParts.hour}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "endTime",
                          "hour",
                          event.target.value,
                          slot.endTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      value={endParts.minute}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "endTime",
                          "minute",
                          event.target.value,
                          slot.endTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      {MINUTES.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <select
                      value={endParts.period}
                      onChange={(event) =>
                        handleDeliverySlotTimePartChange(
                          activeDeliveryDay,
                          slotIndex,
                          "endTime",
                          "period",
                          event.target.value,
                          slot.endTime,
                          toTwelveHourParts,
                        )
                      }
                      className="block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-3 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
                <div className="flex items-end">
                  <ActionButton
                    type="button"
                    onClick={() =>
                      handleRemoveDeliverySlot(activeDeliveryDay, slotIndex)
                    }
                    disabled={activeDaySchedule.slots.length === 1}
                    variant="danger"
                    className="w-full"
                  >
                    Remove
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <ActionButton
          type="button"
          onClick={handleSaveDeliveryTiming}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Delivery Timing"}
        </ActionButton>
      </div>
    </>
  );
};

export default AdminDeliveryDayScheduleSection;
