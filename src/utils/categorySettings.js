const normalizeCategoryName = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizeCategorySettings = (
  categories = [],
  categorySettings = [],
) => {
  const settingMap = new Map();

  (Array.isArray(categorySettings) ? categorySettings : []).forEach((entry) => {
    const name = normalizeCategoryName(entry?.name);
    if (!name) {
      return;
    }

    settingMap.set(name, entry?.isActive !== false);
  });

  const orderedNames = [
    ...(Array.isArray(categories) ? categories : []),
    ...(Array.isArray(categorySettings)
      ? categorySettings.map((entry) => entry?.name)
      : []),
  ]
    .map((entry) => normalizeCategoryName(entry))
    .filter(Boolean);

  return Array.from(new Set(orderedNames)).map((name) => ({
    name,
    isActive: settingMap.has(name) ? settingMap.get(name) : true,
  }));
};

export const isCategoryActive = (categorySettings = [], categoryName = "") => {
  const normalizedName = normalizeCategoryName(categoryName);

  if (!normalizedName) {
    return true;
  }

  const matched = (Array.isArray(categorySettings) ? categorySettings : []).find(
    (entry) => normalizeCategoryName(entry?.name) === normalizedName,
  );

  return matched ? matched.isActive !== false : true;
};
