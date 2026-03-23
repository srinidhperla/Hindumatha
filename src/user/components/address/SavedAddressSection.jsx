import React, { useState } from "react";
import AddressPickerModal from "@/user/components/address/AddressPickerModal";

const SavedAddressSection = ({
  savedAddresses,
  editingAddressIndex,
  dragOverIndex,
  onAddressPickerSave,
  onEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResetDraft,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [pickerKey, setPickerKey] = useState(0);

  const handleStartAdd = () => {
    onResetDraft();
    setEditingAddress(null);
    setPickerKey((k) => k + 1);
    setShowPicker(true);
  };

  const handleEdit = (address, index) => {
    onEditAddress(address, index);
    setEditingAddress(address);
    setPickerKey((k) => k + 1);
    setShowPicker(true);
  };

  const handlePickerClose = () => {
    setShowPicker(false);
    setEditingAddress(null);
    onResetDraft();
  };

  const handlePickerSave = (addressData) => {
    onAddressPickerSave(addressData, editingAddressIndex);
    setShowPicker(false);
    setEditingAddress(null);
  };

  return (
    <div className="mt-8 border-t border-[rgba(201,168,76,0.28)] pt-8">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#2a1f0e]">
            Delivery Addresses
          </h2>
          <p className="mt-0.5 text-sm text-[#6a5130]">
            Manage your saved addresses for quick checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(122,92,15,0.3)] transition-all hover:brightness-110 active:scale-95"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Address
        </button>
      </div>

      {savedAddresses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedAddresses.map((address, index) => (
            <div
              key={address.id || `address-${index}`}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDrop={() => onDrop(index)}
              onDragEnd={onDragEnd}
              className={`relative rounded-2xl border bg-white/90 p-4 sm:p-5 transition-all duration-200 hover:shadow-[0_14px_28px_rgba(18,12,2,0.16)] ${
                address.isDefault
                  ? "border-[#c9a84c99] ring-1 ring-[#c9a84c55] shadow-[0_12px_24px_rgba(18,12,2,0.12)]"
                  : dragOverIndex === index
                    ? "border-[#c9a84c] ring-2 ring-[#e8d08a66]"
                    : "border-[rgba(201,168,76,0.3)] shadow-sm"
              }`}
            >
              {/* Label & default badge */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    address.label === "Home"
                      ? "bg-sage-100 text-sage-600"
                      : address.label === "Work"
                        ? "bg-[#efe1b8] text-[#7a5c0f]"
                        : "bg-[#f7ecd2] text-[#7a5c0f]"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {address.label === "Home" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    ) : address.label === "Work" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    )}
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#2a1f0e]">
                  {address.label}
                </span>
                {address.isDefault && (
                  <span className="ml-auto rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Default
                  </span>
                )}
              </div>

              {/* Address text */}
              <p className="mb-1 line-clamp-2 text-sm leading-relaxed text-[#6a5130]">
                {[address.street, address.city, address.state, address.zipCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-xs font-medium text-[#8f7859]">
                {address.phone || "No phone"}
              </p>

              {/* Action buttons */}
              <div className="mt-3 flex items-center gap-2 border-t border-[rgba(201,168,76,0.25)] pt-3">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefaultAddress(index)}
                    className="text-xs font-semibold text-[#7a5c0f] transition hover:text-[#2a1f0e] active:scale-95"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleEdit(address, index)}
                  className="text-xs font-semibold text-[#8b6914] transition hover:text-[#5b4312] active:scale-95"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteAddress(index)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 active:scale-95 transition ml-auto"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[rgba(201,168,76,0.35)] bg-[#f7ecd275] px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#efe1b8]">
            <svg
              className="h-6 w-6 text-[#8b6914]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#2a1f0e]">
            No saved addresses yet
          </p>
          <p className="mt-1 text-xs text-[#6a5130]">
            Add your first delivery address to speed up checkout.
          </p>
        </div>
      )}

      <AddressPickerModal
        key={pickerKey}
        isOpen={showPicker}
        onClose={handlePickerClose}
        onSave={handlePickerSave}
        initialAddress={editingAddress}
      />
    </div>
  );
};

export default SavedAddressSection;
