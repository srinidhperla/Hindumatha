import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";

export const BusinessInfoSection = ({
  businessInfo,
  onChange,
  onSave,
  saving,
}) => {
  return (
    <SurfaceCard className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#1f1709]">
          Business Information
        </h2>
        <ActionButton type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Business Info"}
        </ActionButton>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Store Name
          </label>
          <input
            name="storeName"
            value={businessInfo.storeName}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Established Year
          </label>
          <input
            type="number"
            min="1900"
            name="establishedYear"
            value={businessInfo.establishedYear ?? ""}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Support Email
          </label>
          <input
            name="email"
            value={businessInfo.email}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Contact Number
          </label>
          <input
            name="phone"
            value={businessInfo.phone}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#5c4a26]">
            Address
          </label>
          <textarea
            name="address"
            rows={2}
            value={businessInfo.address}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#5c4a26]">
            Welcome Message
          </label>
          <textarea
            name="intro"
            rows={3}
            value={businessInfo.intro}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};

export const StoreHoursSection = ({ storeHours, onChange, onSave, saving }) => {
  return (
    <SurfaceCard className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#1f1709]">Store Hours</h2>
        <ActionButton type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Store Hours"}
        </ActionButton>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Weekdays
          </label>
          <input
            name="weekdays"
            value={storeHours.weekdays}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Weekends
          </label>
          <input
            name="weekends"
            value={storeHours.weekends}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};

export const SocialLinksSection = ({
  socialLinks,
  onChange,
  onSave,
  saving,
}) => {
  return (
    <SurfaceCard className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#1f1709]">Social Links</h2>
        <ActionButton type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Social Links"}
        </ActionButton>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Instagram
          </label>
          <input
            name="instagram"
            value={socialLinks.instagram}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            Facebook
          </label>
          <input
            name="facebook"
            value={socialLinks.facebook}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5c4a26]">
            WhatsApp
          </label>
          <input
            name="whatsapp"
            value={socialLinks.whatsapp}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-[#ebe1cb] px-3 py-2 focus:border-[#c9a84c] focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};
