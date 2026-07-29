import { useRef, useState } from "react";
import { getErrorMessage } from "@/admin/pages/adminShared";

/**
 * Shared download/restore behaviour for the gallery and product image backups.
 *
 * `downloadBackup` must resolve to a Blob, `uploadRestore` takes a FormData
 * carrying the zip under the "archive" field.
 */
const useImageBackup = ({
  label,
  fileNamePrefix,
  downloadBackup,
  uploadRestore,
  onToast,
  onRestored,
}) => {
  const restoreInputRef = useRef(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Blob-typed responses turn server error JSON into an unreadable Blob, which
  // would otherwise surface as a generic failure with no reason.
  const readErrorMessage = async (error, fallbackMessage) => {
    const data = error?.response?.data;

    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        return parsed.error || parsed.message || fallbackMessage;
      } catch {
        return fallbackMessage;
      }
    }

    return getErrorMessage(data || error, fallbackMessage);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);

    try {
      const blob = await downloadBackup();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fileNamePrefix}-backup-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      onToast(
        `${label} image backup downloaded. Open _manifest.json inside the zip to confirm nothing failed.`,
      );
    } catch (error) {
      onToast(
        await readErrorMessage(error, `Failed to download ${label} backup.`),
        "error",
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (file) => {
    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      `Restore ${label} images from "${file.name}"?\n\n` +
        "Only images that are MISSING from Cloudinary will be re-uploaded. " +
        "Images that still work are left untouched, so nothing good is " +
        "overwritten and no extra Cloudinary usage is spent.",
    );

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);

    try {
      const archiveFormData = new FormData();
      archiveFormData.append("archive", file);
      archiveFormData.append("mode", "missing");
      const result = await uploadRestore(archiveFormData);

      await onRestored?.();

      const parts = [`Restored ${result.updated?.length || 0} missing ${label} image(s).`];
      if (result.alreadyHealthy?.length) {
        parts.push(`${result.alreadyHealthy.length} already fine (left as is).`);
      }
      if (result.skipped?.length) {
        parts.push(`${result.skipped.length} skipped.`);
      }
      onToast(parts.join(" "));
    } catch (error) {
      onToast(
        await readErrorMessage(error, `Failed to restore ${label} images.`),
        "error",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    restoreInputRef,
    isBackingUp,
    isRestoring,
    handleBackup,
    handleRestore,
    openRestorePicker: () => restoreInputRef.current?.click(),
  };
};

export default useImageBackup;
