import React from "react";
import AdminDeliveryTimingSection from "./AdminDeliveryTimingSection";
import AdminDeliveryFeeSection from "./AdminDeliveryFeeSection";
import { useAdminDeliveryTimingState } from "./useAdminDeliveryTimingState";
import {
  formatTimeRangeLabel,
  toTwelveHourParts,
} from "./adminDeliveryTimingUtils";

const AdminDeliveryTimingPage = ({ syncVersion = 0 }) => {
  const {
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
  } = useAdminDeliveryTimingState();

  const renderSyncVersion = syncVersion;

  return (
    <div className="space-y-6" data-sync-version={renderSyncVersion}>
      <AdminDeliveryTimingSection
        normalizedEditorDeliverySettings={normalizedEditorDeliverySettings}
        pauseUntilLabel={pauseUntilLabel}
        pauseTimeParts={pauseTimeParts}
        setPauseTimeParts={setPauseTimeParts}
        pauseUnitSelection={pauseUnitSelection}
        setPauseUnitSelection={setPauseUnitSelection}
        pauseDateInput={pauseDateInput}
        setPauseDateInput={setPauseDateInput}
        openDeliveryDaysCount={openDeliveryDaysCount}
        activeDeliveryDay={activeDeliveryDay}
        setActiveDeliveryDay={setActiveDeliveryDay}
        activeDaySchedule={activeDaySchedule}
        formatTimeRangeLabel={formatTimeRangeLabel}
        toTwelveHourParts={toTwelveHourParts}
        handleDeliveryEnabledChange={handleDeliveryEnabledChange}
        handlePauseDelivery={handlePauseDelivery}
        handleResumeDelivery={handleResumeDelivery}
        handleDeliveryDayOpenChange={handleDeliveryDayOpenChange}
        handleCopyDayToAll={handleCopyDayToAll}
        handleAddDeliverySlot={handleAddDeliverySlot}
        handleDeliverySlotTimePartChange={handleDeliverySlotTimePartChange}
        handleRemoveDeliverySlot={handleRemoveDeliverySlot}
        handleSaveDeliveryTiming={handleSaveDeliveryTiming}
        saving={saving}
      />

      <AdminDeliveryFeeSection
        normalizedEditorDeliverySettings={normalizedEditorDeliverySettings}
        handleDistanceFeeEnabledChange={handleDistanceFeeEnabledChange}
        handleFreeDeliveryEnabledChange={handleFreeDeliveryEnabledChange}
        handleDeliverySettingChange={handleDeliverySettingChange}
        handleSaveDeliveryFee={handleSaveDeliveryFee}
        saving={saving}
      />
    </div>
  );
};

export default AdminDeliveryTimingPage;
