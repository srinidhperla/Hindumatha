import React from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const AdminOrderAlertToolbar = ({
  alertsEnabled,
  audioEnabled,
  notificationPermission,
  pushSubscribed,
  soundUnlockRequired,
  activeAlertOrderIds,
  audioSupported,
  pushSupported,
  onEnableAlerts,
  onUnlockSound,
  onRunManualAlertTest,
}) => (
  <SurfaceCard className="mb-4 px-4 py-4 text-sm text-primary-700">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip tone={audioEnabled ? "success" : "warning"}>
          Sound:{" "}
          {audioEnabled
            ? "ready"
            : audioSupported
              ? alertsEnabled
                ? "tap once to arm again"
                : "enable once to keep alerts active"
              : "not supported"}
        </StatusChip>
        <StatusChip
          tone={notificationPermission === "granted" ? "success" : "warning"}
        >
          Notification: {notificationPermission}
        </StatusChip>
        <StatusChip
          tone={activeAlertOrderIds.length > 0 ? "danger" : "neutral"}
        >
          Waiting for acceptance: {activeAlertOrderIds.length}
        </StatusChip>
        <StatusChip tone={alertsEnabled ? "success" : "neutral"}>
          Background alerts: {alertsEnabled ? "enabled" : "disabled"}
        </StatusChip>
        <StatusChip tone={pushSubscribed ? "success" : "neutral"}>
          Push alerts:{" "}
          {pushSubscribed
            ? "subscribed"
            : pushSupported
              ? "not subscribed yet"
              : "not supported"}
        </StatusChip>
      </div>
      <ActionButton
        type="button"
        onClick={onEnableAlerts}
        className="w-full lg:w-auto"
      >
        {alertsEnabled ? "Alerts Enabled" : "Enable background alerts"}
      </ActionButton>
      {soundUnlockRequired && (
        <ActionButton
          type="button"
          onClick={onUnlockSound}
          variant="soft"
          className="w-full lg:w-auto"
        >
          Arm Sound
        </ActionButton>
      )}
      <ActionButton
        type="button"
        onClick={onRunManualAlertTest}
        variant="secondary"
        className="w-full lg:w-auto"
      >
        Test Alert
      </ActionButton>
    </div>
    <p className="mt-3 text-xs text-primary-500">
      "Not subscribed yet" means this browser has not finished push
      registration. Click "Enable background alerts" once and allow
      notifications.
    </p>
  </SurfaceCard>
);

export default AdminOrderAlertToolbar;
