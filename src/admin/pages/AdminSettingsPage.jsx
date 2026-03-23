import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionButton } from "@/shared/ui/Primitives";
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
    handleCopyCoordinates,
    handleCopyMapsLink,
    handleCopyDeliveryConfig,
    handleDownloadDeliveryConfig,
    handleResetToVizianagaram,
    handleSaveSettings,
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

  return (
    <div className="space-y-8">
      <PaymentGatewayStatusSection paymentStatus={paymentStatus} />

      <AlertEmailStatusSection
        alertStatus={alertStatus}
        onSendTestEmail={handleSendTestEmail}
      />

      <BusinessInfoSection
        businessInfo={businessInfo}
        onChange={handleBusinessChange}
      />

      <StoreHoursSection storeHours={storeHours} onChange={handleHoursChange} />

      <SocialLinksSection
        socialLinks={socialLinks}
        onChange={handleLinksChange}
      />

      <AdminSettingsDeliverySection
        deliverySettings={deliverySettings}
        onDeliverySettingsChange={handleDeliverySettingsChange}
        onStoreLocationSelect={handleStoreLocationSelect}
        onUseCurrentStoreLocation={handleUseCurrentStoreLocation}
        onCopyCoordinates={handleCopyCoordinates}
        onCopyMapsLink={handleCopyMapsLink}
        onCopyDeliveryConfig={handleCopyDeliveryConfig}
        onDownloadDeliveryConfig={handleDownloadDeliveryConfig}
        onResetToVizianagaram={handleResetToVizianagaram}
      />

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
