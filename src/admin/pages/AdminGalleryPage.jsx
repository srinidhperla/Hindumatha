import React, { useMemo } from "react";
import AdminGalleryCard from "@/admin/components/gallery/AdminGalleryCard";
import AdminGalleryToolbar from "@/admin/components/gallery/AdminGalleryToolbar";
import AdminGalleryFormModal from "@/admin/components/modals/AdminGalleryFormModal";
import {
  EmptyState,
  LoadingState,
  MetricCard,
} from "@/admin/components/ui/AdminUi";
import { SurfaceCard } from "@/shared/ui/Primitives";
import useAdminGalleryEditor from "@/admin/hooks/useAdminGalleryEditor";
import { attachGalleryItemCodes } from "@/utils/galleryItems";

const AdminGalleryPage = ({ onToast, syncVersion = 0 }) => {
  const {
    editorMode,
    filteredItems,
    formData,
    galleryCategories,
    galleryFieldConfig,
    galleryItems,
    categoryDrafts,
    deleteCategory,
    handleCategoryDraftChange,
    handleDeleteItem,
    handleFieldChange,
    handleCategoriesChange,
    handleImageChange,
    handleOptionPriceChange,
    handleCombinationEnabledChange,
    handleCombinationPriceChange,
    handleSectionPriceSourceChange,
    handleSectionPricingModeChange,
    handleSubmit,
    handleWeightRangeChange,
    imageFile,
    imagePreview,
    isModalOpen,
    loading,
    openCreateModal,
    openEditModal,
    closeModal,
    renameCategory,
    saving,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    optionCatalogs,
    toggleSectionOption,
    toggleAllSectionOptions,
    addSectionOption,
    renameSectionOption,
    deleteSectionOption,
    addCustomSection,
    renameFieldSection,
    deleteFieldSection,
    totalLikes,
    editingItem,
  } = useAdminGalleryEditor({ onToast, syncVersion });

  const codedFilteredItems = useMemo(() => {
    const codedGalleryItems = attachGalleryItemCodes(galleryItems);
    const visibleIds = new Set(filteredItems.map((item) => item._id));
    return codedGalleryItems.filter((item) => visibleIds.has(item._id));
  }, [filteredItems, galleryItems]);

  if (loading && !galleryItems.length) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Gallery Images"
          value={galleryItems.length}
          subtitle="All admin-managed showcase images"
          highlight
        />
        <MetricCard
          title="Categories"
          value={galleryCategories.length}
          subtitle="Used across the gallery collection"
        />
        <MetricCard
          title="Total Likes"
          value={totalLikes}
          subtitle="Imported from the live gallery data"
        />
      </div>

      <AdminGalleryToolbar
        galleryCategories={galleryCategories}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
        onSelectCategory={setSelectedCategory}
        onSearch={setSearchTerm}
        onAddImage={() => openCreateModal("general")}
        onConfigurePrice={() => openCreateModal("pricing")}
      />

      {!filteredItems.length ? (
        <SurfaceCard className="p-6">
          <EmptyState message="No gallery items match your current search." />
        </SurfaceCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {codedFilteredItems.map((item) => (
            <AdminGalleryCard
              key={item._id}
              item={item}
              galleryFieldConfig={galleryFieldConfig}
              onEdit={() => openEditModal(item, "general")}
              onDelete={() => handleDeleteItem(item._id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <AdminGalleryFormModal
          editingItem={editingItem}
          formData={formData}
          galleryCategories={galleryCategories}
          optionCatalogs={optionCatalogs}
          imagePreview={imagePreview}
          imageFileName={imageFile?.name || ""}
          isSubmitting={saving}
          mode={editorMode}
          categoryDrafts={categoryDrafts}
          onClose={closeModal}
          onCategoryDraftChange={handleCategoryDraftChange}
          onDeleteCategory={deleteCategory}
          onCategoriesChange={handleCategoriesChange}
          onOptionPriceChange={handleOptionPriceChange}
          onCombinationEnabledChange={handleCombinationEnabledChange}
          onCombinationPriceChange={handleCombinationPriceChange}
          onRenameCategory={renameCategory}
          onSectionPriceSourceChange={handleSectionPriceSourceChange}
          onSectionPricingModeChange={handleSectionPricingModeChange}
          onSubmit={handleSubmit}
          onFieldChange={handleFieldChange}
          onWeightRangeChange={handleWeightRangeChange}
          onToggleOption={toggleSectionOption}
          onToggleAllSectionOptions={toggleAllSectionOptions}
          onAddOption={addSectionOption}
          onRenameOption={renameSectionOption}
          onDeleteOption={deleteSectionOption}
          onAddCustomSection={addCustomSection}
          onRenameFieldSection={renameFieldSection}
          onDeleteFieldSection={deleteFieldSection}
          onImageChange={handleImageChange}
        />
      )}
    </div>
  );
};

export default AdminGalleryPage;
