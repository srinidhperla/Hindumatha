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
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
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
                  isActive ? "text-slate-200" : "text-slate-500"
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

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Editing
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              {DAY_LABELS[activeDeliveryDay]}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use one or more time windows for this day. Customers will see only
              these slots at checkout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
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
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
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
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]"
              >
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
                <div className="flex items-end justify-center pb-3 text-sm font-semibold text-slate-400">
                  to
                </div>
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
