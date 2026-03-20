import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { updateProfile } from "../../../features/auth/authSlice";
import { showToast } from "../../../features/uiSlice";
import SavedAddressSection from "../../components/SavedAddressSection";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [addressDraft, setAddressDraft] = useState({
    label: "Home",
    street: "",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    zipCode: "",
    phone: "",
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1);
  const [dragFromIndex, setDragFromIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    zipCode: "",
  });

  useEffect(() => {
    const nextSavedAddresses = Array.isArray(user?.savedAddresses)
      ? user.savedAddresses.map((address, index) => ({
          id: address?._id || `saved-${index}`,
          label: address?.label || "Saved address",
          street: address?.street || "",
          city: address?.city || "Vizianagaram",
          state: address?.state || "Andhra Pradesh",
          zipCode: address?.zipCode || "",
          phone: address?.phone || user?.phone || "",
          landmark: address?.landmark || "",
          placeId: address?.placeId || "",
          latitude: Number.isFinite(Number(address?.latitude))
            ? Number(address.latitude)
            : undefined,
          longitude: Number.isFinite(Number(address?.longitude))
            ? Number(address.longitude)
            : undefined,
          isDefault: address?.isDefault === true,
        }))
      : [];

    setSavedAddresses(nextSavedAddresses);

    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "Vizianagaram",
      state: user?.address?.state || "Andhra Pradesh",
      zipCode: user?.address?.zipCode || "",
    });
  }, [user]);

  const resetAddressDraft = () => {
    setAddressDraft({
      label: "Home",
      street: "",
      city: "Vizianagaram",
      state: "Andhra Pradesh",
      zipCode: "",
      phone: formData.phone || "",
    });
    setEditingAddressIndex(-1);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleAddressDraftChange = (event) => {
    const { name, value } = event.target;
    setAddressDraft((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  };

  const normalizeAddressListPayload = (addresses) =>
    addresses.map((address) => ({
      label: address.label?.trim() || "Saved address",
      street: address.street?.trim() || "",
      city: address.city?.trim() || "Vizianagaram",
      state: address.state?.trim() || "Andhra Pradesh",
      zipCode: address.zipCode?.trim() || "",
      phone: address.phone?.trim() || "",
      landmark: address.landmark || "",
      placeId: address.placeId || "",
      latitude: Number.isFinite(Number(address.latitude))
        ? Number(address.latitude)
        : undefined,
      longitude: Number.isFinite(Number(address.longitude))
        ? Number(address.longitude)
        : undefined,
      formattedAddress: address.formattedAddress || "",
      isDefault: address.isDefault === true,
    }));

  const persistSavedAddresses = async (nextAddresses, successMessage) => {
    const payloadAddresses = normalizeAddressListPayload(nextAddresses);
    await dispatch(
      updateProfile({
        savedAddresses: payloadAddresses,
      }),
    ).unwrap();

    dispatch(
      showToast({
        message: successMessage,
        type: "success",
      }),
    );
  };

  const handleAddressPickerSave = async (addressData, editIndex) => {
    const normalizedAddress = {
      id:
        editIndex >= 0
          ? savedAddresses[editIndex]?.id || `saved-${Date.now()}`
          : `saved-${Date.now()}`,
      label: addressData.label || "Home",
      street: addressData.street || "",
      city: addressData.city || "Vizianagaram",
      state: addressData.state || "Andhra Pradesh",
      zipCode: addressData.zipCode || "",
      phone: addressData.phone || formData.phone || "",
      landmark: addressData.landmark || "",
      placeId: addressData.placeId || "",
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress || "",
      isDefault: savedAddresses.length === 0 || editIndex >= 0 ? true : false,
    };

    let nextAddresses;
    if (editIndex >= 0) {
      nextAddresses = savedAddresses.map((address, i) =>
        i === editIndex
          ? { ...address, ...normalizedAddress }
          : { ...address, isDefault: false },
      );
    } else {
      nextAddresses = [
        ...savedAddresses.map((a) => ({ ...a, isDefault: false })),
        { ...normalizedAddress, isDefault: true },
      ];
    }

    try {
      await persistSavedAddresses(
        nextAddresses,
        editIndex >= 0 ? "Address updated." : "New address added.",
      );
      resetAddressDraft();
    } catch (saveError) {
      dispatch(
        showToast({
          message: saveError?.message || "Failed to save address.",
          type: "error",
        }),
      );
    }
  };

  const handleEditAddress = (address, index) => {
    setEditingAddressIndex(index);
    setAddressDraft({
      label: address.label || "Home",
      street: address.street || "",
      city: address.city || "Vizianagaram",
      state: address.state || "Andhra Pradesh",
      zipCode: address.zipCode || "",
      phone: address.phone || formData.phone || "",
    });
  };

  const handleDeleteAddress = async (index) => {
    const nextAddresses = savedAddresses.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    if (
      nextAddresses.length > 0 &&
      !nextAddresses.some((address) => address.isDefault)
    ) {
      nextAddresses[0] = {
        ...nextAddresses[0],
        isDefault: true,
      };
    }

    try {
      await persistSavedAddresses(nextAddresses, "Address removed.");
      if (editingAddressIndex === index) {
        resetAddressDraft();
      }
    } catch (deleteError) {
      dispatch(
        showToast({
          message: deleteError?.message || "Failed to remove address.",
          type: "error",
        }),
      );
    }
  };

  const handleSetDefaultAddress = async (index) => {
    const nextAddresses = savedAddresses.map((address, itemIndex) => ({
      ...address,
      isDefault: itemIndex === index,
    }));

    try {
      await persistSavedAddresses(nextAddresses, "Default address updated.");
    } catch (defaultError) {
      dispatch(
        showToast({
          message: defaultError?.message || "Failed to set default address.",
          type: "error",
        }),
      );
    }
  };

  const handleAddressDragStart = (index) => {
    setDragFromIndex(index);
  };

  const handleAddressDragOver = (event, index) => {
    event.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleAddressDragEnd = () => {
    setDragFromIndex(-1);
    setDragOverIndex(-1);
  };

  const handleAddressDrop = async (dropIndex) => {
    if (
      dragFromIndex < 0 ||
      dropIndex < 0 ||
      dragFromIndex === dropIndex ||
      dragFromIndex >= savedAddresses.length ||
      dropIndex >= savedAddresses.length
    ) {
      handleAddressDragEnd();
      return;
    }

    const nextAddresses = [...savedAddresses];
    const [movedAddress] = nextAddresses.splice(dragFromIndex, 1);
    nextAddresses.splice(dropIndex, 0, movedAddress);

    const nextEditingIndex =
      editingAddressIndex === dragFromIndex ? dropIndex : editingAddressIndex;

    try {
      await persistSavedAddresses(nextAddresses, "Address order updated.");
      setEditingAddressIndex(nextEditingIndex);
    } catch (reorderError) {
      dispatch(
        showToast({
          message: reorderError?.message || "Failed to reorder addresses.",
          type: "error",
        }),
      );
    } finally {
      handleAddressDragEnd();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await dispatch(
        updateProfile({
          name: formData.name,
          phone: formData.phone,
          savedAddresses: normalizeAddressListPayload(savedAddresses),
        }),
      ).unwrap();

      dispatch(
        showToast({
          message: "Profile updated successfully.",
          type: "success",
        }),
      );
    } catch (updateError) {
      dispatch(
        showToast({
          message: updateError?.message || "Failed to update profile.",
          type: "error",
        }),
      );
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {/* Profile Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(150deg,#120c02_0%,#1f1408_42%,#33210f_100%)] p-6 text-white shadow-[0_16px_32px_rgba(18,12,2,0.28)] sm:p-10">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#c9a84c33] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#e8d08a1f] blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#c9a84c66] bg-[#f4dfac1f] text-2xl font-black text-[#f4dfac] shadow-lg backdrop-blur-sm sm:h-20 sm:w-20 sm:text-3xl">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8d08a]">
                My Profile
              </p>
              <h1 className="font-playfair truncate text-2xl font-black sm:text-3xl">
                {user?.name || "Your Profile"}
              </h1>
              <p className="mt-1 text-sm text-[#f4dfacbf]">
                {user?.email || ""}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 self-start sm:self-center">
              <Link
                to="/orders"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a84c66] bg-[#f4dfac1a] px-4 py-2 text-sm font-medium text-[#f4dfac] backdrop-blur-sm transition-all hover:bg-[#f4dfac2b] active:scale-95"
              >
                My Orders
              </Link>
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              >
                Go to Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Form Card */}
        <div className="profile-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="mb-1 text-lg font-bold text-[#2a1f0e] sm:text-xl">
                Personal Details
              </h2>
              <p className="text-sm text-[#6a5130]">
                Keep your contact info up to date for faster checkout.
              </p>
            </div>

            <div className="profile-grid">
              <label className="block">
                <span className="commerce-field-label">Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="commerce-input"
                  required
                />
              </label>

              <label className="block">
                <span className="commerce-field-label">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="commerce-input"
                  required
                />
              </label>
            </div>

            {(error || user?.email) && (
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[#f7ecd2a8] px-5 py-4 text-sm text-[#6a5130]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#efe1b8]">
                  <svg
                    className="h-5 w-5 text-[#7a5c0f]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <div>
                  <p>
                    Signed in as{" "}
                    <span className="font-semibold text-[#2a1f0e]">
                      {user?.email}
                    </span>
                  </p>
                  {error ? <p className="mt-1 text-red-600">{error}</p> : null}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <SavedAddressSection
            savedAddresses={savedAddresses}
            editingAddressIndex={editingAddressIndex}
            dragOverIndex={dragOverIndex}
            loading={loading}
            onAddressPickerSave={handleAddressPickerSave}
            onEditAddress={handleEditAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            onDragStart={handleAddressDragStart}
            onDragOver={handleAddressDragOver}
            onDrop={handleAddressDrop}
            onDragEnd={handleAddressDragEnd}
            onResetDraft={resetAddressDraft}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
