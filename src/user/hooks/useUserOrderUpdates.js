import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { upsertIncomingOrder } from "@/features/orders/orderSlice";

const API_URL = import.meta.env.VITE_API_URL;

const useUserOrderUpdates = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!token || !userId || user?.role !== "user") {
      return undefined;
    }

    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const handleOrderUpdate = (event) => {
      if (event?.payload?._id) {
        dispatch(upsertIncomingOrder(event.payload));
      }
    };

    socket.on("order-status-updated", handleOrderUpdate);

    return () => {
      socket.off("order-status-updated", handleOrderUpdate);
      socket.disconnect();
    };
  }, [dispatch, token, userId, user?.role]);
};

export default useUserOrderUpdates;
