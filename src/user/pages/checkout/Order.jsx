import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearCart } from "../../../features/cart/cartSlice";
import { fetchProducts } from "../../../features/products/productSlice";
import { createOrder } from "../../../features/orders/orderSlice";
import { showToast } from "../../../features/uiSlice";
import { updateProfile } from "../../../features/auth/authSlice";
import {
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "../../../utils/orderPricing";
import {
  DAY_LABELS,
  getAvailableSlotsForDate,
  getDeliveryDayKey,
  getLeadTimeMinutes,
  haversineDistance,
  isWithinDeliveryRadius,
  normalizeDeliverySettings,
} from "../../../utils/deliverySettings";
import {
  getResolvedCheckoutItem,
  hasValidCoordinates,
  normalizeUserSavedAddresses,
  CHECKOUT_STORAGE_KEY,
} from "../../components/order/orderHelpers";
import OrderReviewStep from "../../components/order/OrderReviewStep";
import OrderDeliveryStep from "../../components/order/OrderDeliveryStep";
import OrderAddressStep from "../../components/order/OrderAddressStep";
import OrderSummary from "../../components/order/OrderSummary";

const stepLabels = ["Review", "Checkout"];
const scrollToPageTop = () => {
  window.scrollTo({ top: 0, behavior: "auto" });
};

const scrollToValidationTarget = (targetId) => {
  if (!targetId) {
    scrollToPageTop();
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) {
    scrollToPageTop();
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
};

const toMinutes = (timeValue = "") => {
  const [hours, minutes] = String(timeValue)
    .split(":")
    .map((value) => Number(value) || 0);
  return hours * 60 + minutes;
};

const isTimeInsideAnySlotWindow = (timeValue, slots = []) => {
  if (!timeValue) {
    return false;
  }

  const candidateMinutes = toMinutes(String(timeValue).slice(0, 5));
  return slots.some((slot) => {
    const startMinutes = toMinutes(slot.startTime);
    const endMinutes = toMinutes(slot.endTime);
    return candidateMinutes >= startMinutes && candidateMinutes < endMinutes;
  });
};

const toLocalDateKey = (dateValue = new Date()) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayTime = (timeValue = "00:00") => {
  const [hours, minutes] = String(timeValue)
    .split(":")
    .map((value) => Number(value) || 0);
  const dateValue = new Date();
  dateValue.setHours(hours, minutes, 0, 0);
  return dateValue.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDeliveryNowReason = (normalizedDeliverySettings, now = new Date()) => {
  if (!normalizedDeliverySettings?.enabled) {
    return "Delivery is currently turned off.";
  }

  if (normalizedDeliverySettings?.isPaused) {
    return `Delivery is temporarily paused until ${new Date(normalizedDeliverySettings.pauseUntil).toLocaleString("en-IN")}.`;
  }

  const todayDateKey = toLocalDateKey(now);
  const todayDayKey = getDeliveryDayKey(todayDateKey);
  const daySchedule = normalizedDeliverySettings?.weeklySchedule?.[todayDayKey];

  if (!daySchedule?.isOpen) {
    return `Delivery is closed on ${DAY_LABELS[todayDayKey]}.`;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = (daySchedule.slots || [])
    .map((slot) => ({
      ...slot,
      startMinutes: toMinutes(slot.startTime),
      endMinutes: toMinutes(slot.endTime),
    }))
    .filter((slot) => slot.endMinutes > slot.startMinutes)
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const inActiveWindow = slots.some(
    (slot) => nowMinutes >= slot.startMinutes && nowMinutes < slot.endMinutes,
  );

  if (inActiveWindow) {
    return "";
  }

  const nextWindow = slots.find((slot) => slot.startMinutes > nowMinutes);
  if (nextWindow) {
    return `Delivery opens today at ${formatDisplayTime(nextWindow.startTime)}.`;
  }

  return "Delivery is closed for today. Please schedule delivery.";
};

const Order = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);
  const coupons = useSelector((state) => state.site.coupons);
  const deliverySettings = useSelector((state) => state.site.deliverySettings);
  const [step, setStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [formData, setFormData] = useState({
    deliveryMode: "",
    deliveryDateTime: "",
    paymentMethod: "",
    specialInstructions: "",
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "Vizianagaram",
    pincode: "",
    couponCode: normalizeCouponCode(location.state?.couponCode || ""),
  });
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState("");
  const [savedAddresses, setSavedAddresses] = useState(() =>
    normalizeUserSavedAddresses(user),
  );
  const [addressMode, setAddressMode] = useState("saved");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveAddressForNextTime, setSaveAddressForNextTime] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressMeta, setAddressMeta] = useState({
    placeId: "",
    latitude: null,
    longitude: null,
  });
  const [addressQuery, setAddressQuery] = useState("");

  useEffect(() => {
    scrollToPageTop();
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    scrollToPageTop();
  }, [step]);

  useEffect(() => {
    if (orderSuccess) {
      scrollToPageTop();
    }
  }, [orderSuccess]);

  useEffect(() => {
    if (formData.deliveryMode !== "scheduled") {
      return;
    }

    if (!scheduledDeliveryDate && formData.deliveryDateTime.includes("T")) {
      setScheduledDeliveryDate(formData.deliveryDateTime.split("T")[0]);
    }
  }, [formData.deliveryDateTime, formData.deliveryMode, scheduledDeliveryDate]);

  const handleStepChange = (nextStep) => {
    setStep(nextStep);
    scrollToPageTop();
  };

  const checkoutItems = useMemo(
    () => items.map((item) => getResolvedCheckoutItem(item)),
    [items],
  );
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalUnits = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const invalidItems = checkoutItems.filter((item) => !item.canOrder);
  const availableCoupons = (coupons?.length ? coupons : DEFAULT_COUPONS).filter(
    (coupon) => coupon.isActive !== false,
  );
  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );
  const minimumScheduleDateTime = useMemo(() => {
    const leadMinutes = getLeadTimeMinutes(normalizedDeliverySettings);
    const nextTime = new Date(Date.now() + leadMinutes * 60 * 1000);
    const offset = nextTime.getTimezoneOffset();
    const localDate = new Date(nextTime.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }, [normalizedDeliverySettings]);
  const minimumScheduleDate = minimumScheduleDateTime.slice(0, 10);
  const scheduledDate = scheduledDeliveryDate;
  const scheduledSlotStart = formData.deliveryDateTime
    ? (formData.deliveryDateTime.split("T")[1] || "").slice(0, 5)
    : "";
  const availableSlotsForSelectedDate = useMemo(
    () =>
      scheduledDate || normalizedDeliverySettings.enabled === false
        ? getAvailableSlotsForDate(
            normalizedDeliverySettings,
            scheduledDate,
            new Date(),
          )
        : { isAvailable: true, reason: "", slots: [] },
    [normalizedDeliverySettings, scheduledDate],
  );
  const availableScheduledSlots = availableSlotsForSelectedDate.slots || [];
  const scheduleAvailabilityReason = !availableSlotsForSelectedDate.isAvailable
    ? availableSlotsForSelectedDate.reason
    : "";
  const nowAvailabilityReason = useMemo(
    () =>
      formData.deliveryMode === "now"
        ? getDeliveryNowReason(normalizedDeliverySettings, new Date())
        : "",
    [formData.deliveryMode, normalizedDeliverySettings],
  );

  useEffect(() => {
    if (formData.deliveryMode !== "scheduled" || !scheduledDate) {
      return;
    }

    const isSelectedSlotStillValid = isTimeInsideAnySlotWindow(
      scheduledSlotStart,
      availableScheduledSlots,
    );

    if (!isSelectedSlotStillValid && scheduledSlotStart) {
      setFormData((prev) => ({
        ...prev,
        deliveryDateTime: "",
      }));
    }
  }, [
    availableScheduledSlots,
    formData.deliveryMode,
    scheduledDate,
    scheduledSlotStart,
  ]);
  const pauseUntilLabel = normalizedDeliverySettings.pauseUntil
    ? new Date(normalizedDeliverySettings.pauseUntil).toLocaleString("en-IN")
    : "";
  const storeLocation = normalizedDeliverySettings.storeLocation || {
    lat: 0,
    lng: 0,
  };
  const storeLat = Number(storeLocation?.lat);
  const storeLng = Number(storeLocation?.lng);
  const hasConfiguredStoreLocation = hasValidCoordinates(storeLat, storeLng);
  const isAddressVerified = hasValidCoordinates(
    addressMeta.latitude,
    addressMeta.longitude,
  );
  const distanceFromStoreKm =
    isAddressVerified && hasConfiguredStoreLocation
      ? haversineDistance(
          storeLat,
          storeLng,
          Number(addressMeta.latitude),
          Number(addressMeta.longitude),
        )
      : null;
  const estimatedDeliveryDistanceKm = Number.isFinite(distanceFromStoreKm)
    ? distanceFromStoreKm
    : 0;
  const pricing = calculateOrderPricing({
    subtotal,
    couponCode: formData.couponCode,
    coupons: availableCoupons,
    deliveryDistanceKm: estimatedDeliveryDistanceKm,
    deliverySettings: normalizedDeliverySettings,
  });
  const freeDeliveryProgress = {
    enabled: normalizedDeliverySettings.freeDeliveryEnabled !== false,
    minAmount: Number(normalizedDeliverySettings.freeDeliveryMinAmount) || 0,
    remainingAmount: Math.max(
      0,
      (Number(normalizedDeliverySettings.freeDeliveryMinAmount) || 0) -
        Number(pricing.subtotal || 0),
    ),
  };
  const maxDeliveryRadiusKm = Math.max(
    0,
    Number(normalizedDeliverySettings.maxDeliveryRadiusKm) || 0,
  );
  const isAddressServiceable =
    hasConfiguredStoreLocation &&
    isWithinDeliveryRadius(
      storeLocation,
      Number(addressMeta.latitude),
      Number(addressMeta.longitude),
      maxDeliveryRadiusKm,
    );

  useEffect(() => {
    const normalizedAddresses = normalizeUserSavedAddresses(user);
    setSavedAddresses(normalizedAddresses);

    // Prefer address passed from Cart page, then default
    const passedAddressId = location.state?.selectedAddressId;
    const defaultAddress = passedAddressId
      ? normalizedAddresses.find((a) => a.id === passedAddressId)
      : normalizedAddresses.find((address) => address.isDefault) ||
        normalizedAddresses[0];

    if (defaultAddress) {
      setAddressMode("saved");
      setSelectedAddressId(defaultAddress.id);
      setFormData((prev) => ({
        ...prev,
        phone: defaultAddress.phone || prev.phone || user?.phone || "",
        address: defaultAddress.street || prev.address,
        city: defaultAddress.city || prev.city,
        pincode: defaultAddress.zipCode || prev.pincode,
      }));
      setAddressMeta({
        placeId: defaultAddress.placeId || "",
        latitude: Number.isFinite(Number(defaultAddress.latitude))
          ? Number(defaultAddress.latitude)
          : null,
        longitude: Number.isFinite(Number(defaultAddress.longitude))
          ? Number(defaultAddress.longitude)
          : null,
      });
    }
  }, [user]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user?.name || "",
      phone: prev.phone || user?.phone || "",
      address: prev.address || user?.address?.street || "",
      city: prev.city || user?.address?.city || "Vizianagaram",
      pincode: prev.pincode || user?.address?.zipCode || "",
    }));
  }, [
    user?.address?.city,
    user?.address?.street,
    user?.address?.zipCode,
    user?.name,
    user?.phone,
  ]);

  const toSavedAddressPayload = (addresses) =>
    addresses.map((address) => ({
      label: address.label || "Saved address",
      street: address.street || "",
      city: address.city || "Vizianagaram",
      state: address.state || "Andhra Pradesh",
      zipCode: address.zipCode || "",
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
      isDefault: address.isDefault === true,
    }));

  const persistAddressesToProfile = async (nextAddresses, successMessage) => {
    const defaultAddress =
      nextAddresses.find((address) => address.isDefault) || nextAddresses[0];
    const profileAddress = defaultAddress
      ? {
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state || "Andhra Pradesh",
          zipCode: defaultAddress.zipCode,
          placeId: defaultAddress.placeId || "",
          latitude: Number.isFinite(Number(defaultAddress.latitude))
            ? Number(defaultAddress.latitude)
            : undefined,
          longitude: Number.isFinite(Number(defaultAddress.longitude))
            ? Number(defaultAddress.longitude)
            : undefined,
        }
      : user?.address || {};

    const payloadSavedAddresses = toSavedAddressPayload(nextAddresses);

    await dispatch(
      updateProfile({
        phone: formData.phone,
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    ).unwrap();

    setSavedAddresses(
      normalizeUserSavedAddresses({
        ...(user || {}),
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    );

    if (successMessage) {
      dispatch(showToast({ type: "success", message: successMessage }));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "deliveryMode") {
      setFormData((prev) => ({
        ...prev,
        deliveryMode: value,
        deliveryDateTime: value === "scheduled" ? prev.deliveryDateTime : "",
      }));
      if (value !== "scheduled") {
        setScheduledDeliveryDate("");
      }
      return;
    }

    if (name === "deliveryDate") {
      setScheduledDeliveryDate(value || "");
      setFormData((prev) => ({
        ...prev,
        deliveryDateTime: "",
      }));
      return;
    }

    if (name === "deliverySlotTime") {
      setFormData((prev) => ({
        ...prev,
        deliveryDateTime:
          scheduledDate && value ? `${scheduledDate}T${value}` : "",
      }));
      return;
    }

    if (name === "address" || name === "city" || name === "pincode") {
      setAddressMode("new");
      setEditingAddressId("");
      setSelectedAddressId("");
      setSaveAddressForNextTime(true);
      setAddressMeta({ placeId: "", latitude: null, longitude: null });
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === "couponCode" ? normalizeCouponCode(value) : value,
    }));
  };

  const applySelectedAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      phone: address.phone || prev.phone,
      address: address.street || prev.address,
      city: address.city || prev.city,
      pincode: address.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: address.placeId || "",
      latitude: Number.isFinite(Number(address.latitude))
        ? Number(address.latitude)
        : null,
      longitude: Number.isFinite(Number(address.longitude))
        ? Number(address.longitude)
        : null,
    });
  };

  const handleSavedAddressSelect = (address) => {
    setAddressMode("saved");
    setEditingAddressId("");
    setSelectedAddressId(address.id);
    applySelectedAddress(address);
    setSaveAddressForNextTime(false);
  };

  const handleStartNewAddress = () => {
    setAddressMode("new");
    setEditingAddressId("");
    setSelectedAddressId("");
    setAddressQuery("");
    setAddressMeta({ placeId: "", latitude: null, longitude: null });
    setFormData((prev) => ({
      ...prev,
      address: "",
      pincode: "",
    }));
    setSaveAddressForNextTime(true);
  };

  const handleEditSavedAddress = (address) => {
    setAddressMode("edit");
    setEditingAddressId(address.id);
    setSelectedAddressId("");
    applySelectedAddress(address);
    setAddressLabel(address.label || "Home");
    setAddressQuery(address.formattedAddress || "");
    setSaveAddressForNextTime(true);
  };

  const handleDeleteSavedAddress = async (addressId) => {
    const nextAddresses = savedAddresses.filter(
      (entry) => entry.id !== addressId,
    );

    if (
      nextAddresses.length > 0 &&
      !nextAddresses.some((address) => address.isDefault)
    ) {
      nextAddresses[0] = {
        ...nextAddresses[0],
        isDefault: true,
      };
    }

    try {
      await persistAddressesToProfile(nextAddresses, "Address deleted.");

      if (selectedAddressId === addressId) {
        const fallback =
          nextAddresses.find((entry) => entry.isDefault) || nextAddresses[0];
        if (fallback) {
          handleSavedAddressSelect(fallback);
        } else {
          handleStartNewAddress();
        }
      }
    } catch (error) {
      dispatch(
        showToast({
          type: "error",
          message: error?.message || "Failed to delete address.",
        }),
      );
    }
  };

  const handleSaveAddress = async (addressData) => {
    const normalizedAddress = {
      id: editingAddressId || `saved-${Date.now()}`,
      label: addressData.label || "Saved address",
      street: addressData.street,
      city: addressData.city,
      state: addressData.state || "Andhra Pradesh",
      zipCode: addressData.zipCode,
      phone: addressData.phone,
      landmark: addressData.landmark || "",
      placeId: addressData.placeId || "",
      latitude: Number(addressData.latitude),
      longitude: Number(addressData.longitude),
      formattedAddress: addressData.formattedAddress || "",
      isDefault: true,
    };

    // Update form data with the saved address
    setFormData((prev) => ({
      ...prev,
      phone: addressData.phone || prev.phone,
      address: addressData.street || prev.address,
      city: addressData.city || prev.city,
      pincode: addressData.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: addressData.placeId || "",
      latitude: Number(addressData.latitude),
      longitude: Number(addressData.longitude),
    });
    setAddressLabel(addressData.label || "Home");
    setAddressQuery(addressData.formattedAddress || "");

    let nextAddresses;
    if (editingAddressId) {
      nextAddresses = savedAddresses.map((address) =>
        address.id === editingAddressId
          ? normalizedAddress
          : { ...address, isDefault: false },
      );
    } else {
      nextAddresses = [
        ...savedAddresses.map((address) => ({ ...address, isDefault: false })),
        normalizedAddress,
      ];
    }

    try {
      await persistAddressesToProfile(
        nextAddresses,
        editingAddressId ? "Address updated." : "Address saved.",
      );
      setSelectedAddressId(normalizedAddress.id);
      setAddressMode("saved");
      setEditingAddressId("");
      setSaveAddressForNextTime(false);
    } catch (error) {
      dispatch(
        showToast({
          type: "error",
          message: error?.message || "Failed to save address.",
        }),
      );
    }
  };

  const handleCancelAddressModal = () => {
    setAddressMode("saved");
    setEditingAddressId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!checkoutItems.length || invalidItems.length > 0 || pricing.couponError)
      return;

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
      const normalizedStreet = formData.address.trim();
      const normalizedCity = formData.city.trim();
      const normalizedPincode = formData.pincode.trim();
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
          formattedAddress: addressQuery || "",
          isDefault: true,
        });
      } else if (saveAddressForNextTime && !isAlreadySaved) {
        normalizedSavedAddresses.forEach((a) => {
          a.isDefault = false;
        });
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
          formattedAddress: addressQuery || "",
          isDefault: true,
        });
      }

      const checkoutPayload = {
        items: checkoutItems.map((item) => ({
          product: item.product._id,
          quantity: Number(item.quantity),
          size: item.selectedWeight,
          flavor: item.selectedFlavor,
          eggType: item.selectedEggType || "",
          price: item.unitPrice,
        })),
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
          formattedAddress: addressQuery || "",
        },
        deliveryMode: formData.deliveryMode,
        deliveryDateTime:
          formData.deliveryMode === "scheduled"
            ? formData.deliveryDateTime
            : null,
        paymentMethod: formData.paymentMethod,
        couponCode: normalizeCouponCode(formData.couponCode),
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

      if (formData.paymentMethod !== "cash") {
        const pendingCheckout = {
          orderData: checkoutPayload,
          pricing,
          freeDeliveryProgress,
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
        return;
      }

      await dispatch(createOrder(checkoutPayload)).unwrap();
      dispatch(clearCart());
      dispatch(
        showToast({ message: "Order placed successfully.", type: "success" }),
      );
      setOrderSuccess(true);
    } catch (submitError) {
      const errorMessage =
        submitError?.error || submitError?.message || "Failed to create order";
      console.error("Order failed:", errorMessage);
      dispatch(
        showToast({
          message: errorMessage,
          type: "error",
        }),
      );
    }
  };

  if (!checkoutItems.length) {
    return (
      <div className="commerce-page--empty">
        <div className="commerce-empty-shell">
          <div className="commerce-empty-card">
            <p className="commerce-kicker">Checkout</p>
            <h1 className="mt-4 text-4xl font-black text-primary-800">
              Your cart has no items to checkout
            </h1>
            <p className="commerce-copy mt-4">
              Add items from the menu first, then return here to place the
              order.
            </p>
            <Link to="/menu" className="btn-primary mt-8">
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="commerce-page--success flex items-center justify-center">
        <div className="commerce-success-card">
          <div className="commerce-success-icon">
            <svg
              className="h-10 w-10 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-black text-primary-800">
            Order placed successfully
          </h2>
          <p className="mt-3 text-primary-600">
            Your full cart was converted into one order with all selected
            flavors, weights, and quantities.
          </p>
          <div className="commerce-success-box">
            <p className="commerce-price-kicker">Order total</p>
            <p className="mt-2 text-3xl font-black text-primary-300">
              Rs.{pricing.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-primary mt-8 w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page commerce-page--checkout">
      <div className="commerce-shell">
        <div className="mb-10 text-center">
          <p className="commerce-kicker">Checkout</p>
          <h1 className="commerce-title">
            Place one order for your whole cart
          </h1>
          <p className="commerce-copy">
            Review your products, confirm delivery, and finish checkout like a
            standard store flow.
          </p>
        </div>

        <div className="commerce-stepper">
          {stepLabels.map((label, index) => {
            const currentStep = index + 1;
            return (
              <React.Fragment key={label}>
                <div className="commerce-step">
                  <div
                    className={`commerce-step-circle ${
                      step >= currentStep
                        ? "commerce-step-circle--active"
                        : "commerce-step-circle--inactive"
                    }`}
                  >
                    {currentStep}
                  </div>
                  <span
                    className={`commerce-step-label ${
                      step >= currentStep
                        ? "commerce-step-label--active"
                        : "commerce-step-label--inactive"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {currentStep < stepLabels.length && (
                  <div
                    className={`commerce-step-line ${
                      step > currentStep
                        ? "commerce-step-line--active"
                        : "commerce-step-line--inactive"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="commerce-grid">
            <div className="commerce-section">
              {step === 1 && (
                <OrderReviewStep
                  checkoutItems={checkoutItems}
                  invalidItems={invalidItems}
                />
              )}
              {step === 2 && (
                <>
                  <OrderDeliveryStep
                    formData={formData}
                    normalizedDeliverySettings={normalizedDeliverySettings}
                    minimumScheduleDate={minimumScheduleDate}
                    scheduledDate={scheduledDate}
                    scheduledSlotStart={scheduledSlotStart}
                    availableScheduledSlots={availableScheduledSlots}
                    scheduleAvailabilityReason={scheduleAvailabilityReason}
                    nowAvailabilityReason={nowAvailabilityReason}
                    pauseUntilLabel={pauseUntilLabel}
                    pricing={pricing}
                    availableCoupons={availableCoupons}
                    onChange={handleChange}
                    onBack={() => setStep(1)}
                  />
                  <OrderAddressStep
                    savedAddresses={savedAddresses}
                    addressMode={addressMode}
                    editingAddressId={editingAddressId}
                    selectedAddressId={selectedAddressId}
                    addressLabel={addressLabel}
                    isAddressVerified={isAddressVerified}
                    distanceFromStoreKm={distanceFromStoreKm}
                    isAddressServiceable={isAddressServiceable}
                    maxDeliveryRadiusKm={maxDeliveryRadiusKm}
                    storeLocation={normalizedDeliverySettings.storeLocation}
                    addressLatitude={addressMeta.latitude}
                    addressLongitude={addressMeta.longitude}
                    hasConfiguredStoreLocation={hasConfiguredStoreLocation}
                    loading={loading}
                    error={error}
                    onSavedAddressSelect={handleSavedAddressSelect}
                    onStartNewAddress={handleStartNewAddress}
                    onEditSavedAddress={handleEditSavedAddress}
                    onDeleteSavedAddress={handleDeleteSavedAddress}
                    onSaveAddress={handleSaveAddress}
                    onCancelAddressModal={handleCancelAddressModal}
                    onBack={() => setStep(1)}
                  />
                </>
              )}
            </div>

            <OrderSummary
              checkoutItems={checkoutItems}
              totalUnits={totalUnits}
              pricing={pricing}
              freeDeliveryProgress={freeDeliveryProgress}
              step={step}
              invalidItems={invalidItems}
              onNext={() => handleStepChange(2)}
              onBack={() => handleStepChange(1)}
              loading={loading}
              isAddressVerified={isAddressVerified}
              isAddressServiceable={isAddressServiceable}
              paymentMethod={formData.paymentMethod}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Order;
