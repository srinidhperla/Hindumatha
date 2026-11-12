import React from "react";
import { ActionButton, SurfaceCard, Toggle } from "@/shared/ui/Primitives";
import { FormField, fieldClass } from "@/shared/workspace/Form";
import { DAY_KEYS } from "@/utils/deliverySettings";
import AdminDeliveryDayScheduleSection from "./AdminDeliveryDayScheduleSection";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

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
  const settings = normalizedEditorDeliverySettings;
  const setPausePart = (key) => (event) =>
    setPauseTimeParts((currentValue) => ({
      ...currentValue,
      [key]: event.target.value,
    }));

  const statusLabel = settings.acceptingOrders
    ? "Live"
    : settings.isPaused
      ? "Paused"
      : "Off";

  return (
    <SurfaceCard className="p-4 md:p-5">
      {/* Status strip: is delivery on, and when does a pause end */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#1f1709]">
          <Toggle
            checked={settings.enabled !== false}
            onClick={() =>
              handleDeliveryEnabledChange(settings.enabled === false)
            }
            label="toggle accepting delivery orders"
          />
          Accept delivery orders
        </label>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            settings.acceptingOrders
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {statusLabel}
        </span>
        <span className="text-sm text-[#7d6c4d]">
          {settings.isPaused
            ? `Resumes ${pauseUntilLabel}`
            : "No pause scheduled"}
        </span>
        <span className="ml-auto text-sm text-[#7d6c4d]">
          Open days{" "}
          <strong className="text-[#1f1709]">
            {openDeliveryDaysCount}/{DAY_KEYS.length}
          </strong>
        </span>
      </div>

      {/* Temporary pause */}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#ebe1cb] pt-4">
        <FormField label="Pause for" className="w-32">
          <select
            value={pauseUnitSelection}
            onChange={(event) => setPauseUnitSelection(event.target.value)}
            className={fieldClass}
          >
            <option value="">Select</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </FormField>

        {pauseUnitSelection === "days" && (
          <FormField label="Resume date" className="w-44">
            <input
              type="date"
              value={pauseDateInput}
              onChange={(event) => setPauseDateInput(event.target.value)}
              className={fieldClass}
            />
          </FormField>
        )}

        <FormField label="Resume time">
          <span className="flex gap-1.5">
            <select
              value={pauseTimeParts.hour}
              onChange={setPausePart("hour")}
              className={`${fieldClass} w-[72px]`}
              aria-label="Hour"
            >
              <option value="">HH</option>
              {HOURS.map((hourValue) => (
                <option key={hourValue} value={hourValue}>
                  {hourValue.padStart(2, "0")}
                </option>
              ))}
            </select>
            <select
              value={pauseTimeParts.minute}
              onChange={setPausePart("minute")}
              className={`${fieldClass} w-[72px]`}
              aria-label="Minute"
            >
              <option value="">MM</option>
              {MINUTES.map((minuteValue) => (
                <option key={minuteValue} value={minuteValue}>
                  {minuteValue}
                </option>
              ))}
            </select>
            <select
              value={pauseTimeParts.period}
              onChange={setPausePart("period")}
              className={`${fieldClass} w-[84px]`}
              aria-label="AM or PM"
            >
              <option value="">AM/PM</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </span>
        </FormField>

        <ActionButton
          type="button"
          onClick={handlePauseDelivery}
          variant="secondary"
        >
          Pause delivery
        </ActionButton>
        <ActionButton
          type="button"
          onClick={handleResumeDelivery}
          variant="success"
        >
          Resume now
        </ActionButton>
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
    </SurfaceCard>
  );
};

export default AdminDeliveryTimingSection;
