import React from "react";
import { ActionButton, SurfaceCard, Toggle } from "@/shared/ui/Primitives";
import { DAY_KEYS } from "@/utils/deliverySettings";
import AdminDeliveryDayScheduleSection from "./AdminDeliveryDayScheduleSection";

const AdminDeliveryTimingSection = ({
  normalizedEditorDeliverySettings,
  pauseUntilLabel,
  pauseTimeParts,
  setPauseTimeParts,
  pauseUnitSelection,
  setPauseUnitSelection,
  pauseDateInput,
  setPauseDateInput,
  openDeliveryDaysCount,
  activeDeliveryDay,
  setActiveDeliveryDay,
  activeDaySchedule,
  formatTimeRangeLabel,
  toTwelveHourParts,
  handleDeliveryEnabledChange,
  handlePauseDelivery,
  handleResumeDelivery,
  handleDeliveryDayOpenChange,
  handleCopyDayToAll,
  handleAddDeliverySlot,
  handleDeliverySlotTimePartChange,
  handleRemoveDeliverySlot,
  handleSaveDeliveryTiming,
  saving,
}) => {
  return (
    <SurfaceCard className="p-6">
      <div className="overflow-hidden rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#fdf2f8_100%)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Delivery Ops
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Delivery Timing
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Pause delivery means turn delivery off for a fixed number of hours
              or days, then let it turn on automatically after that time ends.
            </p>
          </div>
          <label className="flex w-full flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:min-w-[260px] lg:w-auto">
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">
                Accept delivery orders
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Turn this off only when you want delivery stopped without an
                auto-resume timer.
              </span>
            </div>
            <Toggle
              checked={normalizedEditorDeliverySettings.enabled !== false}
              onClick={() =>
                handleDeliveryEnabledChange(
                  normalizedEditorDeliverySettings.enabled === false,
                )
              }
              label="toggle accepting delivery orders"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </p>
            <p
              className={`mt-2 text-lg font-semibold ${
                normalizedEditorDeliverySettings.acceptingOrders
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {normalizedEditorDeliverySettings.acceptingOrders
                ? "Live"
                : normalizedEditorDeliverySettings.isPaused
                  ? "Temporarily paused"
                  : "Permanently off"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Auto Resume
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {normalizedEditorDeliverySettings.isPaused
                ? pauseUntilLabel
                : "Not scheduled"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Pause resume time
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <select
                value={pauseTimeParts.hour}
                onChange={(event) =>
                  setPauseTimeParts((currentValue) => ({
                    ...currentValue,
                    hour: event.target.value,
                  }))
                }
                className="block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              >
                <option value="">HH</option>
                {Array.from({ length: 12 }, (_, index) =>
                  String(index + 1),
                ).map((hourValue) => (
                  <option key={hourValue} value={hourValue}>
                    {hourValue.padStart(2, "0")}
                  </option>
                ))}
              </select>
              <select
                value={pauseTimeParts.minute}
                onChange={(event) =>
                  setPauseTimeParts((currentValue) => ({
                    ...currentValue,
                    minute: event.target.value,
                  }))
                }
                className="block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              >
                <option value="">MM</option>
                {Array.from({ length: 60 }, (_, index) =>
                  String(index).padStart(2, "0"),
                ).map((minuteValue) => (
                  <option key={minuteValue} value={minuteValue}>
                    {minuteValue}
                  </option>
                ))}
              </select>
              <select
                value={pauseTimeParts.period}
                onChange={(event) =>
                  setPauseTimeParts((currentValue) => ({
                    ...currentValue,
                    period: event.target.value,
                  }))
                }
                className="block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              >
                <option value="">AM/PM</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Pause unit
            </label>
            <select
              value={pauseUnitSelection}
              onChange={(event) => setPauseUnitSelection(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            >
              <option value="">Select unit</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
            {pauseUnitSelection === "days" && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600">
                  Resume date
                </label>
                <input
                  type="date"
                  value={pauseDateInput}
                  onChange={(event) => setPauseDateInput(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <ActionButton
            type="button"
            onClick={handlePauseDelivery}
            variant="soft"
          >
            Pause delivery now
          </ActionButton>
          <ActionButton
            type="button"
            onClick={handleResumeDelivery}
            variant="success"
          >
            Resume delivery now
          </ActionButton>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Open days: {openDeliveryDaysCount} / {DAY_KEYS.length}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
          Customers can only book dates and slots that match this schedule.
          Pause delivery turns delivery off only until the pause timer finishes.
        </div>

        <AdminDeliveryDayScheduleSection
          activeDeliveryDay={activeDeliveryDay}
          setActiveDeliveryDay={setActiveDeliveryDay}
          normalizedEditorDeliverySettings={normalizedEditorDeliverySettings}
          activeDaySchedule={activeDaySchedule}
          formatTimeRangeLabel={formatTimeRangeLabel}
          toTwelveHourParts={toTwelveHourParts}
          handleDeliveryDayOpenChange={handleDeliveryDayOpenChange}
          handleCopyDayToAll={handleCopyDayToAll}
          handleAddDeliverySlot={handleAddDeliverySlot}
          handleDeliverySlotTimePartChange={handleDeliverySlotTimePartChange}
          handleRemoveDeliverySlot={handleRemoveDeliverySlot}
          handleSaveDeliveryTiming={handleSaveDeliveryTiming}
          saving={saving}
        />
      </div>
    </SurfaceCard>
  );
};

export default AdminDeliveryTimingSection;
