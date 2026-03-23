import { useEffect, useState } from "react";
import { updateProfile } from "@/features/auth/authSlice";
import { showToast } from "@/features/uiSlice";
import { normalizeUserSavedAddresses } from "@/user/components/order/orderHelpers";

const toSavedAddressPayload = (addresses) =>
  addresses.map((address) => ({
    label: address.label || "Saved address",
    street: address.street || "",
    city: address.city || "Vizianagaram",
    state: address.state || "Andhra Pradesh",
    zipCode: address.zipCode || "",
    phone: address.phone || "",
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

export const useCheckoutAddressState = ({
  user,
  formData,
  setFormData,
  selectedAddressFromState,
  dispatch,
}) => {
  const [savedAddresses, setSavedAddresses] = useState(() =>
    normalizeUserSavedAddresses(user),
  );
  const [addressMode, setAddressMode] = useState("saved");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveAddressForNextTime, setSaveAddressForNextTime] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressMeta, setAddressMeta] = useState({
    placeId: "",
    latitude: null,
    longitude: null,
  });
  const [addressQuery, setAddressQuery] = useState("");

  useEffect(() => {
    const normalizedAddresses = normalizeUserSavedAddresses(user);
    setSavedAddresses(normalizedAddresses);

    const defaultAddress = selectedAddressFromState
      ? normalizedAddresses.find((a) => a.id === selectedAddressFromState)
      : normalizedAddresses.find((address) => address.isDefault) ||
        normalizedAddresses[0];

    if (!defaultAddress) {
      return;
    }

    setAddressMode("saved");
    setSelectedAddressId(defaultAddress.id);
    setFormData((prev) => ({
      ...prev,
      phone: defaultAddress.phone || prev.phone || user?.phone || "",
      address: defaultAddress.street || prev.address,
      city: defaultAddress.city || prev.city,
      pincode: defaultAddress.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: defaultAddress.placeId || "",
      latitude: Number.isFinite(Number(defaultAddress.latitude))
        ? Number(defaultAddress.latitude)
        : null,
      longitude: Number.isFinite(Number(defaultAddress.longitude))
        ? Number(defaultAddress.longitude)
        : null,
    });
  }, [selectedAddressFromState, setFormData, user]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user?.name || "",
      phone: prev.phone || user?.phone || "",
      address: prev.address || user?.address?.street || "",
      city: prev.city || user?.address?.city || "Vizianagaram",
      pincode: prev.pincode || user?.address?.zipCode || "",
    }));
  }, [
    setFormData,
    user?.address?.city,
    user?.address?.street,
    user?.address?.zipCode,
    user?.name,
    user?.phone,
  ]);

  const persistAddressesToProfile = async (nextAddresses, successMessage) => {
    const defaultAddress =
      nextAddresses.find((address) => address.isDefault) || nextAddresses[0];
    const profileAddress = defaultAddress
      ? {
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state || "Andhra Pradesh",
          zipCode: defaultAddress.zipCode,
          placeId: defaultAddress.placeId || "",
          latitude: Number.isFinite(Number(defaultAddress.latitude))
            ? Number(defaultAddress.latitude)
            : undefined,
          longitude: Number.isFinite(Number(defaultAddress.longitude))
            ? Number(defaultAddress.longitude)
            : undefined,
        }
      : user?.address || {};

    const payloadSavedAddresses = toSavedAddressPayload(nextAddresses);

    await dispatch(
      updateProfile({
        phone: formData.phone,
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    ).unwrap();

    setSavedAddresses(
      normalizeUserSavedAddresses({
        ...(user || {}),
        address: profileAddress,
        savedAddresses: payloadSavedAddresses,
      }),
    );

    if (successMessage) {
      dispatch(showToast({ type: "success", message: successMessage }));
    }
  };

  const applySelectedAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      phone: address.phone || prev.phone,
      address: address.street || prev.address,
      city: address.city || prev.city,
      pincode: address.zipCode || prev.pincode,
    }));
    setAddressMeta({
      placeId: address.placeId || "",
      latitude: Number.isFinite(Number(address.latitude))
        ? Number(address.latitude)
        : null,
      longitude: Number.isFinite(Number(address.longitude))
        ? Number(address.longitude)
        : null,
    });
  };

  const handleSavedAddressSelect = (address) => {
    setAddressMode("saved");
    setEditingAddressId("");
    setSelectedAddressId(address.id);
    applySelectedAddress(address);
    setSaveAddressForNextTime(false);
  };

  const handleStartNewAddress = () => {
    setAddressMode("new");
    setEditingAddressId("");
    setSelectedAddressId("");
    setAddressQuery("");
    setAddressMeta({ placeId: "", latitude: null, longitude: null });
    setFormData((prev) => ({
      ...prev,
      address: "",
      pincode: "",
    }));
    setSaveAddressForNextTime(true);
  };

  const handleEditSavedAddress = (address) => {
    setAddressMode("edit");
    setEditingAddressId(address.id);
    setSelectedAddressId("");
    applySelectedAddress(address);
    setAddressLabel(address.label || "Home");
    setAddressQuery(address.formattedAddress || "");
    setSaveAddressForNextTime(true);
  };

  const handleDeleteSavedAddress = async (addressId) => {
    const nextAddresses = savedAddresses.filter(
      (entry) => entry.id !== addressId,
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
      await persistAddressesToProfile(nextAddresses, "Address deleted.");

      if (selectedAddressId !== addressId) {
        return;
      }

      const fallback =
        nextAddresses.find((entry) => entry.isDefault) || nextAddresses[0];
      if (fallback) {
        handleSavedAddressSelect(fallback);
      } else {
        handleStartNewAddress();
      }
    } catch (error) {
      dispatch(
        showToast({
          type: "error",
          message: error?.message || "Failed to delete address.",
        }),
      );
    }
  };

  return {
    savedAddresses,
    addressMode,
    editingAddressId,
    selectedAddressId,
    saveAddressForNextTime,
    addressLabel,
    addressMeta,
    addressQuery,
    setAddressMode,
    setEditingAddressId,
    setSelectedAddressId,
    setSaveAddressForNextTime,
    setAddressLabel,
    setAddressMeta,
    setAddressQuery,
    persistAddressesToProfile,
    handleSavedAddressSelect,
    handleStartNewAddress,
    handleEditSavedAddress,
    handleDeleteSavedAddress,
  };
};
