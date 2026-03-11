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

  const handleAddressDraftSubmit = async (event) => {
    event.preventDefault();

    if (!addressDraft.street.trim() || !addressDraft.zipCode.trim()) {
      dispatch(
        showToast({
          message: "Street and pincode are required for saved addresses.",
          type: "error",
        }),
      );
      return;
    }

    const normalizedAddress = {
      ...addressDraft,
      label: addressDraft.label.trim() || "Saved address",
      street: addressDraft.street.trim(),
      city: addressDraft.city.trim() || "Vizianagaram",
      state: addressDraft.state.trim() || "Andhra Pradesh",
      zipCode: addressDraft.zipCode.trim(),
      phone: addressDraft.phone.trim() || formData.phone.trim(),
    };

    const nextAddresses = [...savedAddresses];

    if (editingAddressIndex >= 0) {
      const existingAddress = nextAddresses[editingAddressIndex] || {};
      nextAddresses[editingAddressIndex] = {
        ...existingAddress,
        ...normalizedAddress,
      };
    } else {
      nextAddresses.push({
        ...normalizedAddress,
        isDefault: nextAddresses.length === 0,
      });
    }

    try {
      await persistSavedAddresses(
        nextAddresses,
        editingAddressIndex >= 0
          ? "Saved address updated."
          : "New address added.",
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
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
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
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-caramel-500">
              My Profile
            </p>
            <h1 className="mt-3 text-4xl font-black text-primary-800">
              Keep your checkout details ready
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-primary-600">
              Update your contact details and default delivery address so
              checkout is faster the next time you order.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/orders" className="btn-secondary">
              View Orders
            </Link>
            <Link to="/cart" className="btn-primary">
              Go to Cart
            </Link>
          </div>
        </div>

        <div className="profile-card">
          <form onSubmit={handleSubmit} className="space-y-8">
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

            <label className="block">
              <span className="commerce-field-label">Street Address</span>
              <textarea
                name="street"
                rows={4}
                value={formData.street}
                onChange={handleChange}
                className="commerce-input"
                required
              />
            </label>

            <div className="profile-grid">
              <label className="block">
                <span className="commerce-field-label">City</span>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="commerce-input"
                  required
                />
              </label>

              <label className="block">
                <span className="commerce-field-label">State</span>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="commerce-input"
                  required
                />
              </label>
            </div>

            <div className="profile-grid">
              <label className="block">
                <span className="commerce-field-label">Pincode</span>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="commerce-input"
                  required
                />
              </label>

              <div className="rounded-[1.5rem] border border-caramel-100 bg-caramel-50/70 p-5 text-sm leading-7 text-primary-600">
                These details are used to prefill checkout. You can still change
                them for any single order before placing it.
              </div>
            </div>

            {(error || user?.email) && (
              <div className="rounded-2xl border border-cream-200 bg-cream-50 px-5 py-4 text-sm text-primary-600">
                <p>
                  Signed in as{" "}
                  <span className="font-semibold text-primary-800">
                    {user?.email}
                  </span>
                </p>
                {error ? <p className="mt-2 text-red-600">{error}</p> : null}
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
            addressDraft={addressDraft}
            loading={loading}
            onAddressDraftChange={handleAddressDraftChange}
            onAddressDraftSubmit={handleAddressDraftSubmit}
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
