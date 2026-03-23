import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "@/features/auth/authSlice";
import { showToast } from "@/features/uiSlice";
import SavedAddressSection from "@/user/components/address/SavedAddressSection";
import ProfileHeader from "@/user/pages/account/ProfileHeader";
import ProfileForm from "@/user/pages/account/ProfileForm";
import useProfileAddressBook from "@/user/pages/account/useProfileAddressBook";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    zipCode: "",
  });
  const {
    savedAddresses,
    editingAddressIndex,
    dragOverIndex,
    resetAddressDraft,
    handleAddressPickerSave,
    handleEditAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleAddressDragStart,
    handleAddressDragOver,
    handleAddressDrop,
    handleAddressDragEnd,
    normalizeAddressListPayload,
  } = useProfileAddressBook({
    user,
    dispatch,
    fallbackPhone: formData.phone,
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "Vizianagaram",
      state: user?.address?.state || "Andhra Pradesh",
      zipCode: user?.address?.zipCode || "",
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
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
        <ProfileHeader user={user} />

        <div className="profile-card">
          <ProfileForm
            formData={formData}
            user={user}
            error={error}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />

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
