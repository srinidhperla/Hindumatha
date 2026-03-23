import { useEffect, useState } from "react";
import { createEmptyCoupon } from "./adminSettingsUtils";

export const useAdminSettingsState = ({
  savedBusinessInfo,
  savedStoreHours,
  savedSocialLinks,
  savedDeliverySettings,
  savedCoupons,
}) => {
  const [businessInfo, setBusinessInfo] = useState(savedBusinessInfo);
  const [storeHours, setStoreHours] = useState(savedStoreHours);
  const [socialLinks, setSocialLinks] = useState(savedSocialLinks);
  const [deliverySettings, setDeliverySettings] = useState(
    savedDeliverySettings,
  );
  const [coupons, setCoupons] = useState(savedCoupons);

  useEffect(() => {
    setBusinessInfo(savedBusinessInfo);
  }, [savedBusinessInfo]);

  useEffect(() => {
    setStoreHours(savedStoreHours);
  }, [savedStoreHours]);

  useEffect(() => {
    setSocialLinks(savedSocialLinks);
  }, [savedSocialLinks]);

  useEffect(() => {
    setDeliverySettings(savedDeliverySettings);
  }, [savedDeliverySettings]);

  useEffect(() => {
    setCoupons(savedCoupons);
  }, [savedCoupons]);

  const handleBusinessChange = (event) => {
    const { name, value } = event.target;
    setBusinessInfo((currentValue) => ({
      ...currentValue,
      [name]:
        name === "establishedYear"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleHoursChange = (event) => {
    const { name, value } = event.target;
    setStoreHours((currentValue) => ({ ...currentValue, [name]: value }));
  };

  const handleLinksChange = (event) => {
    const { name, value } = event.target;
    setSocialLinks((currentValue) => ({ ...currentValue, [name]: value }));
  };

  const handleDeliverySettingsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDeliverySettings((currentValue) => {
      if (name === "storeLat" || name === "storeLng") {
        return {
          ...currentValue,
          storeLocation: {
            lat:
              name === "storeLat"
                ? value === ""
                  ? ""
                  : Number(value)
                : Number(currentValue.storeLocation?.lat || 0),
            lng:
              name === "storeLng"
                ? value === ""
                  ? ""
                  : Number(value)
                : Number(currentValue.storeLocation?.lng || 0),
          },
        };
      }

      return {
        ...currentValue,
        [name]:
          type === "checkbox"
            ? checked
            : name === "maxDeliveryRadiusKm"
              ? value === ""
                ? ""
                : Number(value)
              : value,
      };
    });
  };

  const handleStoreLocationSelect = (lat, lng) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      storeLocation: {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      },
    }));
  };

  const handleCouponChange = (index, field, value) => {
    setCoupons((currentCoupons) =>
      currentCoupons.map((coupon, couponIndex) =>
        couponIndex === index ? { ...coupon, [field]: value } : coupon,
      ),
    );
  };

  const handleAddCoupon = () => {
    setCoupons((currentCoupons) => [...currentCoupons, createEmptyCoupon()]);
  };

  const handleRemoveCoupon = (index) => {
    setCoupons((currentCoupons) =>
      currentCoupons.filter((_, couponIndex) => couponIndex !== index),
    );
  };

  return {
    businessInfo,
    storeHours,
    socialLinks,
    deliverySettings,
    coupons,
    setDeliverySettings,
    handleBusinessChange,
    handleHoursChange,
    handleLinksChange,
    handleDeliverySettingsChange,
    handleStoreLocationSelect,
    handleCouponChange,
    handleAddCoupon,
    handleRemoveCoupon,
  };
};
