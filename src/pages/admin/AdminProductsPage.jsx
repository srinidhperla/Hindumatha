import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../features/productSlice";
import { LoadingState, EmptyState } from "../../components/admin/AdminUi";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  getErrorMessage,
  normalizeCategoryValue,
} from "./adminShared";
import {
  createDefaultProductForm,
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  normalizeFlavorOptions,
  normalizeWeightOptions,
} from "../../utils/productOptions";

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

    if (!formData.flavorOptions.length) {
      onToast("Add at least one flavor option.", "error");
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
      productData.append(
        "flavorOptions",
        JSON.stringify(formData.flavorOptions),
      );
      productData.append(
        "weightOptions",
        JSON.stringify(formData.weightOptions),
      );
      productData.append("isFeatured", formData.isFeatured);

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
      isFeatured: product.isFeatured || false,
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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === "all"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-pink-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formatCategoryLabel(category)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Link
              to="/admin/inventory"
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-center font-semibold text-gray-700 hover:bg-gray-50"
            >
              Manage Inventory
            </Link>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="rounded-xl bg-pink-600 px-5 py-2.5 font-semibold text-white hover:bg-pink-700"
            >
              Add New Product
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const availableFlavorCount =
              getAvailableFlavorOptions(product).length;
            const availableWeightCount =
              getAvailableWeightOptions(product).length;

            return (
              <div
                key={product._id}
                className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <img
                  src={product.images?.[0] || product.image}
                  alt={product.name}
                  className="h-56 w-full object-cover"
                />
                {product.isFeatured && (
                  <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    ★ Featured
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
                        {formatCategoryLabel(product.category)}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      Starts at ₹{product.price}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">{product.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      {availableFlavorCount} flavors live
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      {availableWeightCount} weights live
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      {product.images?.length || 1} images
                    </span>
                  </div>

                  {!!product.flavorOptions?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.flavorOptions.map((option) => (
                        <span
                          key={`${product._id}-${option.name}`}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {option.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {!!product.weightOptions?.length && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {product.weightOptions.map((option) => (
                        <div
                          key={`${product._id}-${option.label}`}
                          className="rounded-2xl bg-gray-50 px-3 py-2"
                        >
                          <p className="font-semibold text-gray-900">
                            {option.label}
                          </p>
                          <p className="text-gray-500">x{option.multiplier}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-800 hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <EmptyState message="No products match the current filters." />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Base Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-pink-200 bg-pink-50 p-4">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="isFeatured" className="cursor-pointer">
                  <span className="block text-sm font-semibold text-pink-800">
                    Featured Product
                  </span>
                  <span className="text-xs text-pink-600">
                    This product will appear in the Featured section and Gallery
                  </span>
                </label>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={useCustomCategory ? "__new__" : formData.category}
                    onChange={handleCategoryChange}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  >
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {formatCategoryLabel(category)}
                      </option>
                    ))}
                    <option value="__new__">Add New Category</option>
                  </select>
                </div>
              </div>

              {useCustomCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    required
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                    placeholder="For example: photo-cakes"
                  />
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Flavors
                      </h3>
                      <p className="text-sm text-gray-500">
                        Add the flavor list here. Availability is managed from
                        the Inventory page.
                      </p>
                    </div>
                  </div>

                  {availableFlavors.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {availableFlavors
                        .filter(
                          (flavor) =>
                            !formData.flavorOptions.some(
                              (option) =>
                                option.name.toLowerCase() ===
                                flavor.toLowerCase(),
                            ),
                        )
                        .map((flavor) => (
                          <button
                            key={flavor}
                            type="button"
                            onClick={() => addFlavorOption(flavor)}
                            className="rounded-full border border-pink-200 px-3 py-1 text-sm text-pink-700 hover:bg-pink-50"
                          >
                            + {flavor}
                          </button>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customFlavor}
                      onChange={(event) => setCustomFlavor(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddFlavor();
                        }
                      }}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                      placeholder="Add new flavor"
                    />
                    <button
                      type="button"
                      onClick={handleAddFlavor}
                      className="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {formData.flavorOptions.map((option) => (
                      <div
                        key={option.name}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
                      >
                        <span className="font-medium text-gray-900">
                          {option.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFlavor(option.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Weights
                    </h3>
                    <p className="text-sm text-gray-500">
                      Set price multipliers here. Availability is managed from
                      the Inventory page.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customWeightLabel}
                      onChange={(event) =>
                        setCustomWeightLabel(event.target.value)
                      }
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                      placeholder="Example: 4kg"
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={customWeightMultiplier}
                      onChange={(event) =>
                        setCustomWeightMultiplier(event.target.value)
                      }
                      className="w-28 rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddWeight}
                      className="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {formData.weightOptions.map((option, index) => (
                      <div
                        key={option.label}
                        className="rounded-2xl bg-gray-50 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto] md:items-center">
                          <input
                            type="text"
                            value={option.label}
                            onChange={(event) =>
                              handleWeightFieldChange(
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                            className="rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                          />
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={option.multiplier}
                            onChange={(event) =>
                              handleWeightFieldChange(
                                index,
                                "multiplier",
                                event.target.value,
                              )
                            }
                            className="rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWeight(option.label)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Upload one or more images. They will be stored inside the
                  selected category folder, and the first image becomes the
                  product cover.
                </p>
                {imageItems.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {imageItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-gray-200"
                      >
                        <img
                          src={item.preview}
                          alt={`${formData.name || "Product preview"} ${index + 1}`}
                          className="h-40 w-full object-cover"
                        />
                        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 p-3">
                          <button
                            type="button"
                            onClick={() => moveImageItem(index, -1)}
                            disabled={index === 0}
                            className="rounded-lg bg-gray-100 px-2 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImageItem(index, 1)}
                            disabled={index === imageItems.length - 1}
                            className="rounded-lg bg-gray-100 px-2 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"
                          >
                            Right
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImageItem(item.id)}
                            className="rounded-lg bg-red-50 px-2 py-2 text-xs font-semibold text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
                >
                  {editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
