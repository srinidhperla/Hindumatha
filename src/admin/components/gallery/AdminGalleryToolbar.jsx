import React from "react";
import { ActionButton } from "@/shared/ui/Primitives";
import WorkspaceToolbar from "@/shared/workspace/Toolbar";
import ImageBackupButtons from "@/admin/components/common/ImageBackupButtons";
import { formatGalleryCategoryLabel } from "@/utils/galleryItems";

const AdminGalleryToolbar = ({
  galleryCategories,
  selectedCategory,
  searchTerm,
  onSelectCategory,
  onSearch,
  onAddImage,
  onConfigurePrice,
  imageBackup,
}) => (
  <WorkspaceToolbar
    search={{
      value: searchTerm,
      onChange: onSearch,
      placeholder: "Search gallery",
    }}
    chips={{
      value: selectedCategory,
      onChange: onSelectCategory,
      options: [
        { value: "all", label: "All" },
        ...galleryCategories.map((category) => ({
          value: category,
          label: formatGalleryCategoryLabel(category),
        })),
      ],
    }}
    actions={
      <>
        {imageBackup ? (
          <ImageBackupButtons
            restoreInputRef={imageBackup.restoreInputRef}
            isBackingUp={imageBackup.isBackingUp}
            isRestoring={imageBackup.isRestoring}
            onBackup={imageBackup.handleBackup}
            onRestore={imageBackup.handleRestore}
            openRestorePicker={imageBackup.openRestorePicker}
          />
        ) : null}
        <ActionButton onClick={onConfigurePrice} variant="secondary">
          Set Price & Configure
        </ActionButton>
        <ActionButton onClick={onAddImage}>Add Image</ActionButton>
      </>
    }
  />
);

export default AdminGalleryToolbar;
