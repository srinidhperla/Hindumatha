import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "@/features/uiSlice";
import { updateSiteSettings } from "@/features/site/siteSlice";
import {
  createDefaultSlot,
  DAY_KEYS,
  normalizeDeliverySettings,
} from "@/utils/deliverySettings";
import { getErrorMessage } from "./adminShared";
import {
  EMPTY_PAUSE_TIME_PARTS,
  toTwentyFourHour,
} from "./adminDeliveryTimingUtils";

export const useAdminDeliveryTimingState = () => {
  const dispatch = useDispatch();
  const {
    businessInfo,
    storeHours,
    socialLinks,
    coupons,
    deliverySettings: savedDeliverySettings,
    saving,
  } = useSelector((state) => state.site);

  const onToast = (message, type = "success") => {
    dispatch(showToast({ message, type }));
  };

  const [deliverySettings, setDeliverySettings] = useState(() =>
    normalizeDeliverySettings(savedDeliverySettings),
  );
  const [activeDeliveryDay, setActiveDeliveryDay] = useState(DAY_KEYS[0]);
  const [pauseDateInput, setPauseDateInput] = useState("");
  const [pauseTimeParts, setPauseTimeParts] = useState(EMPTY_PAUSE_TIME_PARTS);
  const [pauseUnitSelection, setPauseUnitSelection] = useState("");

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
        name === "advanceNoticeValue" ||
        name === "pauseDurationValue" ||
        name === "pricePerKm" ||
        name === "firstKmFee" ||
        name === "pricePerKmBeyondFirstKm" ||
        name === "freeDeliveryMinAmount"
          ? Number(value) || 0
          : value,
    }));
  };

  const handleDeliveryEnabledChange = (checked) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      enabled: checked,
    }));
  };

  const handleDistanceFeeEnabledChange = (checked) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      distanceFeeEnabled: checked,
    }));
  };

  const handleFreeDeliveryEnabledChange = (checked) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      freeDeliveryEnabled: checked,
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
    toTwelveHourParts,
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
    if (!pauseUnitSelection) {
      onToast("Select pause unit.", "error");
      return;
    }

    const time24 = toTwentyFourHour(
      pauseTimeParts.hour,
      pauseTimeParts.minute,
      pauseTimeParts.period,
    );
    if (!time24) {
      onToast("Choose a valid pause resume time.", "error");
      return;
    }

    const [hours, minutes] = time24.split(":").map((item) => Number(item));
    const now = new Date();
    const pauseUntil = new Date(now);

    if (pauseUnitSelection === "days") {
      if (!pauseDateInput) {
        onToast("Choose a pause resume date.", "error");
        return;
      }
      const pickedDate = new Date(pauseDateInput);
      if (Number.isNaN(pickedDate.getTime())) {
        onToast("Choose a valid pause resume date.", "error");
        return;
      }
      pauseUntil.setFullYear(
        pickedDate.getFullYear(),
        pickedDate.getMonth(),
        pickedDate.getDate(),
      );
    }

    pauseUntil.setHours(hours, minutes, 0, 0);

    if (pauseUntil <= now) {
      if (pauseUnitSelection === "hours") {
        pauseUntil.setDate(pauseUntil.getDate() + 1);
      } else {
        onToast("Pause resume date and time should be in the future.", "error");
        return;
      }
    }

    setDeliverySettings((currentValue) => ({
      ...currentValue,
      enabled: true,
      pauseDurationUnit: pauseUnitSelection,
      pauseUntil: pauseUntil.toISOString(),
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

  const persistDeliverySettings = async ({
    successMessage,
    failureMessage,
  }) => {
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
      onToast(successMessage);
    } catch (error) {
      onToast(getErrorMessage(error, failureMessage), "error");
    }
  };

  const handleSaveDeliveryTiming = async () => {
    await persistDeliverySettings({
      successMessage: "Delivery timing saved successfully.",
      failureMessage: "Failed to save delivery timing.",
    });
  };

  const handleSaveDeliveryFee = async () => {
    await persistDeliverySettings({
      successMessage: "Delivery fee settings saved successfully.",
      failureMessage: "Failed to save delivery fee settings.",
    });
  };

  return {
    saving,
    activeDeliveryDay,
    setActiveDeliveryDay,
    pauseDateInput,
    setPauseDateInput,
    pauseTimeParts,
    setPauseTimeParts,
    pauseUnitSelection,
    setPauseUnitSelection,
    normalizedEditorDeliverySettings,
    openDeliveryDaysCount,
    activeDaySchedule,
    pauseUntilLabel,
    handleDeliverySettingChange,
    handleDeliveryEnabledChange,
    handleDistanceFeeEnabledChange,
    handleFreeDeliveryEnabledChange,
    handleDeliveryDayOpenChange,
    handleDeliverySlotTimePartChange,
    handleAddDeliverySlot,
    handleRemoveDeliverySlot,
    handleCopyDayToAll,
    handlePauseDelivery,
    handleResumeDelivery,
    handleSaveDeliveryTiming,
    handleSaveDeliveryFee,
  };
};
