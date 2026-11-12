import React from "react";
import { Link } from "react-router-dom";
import { ActionButton } from "@/shared/ui/Primitives";
import WorkspaceToolbar from "@/shared/workspace/Toolbar";
import ImageBackupButtons from "@/admin/components/common/ImageBackupButtons";
import { formatCategoryLabel } from "@/utils/productOptions";

const AdminProductsToolbar = ({
  availableCategories,
  selectedCategory,
  searchTerm,
  onSelectCategory,
  onSearch,
  onAddProduct,
  onAddAddon,
  imageBackup,
}) => (
  <WorkspaceToolbar
    className="mb-4"
    search={{
      value: searchTerm,
      onChange: onSearch,
      placeholder: "Search products",
    }}
    chips={{
      value: selectedCategory,
      onChange: onSelectCategory,
      options: [
        { value: "all", label: "All" },
        ...availableCategories.map((category) => ({
          value: category,
          label: formatCategoryLabel(category),
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
        <Link to="/admin/inventory">
          <ActionButton variant="secondary">Inventory</ActionButton>
        </Link>
        <ActionButton onClick={onAddAddon} variant="secondary">
          Add Addon
        </ActionButton>
        <ActionButton onClick={onAddProduct}>Add Product</ActionButton>
      </>
    }
  />
);

export default AdminProductsToolbar;
