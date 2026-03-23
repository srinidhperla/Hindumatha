import { useEffect } from "react";
import {
  fetchAlertStatus,
  fetchPaymentStatus,
  sendTestAlertEmail,
  updateSiteSettings,
} from "@/features/site/siteSlice";
import { getErrorMessage } from "./adminShared";
import {
  buildMapsUrl,
  normalizeCouponPayload,
  VIZIANAGARAM_DEFAULT_COORDS,
} from "./adminSettingsUtils";

export const useAdminSettingsActions = ({
  dispatch,
  onToast,
  businessInfo,
  storeHours,
  socialLinks,
  deliverySettings,
  setDeliverySettings,
  coupons,
}) => {
  useEffect(() => {
    dispatch(fetchAlertStatus());
    dispatch(fetchPaymentStatus());
  }, [dispatch]);

  const handleUseCurrentStoreLocation = () => {
    if (!navigator.geolocation) {
      onToast("Browser geolocation is not supported.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliverySettings((currentValue) => ({
          ...currentValue,
          storeLocation: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          },
        }));
        onToast("Store location captured from browser GPS.");
      },
      () => {
        onToast("Could not fetch browser location.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCopyCoordinates = async () => {
    const lat = Number(deliverySettings.storeLocation?.lat);
    const lng = Number(deliverySettings.storeLocation?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      onToast("Set valid coordinates first.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      onToast("Coordinates copied.");
    } catch (error) {
      onToast("Failed to copy coordinates.", "error");
    }
  };

  const handleCopyMapsLink = async () => {
    const lat = Number(deliverySettings.storeLocation?.lat);
    const lng = Number(deliverySettings.storeLocation?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      onToast("Set valid coordinates first.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(buildMapsUrl(lat, lng));
      onToast("Google Maps link copied.");
    } catch (error) {
      onToast("Failed to copy Google Maps link.", "error");
    }
  };

  const handleCopyDeliveryConfig = async () => {
    const lat = Number(deliverySettings.storeLocation?.lat);
    const lng = Number(deliverySettings.storeLocation?.lng);
    const radius = Number(deliverySettings.maxDeliveryRadiusKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      onToast("Set valid coordinates first.", "error");
      return;
    }

    const payload = [
      `Delivery enabled: ${deliverySettings.enabled !== false ? "yes" : "no"}`,
      `Delivery radius (km): ${
        Number.isFinite(radius) && radius >= 0 ? radius : "N/A"
      }`,
      `Store latitude: ${lat}`,
      `Store longitude: ${lng}`,
      `Google Maps: ${buildMapsUrl(lat, lng)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      onToast("Delivery config copied.");
    } catch (error) {
      onToast("Failed to copy delivery config.", "error");
    }
  };

  const handleDownloadDeliveryConfig = () => {
    const lat = Number(deliverySettings.storeLocation?.lat);
    const lng = Number(deliverySettings.storeLocation?.lng);
    const radius = Number(deliverySettings.maxDeliveryRadiusKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      onToast("Set valid coordinates first.", "error");
      return;
    }

    const fileContent = [
      "Bakery Delivery Configuration",
      `Generated at: ${new Date().toLocaleString("en-IN")}`,
      "",
      `Delivery enabled: ${deliverySettings.enabled !== false ? "yes" : "no"}`,
      `Delivery radius (km): ${
        Number.isFinite(radius) && radius >= 0 ? radius : "N/A"
      }`,
      `Store latitude: ${lat}`,
      `Store longitude: ${lng}`,
      `Google Maps: ${buildMapsUrl(lat, lng)}`,
    ].join("\n");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `delivery-config-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    onToast("Delivery config downloaded.");
  };

  const handleResetToVizianagaram = () => {
    const parsedRadius = Number(deliverySettings.maxDeliveryRadiusKm);
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      storeLocation: {
        lat: VIZIANAGARAM_DEFAULT_COORDS.lat,
        lng: VIZIANAGARAM_DEFAULT_COORDS.lng,
      },
      maxDeliveryRadiusKm:
        Number.isFinite(parsedRadius) && parsedRadius >= 0 ? parsedRadius : 3,
    }));
    onToast("Store location reset to Vizianagaram default.");
  };

  const handleSaveSettings = async () => {
    const sanitizedCoupons = coupons
      .map((coupon) => normalizeCouponPayload(coupon))
      .filter((coupon) => coupon.code);

    const duplicateCodes = sanitizedCoupons.filter(
      (coupon, index, list) =>
        list.findIndex((entry) => entry.code === coupon.code) !== index,
    );

    if (duplicateCodes.length > 0) {
      onToast("Coupon codes must be unique.", "error");
      return;
    }

    const radius = Number(deliverySettings.maxDeliveryRadiusKm);
    const storeLat = Number(deliverySettings.storeLocation?.lat);
    const storeLng = Number(deliverySettings.storeLocation?.lng);

    if (!Number.isFinite(radius) || radius < 0) {
      onToast("Delivery radius must be a valid number.", "error");
      return;
    }

    if (!Number.isFinite(storeLat) || storeLat < -90 || storeLat > 90) {
      onToast("Store latitude must be between -90 and 90.", "error");
      return;
    }

    if (!Number.isFinite(storeLng) || storeLng < -180 || storeLng > 180) {
      onToast("Store longitude must be between -180 and 180.", "error");
      return;
    }

    try {
      await dispatch(
        updateSiteSettings({
          businessInfo,
          storeHours,
          socialLinks,
          deliverySettings: {
            ...deliverySettings,
            maxDeliveryRadiusKm: radius,
            storeLocation: {
              lat: storeLat,
              lng: storeLng,
            },
          },
          coupons: sanitizedCoupons,
        }),
      ).unwrap();
      onToast("Store settings saved successfully.");
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to save store settings."),
        "error",
      );
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const response = await dispatch(sendTestAlertEmail()).unwrap();
      onToast(response.message || "Test alert email sent.");
      dispatch(fetchAlertStatus());
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to send test alert email."),
        "error",
      );
    }
  };

  return {
    handleUseCurrentStoreLocation,
    handleCopyCoordinates,
    handleCopyMapsLink,
    handleCopyDeliveryConfig,
    handleDownloadDeliveryConfig,
    handleResetToVizianagaram,
    handleSaveSettings,
    handleSendTestEmail,
  };
};
