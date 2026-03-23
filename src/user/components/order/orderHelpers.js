import {
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import { toCoordinate } from "@/user/components/order/addressGeocoding";
export {
  GEOAPIFY_API_KEY,
  hasValidCoordinates,
  reverseGeocodeCoordinates,
  searchAddressSuggestions,
  toAddressFromPlaceResult,
  toAddressFromSuggestion,
} from "@/user/components/order/addressGeocoding";

const CHECKOUT_STORAGE_KEY = "bakeryPendingCheckout";

export { CHECKOUT_STORAGE_KEY };

export const getResolvedCheckoutItem = (item) => {
  const hasExplicitFlavors = normalizeFlavorOptions(item.product).length > 0;
  const availableEggTypes = [
    ...(item.product?.isEgg !== false ? ["egg"] : []),
    ...(item.product?.isEggless === true ? ["eggless"] : []),
  ];
  const selectedEggType = availableEggTypes.includes(item.selectedEggType)
    ? item.selectedEggType
    : availableEggTypes.length === 1
      ? availableEggTypes[0]
      : "";
  const availableFlavors = getAvailableFlavorOptions(item.product);
  const selectedFlavor = hasExplicitFlavors
    ? availableFlavors.find((option) => option.name === item.selectedFlavor)
        ?.name ||
      availableFlavors[0]?.name ||
      ""
    : "";
  const flavorForWeightFilter =
    selectedFlavor || availableFlavors[0]?.name || "";
  const availableWeights = getAvailableWeightOptions(
    item.product,
    flavorForWeightFilter,
    selectedEggType,
  );
  const selectedWeight =
    availableWeights.find((option) => option.label === item.selectedWeight)
      ?.label ||
    availableWeights[0]?.label ||
    "";
  const unitPrice = getVariantPrice(item.product, {
    flavorName: selectedFlavor,
    weightLabel: selectedWeight,
    eggType: selectedEggType,
  });

  return {
    ...item,
    portionTypeMeta: getPortionTypeMeta(item.product?.portionType),
    selectedEggType,
    selectedFlavor,
    selectedWeight,
    unitPrice,
    lineTotal: unitPrice * item.quantity,
    canOrder:
      isProductPurchasable(item.product) &&
      (!hasExplicitFlavors || Boolean(selectedFlavor)) &&
      (availableEggTypes.length <= 1 || Boolean(selectedEggType)) &&
      Boolean(selectedWeight),
  };
};

export const normalizeUserSavedAddresses = (user) => {
  const saved = Array.isArray(user?.savedAddresses)
    ? user.savedAddresses.map((address, index) => ({
        id: address?._id || `saved-${index}`,
        label: address?.label || "Saved address",
        street: address?.street || "",
        city: address?.city || "Vizianagaram",
        state: address?.state || "Andhra Pradesh",
        zipCode: address?.zipCode || "",
        phone: address?.phone || "",
        landmark: address?.landmark || "",
        placeId: address?.placeId || "",
        latitude: toCoordinate(address?.latitude, -90, 90),
        longitude: toCoordinate(address?.longitude, -180, 180),
        formattedAddress: address?.formattedAddress || "",
        isDefault: address?.isDefault === true,
      }))
    : [];

  if (saved.length > 0) {
    return saved;
  }

  if (user?.address?.street) {
    return [
      {
        id: "default-profile-address",
        label: "Primary",
        street: user.address.street,
        city: user.address.city || "Vizianagaram",
        state: user.address.state || "Andhra Pradesh",
        zipCode: user.address.zipCode || "",
        phone: user.phone || "",
        landmark: "",
        placeId: "",
        latitude: null,
        longitude: null,
        formattedAddress: "",
        isDefault: true,
      },
    ];
  }

  return [];
};
