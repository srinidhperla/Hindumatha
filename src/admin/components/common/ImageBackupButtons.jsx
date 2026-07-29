import React from "react";
import { ActionButton } from "@/shared/ui/Primitives";

/**
 * Download / restore pair used by both the gallery and product admin toolbars.
 * State and handlers come from useImageBackup.
 */
const ImageBackupButtons = ({
  restoreInputRef,
  isBackingUp,
  isRestoring,
  onBackup,
  onRestore,
  openRestorePicker,
  className = "",
}) => (
  <div className={`flex gap-2 ${className}`}>
    <ActionButton
      onClick={onBackup}
      variant="soft"
      disabled={isBackingUp}
      className="flex-1 sm:flex-initial text-xs sm:text-sm"
    >
      {isBackingUp ? "Preparing..." : "Download Images"}
    </ActionButton>

    <input
      ref={restoreInputRef}
      type="file"
      accept=".zip,application/zip,application/x-zip-compressed"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) {
          onRestore(file);
        }
      }}
    />
    <ActionButton
      onClick={openRestorePicker}
      variant="soft"
      disabled={isRestoring}
      className="flex-1 sm:flex-initial text-xs sm:text-sm"
    >
      {isRestoring ? "Restoring..." : "Restore Images"}
    </ActionButton>
  </div>
);

export default ImageBackupButtons;
