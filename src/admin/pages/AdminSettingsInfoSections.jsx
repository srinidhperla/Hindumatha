import React from "react";
import { SurfaceCard } from "@/shared/ui/Primitives";

export const BusinessInfoSection = ({ businessInfo, onChange }) => {
  return (
    <SurfaceCard className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary-900">
        Business Information
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Store Name
          </label>
          <input
            name="storeName"
            value={businessInfo.storeName}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Established Year
          </label>
          <input
            type="number"
            min="1900"
            name="establishedYear"
            value={businessInfo.establishedYear ?? ""}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Support Email
          </label>
          <input
            name="email"
            value={businessInfo.email}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Contact Number
          </label>
          <input
            name="phone"
            value={businessInfo.phone}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-700">
            Address
          </label>
          <textarea
            name="address"
            rows={2}
            value={businessInfo.address}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-700">
            Welcome Message
          </label>
          <textarea
            name="intro"
            rows={3}
            value={businessInfo.intro}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};

export const StoreHoursSection = ({ storeHours, onChange }) => {
  return (
    <SurfaceCard className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary-900">
        Store Hours
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Weekdays
          </label>
          <input
            name="weekdays"
            value={storeHours.weekdays}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Weekends
          </label>
          <input
            name="weekends"
            value={storeHours.weekends}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};

export const SocialLinksSection = ({ socialLinks, onChange }) => {
  return (
    <SurfaceCard className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary-900">
        Social Links
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Instagram
          </label>
          <input
            name="instagram"
            value={socialLinks.instagram}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            Facebook
          </label>
          <input
            name="facebook"
            value={socialLinks.facebook}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700">
            WhatsApp
          </label>
          <input
            name="whatsapp"
            value={socialLinks.whatsapp}
            onChange={onChange}
            className="mt-1 block w-full rounded-xl border border-gold-200/70 px-3 py-2 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
          />
        </div>
      </div>
    </SurfaceCard>
  );
};
