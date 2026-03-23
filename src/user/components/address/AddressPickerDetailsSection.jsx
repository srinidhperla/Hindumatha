import React from "react";

const AddressPickerDetailsSection = ({
  autoDetecting,
  addressMeta,
  formData,
  isAddressVerified,
  isAddressServiceable,
  hasDistance,
  distanceFromStoreKm,
  maxDeliveryRadiusKm,
  handleFormChange,
}) => {
  const formattedAddr = addressMeta.formattedAddress || "";

  return (
    <div className="mt-1 rounded-t-3xl border-t border-gold-200/60 bg-white px-4 pb-4 pt-5 sm:rounded-t-none sm:px-5">
      <div className="mb-4 flex justify-center sm:hidden">
        <div className="h-1 w-10 rounded-full bg-cream-300" />
      </div>

      <p className="text-sm font-semibold text-primary-600">Delivery details</p>

      {formattedAddr ? (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-caramel-200 bg-caramel-50/60 p-3.5">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-4 w-4 text-primary-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-primary-900">
              {formattedAddr.split(",").slice(0, 2).join(",")}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-primary-600">
              {formattedAddr.split(",").slice(2).join(",").trim()}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-1">
            {isAddressVerified && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isAddressServiceable
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isAddressServiceable ? "Deliverable" : "Out of range"}
              </span>
            )}
            {hasDistance && (
              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                {distanceFromStoreKm.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-primary-200 bg-cream-50 p-4 text-center text-sm text-primary-500">
          {autoDetecting
            ? "Detecting your location..."
            : "Search or use current location to select address"}
        </div>
      )}

      {isAddressVerified && !isAddressServiceable && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          This address is outside our {maxDeliveryRadiusKm}km delivery area.
          Please choose a closer location.
        </div>
      )}

      <div className="mt-4">
        <label className="block">
          <span className="text-sm font-medium text-primary-700">
            Address details<span className="text-red-400">*</span>
          </span>
          <textarea
            name="street"
            value={formData.street}
            onChange={handleFormChange}
            rows={2}
            placeholder="Floor, Flat no., Tower, Building name"
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-primary-700">City</span>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleFormChange}
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-primary-700">Pincode</span>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleFormChange}
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
      </div>

      <div className="mt-3">
        <label className="block">
          <span className="text-sm font-medium text-primary-700">
            Landmark <span className="text-primary-400">(optional)</span>
          </span>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleFormChange}
            placeholder="Nearby landmark"
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
      </div>

      <p className="mt-5 text-sm font-semibold text-primary-600">
        Receiver details for this address
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-primary-700">
            Phone<span className="text-red-400">*</span>
          </span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            placeholder="10-digit phone"
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-primary-700">Label</span>
          <select
            name="label"
            value={formData.label}
            onChange={handleFormChange}
            className="mt-1.5 w-full rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm text-primary-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default AddressPickerDetailsSection;
