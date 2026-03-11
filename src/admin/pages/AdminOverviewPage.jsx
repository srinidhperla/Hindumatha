import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { MetricCard, LoadingState, EmptyState } from "../components/ui/AdminUi";
import { getOrderSummary } from "./adminShared";

const AdminOverviewPage = () => {
  const { orders, loading: ordersLoading } = useSelector(
    (state) => state.orders,
  );
  const { products, loading: productsLoading } = useSelector(
    (state) => state.products,
  );

  const metrics = useMemo(() => {
    if (!orders) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };
    }

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending",
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "delivered",
    ).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    if (!orders) {
      return [];
    }

    return [...orders]
      .sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      )
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString("en-IN")}`}
          subtitle="All-time gross revenue"
          highlight
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          subtitle="Across all statuses"
        />
        <MetricCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          subtitle="Awaiting fulfillment"
        />
        <MetricCard
          title="Completed Orders"
          value={metrics.completedOrders}
          subtitle="Delivered successfully"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders
          </h2>
          {ordersLoading ? (
            <LoadingState />
          ) : recentOrders.length ? (
            <ul className="space-y-4">
              {recentOrders.map((order) => (
                <li
                  key={order._id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.user?.name || "Guest Customer"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getOrderSummary(order)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-pink-50 text-pink-600">
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No orders yet." />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Product Summary
          </h2>
          {productsLoading ? (
            <LoadingState />
          ) : products?.length ? (
            <ul className="space-y-3">
              {products.slice(0, 6).map((product) => (
                <li
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{product.price}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Add products to view summary." />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
