import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "@/features/products/productSlice";
import { normalizeCouponCode } from "@/utils/orderPricing";
import OrderDeliveryStep from "@/user/components/order/OrderDeliveryStep";
import OrderAddressStep from "@/user/components/order/OrderAddressStep";
import { scrollToPageTop } from "./orderPageUtils";
import { useCheckoutAddressState } from "./useCheckoutAddressState";
import { useCheckoutDerivedData } from "./useCheckoutDerivedData";
import { useCheckoutSubmit } from "./useCheckoutSubmit";
import CheckoutEmptyState from "./CheckoutEmptyState";
import { getPendingCheckout } from "./paymentHelpers";

const getRestorableSpecialInstructions = (pendingCheckout) => {
  const savedValue = pendingCheckout?.checkoutForm?.formData?.specialInstructions;
  if (savedValue !== undefined) {
    return savedValue;
  }

  return String(pendingCheckout?.orderData?.specialInstructions || "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(
      (entry) =>
        entry &&
        !/^contact name:/i.test(entry) &&
        !/^phone:/i.test(entry),
    )
    .join(" | ");
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

  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState("");
  const [hasRestoredCheckout, setHasRestoredCheckout] = useState(false);
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

  const addressState = useCheckoutAddressState({
    user,
    formData,
    setFormData,
    selectedAddressFromState: location.state?.selectedAddressId,
    dispatch,
  });

  const derived = useCheckoutDerivedData({
    items,
    coupons,
    deliverySettings,
    formData,
    scheduledDeliveryDate,
    setFormData,
    addressMeta: addressState.addressMeta,
  });

  const { handleSubmit } = useCheckoutSubmit({
    dispatch,
    navigate,
    user,
    formData,
    checkoutItems: derived.checkoutItems,
    invalidItems: derived.invalidItems,
    pricing: derived.pricing,
    scheduledDate: derived.scheduledDate,
    scheduledSlotStart: derived.scheduledSlotStart,
    availableScheduledSlots: derived.availableScheduledSlots,
    scheduleAvailabilityReason: derived.scheduleAvailabilityReason,
    nowAvailabilityReason: derived.nowAvailabilityReason,
    hasConfiguredStoreLocation: derived.hasConfiguredStoreLocation,
    isAddressVerified: derived.isAddressVerified,
    isAddressServiceable: derived.isAddressServiceable,
    deliveryDistanceKm: derived.distanceFromStoreKm,
    maxDeliveryRadiusKm: derived.maxDeliveryRadiusKm,
    addressMeta: addressState.addressMeta,
    addressLabel: addressState.addressLabel,
    addressQuery: addressState.addressQuery,
    saveAddressForNextTime: addressState.saveAddressForNextTime,
    editingAddressId: addressState.editingAddressId,
    savedAddresses: addressState.savedAddresses,
    selectedAddressId: addressState.selectedAddressId,
    freeDeliveryProgress: derived.freeDeliveryProgress,
    availableCoupons: derived.availableCoupons,
    loading,
  });

  useEffect(() => {
    scrollToPageTop();
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (hasRestoredCheckout) {
      return;
    }

    setHasRestoredCheckout(true);

    const pendingCheckout = getPendingCheckout(location.state);
    if (!pendingCheckout?.orderData) {
      return;
    }

    const checkoutForm = pendingCheckout.checkoutForm || {};
    const savedFormData = checkoutForm.formData || {};
    const deliveryAddress = pendingCheckout.orderData.deliveryAddress || {};
    const restoredDeliveryDateTime =
      savedFormData.deliveryDateTime ||
      pendingCheckout.orderData.deliveryDateTime ||
      "";
    const restoredFormattedAddress =
      checkoutForm.addressMeta?.formattedAddress ||
      deliveryAddress.formattedAddress ||
      "";
    const restoredPaymentMethod =
      savedFormData.paymentMethod || pendingCheckout.orderData.paymentMethod || "";
    const restoredCouponCode = normalizeCouponCode(
      pendingCheckout.orderData.couponCode || savedFormData.couponCode || "",
    );

    setFormData((prev) => ({
      ...prev,
      deliveryMode:
        savedFormData.deliveryMode ||
        pendingCheckout.orderData.deliveryMode ||
        prev.deliveryMode,
      deliveryDateTime: restoredDeliveryDateTime,
      paymentMethod: restoredPaymentMethod,
      specialInstructions: getRestorableSpecialInstructions(pendingCheckout),
      name:
        savedFormData.name ||
        pendingCheckout.customer?.name ||
        prev.name ||
        "",
      phone:
        savedFormData.phone ||
        pendingCheckout.customer?.phone ||
        deliveryAddress.phone ||
        prev.phone ||
        "",
      address: savedFormData.address || deliveryAddress.street || prev.address,
      city: savedFormData.city || deliveryAddress.city || prev.city,
      pincode:
        savedFormData.pincode || deliveryAddress.zipCode || prev.pincode,
      couponCode: restoredCouponCode,
      clientOrderRequestId:
        savedFormData.clientOrderRequestId ||
        pendingCheckout.orderData.clientOrderRequestId ||
        prev.clientOrderRequestId,
    }));

    setScheduledDeliveryDate(
      checkoutForm.scheduledDeliveryDate ||
        (restoredDeliveryDateTime.includes("T")
          ? restoredDeliveryDateTime.split("T")[0]
          : ""),
    );

    addressState.setEditingAddressId("");
    addressState.setSelectedAddressId(checkoutForm.selectedAddressId || "");
    addressState.setSaveAddressForNextTime(
      checkoutForm.saveAddressForNextTime === true,
    );
    addressState.setAddressMode(
      checkoutForm.selectedAddressId ? "saved" : checkoutForm.addressMode || "new",
    );
    addressState.setAddressLabel(
      checkoutForm.addressLabel || deliveryAddress.label || "Home",
    );
    addressState.setAddressMeta({
      placeId: checkoutForm.addressMeta?.placeId || deliveryAddress.placeId || "",
      latitude: Number.isFinite(Number(checkoutForm.addressMeta?.latitude))
        ? Number(checkoutForm.addressMeta.latitude)
        : Number.isFinite(Number(deliveryAddress.lat))
          ? Number(deliveryAddress.lat)
          : null,
      longitude: Number.isFinite(Number(checkoutForm.addressMeta?.longitude))
        ? Number(checkoutForm.addressMeta.longitude)
        : Number.isFinite(Number(deliveryAddress.lng))
          ? Number(deliveryAddress.lng)
          : null,
      formattedAddress: restoredFormattedAddress,
    });
    addressState.setAddressQuery(
      checkoutForm.addressQuery ||
        restoredFormattedAddress ||
        [deliveryAddress.street, deliveryAddress.city, deliveryAddress.zipCode]
          .filter(Boolean)
          .join(", "),
    );
  }, [addressState, hasRestoredCheckout, location.state]);

  useEffect(() => {
    if (formData.deliveryMode !== "scheduled") {
      return;
    }
    if (!scheduledDeliveryDate && formData.deliveryDateTime.includes("T")) {
      setScheduledDeliveryDate(formData.deliveryDateTime.split("T")[0]);
    }
  }, [formData.deliveryDateTime, formData.deliveryMode, scheduledDeliveryDate]);

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
      setFormData((prev) => ({ ...prev, deliveryDateTime: "" }));
      return;
    }

    if (name === "deliverySlotTime") {
      setFormData((prev) => ({
        ...prev,
        deliveryDateTime:
          derived.scheduledDate && value
            ? `${derived.scheduledDate}T${value}`
            : "",
      }));
      return;
    }

    if (name === "address" || name === "city" || name === "pincode") {
      addressState.setAddressMode("new");
      addressState.setEditingAddressId("");
      addressState.setSelectedAddressId("");
      addressState.setSaveAddressForNextTime(true);
      addressState.setAddressMeta({
        placeId: "",
        latitude: null,
        longitude: null,
        formattedAddress: "",
      });
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "couponCode" ? normalizeCouponCode(value) : value,
    }));
  };

  const handleSaveAddress = async (addressData) => {
    const normalizedAddress = {
      id: addressState.editingAddressId || `saved-${Date.now()}`,
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

    setFormData((prev) => ({
      ...prev,
      phone: addressData.phone || prev.phone,
      address: addressData.street || prev.address,
      city: addressData.city || prev.city,
      pincode: addressData.zipCode || prev.pincode,
    }));

    addressState.setAddressMeta({
      placeId: addressData.placeId || "",
      latitude: Number(addressData.latitude),
      longitude: Number(addressData.longitude),
      formattedAddress: addressData.formattedAddress || "",
    });
    addressState.setAddressLabel(addressData.label || "Home");
    addressState.setAddressQuery(addressData.formattedAddress || "");

    const nextAddresses = addressState.editingAddressId
      ? addressState.savedAddresses.map((address) =>
          address.id === addressState.editingAddressId
            ? normalizedAddress
            : { ...address, isDefault: false },
        )
      : [
          ...addressState.savedAddresses.map((address) => ({
            ...address,
            isDefault: false,
          })),
          normalizedAddress,
        ];

    try {
      await addressState.persistAddressesToProfile(
        nextAddresses,
        addressState.editingAddressId ? "Address updated." : "Address saved.",
      );
      addressState.setSelectedAddressId(normalizedAddress.id);
      addressState.setAddressMode("saved");
      addressState.setEditingAddressId("");
      addressState.setSaveAddressForNextTime(false);
      addressState.handleAddressModalClose("saved");
    } catch {
      addressState.handleAddressModalClose("cancel");
      // Shared helper emits error toast.
    }
  };

  if (!derived.checkoutItems.length) {
    return <CheckoutEmptyState />;
  }

  return (
    <div className="commerce-page commerce-page--checkout">
      <div className="commerce-shell max-w-5xl">
        <div className="mb-10 text-center">
          <p className="commerce-kicker">Delivery Details</p>
          <h1 className="commerce-title">
            Address, delivery, and payment setup
          </h1>
          <p className="commerce-copy">
            Final item review, coupon, and full bill summary are on the next
            page.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="commerce-section">
            <div className="space-y-8">
              <div className="rounded-3xl border border-primary-200 bg-white shadow-sm">
                <OrderDeliveryStep
                  formData={formData}
                  normalizedDeliverySettings={
                    derived.normalizedDeliverySettings
                  }
                  minimumScheduleDate={derived.minimumScheduleDate}
                  scheduledDate={derived.scheduledDate}
                  scheduledSlotStart={derived.scheduledSlotStart}
                  availableScheduledSlots={derived.availableScheduledSlots}
                  scheduleAvailabilityReason={
                    derived.scheduleAvailabilityReason
                  }
                  nowAvailabilityReason={derived.nowAvailabilityReason}
                  pauseUntilLabel={derived.pauseUntilLabel}
                  pricing={derived.pricing}
                  availableCoupons={derived.availableCoupons}
                  onChange={handleChange}
                  onBack={() => {}}
                />
              </div>

              <div className="rounded-3xl border border-primary-200 bg-white shadow-sm">
                <OrderAddressStep
                  savedAddresses={addressState.savedAddresses}
                  addressMode={addressState.addressMode}
                  editingAddressId={addressState.editingAddressId}
                  selectedAddressId={addressState.selectedAddressId}
                  addressLabel={addressState.addressLabel}
                  isAddressVerified={derived.isAddressVerified}
                  distanceFromStoreKm={derived.distanceFromStoreKm}
                  isAddressServiceable={derived.isAddressServiceable}
                  maxDeliveryRadiusKm={derived.maxDeliveryRadiusKm}
                  storeLocation={
                    derived.normalizedDeliverySettings.storeLocation
                  }
                  addressLatitude={addressState.addressMeta.latitude}
                  addressLongitude={addressState.addressMeta.longitude}
                  hasConfiguredStoreLocation={
                    derived.hasConfiguredStoreLocation
                  }
                  loading={loading}
                  error={error}
                  onSavedAddressSelect={addressState.handleSavedAddressSelect}
                  onStartNewAddress={addressState.handleStartNewAddress}
                  onEditSavedAddress={addressState.handleEditSavedAddress}
                  onDeleteSavedAddress={addressState.handleDeleteSavedAddress}
                  onSaveAddress={handleSaveAddress}
                  onCancelAddressModal={addressState.handleAddressModalClose}
                  onBack={() => {}}
                  hideBackAction
                />
              </div>

              <div className="border-t border-primary-200 px-6 pb-6 pt-4 sm:px-8">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (derived.invalidItems?.length ?? 0) > 0 ||
                    !derived.isAddressVerified ||
                    !derived.isAddressServiceable
                  }
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Final Review
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Order;
