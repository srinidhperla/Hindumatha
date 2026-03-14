import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  renameCategory,
  deleteCategory,
} from "../../features/products/productSlice";
import { LoadingState } from "../components/ui/AdminUi";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  getErrorMessage,
  normalizeCategoryValue,
} from "./adminShared";
import {
  createDefaultProductForm,
  normalizeFlavorOptions,
  normalizeFlavorWeightAvailability,
  normalizeWeightOptions,
} from "../../utils/productOptions";
import ProductFormModal from "../components/modals/ProductFormModal";
import AdminProductsToolbar from "../components/products/AdminProductsToolbar";
import AdminProductsGrid from "../components/products/AdminProductsGrid";

const AdminProductsPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(createDefaultProductForm());
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customFlavor, setCustomFlavor] = useState("");
  const [customWeightLabel, setCustomWeightLabel] = useState("");
  const [customWeightMultiplier, setCustomWeightMultiplier] = useState("1");
  const [imageItems, setImageItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_PRODUCT_CATEGORIES,
          ...products.map((product) => product.category).filter(Boolean),
        ]),
      ),
    [products],
  );

  const availableFlavors = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) =>
            normalizeFlavorOptions(product).map((option) => option.name),
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategory],
  );

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(createDefaultProductForm());
    setUseCustomCategory(false);
    setCustomCategory("");
    setCustomFlavor("");
    setCustomWeightLabel("");
    setCustomWeightMultiplier("1");
    setImageItems([]);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryChange = (event) => {
    if (event.target.value === "__new__") {
      setUseCustomCategory(true);
      setFormData((currentFormData) => ({
        ...currentFormData,
        category: "",
      }));
      return;
    }

    setUseCustomCategory(false);
    setCustomCategory("");
    setFormData((currentFormData) => ({
      ...currentFormData,
      category: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    setImageItems((currentItems) => [
      ...currentItems,
      ...selectedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}-${Math.round(Math.random() * 1e6)}`,
        file,
        existingPath: null,
        preview: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = "";
  };

  const moveImageItem = (index, direction) => {
    setImageItems((currentItems) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= currentItems.length) {
        return currentItems;
      }

      const nextItems = [...currentItems];
      const [movedItem] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, movedItem);
      return nextItems;
    });
  };

  const removeImageItem = (itemId) => {
    setImageItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const addFlavorOption = (flavorName) => {
    const normalizedFlavor = flavorName.trim();

    if (!normalizedFlavor) {
      return;
    }

    setFormData((currentFormData) => {
      if (
        currentFormData.flavorOptions.some(
          (option) =>
            option.name.toLowerCase() === normalizedFlavor.toLowerCase(),
        )
      ) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        flavorOptions: [
          ...currentFormData.flavorOptions,
          { name: normalizedFlavor, isAvailable: true },
        ],
      };
    });
  };

  const handleAddFlavor = () => {
    addFlavorOption(customFlavor);
    setCustomFlavor("");
  };

  const handleRemoveFlavor = (name) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      flavorOptions: currentFormData.flavorOptions.filter(
        (option) => option.name !== name,
      ),
    }));
  };

  const handleWeightFieldChange = (index, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      weightOptions: currentFormData.weightOptions.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              [field]: field === "multiplier" ? Number(value) || 1 : value,
            }
          : option,
      ),
    }));
  };

  const handleAddWeight = () => {
    const normalizedLabel = customWeightLabel.trim();
    const normalizedMultiplier = Number(customWeightMultiplier);

    if (!normalizedLabel) {
      return;
    }

    setFormData((currentFormData) => {
      if (
        currentFormData.weightOptions.some(
          (option) =>
            option.label.toLowerCase() === normalizedLabel.toLowerCase(),
        )
      ) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        weightOptions: [
          ...currentFormData.weightOptions,
          {
            label: normalizedLabel,
            multiplier: normalizedMultiplier > 0 ? normalizedMultiplier : 1,
            isAvailable: true,
          },
        ],
      };
    });

    setCustomWeightLabel("");
    setCustomWeightMultiplier("1");
  };

  const handleRemoveWeight = (label) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      weightOptions: currentFormData.weightOptions.filter(
        (option) => option.label !== label,
      ),
    }));
  };

  const handleFlavorWeightAvailabilityChange = (nextMatrix) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      flavorWeightAvailability: nextMatrix || {},
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const finalCategory = normalizeCategoryValue(
      useCustomCategory ? customCategory : formData.category,
    );

    if (!finalCategory) {
      onToast("Please select or enter a category.", "error");
      return;
    }

    if (!editingProduct && !imageItems.length) {
      onToast("Please upload at least one product image.", "error");
      return;
    }

    if (!formData.weightOptions.length) {
      onToast("Add at least one weight option.", "error");
      return;
    }

    try {
      const productData = new FormData();
      productData.append("name", formData.name.trim());
      productData.append("description", formData.description.trim());
      productData.append("price", Number(formData.price));
      productData.append("category", finalCategory);
      productData.append("isEgg", formData.isEgg);
      productData.append("isEggless", formData.isEggless);
      productData.append(
        "flavorOptions",
        JSON.stringify(formData.flavorOptions),
      );
      productData.append(
        "weightOptions",
        JSON.stringify(formData.weightOptions),
      );
      productData.append(
        "flavorWeightAvailability",
        JSON.stringify(formData.flavorWeightAvailability || {}),
      );

      const existingImages = imageItems
        .filter((item) => item.existingPath)
        .map((item) => item.existingPath);
      const newImageItems = imageItems.filter((item) => item.file);
      const imageOrder = imageItems.map((item) =>
        item.existingPath
          ? { type: "existing", value: item.existingPath }
          : { type: "new", value: item.id },
      );

      productData.append("existingImages", JSON.stringify(existingImages));
      productData.append("imageOrder", JSON.stringify(imageOrder));

      newImageItems.forEach((item) => {
        productData.append("images", item.file);
        productData.append("newImageIds", item.id);
      });

      if (!newImageItems.length && !existingImages.length) {
        onToast("Please upload at least one product image.", "error");
        return;
      }

      if (editingProduct) {
        await dispatch(
          updateProduct({ id: editingProduct._id, productData }),
        ).unwrap();
        onToast("Product updated successfully.");
      } else {
        await dispatch(createProduct(productData)).unwrap();
        onToast("Product created successfully.");
      }

      resetForm();
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to save product."), "error");
    }
  };

  const handleEdit = (product) => {
    const categoryExists = availableCategories.includes(product.category);
    const rawFlavorWeightAvailability =
      product.flavorWeightAvailability instanceof Map
        ? Object.fromEntries(product.flavorWeightAvailability.entries())
        : product.flavorWeightAvailability || {};

    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      images:
        product.images?.length > 0
          ? product.images
          : [product.image].filter(Boolean),
      flavorOptions: normalizeFlavorOptions(product),
      weightOptions: normalizeWeightOptions(product),
      flavorWeightAvailability: {
        ...normalizeFlavorWeightAvailability(product),
        ...rawFlavorWeightAvailability,
      },
      isEgg: product.isEgg !== false,
      isEggless: product.isEggless === true,
    });
    setUseCustomCategory(!categoryExists);
    setCustomCategory(categoryExists ? "" : product.category);
    setCustomFlavor("");
    setCustomWeightLabel("");
    setCustomWeightMultiplier("1");
    setImageItems(
      (product.images?.length > 0
        ? product.images
        : [product.image].filter(Boolean)
      ).map((imagePath, index) => ({
        id: `existing-${product._id}-${index}`,
        file: null,
        existingPath: imagePath,
        preview: imagePath,
      })),
    );
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await dispatch(deleteProduct(productId)).unwrap();
      onToast("Product deleted successfully.");
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to delete product."), "error");
    }
  };

  const handleRenameCategory = async (oldName, newName) => {
    try {
      await dispatch(renameCategory({ oldName, newName })).unwrap();
      onToast(`Category renamed to "${newName}".`);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to rename category."), "error");
    }
  };

  const handleDeleteCategory = async (name) => {
    if (
      !window.confirm(
        `Delete category "${name}"? Products will be moved to "cakes".`,
      )
    )
      return;
    try {
      await dispatch(deleteCategory(name)).unwrap();
      onToast(`Category "${name}" deleted.`);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to delete category."), "error");
    }
  };

  if (loading && !products.length) {
    return <LoadingState />;
  }

  return (
    <div>
      <AdminProductsToolbar
        availableCategories={availableCategories}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
        onSelectCategory={setSelectedCategory}
        onSearch={setSearchTerm}
        onAddProduct={() => {
          resetForm();
          setIsModalOpen(true);
        }}
      />

      <AdminProductsGrid
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          formData={formData}
          useCustomCategory={useCustomCategory}
          customCategory={customCategory}
          customFlavor={customFlavor}
          customWeightLabel={customWeightLabel}
          customWeightMultiplier={customWeightMultiplier}
          imageItems={imageItems}
          availableCategories={availableCategories}
          availableFlavors={availableFlavors}
          onClose={resetForm}
          onChange={handleChange}
          onCategoryChange={handleCategoryChange}
          onCustomCategoryChange={setCustomCategory}
          onCustomFlavorChange={setCustomFlavor}
          onAddFlavor={handleAddFlavor}
          onRemoveFlavor={handleRemoveFlavor}
          onAddFlavorOption={addFlavorOption}
          onCustomWeightLabelChange={setCustomWeightLabel}
          onCustomWeightMultiplierChange={setCustomWeightMultiplier}
          onAddWeight={handleAddWeight}
          onRemoveWeight={handleRemoveWeight}
          onWeightFieldChange={handleWeightFieldChange}
          onFlavorWeightAvailabilityChange={
            handleFlavorWeightAvailabilityChange
          }
          onImageChange={handleImageChange}
          onMoveImage={moveImageItem}
          onRemoveImage={removeImageItem}
          onSubmit={handleSubmit}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
