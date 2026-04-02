import { updateProfile } from "@/features/auth/authSlice";
import { showToast } from "@/features/uiSlice";
import { normalizeCouponCode } from "@/utils/orderPricing";
import { CHECKOUT_STORAGE_KEY } from "@/user/components/order/orderHelpers";
import {
  isTimeInsideAnySlotWindow,
  scrollToPageTop,
  scrollToValidationTarget,
} from "./orderPageUtils";
import { useRef } from "react";

const toText = (value) => String(value ?? "").trim();

const formatEggTypeLabel = (eggType = "") => {
  if (String(eggType).toLowerCase() === "eggless") {
    return "Eggless";
  }
  if (String(eggType).toLowerCase() === "egg") {
    return "Egg";
  }
  return toText(eggType);
};

const dedupeOptionEntries = (entries = []) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const label = toText(entry?.label);
    const value = toText(entry?.value);
    if (!label || !value) {
      return false;
    }

    const key = `${label.toLowerCase()}::${value.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildCheckoutItemSelectedOptions = (item) => {
  const entries = [];
  const push = (label, value) => {
    const normalizedLabel = toText(label);
    const normalizedValue = toText(value);
    if (normalizedLabel && normalizedValue) {
      entries.push({
        label: normalizedLabel,
        value: normalizedValue,
      });
    }
  };

  if (Array.isArray(item?.selectedOptions)) {
    item.selectedOptions.forEach((entry) => {
      push(entry?.label || entry?.name || entry?.key, entry?.value ?? entry?.choice);
    });
  } else if (item?.selectedOptions && typeof item.selectedOptions === "object") {
    Object.entries(item.selectedOptions).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        push(value.label || key, value.value ?? value.choice ?? value.selected);
      } else {
        push(key, value);
      }
    });
  }

  const portionLabel = toText(
    item?.portionTypeMeta?.singular || item?.portionTypeMeta?.heading || "Size",
  );
  push(portionLabel, item?.selectedWeight);
  push("Size", item?.selectedWeight);
  push("Weight", item?.selectedWeight);
  push("Flavor", item?.selectedFlavor);
  push("Cake Type", formatEggTypeLabel(item?.selectedEggType));
  push("Occasion", item?.occasion);
  push("Message on Cake", item?.customMessage || item?.message);

  if (Array.isArray(item?.customizations)) {
    item.customizations.forEach((customization) => {
      push(customization?.name || "Customization", customization?.choice);
    });
  }

  return dedupeOptionEntries(entries);
};

export const useCheckoutSubmit = ({
  dispatch,
  navigate,
  user,
  formData,
  checkoutItems,
  invalidItems,
  pricing,
  scheduledDate,
  scheduledSlotStart,
  availableScheduledSlots,
  scheduleAvailabilityReason,
  nowAvailabilityReason,
  hasConfiguredStoreLocation,
  isAddressVerified,
  isAddressServiceable,
  deliveryDistanceKm,
  maxDeliveryRadiusKm,
  addressMeta,
  addressLabel,
  addressQuery,
  saveAddressForNextTime,
  editingAddressId,
  savedAddresses,
  selectedAddressId,
  freeDeliveryProgress,
  availableCoupons,
  loading,
}) => {
  const submitLockRef = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || loading) {
      return;
    }

    if (
      !checkoutItems.length ||
      invalidItems.length > 0 ||
      pricing.couponError
    ) {
      return;
    }

    if (!formData.deliveryMode) {
      scrollToValidationTarget("checkout-delivery-mode");
      dispatch(
        showToast({
          message: "Please choose Deliver Now or Schedule Delivery.",
          type: "error",
        }),
      );
      return;
    }

    if (formData.deliveryMode === "scheduled" && !formData.deliveryDateTime) {
      scrollToValidationTarget("checkout-schedule-section");
      dispatch(
        showToast({
          message: "Please choose delivery date and an available time slot.",
          type: "error",
        }),
      );
      return;
    }

    if (
      formData.deliveryMode === "scheduled" &&
      (!scheduledDate ||
        !scheduledSlotStart ||
        !isTimeInsideAnySlotWindow(scheduledSlotStart, availableScheduledSlots))
    ) {
      scrollToValidationTarget("checkout-schedule-section");
      dispatch(
        showToast({
          message:
            scheduleAvailabilityReason ||
            "Selected schedule is not available. Please choose a valid slot.",
          type: "error",
        }),
      );
      return;
    }

    if (formData.deliveryMode === "now" && nowAvailabilityReason) {
      scrollToValidationTarget("checkout-delivery-mode");
      dispatch(
        showToast({
          message:
            nowAvailabilityReason ||
            "Delivery is unavailable right now. Please schedule a time.",
          type: "error",
        }),
      );
      return;
    }

    if (!hasConfiguredStoreLocation) {
      scrollToValidationTarget("checkout-address-section");
      dispatch(
        showToast({
          message:
            "Store location is missing in admin delivery settings. Unable to place order.",
          type: "error",
        }),
      );
      return;
    }

    if (!isAddressVerified) {
      scrollToValidationTarget("checkout-address-section");
      dispatch(
        showToast({
          message:
            "Please select a verified address suggestion or use current location.",
          type: "error",
        }),
      );
      return;
    }

    if (!isAddressServiceable) {
      scrollToValidationTarget("checkout-address-section");
      dispatch(
        showToast({
          message: `Sorry, this address is outside our ${maxDeliveryRadiusKm}km delivery area.`,
          type: "error",
        }),
      );
      return;
    }

    if (!formData.paymentMethod) {
      scrollToValidationTarget("checkout-payment-method");
      dispatch(
        showToast({
          message: "Please choose a payment method.",
          type: "error",
        }),
      );
      return;
    }

    try {
      submitLockRef.current = true;

      const normalizedStreet = formData.address.trim();
      const normalizedCity = formData.city.trim();
      const normalizedPincode = formData.pincode.trim();
      const clientOrderRequestId =
        formData.clientOrderRequestId ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const resolvedFormattedAddress = String(
        addressMeta.formattedAddress ||
          addressQuery ||
          [normalizedStreet, normalizedCity, normalizedPincode]
            .filter(Boolean)
            .join(", "),
      ).trim();
      const profileAddress = {
        street: normalizedStreet,
        city: normalizedCity,
        state: "Andhra Pradesh",
        zipCode: normalizedPincode,
        placeId: addressMeta.placeId || "",
        latitude: Number(addressMeta.latitude),
        longitude: Number(addressMeta.longitude),
      };

      let normalizedSavedAddresses = savedAddresses.map((address) => ({
        label: address.label || "Saved address",
        street: address.street,
        city: address.city,
        state: address.state || "Andhra Pradesh",
        zipCode: address.zipCode,
        phone: address.phone || "",
        landmark: address.landmark || "",
        placeId: address.placeId || "",
        latitude: Number.isFinite(Number(address.latitude))
          ? Number(address.latitude)
          : undefined,
        longitude: Number.isFinite(Number(address.longitude))
          ? Number(address.longitude)
          : undefined,
        formattedAddress: address.formattedAddress || "",
        isDefault: address.id === selectedAddressId,
      }));

      const isAlreadySaved = normalizedSavedAddresses.some(
        (address) =>
          address.street?.toLowerCase() === normalizedStreet.toLowerCase() &&
          address.city?.toLowerCase() === normalizedCity.toLowerCase() &&
          address.zipCode?.toLowerCase() === normalizedPincode.toLowerCase(),
      );

      const editingAddress = savedAddresses.find(
        (address) => address.id === editingAddressId,
      );

      if (saveAddressForNextTime && editingAddressId) {
        normalizedSavedAddresses = normalizedSavedAddresses.filter(
          (entry) =>
            !(
              entry.street?.toLowerCase() ===
                (editingAddress?.street || "").toLowerCase() &&
              entry.city?.toLowerCase() ===
                (editingAddress?.city || "").toLowerCase() &&
              entry.zipCode?.toLowerCase() ===
                (editingAddress?.zipCode || "").toLowerCase()
            ),
        );

        normalizedSavedAddresses = normalizedSavedAddresses.map((entry) => ({
          ...entry,
          isDefault: false,
        }));

        normalizedSavedAddresses.push({
          label: addressLabel.trim() || "Saved address",
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          landmark: "",
          placeId: addressMeta.placeId || "",
          latitude: Number.isFinite(Number(addressMeta.latitude))
            ? Number(addressMeta.latitude)
            : undefined,
          longitude: Number.isFinite(Number(addressMeta.longitude))
            ? Number(addressMeta.longitude)
            : undefined,
          formattedAddress: resolvedFormattedAddress,
          isDefault: true,
        });
      } else if (saveAddressForNextTime && !isAlreadySaved) {
        normalizedSavedAddresses = normalizedSavedAddresses.map((entry) => ({
          ...entry,
          isDefault: false,
        }));

        normalizedSavedAddresses.push({
          label: addressLabel.trim() || "Saved address",
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          landmark: "",
          placeId: addressMeta.placeId || "",
          latitude: Number.isFinite(Number(addressMeta.latitude))
            ? Number(addressMeta.latitude)
            : undefined,
          longitude: Number.isFinite(Number(addressMeta.longitude))
            ? Number(addressMeta.longitude)
            : undefined,
          formattedAddress: resolvedFormattedAddress,
          isDefault: true,
        });
      }

      const checkoutPayload = {
        items: checkoutItems.map((item) => {
          const selectedOptions = buildCheckoutItemSelectedOptions(item);
          const optionSummary = selectedOptions
            .map((entry) => `${entry.label}: ${entry.value}`)
            .join(" | ");

          return {
            product: item.product._id,
            productName: toText(item.product?.name || ""),
            productImage: toText(
              item.product?.images?.[0] || item.product?.image || "",
            ),
            quantity: Number(item.quantity),
            size: item.selectedWeight,
            weight: item.selectedWeight,
            flavor: item.selectedFlavor,
            cakeType: item.selectedEggType || "",
            customMessage: toText(item.customMessage || item.message || ""),
            occasion: toText(item.occasion || ""),
            selectedOptions,
            optionSummary,
            customizations: Array.isArray(item.customizations)
              ? item.customizations
              : [],
            price: item.unitPrice,
          };
        }),
        deliveryAddress: {
          street: normalizedStreet,
          city: normalizedCity,
          state: "Andhra Pradesh",
          zipCode: normalizedPincode,
          phone: formData.phone.trim(),
          placeId: addressMeta.placeId || "",
          lat: Number(addressMeta.latitude),
          lng: Number(addressMeta.longitude),
          label: addressLabel.trim() || "Home",
          formattedAddress: resolvedFormattedAddress,
        },
        deliveryMode: formData.deliveryMode,
        deliveryDateTime:
          formData.deliveryMode === "scheduled"
            ? formData.deliveryDateTime
            : null,
        deliveryDistanceKm: Number.isFinite(Number(deliveryDistanceKm))
          ? Number(deliveryDistanceKm)
          : null,
        paymentMethod: formData.paymentMethod,
        couponCode: normalizeCouponCode(formData.couponCode),
        clientOrderRequestId,
        specialInstructions: [
          formData.specialInstructions,
          formData.name ? `Contact name: ${formData.name}` : "",
          formData.phone ? `Phone: ${formData.phone}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      };

      await dispatch(
        updateProfile({
          phone: formData.phone,
          address: profileAddress,
          savedAddresses: normalizedSavedAddresses,
        }),
      ).unwrap();

      const pendingCheckout = {
        orderData: checkoutPayload,
        pricing,
        freeDeliveryProgress,
        availableCoupons,
        checkoutForm: {
          formData: {
            ...formData,
            clientOrderRequestId,
          },
          scheduledDeliveryDate: scheduledDate,
          addressMode: selectedAddressId ? "saved" : "new",
          selectedAddressId,
          saveAddressForNextTime,
          addressLabel,
          addressMeta: {
            ...addressMeta,
          },
          deliveryDistanceKm: Number.isFinite(Number(deliveryDistanceKm))
            ? Number(deliveryDistanceKm)
            : null,
          addressQuery,
        },
        customer: {
          name: formData.name,
          email: user?.email || "",
          phone: formData.phone,
        },
      };
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify(pendingCheckout),
      );
      scrollToPageTop();
      navigate("/payment", { state: pendingCheckout });
    } catch (submitError) {
      const errorMessage =
        submitError?.error || submitError?.message || "Failed to create order";
      dispatch(showToast({ message: errorMessage, type: "error" }));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { handleSubmit };
};
