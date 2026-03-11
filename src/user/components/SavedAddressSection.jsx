import React, { useEffect, useState } from "react";

const SavedAddressSection = ({
  savedAddresses,
  editingAddressIndex,
  dragOverIndex,
  addressDraft,
  loading,
  onAddressDraftChange,
  onAddressDraftSubmit,
  onEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResetDraft,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (editingAddressIndex >= 0) {
      setShowModal(true);
      setStep(1);
    }
  }, [editingAddressIndex]);

  const handleStartAdd = () => {
    onResetDraft();
    setStep(1);
    setShowModal(true);
  };

  const handleCancel = () => {
    onResetDraft();
    setShowModal(false);
    setStep(1);
  };

  const handleNext = () => {
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onAddressDraftSubmit(event);
    setShowModal(false);
    setStep(1);
  };

  // Validate step 1 (Street, City)
  const isStep1Valid = addressDraft.street?.trim() && addressDraft.city?.trim();
  // Validate step 2 (Pincode)
  const isStep2Valid = addressDraft.zipCode?.trim();
  // Validate step 3 (Phone, Label)
  const isStep3Valid = addressDraft.phone?.trim();

  return (
    <div className="mt-10 border-t border-cream-300 pt-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-black text-primary-800">My Addresses</h2>
        <p className="text-sm text-primary-600">
          Add, edit, delete, and set your default delivery address.
        </p>
        <div>
          <button
            type="button"
            onClick={handleStartAdd}
            className="btn-secondary"
          >
            Add New Address
          </button>
        </div>
      </div>

      {savedAddresses.length > 0 ? (
        <div className="space-y-3">
          {savedAddresses.map((address, index) => (
            <div
              key={address.id || `address-${index}`}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDrop={() => onDrop(index)}
              onDragEnd={onDragEnd}
              className={`rounded-2xl border bg-cream-100 p-4 transition ${
                dragOverIndex === index
                  ? "border-primary-400 ring-2 ring-primary-100"
                  : "border-cream-300"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary-800">
                    <span className="mr-2 text-primary-400">::</span>
                    {address.label}
                    {address.isDefault ? (
                      <span className="ml-2 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold text-sage-700">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-primary-600">
                    {[
                      address.street,
                      address.city,
                      address.state,
                      address.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-xs font-semibold text-primary-700">
                    {address.phone || "No phone"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefaultAddress(index)}
                      className="rounded-xl border border-sage-200 px-3 py-1.5 text-xs font-semibold text-sage-700 hover:bg-sage-50"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onEditAddress(address, index);
                      setShowModal(true);
                      setStep(1);
                    }}
                    className="rounded-xl border border-cream-300 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAddress(index)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-cream-300 bg-cream-100 px-4 py-3 text-sm text-primary-600">
          No saved addresses yet.
        </div>
      )}

      {/* Address Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-warm">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-primary-800">
                  {editingAddressIndex >= 0
                    ? "Edit Address"
                    : "Add New Address"}
                </h3>
                <p className="mt-1 text-sm text-primary-500">
                  Step {step} of 3
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full bg-cream-100 p-2 text-primary-600 hover:bg-cream-200"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded-full transition-colors ${
                    s <= step ? "bg-primary-500" : "bg-cream-200"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Street & City */}
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="commerce-field-label">Street Address</span>
                    <textarea
                      name="street"
                      rows={3}
                      value={addressDraft.street}
                      onChange={onAddressDraftChange}
                      className="commerce-input"
                      placeholder="Enter your full street address"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="commerce-field-label">City</span>
                    <input
                      type="text"
                      name="city"
                      value={addressDraft.city}
                      onChange={onAddressDraftChange}
                      className="commerce-input"
                      placeholder="Enter city name"
                      required
                    />
                  </label>
                </div>
              )}

              {/* Step 2: Pincode */}
              {step === 2 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="commerce-field-label">Pincode</span>
                    <input
                      type="text"
                      name="zipCode"
                      value={addressDraft.zipCode}
                      onChange={onAddressDraftChange}
                      className="commerce-input"
                      placeholder="Enter 6-digit pincode"
                      required
                    />
                  </label>
                </div>
              )}

              {/* Step 3: Phone & Label */}
              {step === 3 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="commerce-field-label">Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={addressDraft.phone}
                      onChange={onAddressDraftChange}
                      className="commerce-input"
                      placeholder="Enter 10-digit phone number"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="commerce-field-label">Address Label</span>
                    <select
                      name="label"
                      value={addressDraft.label}
                      onChange={onAddressDraftChange}
                      className="commerce-input"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  {/* Preview */}
                  <div className="rounded-xl border border-cream-300 bg-cream-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-primary-500">
                      Address Preview
                    </p>
                    <p className="mt-2 text-sm text-primary-700">
                      {[
                        addressDraft.street,
                        addressDraft.city,
                        addressDraft.state,
                        addressDraft.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-primary-600">
                      {addressDraft.phone || "No phone"} • {addressDraft.label}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !isStep1Valid) ||
                      (step === 2 && !isStep2Valid)
                    }
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isStep3Valid || loading}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingAddressIndex >= 0
                      ? "Update Address"
                      : "Save Address"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddressSection;
