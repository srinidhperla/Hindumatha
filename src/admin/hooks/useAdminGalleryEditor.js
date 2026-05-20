import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addGalleryItem,
  deleteGalleryItem,
  fetchSiteContent,
  updateSiteSettings,
  updateGalleryItem,
} from "@/features/site/siteSlice";
import {
  buildOptionCatalogMap,
  createDefaultGalleryFieldConfig,
  createEmptyGalleryForm,
  createGalleryFieldConfigFromForm,
  getBuiltInGallerySectionKeys,
  normalizeGalleryFieldConfig,
  normalizeGalleryFormFromItem,
} from "@/admin/pages/adminGalleryConfig";
import {
  buildGalleryCombinationKey,
  buildGalleryCombinationLabel,
  normalizeCombinationPricePayload,
} from "@/admin/pages/adminGalleryPricingUtils";
import { getErrorMessage } from "@/admin/pages/adminShared";

const DEFAULT_DELETED_CATEGORY = "uncategorized";

const createCustomSectionKey = () => `custom${Date.now()}`;

const toUniqueOptions = (items = []) =>
  Array.from(
    new Set(items.map((item) => String(item || "").trim()).filter(Boolean)),
  );

const buildOptionPriceEntry = (sectionKey, sectionTitle, option, price) => ({
  sectionKey: String(sectionKey || "").trim(),
  sectionTitle: String(sectionTitle || "").trim(),
  option: String(option || "").trim(),
  price: Number(price) || 0,
});

const isDirectToggleSection = (section = {}, options = []) =>
  section?.area === "extras" &&
  Boolean(section?.isCustom) &&
  toUniqueOptions(options).length === 0;
const COMBINATION_SECTION_KEYS = ["cakeTypes", "eggOptions", "flavors"];

const buildSectionOptions = (formData = {}) =>
  (formData.fieldSections || []).map((section) => ({
    sectionKey: String(section.key || "").trim(),
    options: toUniqueOptions(formData[section.key] || []),
  }));

const buildGalleryPayload = ({
  formData,
  optionCatalogs,
  imageFile = null,
  existingImageUrl = "",
  galleryFieldMutations = [],
}) => {
  const payload = new FormData();
  const galleryFieldConfig = createGalleryFieldConfigFromForm(
    formData,
    optionCatalogs,
  );
  const categories = Array.from(
    new Set(
      (Array.isArray(formData.categories) ? formData.categories : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    ),
  );
  const primaryCategory =
    categories[0] || String(formData.category || "").trim();

  payload.append("title", String(formData.title || "").trim());
  payload.append("category", primaryCategory);
  payload.append("categories", JSON.stringify(categories));
  payload.append("price", Number(formData.price) || 0);
  payload.append(
    "priceLabel",
    String(formData.priceLabel || "").trim() || "Starting at",
  );
  payload.append(
    "configurationNote",
    String(formData.configurationNote || "").trim(),
  );
  payload.append("likes", Number(formData.likes) || 0);
  payload.append(
    "weightRange",
    JSON.stringify({
      min: Number(formData.weightRange?.min) || 0,
      max: Number(formData.weightRange?.max) || 0,
      unit: String(formData.weightRange?.unit || "kg").trim() || "kg",
    }),
  );
  payload.append("sectionOptions", JSON.stringify(buildSectionOptions(formData)));
  payload.append("optionPrices", JSON.stringify(formData.optionPrices || []));
  payload.append("galleryFieldConfig", JSON.stringify(galleryFieldConfig));
  payload.append(
    "galleryFieldMutations",
    JSON.stringify(galleryFieldMutations || []),
  );

  getBuiltInGallerySectionKeys().forEach((sectionKey) => {
    payload.append(sectionKey, JSON.stringify(formData[sectionKey] || []));
  });

  if (imageFile) {
    payload.append("image", imageFile);
  } else if (existingImageUrl) {
    payload.append("imageUrl", existingImageUrl);
  }

  return payload;
};

const replaceMatchingMutation = (mutations, matcher, nextValue) => {
  let hasReplaced = false;
  const nextMutations = mutations.map((entry) => {
    if (matcher(entry)) {
      hasReplaced = true;
      return nextValue;
    }
    return entry;
  });

  return hasReplaced ? nextMutations : [...nextMutations, nextValue];
};

const dropMatchingMutations = (mutations, matcher) =>
  mutations.filter((entry) => !matcher(entry));

const useAdminGalleryEditor = ({ onToast, syncVersion = 0 }) => {
  const dispatch = useDispatch();
  const { galleryFieldConfig, galleryItems, loading, saving, loaded } =
    useSelector((state) => state.site);

  const sharedGalleryFieldConfig = useMemo(
    () =>
      normalizeGalleryFieldConfig(
        galleryFieldConfig || createDefaultGalleryFieldConfig(),
        galleryItems,
      ),
    [galleryFieldConfig, galleryItems],
  );

  const sharedOptionCatalogs = useMemo(
    () => buildOptionCatalogMap(sharedGalleryFieldConfig),
    [sharedGalleryFieldConfig],
  );

  const [formData, setFormData] = useState(() =>
    createEmptyGalleryForm(sharedGalleryFieldConfig),
  );
  const [optionCatalogs, setOptionCatalogs] = useState(() => sharedOptionCatalogs);
  const [fieldMutations, setFieldMutations] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("general");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryDrafts, setCategoryDrafts] = useState({});

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchSiteContent());
    }
  }, [dispatch, loaded, syncVersion]);

  useEffect(() => {
    if (!imageFile) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const galleryCategories = useMemo(
    () =>
      Array.from(
        new Set(
          galleryItems
            .flatMap((item) =>
              Array.isArray(item?.categories) && item.categories.length > 0
                ? item.categories
                : [item?.category],
            )
            .map((category) => String(category || "").trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [galleryItems],
  );

  useEffect(() => {
    setCategoryDrafts((current) =>
      Object.fromEntries(
        galleryCategories.map((category) => [
          category,
          current[category] || category,
        ]),
      ),
    );
  }, [galleryCategories]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return galleryItems.filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const categories = (
        Array.isArray(item?.categories) && item.categories.length > 0
          ? item.categories
          : [item?.category]
      )
        .map((category) => String(category || "").toLowerCase())
        .filter(Boolean);
      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        categories.some((category) => category.includes(normalizedSearch));
      const matchesCategory =
        selectedCategory === "all" ||
        categories.includes(String(selectedCategory || "").toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [galleryItems, searchTerm, selectedCategory]);

  const totalLikes = useMemo(
    () =>
      galleryItems.reduce((sum, item) => {
        const likes = Number(item?.likes);
        return sum + (Number.isFinite(likes) ? likes : 0);
      }, 0),
    [galleryItems],
  );

  const resetEditorState = () => {
    const nextForm = createEmptyGalleryForm(sharedGalleryFieldConfig);
    setFormData(nextForm);
    setOptionCatalogs(sharedOptionCatalogs);
    setFieldMutations([]);
    setEditingItem(null);
    setIsModalOpen(false);
    setEditorMode("general");
    setImageFile(null);
    setImagePreview("");
  };

  const closeModal = () => {
    resetEditorState();
  };

  const openCreateModal = (mode = "general") => {
    const nextForm = createEmptyGalleryForm(sharedGalleryFieldConfig);
    setFormData(nextForm);
    setOptionCatalogs(sharedOptionCatalogs);
    setFieldMutations([]);
    setEditingItem(null);
    setEditorMode(mode);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (item, mode = "general") => {
    const nextForm = normalizeGalleryFormFromItem(item, sharedGalleryFieldConfig);
    setFormData(nextForm);
    setOptionCatalogs(sharedOptionCatalogs);
    setFieldMutations([]);
    setEditingItem(item);
    setEditorMode(mode);
    setImageFile(null);
    setImagePreview(item?.imageUrl || "");
    setIsModalOpen(true);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCategoriesChange = (nextCategories = []) => {
    const normalizedCategories = toUniqueOptions(nextCategories);

    setFormData((current) => ({
      ...current,
      categories: normalizedCategories,
      category: normalizedCategories[0] || "",
    }));
  };

  const handleWeightRangeChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      weightRange: {
        ...current.weightRange,
        [field]: value,
      },
    }));
  };

  const handleImageChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setImageFile(nextFile);
    if (!nextFile && editingItem?.imageUrl) {
      setImagePreview(editingItem.imageUrl);
    }
  };

  const handleCategoryDraftChange = (categoryName, nextValue) => {
    setCategoryDrafts((current) => ({
      ...current,
      [categoryName]: nextValue,
    }));
  };

  const toggleSectionOption = (sectionKey, option) => {
    const normalizedOption = String(option || "").trim();
    if (!normalizedOption) {
      return;
    }

    setFormData((current) => {
      const currentItems = current[sectionKey] || [];
      const isSelected = currentItems.includes(normalizedOption);

      return {
        ...current,
        [sectionKey]: isSelected
          ? currentItems.filter((item) => item !== normalizedOption)
          : [...currentItems, normalizedOption],
      };
    });
  };

  const handleSectionPricingModeChange = (sectionKey, nextPricingMode) => {
    const pricingMode = nextPricingMode === "fixed" ? "fixed" : "per_kg";

    setFormData((current) => ({
      ...current,
      fieldSections: (current.fieldSections || []).map((section) =>
        section.key === sectionKey ? { ...section, pricingMode } : section,
      ),
    }));
  };

  const handleSectionPriceSourceChange = (sectionKey, nextPriceSource) => {
    const priceSource = nextPriceSource === "per_image" ? "per_image" : "shared";

    setFormData((current) => ({
      ...current,
      fieldSections: (current.fieldSections || []).map((section) =>
        section.key === sectionKey ? { ...section, priceSource } : section,
      ),
    }));
  };

  const toggleAllSectionOptions = (sectionKey, options = [], forceState) => {
    const normalizedOptions = toUniqueOptions(options);

    setFormData((current) => ({
      ...current,
      [sectionKey]: forceState ? normalizedOptions : [],
    }));
  };

  const addSectionOption = (sectionKey, value) => {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) {
      onToast("Enter a field value before adding it.", "error");
      return false;
    }

    const currentOptions = optionCatalogs[sectionKey] || [];
    const nextOptions = toUniqueOptions([...currentOptions, normalizedValue]);

    if (nextOptions.length === currentOptions.length) {
      return false;
    }

    setOptionCatalogs((current) => ({
      ...current,
      [sectionKey]: nextOptions,
    }));

    setFormData((current) => ({
      ...current,
      [sectionKey]: toUniqueOptions([...(current[sectionKey] || []), normalizedValue]),
    }));

    setFieldMutations((current) => [
      ...current,
      {
        type: "add_option",
        sectionKey,
        option: normalizedValue,
      },
    ]);

    return true;
  };

  const renameSectionOption = (sectionKey, index, value) => {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return;
    }

    const currentOptions = optionCatalogs[sectionKey] || [];
    const previousValue = currentOptions[index];
    if (!previousValue || previousValue === normalizedValue) {
      return;
    }

    const nextOptions = [...currentOptions];
    nextOptions[index] = normalizedValue;
    const sectionTitle =
      (formData.fieldSections || []).find((section) => section.key === sectionKey)
        ?.title || "";

    setOptionCatalogs((current) => ({
      ...current,
      [sectionKey]: nextOptions.filter(Boolean),
    }));

    setFormData((currentForm) => ({
      ...currentForm,
      [sectionKey]: (currentForm[sectionKey] || [])
        .map((entry) => (entry === previousValue ? normalizedValue : entry))
        .filter(Boolean),
      optionPrices: (currentForm.optionPrices || []).map((entry) =>
        entry.sectionKey === sectionKey &&
        String(entry.option || "").trim() === previousValue
          ? buildOptionPriceEntry(
              sectionKey,
              sectionTitle,
              normalizedValue,
              entry.price,
            )
          : entry,
      ),
    }));

    setFieldMutations((currentMutations) => {
      const addOptionMutation = currentMutations.find(
        (entry) =>
          entry.type === "add_option" &&
          entry.sectionKey === sectionKey &&
          entry.option === previousValue,
      );

      if (addOptionMutation) {
        return currentMutations.map((entry) =>
          entry === addOptionMutation ? { ...entry, option: normalizedValue } : entry,
        );
      }

      const existingRenameMutation = currentMutations.find(
        (entry) =>
          entry.type === "rename_option" &&
          entry.sectionKey === sectionKey &&
          entry.option === previousValue,
      );

      const previousOption = existingRenameMutation?.previousOption || previousValue;

      return replaceMatchingMutation(
        currentMutations,
        (entry) =>
          entry.type === "rename_option" &&
          entry.sectionKey === sectionKey &&
          (entry.option === previousValue ||
            entry.previousOption === previousOption),
        {
          type: "rename_option",
          sectionKey,
          previousOption,
          option: normalizedValue,
        },
      );
    });
  };

  const deleteSectionOption = (sectionKey, index) => {
    const currentOptions = optionCatalogs[sectionKey] || [];
    if (index < 0 || index >= currentOptions.length) {
      return;
    }

    const nextOptions = [...currentOptions];
    const [deletedOption] = nextOptions.splice(index, 1);

    setOptionCatalogs((current) => ({
      ...current,
      [sectionKey]: nextOptions,
    }));

    setFormData((currentForm) => ({
      ...currentForm,
      [sectionKey]: (currentForm[sectionKey] || []).filter(
        (entry) => entry !== deletedOption,
      ),
      optionPrices: (currentForm.optionPrices || []).filter(
        (entry) =>
          !(
            entry.sectionKey === sectionKey &&
            String(entry.option || "").trim() === String(deletedOption).trim()
          ),
      ),
    }));

    setFieldMutations((currentMutations) => {
      const addOptionMutation = currentMutations.find(
        (entry) =>
          entry.type === "add_option" &&
          entry.sectionKey === sectionKey &&
          entry.option === deletedOption,
      );

      if (addOptionMutation) {
        return dropMatchingMutations(
          currentMutations,
          (entry) =>
            entry === addOptionMutation ||
            (entry.type === "rename_option" &&
              entry.sectionKey === sectionKey &&
              entry.previousOption === deletedOption),
        );
      }

      const renameMutation = currentMutations.find(
        (entry) =>
          entry.type === "rename_option" &&
          entry.sectionKey === sectionKey &&
          entry.option === deletedOption,
      );

      const optionToDelete = renameMutation?.previousOption || deletedOption;
      const withoutRename = dropMatchingMutations(
        currentMutations,
        (entry) => entry === renameMutation,
      );

      return [
        ...dropMatchingMutations(
          withoutRename,
          (entry) =>
            entry.type === "delete_option" &&
            entry.sectionKey === sectionKey &&
            entry.option === optionToDelete,
        ),
        {
          type: "delete_option",
          sectionKey,
          option: optionToDelete,
        },
      ];
    });
  };

  const addCustomSection = (area, title) => {
    const normalizedTitle = String(title || "").trim();

    if (!normalizedTitle) {
      onToast("Enter a field name before creating it.", "error");
      return "";
    }

    const sectionKey = createCustomSectionKey();

    setFormData((current) => ({
      ...current,
      fieldSections: [
        ...(current.fieldSections || []),
        {
          key: sectionKey,
          title: normalizedTitle,
          area: area === "extras" ? "extras" : "general",
          isCustom: true,
          pricingMode: area === "extras" ? "fixed" : "per_kg",
          priceSource: "shared",
        },
      ],
      customSections: [
        ...(current.customSections || []),
        {
          key: sectionKey,
          title: normalizedTitle,
          area: area === "extras" ? "extras" : "general",
          pricingMode: area === "extras" ? "fixed" : "per_kg",
          priceSource: "shared",
        },
      ],
      [sectionKey]: [],
    }));

    setOptionCatalogs((current) => ({
      ...current,
      [sectionKey]: [],
    }));

    setFieldMutations((current) => [
      ...current,
      {
        type: "add_field",
        sectionKey,
        title: normalizedTitle,
        area: area === "extras" ? "extras" : "general",
        isCustom: true,
      },
    ]);

    return sectionKey;
  };

  const renameFieldSection = (sectionKey, nextTitle) => {
    const normalizedTitle = String(nextTitle || "").trim();
    if (!normalizedTitle) {
      return;
    }

    const targetSection =
      (formData.fieldSections || []).find((section) => section.key === sectionKey) ||
      null;
    const previousTitle = targetSection?.title || "";
    const usesFieldToggle = isDirectToggleSection(
      targetSection,
      optionCatalogs[sectionKey] || [],
    );

    setFormData((current) => {
      return {
        ...current,
        fieldSections: (current.fieldSections || []).map((section) =>
          section.key === sectionKey
            ? { ...section, title: normalizedTitle }
            : section,
        ),
        customSections: (current.customSections || []).map((section) =>
          section.key === sectionKey
            ? { ...section, title: normalizedTitle }
            : section,
        ),
        [sectionKey]: usesFieldToggle
          ? toUniqueOptions(
              (current[sectionKey] || []).map((entry) =>
                entry === previousTitle ? normalizedTitle : entry,
              ),
            )
          : current[sectionKey],
        optionPrices: (current.optionPrices || []).map((entry) => ({
          ...entry,
          sectionTitle:
            entry.sectionKey === sectionKey ? normalizedTitle : entry.sectionTitle,
          option:
            usesFieldToggle &&
            entry.sectionKey === sectionKey &&
            String(entry.option || "").trim() === previousTitle
              ? normalizedTitle
              : entry.option,
        })),
      };
    });

    setFieldMutations((current) => {
      const addFieldMutation = current.find(
        (entry) => entry.type === "add_field" && entry.sectionKey === sectionKey,
      );

      if (addFieldMutation) {
        return current.map((entry) =>
          entry === addFieldMutation ? { ...entry, title: normalizedTitle } : entry,
        );
      }

      const existingRename = current.find(
        (entry) => entry.type === "rename_field" && entry.sectionKey === sectionKey,
      );

      return replaceMatchingMutation(
        current,
        (entry) => entry === existingRename,
        {
          type: "rename_field",
          sectionKey,
          area: targetSection?.area || "general",
          isCustom: Boolean(targetSection?.isCustom),
          previousTitle: existingRename?.previousTitle || previousTitle,
          title: normalizedTitle,
        },
      );
    });
  };

  const deleteFieldSection = (sectionKey) => {
    const deletedSection =
      (formData.fieldSections || []).find((section) => section.key === sectionKey) ||
      null;

    setFormData((current) => {
      const nextForm = { ...current };
      nextForm.fieldSections = (nextForm.fieldSections || []).filter(
        (section) => section.key !== sectionKey,
      );
      nextForm.customSections = (nextForm.customSections || []).filter(
        (section) => section.key !== sectionKey,
      );
      nextForm.optionPrices = (nextForm.optionPrices || []).filter(
        (entry) => entry.sectionKey !== sectionKey,
      );
      delete nextForm[sectionKey];
      return nextForm;
    });

    setOptionCatalogs((current) => {
      const nextCatalogs = { ...current };
      delete nextCatalogs[sectionKey];
      return nextCatalogs;
    });

    setFieldMutations((current) => {
      const addFieldMutation = current.find(
        (entry) => entry.type === "add_field" && entry.sectionKey === sectionKey,
      );

      const withoutSectionMutations = dropMatchingMutations(
        current,
        (entry) => entry.sectionKey === sectionKey,
      );

      if (addFieldMutation) {
        return withoutSectionMutations;
      }

      return [
        ...withoutSectionMutations,
        {
          type: "delete_field",
          sectionKey,
          title: deletedSection?.title || "",
          area: deletedSection?.area || "general",
        },
      ];
    });
  };

  const handleOptionPriceChange = (section, option, nextPrice) => {
    const numericPrice = Number(nextPrice);
    const normalizedOption = String(option || "").trim();

    setFormData((current) => {
      const currentEntries = Array.isArray(current.optionPrices)
        ? current.optionPrices
        : [];
      const remainingEntries = currentEntries.filter(
        (entry) =>
          !(
            entry.sectionKey === section.key &&
            String(entry.option || "").trim() === normalizedOption
          ),
      );

      return {
        ...current,
        optionPrices: [
          ...remainingEntries,
          buildOptionPriceEntry(
            section.key,
            section.title,
            normalizedOption,
            Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 0,
          ),
        ],
      };
    });
  };

  const handleCombinationPriceChange = (selections = [], nextPrice) => {
    const combinationKey = buildGalleryCombinationKey(selections);
    const combinationLabel = buildGalleryCombinationLabel(selections);
    if (!combinationKey) {
      return;
    }

    const numericPrice = Number(nextPrice);

    setFormData((current) => {
      const currentEntries = Array.isArray(current.combinationPrices)
        ? current.combinationPrices
        : [];
      const existingEntry = currentEntries.find((entry) => entry.key === combinationKey);
      const remainingEntries = currentEntries.filter(
        (entry) => entry.key !== combinationKey,
      );

      return {
        ...current,
        combinationPrices: [
          ...remainingEntries,
          {
            key: combinationKey,
            label: combinationLabel,
            price:
              Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 0,
            isEnabled: existingEntry?.isEnabled !== false,
            selections,
          },
        ],
      };
    });
  };

  const handleCombinationEnabledChange = (selections = [], isEnabled) => {
    const combinationKey = buildGalleryCombinationKey(selections);
    const combinationLabel = buildGalleryCombinationLabel(selections);
    if (!combinationKey) {
      return;
    }

    setFormData((current) => {
      const currentEntries = Array.isArray(current.combinationPrices)
        ? current.combinationPrices
        : [];
      const existingEntry = currentEntries.find((entry) => entry.key === combinationKey);
      const remainingEntries = currentEntries.filter(
        (entry) => entry.key !== combinationKey,
      );

      return {
        ...current,
        combinationPrices: [
          ...remainingEntries,
          {
            key: combinationKey,
            label: combinationLabel,
            price: Number(existingEntry?.price) || 0,
            isEnabled: Boolean(isEnabled),
            selections,
          },
        ],
      };
    });
  };

  const renameCategory = async (currentCategory) => {
    const sourceCategory = String(currentCategory || "").trim();
    const targetCategory = String(categoryDrafts[sourceCategory] || "").trim();

    if (!sourceCategory || !targetCategory) {
      onToast("Enter a category name before saving.", "error");
      return;
    }

    if (sourceCategory === targetCategory) {
      onToast("Category name is already up to date.");
      return;
    }

    if (galleryCategories.includes(targetCategory)) {
      onToast("That category already exists. Choose a different name.", "error");
      return;
    }

    try {
      const matchingItems = galleryItems.filter(
        (item) =>
          (
            Array.isArray(item?.categories) && item.categories.length > 0
              ? item.categories
              : [item?.category]
          )
            .map((entry) => String(entry || "").trim())
            .includes(sourceCategory),
      );

      await Promise.all(
        matchingItems.map((item) =>
          {
            const nextCategories = toUniqueOptions(
              (
                Array.isArray(item?.categories) && item.categories.length > 0
                  ? item.categories
                  : [item?.category]
              ).map((entry) =>
                String(entry || "").trim() === sourceCategory
                  ? targetCategory
                  : String(entry || "").trim(),
              ),
            );

            return (
          dispatch(
            updateGalleryItem({
              itemId: item._id,
              galleryItemData: buildGalleryPayload({
                formData: {
                  ...normalizeGalleryFormFromItem(item, sharedGalleryFieldConfig),
                  categories: nextCategories,
                  category: nextCategories[0] || targetCategory,
                },
                optionCatalogs: sharedOptionCatalogs,
                existingImageUrl: item.imageUrl,
              }),
            }),
          ).unwrap()
            );
          },
        ),
      );

      if (selectedCategory === sourceCategory) {
        setSelectedCategory(targetCategory);
      }

      onToast("Category renamed successfully.");
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to rename category."), "error");
    }
  };

  const deleteCategory = async (categoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) {
      return;
    }

    if (
      !window.confirm(
        `Move all "${normalizedCategory}" items to ${DEFAULT_DELETED_CATEGORY}?`,
      )
    ) {
      return;
    }

    try {
      const matchingItems = galleryItems.filter(
        (item) =>
          (
            Array.isArray(item?.categories) && item.categories.length > 0
              ? item.categories
              : [item?.category]
          )
            .map((entry) => String(entry || "").trim())
            .includes(normalizedCategory),
      );

      await Promise.all(
        matchingItems.map((item) =>
          {
            const remainingCategories = toUniqueOptions(
              (
                Array.isArray(item?.categories) && item.categories.length > 0
                  ? item.categories
                  : [item?.category]
              ).filter(
                (entry) => String(entry || "").trim() !== normalizedCategory,
              ),
            );
            const nextCategories = remainingCategories.length
              ? remainingCategories
              : [DEFAULT_DELETED_CATEGORY];

            return (
          dispatch(
            updateGalleryItem({
              itemId: item._id,
              galleryItemData: buildGalleryPayload({
                formData: {
                  ...normalizeGalleryFormFromItem(item, sharedGalleryFieldConfig),
                  categories: nextCategories,
                  category: nextCategories[0] || DEFAULT_DELETED_CATEGORY,
                },
                optionCatalogs: sharedOptionCatalogs,
                existingImageUrl: item.imageUrl,
              }),
            }),
          ).unwrap()
            );
          },
        ),
      );

      if (selectedCategory === normalizedCategory) {
        setSelectedCategory("all");
      }

      onToast(`Category moved to ${DEFAULT_DELETED_CATEGORY}.`);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to delete category."), "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this gallery item?")) {
      return;
    }

    try {
      await dispatch(deleteGalleryItem(itemId)).unwrap();
      onToast("Gallery item deleted successfully.");
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to delete gallery item."), "error");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editorMode === "pricing") {
      try {
        const combinationFieldSections = (formData.fieldSections || []).filter((section) =>
          COMBINATION_SECTION_KEYS.includes(section.key),
        );
        const galleryFieldConfig = createGalleryFieldConfigFromForm(
          {
            ...formData,
            combinationPrices: normalizeCombinationPricePayload({
              ...formData,
              fieldSections: combinationFieldSections,
            }),
          },
          optionCatalogs,
        );

        await dispatch(updateSiteSettings({ galleryFieldConfig })).unwrap();
        onToast("Gallery pricing updated successfully.");
        closeModal();
      } catch (error) {
        onToast(getErrorMessage(error, "Failed to save gallery pricing."), "error");
      }
      return;
    }

    const title = String(formData.title || "").trim();
    const categories = toUniqueOptions(formData.categories || []);

    if (!title || !categories.length) {
      onToast("Please enter a gallery title and at least one category.", "error");
      return;
    }

    if (!editingItem && !imageFile) {
      onToast("Please choose an image before saving.", "error");
      return;
    }

    try {
      const payload = buildGalleryPayload({
        formData,
        optionCatalogs,
        imageFile,
        existingImageUrl: editingItem?.imageUrl || "",
        galleryFieldMutations: fieldMutations,
      });

      if (editingItem?._id) {
        await dispatch(
          updateGalleryItem({
            itemId: editingItem._id,
            galleryItemData: payload,
          }),
        ).unwrap();
        onToast(
          editorMode === "pricing"
            ? "Gallery pricing updated successfully."
            : "Gallery item updated successfully.",
        );
      } else {
        await dispatch(addGalleryItem(payload)).unwrap();
        onToast("Gallery item added successfully.");
      }

      closeModal();
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to save gallery item."), "error");
    }
  };

  return {
    categoryDrafts,
    deleteCategory,
    editorMode,
    filteredItems,
    formData,
    galleryCategories,
    galleryFieldConfig: sharedGalleryFieldConfig,
    galleryItems,
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
  };
};

export default useAdminGalleryEditor;
