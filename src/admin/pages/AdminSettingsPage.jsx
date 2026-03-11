import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../components/ui/Primitives";
import {
  fetchAlertStatus,
  fetchPaymentStatus,
  sendTestAlertEmail,
  updateSiteSettings,
} from "../../features/site/siteSlice";
import { getErrorMessage } from "./adminShared";
import CouponManager from "../components/CouponManager";
import StoreLocationPicker from "../components/StoreLocationPicker";

const VIZIANAGARAM_DEFAULT_COORDS = {
  lat: 18.1067,
  lng: 83.3956,
};

const createEmptyCoupon = () => ({
  code: "",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  maxDiscount: "",
  description: "",
  isActive: true,
});

const normalizeCouponPayload = (coupon) => ({
  ...coupon,
  code: String(coupon.code || "")
    .trim()
    .toUpperCase(),
  value: Number(coupon.value) || 0,
  minSubtotal: Number(coupon.minSubtotal) || 0,
  maxDiscount:
    coupon.maxDiscount === "" || coupon.maxDiscount === null
      ? undefined
      : Number(coupon.maxDiscount) || 0,
});

const AdminSettingsPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const {
    businessInfo: savedBusinessInfo,
    storeHours: savedStoreHours,
    socialLinks: savedSocialLinks,
    deliverySettings: savedDeliverySettings,
    coupons: savedCoupons,
    alertStatus,
    paymentStatus,
    saving,
  } = useSelector((state) => state.site);

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

  useEffect(() => {
    dispatch(fetchAlertStatus());
    dispatch(fetchPaymentStatus());
  }, [dispatch]);

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

  const handleStoreLocationSelect = (lat, lng) => {
    setDeliverySettings((currentValue) => ({
      ...currentValue,
      storeLocation: {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      },
    }));
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

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    try {
      await navigator.clipboard.writeText(mapsUrl);
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

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const payload = [
      `Delivery enabled: ${deliverySettings.enabled !== false ? "yes" : "no"}`,
      `Delivery radius (km): ${
        Number.isFinite(radius) && radius >= 0 ? radius : "N/A"
      }`,
      `Store latitude: ${lat}`,
      `Store longitude: ${lng}`,
      `Google Maps: ${mapsUrl}`,
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

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
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
      `Google Maps: ${mapsUrl}`,
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

  return (
    <div className="space-y-8">
      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Gateway Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Online UPI and card payments use Razorpay. Cash on delivery stays
              enabled even if online keys are missing.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Gateway
            </p>
            <p className="mt-2 text-sm font-semibold uppercase text-gray-900">
              {paymentStatus.gateway || "razorpay"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Online Payments
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${paymentStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
            >
              {paymentStatus.configured ? "Ready" : "Keys missing"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Key ID
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-gray-900">
              {paymentStatus.keyIdPreview || "Not configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Methods
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {(paymentStatus.supportedMethods || []).join(", ").toUpperCase()}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Alert Email Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pending orders trigger an immediate alert email and then repeat
              every {alertStatus.reminderIntervalMinutes || 5} minutes until
              accepted.
            </p>
          </div>
          <ActionButton
            type="button"
            onClick={handleSendTestEmail}
            variant="secondary"
          >
            Send Test Email
          </ActionButton>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              SMTP
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${alertStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
            >
              {alertStatus.configured ? "Configured" : "Not configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Recipient
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-gray-900">
              {alertStatus.recipient || "No recipient configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              From
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-gray-900">
              {alertStatus.from || "Not configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Pending Orders
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {alertStatus.pendingOrderCount || 0}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Business Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Store Name
            </label>
            <input
              name="storeName"
              value={businessInfo.storeName}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Established Year
            </label>
            <input
              type="number"
              min="1900"
              name="establishedYear"
              value={businessInfo.establishedYear ?? ""}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Support Email
            </label>
            <input
              name="email"
              value={businessInfo.email}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              name="phone"
              value={businessInfo.phone}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              rows={2}
              value={businessInfo.address}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Welcome Message
            </label>
            <textarea
              name="intro"
              rows={3}
              value={businessInfo.intro}
              onChange={handleBusinessChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Store Hours
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weekdays
            </label>
            <input
              name="weekdays"
              value={storeHours.weekdays}
              onChange={handleHoursChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weekends
            </label>
            <input
              name="weekends"
              value={storeHours.weekends}
              onChange={handleHoursChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Social Links
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instagram
            </label>
            <input
              name="instagram"
              value={socialLinks.instagram}
              onChange={handleLinksChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Facebook
            </label>
            <input
              name="facebook"
              value={socialLinks.facebook}
              onChange={handleLinksChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              WhatsApp
            </label>
            <input
              name="whatsapp"
              value={socialLinks.whatsapp}
              onChange={handleLinksChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery Coverage
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure store GPS location and delivery radius used for checkout
              serviceability checks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              type="button"
              onClick={handleUseCurrentStoreLocation}
              variant="secondary"
            >
              Use Current Browser Location
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleCopyCoordinates}
              variant="soft"
            >
              Copy Lat/Lng
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleCopyMapsLink}
              variant="soft"
            >
              Copy Maps Link
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleCopyDeliveryConfig}
              variant="soft"
            >
              Copy Delivery Config
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleDownloadDeliveryConfig}
              variant="success"
            >
              Download Delivery Config
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleResetToVizianagaram}
              variant="soft"
            >
              Reset to Vizianagaram
            </ActionButton>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700">
              Delivery Enabled
            </span>
            <input
              type="checkbox"
              name="enabled"
              checked={deliverySettings.enabled !== false}
              onChange={handleDeliverySettingsChange}
              className="mt-3 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700">
              Max Radius (km)
            </span>
            <input
              type="number"
              min="0"
              step="0.1"
              name="maxDeliveryRadiusKm"
              value={deliverySettings.maxDeliveryRadiusKm ?? ""}
              onChange={handleDeliverySettingsChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700">
              Store Latitude
            </span>
            <input
              type="number"
              step="0.000001"
              name="storeLat"
              value={deliverySettings.storeLocation?.lat ?? ""}
              onChange={handleDeliverySettingsChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700">
              Store Longitude
            </span>
            <input
              type="number"
              step="0.000001"
              name="storeLng"
              value={deliverySettings.storeLocation?.lng ?? ""}
              onChange={handleDeliverySettingsChange}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
          </label>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-gray-700">
            Click on the map to set store location and preview delivery radius
          </p>
          <StoreLocationPicker
            lat={deliverySettings.storeLocation?.lat}
            lng={deliverySettings.storeLocation?.lng}
            radiusKm={deliverySettings.maxDeliveryRadiusKm}
            onPickLocation={handleStoreLocationSelect}
          />
        </div>

        {Number.isFinite(Number(deliverySettings.storeLocation?.lat)) &&
          Number.isFinite(Number(deliverySettings.storeLocation?.lng)) && (
            <div className="mt-4">
              <a
                href={`https://maps.google.com/?q=${deliverySettings.storeLocation.lat},${deliverySettings.storeLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-pink-600 hover:text-pink-700"
              >
                Open Store Location in Maps
              </a>
            </div>
          )}
      </SurfaceCard>

      <CouponManager
        coupons={coupons}
        onCouponChange={handleCouponChange}
        onAddCoupon={handleAddCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />

      <div className="mt-6">
        <ActionButton
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </ActionButton>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
