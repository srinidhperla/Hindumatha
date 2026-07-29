import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
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
  <SurfaceCard className="p-4 sm:p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => onSelectCategory("all")}
          variant={selectedCategory === "all" ? "primary" : "soft"}
          className="rounded-full px-4 py-2 text-xs sm:text-sm"
        >
          All
        </ActionButton>
        {galleryCategories.map((category) => (
          <ActionButton
            key={category}
            onClick={() => onSelectCategory(category)}
            variant={selectedCategory === category ? "primary" : "soft"}
            className="rounded-full px-4 py-2 text-xs sm:text-sm"
          >
            {formatGalleryCategoryLabel(category)}
          </ActionButton>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search gallery"
          className="rounded-xl border border-gold-200/70 bg-white/80 px-3 py-2 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
        />
        <ActionButton
          onClick={onAddImage}
          variant="secondary"
          className="text-xs sm:text-sm"
        >
          Add Image
        </ActionButton>
        <ActionButton onClick={onConfigurePrice} className="text-xs sm:text-sm">
          Set Price & Configure
        </ActionButton>
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
      </div>
    </div>
  </SurfaceCard>
);

export default AdminGalleryToolbar;
