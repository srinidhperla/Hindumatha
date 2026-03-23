import { useEffect, useState } from "react";
import { updateProfile } from "@/features/auth/authSlice";
import { showToast } from "@/features/uiSlice";

const useProfileAddressBook = ({ user, dispatch, fallbackPhone }) => {
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
  }, [user]);

  const resetAddressDraft = () => {
    setAddressDraft({
      label: "Home",
      street: "",
      city: "Vizianagaram",
      state: "Andhra Pradesh",
      zipCode: "",
      phone: fallbackPhone || "",
    });
    setEditingAddressIndex(-1);
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
      phone: addressData.phone || fallbackPhone || "",
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
        ...savedAddresses.map((address) => ({ ...address, isDefault: false })),
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
      phone: address.phone || fallbackPhone || "",
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

  return {
    addressDraft,
    setAddressDraft,
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
  };
};

export default useProfileAddressBook;
