import React from "react";
import { useDispatch, useSelector } from "react-redux";
import CouponManager from "../components/CouponManager";
import {
  AlertEmailStatusSection,
  PaymentGatewayStatusSection,
} from "./AdminSettingsStatusSections";
import {
  BusinessInfoSection,
  SocialLinksSection,
  StoreHoursSection,
} from "./AdminSettingsInfoSections";
import { AdminSettingsDeliverySection } from "./AdminSettingsDeliverySection";
import { useAdminSettingsState } from "./useAdminSettingsState";
import { useAdminSettingsActions } from "./useAdminSettingsActions";

const AdminSettingsPage = ({ onToast, syncVersion = 0 }) => {
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

  const {
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
  } = useAdminSettingsState({
    savedBusinessInfo,
    savedStoreHours,
    savedSocialLinks,
    savedDeliverySettings,
    savedCoupons,
  });

  const {
    handleUseCurrentStoreLocation,
    handleCopyMapsLink,
    handleCopyDeliveryConfig,
    handleDownloadDeliveryConfig,
    handleResetToVizianagaram,
    handleSaveBusinessInfo,
    handleSaveStoreHours,
    handleSaveSocialLinks,
    handleSaveDeliverySettings,
    handleSaveCoupons,
    handleSendTestEmail,
  } = useAdminSettingsActions({
    dispatch,
    onToast,
    businessInfo,
    storeHours,
    socialLinks,
    deliverySettings,
    setDeliverySettings,
    coupons,
  });

  // Keep prop consumption explicit for realtime sync re-rendering.
  const renderSyncVersion = syncVersion;

  return (
    <div className="space-y-8" data-sync-version={renderSyncVersion}>
      <PaymentGatewayStatusSection paymentStatus={paymentStatus} />

      <AlertEmailStatusSection
        alertStatus={alertStatus}
        onSendTestEmail={handleSendTestEmail}
      />

      <BusinessInfoSection
        businessInfo={businessInfo}
        onChange={handleBusinessChange}
        onSave={handleSaveBusinessInfo}
        saving={saving}
      />

      <StoreHoursSection
        storeHours={storeHours}
        onChange={handleHoursChange}
        onSave={handleSaveStoreHours}
        saving={saving}
      />

      <SocialLinksSection
        socialLinks={socialLinks}
        onChange={handleLinksChange}
        onSave={handleSaveSocialLinks}
        saving={saving}
      />

      <AdminSettingsDeliverySection
        deliverySettings={deliverySettings}
        onDeliverySettingsChange={handleDeliverySettingsChange}
        onStoreLocationSelect={handleStoreLocationSelect}
        onUseCurrentStoreLocation={handleUseCurrentStoreLocation}
        onCopyMapsLink={handleCopyMapsLink}
        onCopyDeliveryConfig={handleCopyDeliveryConfig}
        onDownloadDeliveryConfig={handleDownloadDeliveryConfig}
        onResetToVizianagaram={handleResetToVizianagaram}
        onSave={handleSaveDeliverySettings}
        saving={saving}
      />

      <CouponManager
        coupons={coupons}
        onCouponChange={handleCouponChange}
        onAddCoupon={handleAddCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        onSave={handleSaveCoupons}
        saving={saving}
      />
    </div>
  );
};

export default AdminSettingsPage;
