import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "@/features/products/productSlice";
import { normalizeCouponCode } from "@/utils/orderPricing";
import OrderReviewStep from "@/user/components/order/OrderReviewStep";
import OrderDeliveryStep from "@/user/components/order/OrderDeliveryStep";
import OrderAddressStep from "@/user/components/order/OrderAddressStep";
import OrderSummary from "@/user/components/order/OrderSummary";
import { scrollToPageTop } from "./orderPageUtils";
import { useCheckoutAddressState } from "./useCheckoutAddressState";
import { useCheckoutDerivedData } from "./useCheckoutDerivedData";
import { useCheckoutSubmit } from "./useCheckoutSubmit";
import CheckoutStepper from "./CheckoutStepper";
import CheckoutEmptyState from "./CheckoutEmptyState";
import CheckoutSuccessState from "./CheckoutSuccessState";

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
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState("");
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
    maxDeliveryRadiusKm: derived.maxDeliveryRadiusKm,
    addressMeta: addressState.addressMeta,
    addressLabel: addressState.addressLabel,
    addressQuery: addressState.addressQuery,
    saveAddressForNextTime: addressState.saveAddressForNextTime,
    editingAddressId: addressState.editingAddressId,
    savedAddresses: addressState.savedAddresses,
    selectedAddressId: addressState.selectedAddressId,
    freeDeliveryProgress: derived.freeDeliveryProgress,
    setOrderSuccess,
  });

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
    } catch {
      // Shared helper emits error toast.
    }
  };

  if (!derived.checkoutItems.length) {
    return <CheckoutEmptyState />;
  }

  if (orderSuccess) {
    return (
      <CheckoutSuccessState
        totalAmount={derived.pricing.totalAmount}
        onBackHome={() => navigate("/")}
      />
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

        <CheckoutStepper step={step} />

        <form onSubmit={handleSubmit}>
          <div className="commerce-grid">
            <div className="commerce-section">
              {step === 1 && (
                <OrderReviewStep
                  checkoutItems={derived.checkoutItems}
                  invalidItems={derived.invalidItems}
                />
              )}

              {step === 2 && (
                <>
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
                    onBack={() => setStep(1)}
                  />

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
                    onCancelAddressModal={() => {
                      addressState.setAddressMode("saved");
                      addressState.setEditingAddressId("");
                    }}
                    onBack={() => setStep(1)}
                  />
                </>
              )}
            </div>

            <OrderSummary
              checkoutItems={derived.checkoutItems}
              totalUnits={derived.totalUnits}
              pricing={derived.pricing}
              freeDeliveryProgress={derived.freeDeliveryProgress}
              step={step}
              invalidItems={derived.invalidItems}
              onNext={() => setStep(2)}
              onBack={() => setStep(1)}
              loading={loading}
              isAddressVerified={derived.isAddressVerified}
              isAddressServiceable={derived.isAddressServiceable}
              paymentMethod={formData.paymentMethod}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Order;
