import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  renameCategory,
  deleteCategory,
} from "@/features/products/productSlice";
import { LoadingState } from "@/admin/components/ui/AdminUi";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  getErrorMessage,
  normalizeCategoryValue,
} from "./adminShared";
import {
  createDefaultProductForm,
  getDefaultOptionsForPortionType,
  normalizeFlavorOptions,
  normalizeFlavorWeightAvailability,
  normalizePortionType,
  normalizeWeightOptions,
} from "@/utils/productOptions";
import ProductFormModal from "../components/modals/ProductFormModal";
import AddOnFormModal from "../components/modals/AddOnFormModal";
import AdminProductsToolbar from "../components/products/AdminProductsToolbar";
import AdminProductsGrid from "../components/products/AdminProductsGrid";

const AdminProductsPage = ({ onToast, syncVersion = 0 }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(createDefaultProductForm());
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customFlavor, setCustomFlavor] = useState("");
  const [customWeightLabel, setCustomWeightLabel] = useState("");
  const [imageItems, setImageItems] = useState([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isSubmittingAddOn, setIsSubmittingAddOn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    description: "",
    price: "",
    imageFile: null,
    imagePreview: "",
  });

  useEffect(() => {
    dispatch(fetchProducts({ force: true }));
  }, [dispatch]);

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_PRODUCT_CATEGORIES,
          ...products.map((product) => product.category).filter(Boolean),
        ]),
      ),
    [products, syncVersion],
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

  const getVariantAxes = (data) => {
    const validLabels = new Set();
    (data?.weightOptions || [])
      .map((option) => option.label)
      .filter(Boolean)
      .forEach((label) => {
        validLabels.add(String(label));
        validLabels.add(String(label).toLowerCase());
      });
    const flavorNames =
      Array.isArray(data?.flavorOptions) && data.flavorOptions.length > 0
        ? data.flavorOptions.map((option) => option.name).filter(Boolean)
        : ["Cake"];
    const eggTypes = [
      data?.isEgg ? "egg" : null,
      data?.isEggless ? "eggless" : null,
    ].filter(Boolean);

    const validTypedKeys = new Set();
    eggTypes.forEach((eggType) => {
      flavorNames.forEach((flavorName) => {
        const typedKey = `${eggType}::${flavorName}`;
        validTypedKeys.add(typedKey);
        validTypedKeys.add(typedKey.toLowerCase());
      });
    });

    return { validLabels, validTypedKeys };
  };

  const getMinimumVariantPrice = (
    variantPrices,
    flavorWeightAvailability = {},
    axes = {},
  ) => {
    if (!variantPrices || typeof variantPrices !== "object") {
      return null;
    }

    const getRowEntries = (source) => {
      if (source instanceof Map) {
        return Array.from(source.entries());
      }
      return Object.entries(source || {});
    };

    const findRowByTypedKey = (source, typedKey) => {
      if (!source || typeof source !== "object") return null;
      const direct =
        source?.[typedKey] ||
        source?.get?.(typedKey) ||
        source?.[String(typedKey).toLowerCase()] ||
        source?.get?.(String(typedKey).toLowerCase());
      if (direct && typeof direct === "object") {
        return direct;
      }

      const typedKeyLower = String(typedKey).toLowerCase();
      const entries =
        source instanceof Map
          ? Array.from(source.entries())
          : Object.entries(source || {});
      const matched = entries.find(
        ([key]) => String(key).toLowerCase() === typedKeyLower,
      );
      return matched && typeof matched[1] === "object" ? matched[1] : null;
    };

    const readRowValue = (row, unitLabel) => {
      if (!row || typeof row !== "object") return undefined;

      const label = String(unitLabel || "").trim();
      if (label in row) return row[label];

      const lower = label.toLowerCase();
      if (lower in row) return row[lower];

      const entries = Object.entries(row || {});
      const matched = entries.find(
        ([key]) =>
          String(key || "")
            .trim()
            .toLowerCase() === lower,
      );
      return matched ? matched[1] : undefined;
    };

    const getCellEnabled = (typedKey, unitLabel) => {
      const row = findRowByTypedKey(flavorWeightAvailability, typedKey);

      if (!row || typeof row !== "object") {
        return true;
      }

      const value = readRowValue(row, unitLabel);

      return value !== false && value !== null;
    };

    let minimum = null;
    getRowEntries(variantPrices).forEach(([typedKey, row]) => {
      if (
        axes?.validTypedKeys instanceof Set &&
        axes.validTypedKeys.size > 0 &&
        !axes.validTypedKeys.has(typedKey) &&
        !axes.validTypedKeys.has(String(typedKey).toLowerCase())
      ) {
        return;
      }

      if (!row || typeof row !== "object") return;
      Object.entries(row).forEach(([unitLabel, raw]) => {
        const normalizedLabel = String(unitLabel || "").trim();
        if (
          axes?.validLabels instanceof Set &&
          axes.validLabels.size > 0 &&
          !axes.validLabels.has(normalizedLabel) &&
          !axes.validLabels.has(normalizedLabel.toLowerCase())
        ) {
          return;
        }
        if (!getCellEnabled(typedKey, unitLabel)) return;
        const numeric = Number(raw);
        if (!Number.isFinite(numeric) || numeric <= 0) return;
        minimum = minimum === null ? numeric : Math.min(minimum, numeric);
      });
    });

    return minimum;
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setIsSubmittingProduct(false);
    setFormData(createDefaultProductForm());
    setUseCustomCategory(false);
    setCustomCategory("");
    setCustomFlavor("");
    setCustomWeightLabel("");
    setImageItems([]);
  };

  const resetAddOnForm = () => {
    setIsSubmittingAddOn(false);
    setAddOnForm({
      name: "",
      description: "",
      price: "",
      imageFile: null,
      imagePreview: "",
    });
    setIsAddOnModalOpen(false);
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
            multiplier: 1,
            isAvailable: true,
          },
        ],
      };
    });

    setCustomWeightLabel("");
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
    setFormData((currentFormData) => {
      const resolvedMatrix = nextMatrix || {};

      return {
        ...currentFormData,
        flavorWeightAvailability: resolvedMatrix,
      };
    });
  };

  const handlePortionTypeChange = (nextType) => {
    const normalizedType = normalizePortionType(nextType);
    setFormData((currentFormData) => ({
      ...currentFormData,
      portionType: normalizedType,
      weightOptions: getDefaultOptionsForPortionType(normalizedType),
      flavorWeightAvailability: {},
      variantPrices: {},
    }));
  };

  const handleVariantPricesChange = (nextVariantPrices) => {
    setFormData((currentFormData) => {
      const axes = getVariantAxes(currentFormData);
      const minimumPrice = getMinimumVariantPrice(
        nextVariantPrices,
        currentFormData.flavorWeightAvailability,
        axes,
      );
      return {
        ...currentFormData,
        variantPrices: nextVariantPrices || {},
        price: minimumPrice !== null ? minimumPrice : 0,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSubmittingProduct) {
      return;
    }

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
      setIsSubmittingProduct(true);

      const productData = new FormData();
      const finalBasePrice = Number(formData.price);
      productData.append("name", formData.name.trim());
      productData.append("description", formData.description.trim());
      productData.append(
        "price",
        Number.isFinite(finalBasePrice) && finalBasePrice >= 0
          ? finalBasePrice
          : 0,
      );
      productData.append("category", finalCategory);
      productData.append("isEgg", formData.isEgg);
      productData.append("isEggless", formData.isEggless);
      productData.append("isAddon", formData.isAddon === true);
      productData.append(
        "portionType",
        normalizePortionType(formData.portionType),
      );
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
      productData.append(
        "variantPrices",
        JSON.stringify(formData.variantPrices || {}),
      );
      productData.append("addOns", JSON.stringify(formData.addOns || []));

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
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleEdit = (product) => {
    const categoryExists = availableCategories.includes(product.category);
    const rawFlavorWeightAvailability =
      product.flavorWeightAvailability instanceof Map
        ? Object.fromEntries(product.flavorWeightAvailability.entries())
        : product.flavorWeightAvailability || {};
    const flavorOptions = normalizeFlavorOptions(product);
    const weightOptions = normalizeWeightOptions(product);
    const variantPrices =
      product.variantPrices instanceof Map
        ? Object.fromEntries(product.variantPrices.entries())
        : product.variantPrices || {};
    const flavorWeightAvailability = {
      ...normalizeFlavorWeightAvailability(product),
      ...rawFlavorWeightAvailability,
    };
    const isEgg = product.isEgg !== false;
    const isEggless = product.isEggless === true;
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: Number(product.price) || 0,
      portionType: normalizePortionType(product.portionType),
      category: product.category,
      image: product.image,
      images:
        product.images?.length > 0
          ? product.images
          : [product.image].filter(Boolean),
      flavorOptions,
      weightOptions,
      flavorWeightAvailability,
      variantPrices,
      isEgg,
      isEggless,
      isAddon: product.isAddon === true,
      addOns: Array.isArray(product.addOns) ? product.addOns : [],
    });
    setUseCustomCategory(!categoryExists);
    setCustomCategory(categoryExists ? "" : product.category);
    setCustomFlavor("");
    setCustomWeightLabel("");
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

  const handleAddOnInputChange = (event) => {
    const { name, value } = event.target;
    setAddOnForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddOnImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAddOnForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : "",
    }));
  };

  const handleAddOnSubmit = async (event) => {
    event.preventDefault();

    if (isSubmittingAddOn) {
      return;
    }

    const name = addOnForm.name.trim();
    const description = addOnForm.description.trim();
    const price = Number(addOnForm.price);

    if (!name || !description || !Number.isFinite(price) || price < 0) {
      onToast("Please fill addon name, price and description.", "error");
      return;
    }

    if (!addOnForm.imageFile) {
      onToast("Please upload addon image.", "error");
      return;
    }

    try {
      setIsSubmittingAddOn(true);
      const productData = new FormData();
      const imageToken = `new-addon-${Date.now()}`;
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("category", "addons");
      productData.append("portionType", "pieces");
      productData.append("isAddon", true);
      productData.append("isAvailable", true);
      productData.append("isEgg", true);
      productData.append("isEggless", false);
      productData.append("flavorOptions", JSON.stringify([]));
      productData.append(
        "weightOptions",
        JSON.stringify([{ label: "1 pc", multiplier: 1, isAvailable: true }]),
      );
      productData.append("flavorWeightAvailability", JSON.stringify({}));
      productData.append("variantPrices", JSON.stringify({}));
      productData.append("existingImages", JSON.stringify([]));
      productData.append(
        "imageOrder",
        JSON.stringify([{ type: "new", value: imageToken }]),
      );
      productData.append("newImageIds", imageToken);
      productData.append("images", addOnForm.imageFile);

      await dispatch(createProduct(productData)).unwrap();
      onToast("Addon created successfully.");
      resetAddOnForm();
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to create addon."), "error");
    } finally {
      setIsSubmittingAddOn(false);
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
        onAddAddon={() => {
          resetAddOnForm();
          setIsAddOnModalOpen(true);
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
          imageItems={imageItems}
          isSubmitting={isSubmittingProduct}
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
          onPortionTypeChange={handlePortionTypeChange}
          onAddWeight={handleAddWeight}
          onRemoveWeight={handleRemoveWeight}
          onWeightFieldChange={handleWeightFieldChange}
          onFlavorWeightAvailabilityChange={
            handleFlavorWeightAvailabilityChange
          }
          onVariantPricesChange={handleVariantPricesChange}
          onImageChange={handleImageChange}
          onMoveImage={moveImageItem}
          onRemoveImage={removeImageItem}
          onSubmit={handleSubmit}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {isAddOnModalOpen && (
        <AddOnFormModal
          formData={addOnForm}
          onChange={handleAddOnInputChange}
          onImageChange={handleAddOnImageChange}
          onSubmit={handleAddOnSubmit}
          onClose={resetAddOnForm}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
