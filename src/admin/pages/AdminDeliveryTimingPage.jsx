import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../components/ui/Primitives";
import {
  createDefaultSlot,
  DAY_KEYS,
  DAY_LABELS,
  getPauseUntilFromDuration,
  normalizeDeliverySettings,
} from "../../utils/deliverySettings";
import { updateSiteSettings } from "../../features/site/siteSlice";
import { getErrorMessage } from "./adminShared";

const formatTimeRangeLabel = (startTime, endTime) => {
  const formatTime = (value) => {
    const [hours, minutes] = String(value || "00:00")
      .split(":")
      .map((item) => Number(item) || 0);
    const dateValue = new Date();
    dateValue.setHours(hours, minutes, 0, 0);

    return dateValue.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const toTwelveHourParts = (value) => {
  const [hoursRaw, minutesRaw] = String(value || "00:00")
    .split(":")
    .map((item) => Number(item) || 0);
  const period = hoursRaw >= 12 ? "PM" : "AM";
  const hour12 = hoursRaw % 12 || 12;

  return {
    hour: String(hour12),
    minute: String(minutesRaw).padStart(2, "0"),
    period,
  };
};

const toTwentyFourHour = (hour12Value, minuteValue, periodValue) => {
  const safeHour12 = Math.min(12, Math.max(1, Number(hour12Value) || 12));
  const safeMinute = Math.min(59, Math.max(0, Number(minuteValue) || 0));
  const normalizedPeriod = periodValue === "PM" ? "PM" : "AM";

  let hour24 = safeHour12 % 12;
  if (normalizedPeriod === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`;
};

const AdminDeliveryTimingPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const {
    businessInfo,
    storeHours,
    socialLinks,
    coupons,
    deliverySettings: savedDeliverySettings,
    saving,
  } = useSelector((state) => state.site);

  const [deliverySettings, setDeliverySettings] = useState(() =>
    normalizeDeliverySettings(savedDeliverySettings),
  );
  const [activeDeliveryDay, setActiveDeliveryDay] = useState(DAY_KEYS[0]);

  const normalizedEditorDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );

  const openDeliveryDaysCount = useMemo(
    () =>
      DAY_KEYS.filter(
        (dayKey) =>
          normalizedEditorDeliverySettings.weeklySchedule[dayKey]?.isOpen,
      ).length,
    [normalizedEditorDeliverySettings],
  );

  const activeDaySchedule =
    normalizedEditorDeliverySettings.weeklySchedule[activeDeliveryDay] ||
    normalizedEditorDeliverySettings.weeklySchedule[DAY_KEYS[0]];

  const pauseUntilLabel = normalizedEditorDeliverySettings.pauseUntil
    ? new Date(normalizedEditorDeliverySettings.pauseUntil).toLocaleString(
        "en-IN",
      )
    : "Not scheduled";

  useEffect(() => {
    setDeliverySettings(normalizeDeliverySettings(savedDeliverySettings));
  }, [savedDeliverySettings]);

  const handleDeliverySettingChange = (event) => {
    const { name, value } = event.target;
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      [name]:
        name === "prepTimeMinutes" ||
        name === "advanceNoticeValue" ||
        name === "pauseDurationValue"
          ? Number(value) || 0
          : value,
    }));
  };

  const handleDeliveryEnabledChange = (event) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      enabled: event.target.checked,
    }));
  };

  const handleDeliveryDayOpenChange = (dayKey, checked) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      weeklySchedule: {
        ...currentValue.weeklySchedule,
        [dayKey]: {
          ...currentValue.weeklySchedule[dayKey],
          isOpen: checked,
        },
      },
    }));
  };

  const handleDeliverySlotChange = (dayKey, slotIndex, field, value) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      weeklySchedule: {
        ...currentValue.weeklySchedule,
        [dayKey]: {
          ...currentValue.weeklySchedule[dayKey],
          slots: currentValue.weeklySchedule[dayKey].slots.map((slot, index) =>
            index === slotIndex ? { ...slot, [field]: value } : slot,
          ),
        },
      },
    }));
  };

  const handleDeliverySlotTimePartChange = (
    dayKey,
    slotIndex,
    field,
    part,
    partValue,
    currentTime,
  ) => {
    const currentParts = toTwelveHourParts(currentTime);
    const nextParts = {
      ...currentParts,
      [part]: String(partValue),
    };

    handleDeliverySlotChange(
      dayKey,
      slotIndex,
      field,
      toTwentyFourHour(nextParts.hour, nextParts.minute, nextParts.period),
    );
  };

  const handleAddDeliverySlot = (dayKey) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      weeklySchedule: {
        ...currentValue.weeklySchedule,
        [dayKey]: {
          ...currentValue.weeklySchedule[dayKey],
          slots: [
            ...currentValue.weeklySchedule[dayKey].slots,
            createDefaultSlot(),
          ],
        },
      },
    }));
  };

  const handleRemoveDeliverySlot = (dayKey, slotIndex) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      weeklySchedule: {
        ...currentValue.weeklySchedule,
        [dayKey]: {
          ...currentValue.weeklySchedule[dayKey],
          slots: currentValue.weeklySchedule[dayKey].slots.filter(
            (_, currentSlotIndex) => currentSlotIndex !== slotIndex,
          ),
        },
      },
    }));
  };

  const handleCopyDayToAll = (dayKey) => {
    setDeliverySettings((currentValue) => {
      const sourceDay = currentValue.weeklySchedule[dayKey];
      const nextWeeklySchedule = DAY_KEYS.reduce((result, currentDayKey) => {
        result[currentDayKey] = {
          isOpen: sourceDay.isOpen,
          slots: sourceDay.slots.map((slot) => ({ ...slot })),
        };
        return result;
      }, {});

      return {
        ...currentValue,
        weeklySchedule: nextWeeklySchedule,
      };
    });
  };

  const handlePauseDelivery = () => {
    const pauseUntil = getPauseUntilFromDuration(
      normalizedEditorDeliverySettings.pauseDurationValue,
      normalizedEditorDeliverySettings.pauseDurationUnit,
    );

    if (!pauseUntil) {
      onToast("Enter a pause duration greater than 0.", "error");
      return;
    }

    setDeliverySettings((currentValue) => ({
      ...currentValue,
      enabled: true,
      pauseUntil,
    }));
    onToast("Delivery pause timer updated.");
  };

  const handleResumeDelivery = () => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      pauseUntil: null,
    }));
    onToast("Delivery resumed.");
  };

  const handleSaveDeliveryTiming = async () => {
    try {
      const normalizedDelivery = normalizeDeliverySettings(deliverySettings);
      const flattenedTimeSlots = DAY_KEYS.flatMap((dayKey) =>
        normalizedDelivery.weeklySchedule[dayKey].slots.map(
          (slot) => `${slot.startTime}-${slot.endTime}`,
        ),
      );

      await dispatch(
        updateSiteSettings({
          businessInfo,
          storeHours,
          socialLinks,
          coupons,
          deliverySettings: {
            ...normalizedDelivery,
            advanceNoticeUnit: "hours",
            advanceNoticeValue: 0,
            timeSlots: flattenedTimeSlots,
          },
        }),
      ).unwrap();
      onToast("Delivery timing saved successfully.");
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to save delivery timing."),
        "error",
      );
    }
  };

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
          <label className="inline-flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:min-w-[260px]">
            <div>
              <span className="block text-sm font-semibold text-slate-900">
                Accept delivery orders
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Turn this off only when you want delivery stopped without an
                auto-resume timer.
              </span>
            </div>
            <input
              type="checkbox"
              checked={normalizedEditorDeliverySettings.enabled !== false}
              onChange={handleDeliveryEnabledChange}
              className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </p>
            <p
              className={`mt-2 text-lg font-semibold ${normalizedEditorDeliverySettings.acceptingOrders ? "text-emerald-700" : "text-rose-700"}`}
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
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prep Time
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {normalizedEditorDeliverySettings.prepTimeMinutes || 0} mins
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Pause delivery for
            </label>
            <input
              type="number"
              min="0"
              name="pauseDurationValue"
              value={normalizedEditorDeliverySettings.pauseDurationValue}
              onChange={handleDeliverySettingChange}
              className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Pause unit
            </label>
            <select
              name="pauseDurationUnit"
              value={normalizedEditorDeliverySettings.pauseDurationUnit}
              onChange={handleDeliverySettingChange}
              className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Prep time in minutes
            </label>
            <input
              type="number"
              min="0"
              name="prepTimeMinutes"
              value={normalizedEditorDeliverySettings.prepTimeMinutes}
              onChange={handleDeliverySettingChange}
              className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
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

        <div className="mt-6 grid gap-3 lg:grid-cols-7">
          {DAY_KEYS.map((dayKey) => {
            const daySchedule = normalizedEditorDeliverySettings
              .weeklySchedule?.[dayKey] || {
              isOpen: true,
              slots: [createDefaultSlot()],
            };
            const isActive = activeDeliveryDay === dayKey;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setActiveDeliveryDay(dayKey)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
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
                Use one or more time windows for this day. Customers will see
                only these slots at checkout.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={activeDaySchedule.isOpen}
                  onChange={(event) =>
                    handleDeliveryDayOpenChange(
                      activeDeliveryDay,
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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
            {activeDaySchedule.slots.map((slot, slotIndex) =>
              (() => {
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
                            )
                          }
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        >
                          {Array.from({ length: 12 }, (_, index) =>
                            String(index + 1),
                          ).map((hour) => (
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
                            )
                          }
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        >
                          {Array.from({ length: 60 }, (_, index) =>
                            String(index).padStart(2, "0"),
                          ).map((minute) => (
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
                            )
                          }
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        >
                          {Array.from({ length: 12 }, (_, index) =>
                            String(index + 1),
                          ).map((hour) => (
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
                            )
                          }
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        >
                          {Array.from({ length: 60 }, (_, index) =>
                            String(index).padStart(2, "0"),
                          ).map((minute) => (
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
              })(),
            )}
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
      </div>
    </SurfaceCard>
  );
};

export default AdminDeliveryTimingPage;
