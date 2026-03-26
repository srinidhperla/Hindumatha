import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState, MetricCard } from "@/admin/components/ui/AdminUi";
import { fetchOrderAnalytics } from "@/services/orderAPI";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";

const COLORS = ["#7a5c0f", "#c9a84c", "#15803d", "#0284c7", "#dc2626", "#9333ea"];

const currencyFormatter = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    orderCount: 0,
    productCount: 0,
    customerCount: 0,
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    dailyRevenue: [],
    ordersPerDay: [],
    statusBreakdown: {},
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchOrderAnalytics();
      setAnalytics({
        totalRevenue: Number(response?.totalRevenue || 0),
        averageOrderValue: Number(response?.averageOrderValue || 0),
        orderCount: Number(response?.orderCount || 0),
        productCount: Number(response?.productCount || 0),
        customerCount: Number(response?.customerCount || 0),
        todayOrders: Number(response?.todayOrders || 0),
        todayRevenue: Number(response?.todayRevenue || 0),
        pendingOrders: Number(response?.pendingOrders || 0),
        dailyRevenue: Array.isArray(response?.dailyRevenue)
          ? response.dailyRevenue
          : [],
        ordersPerDay: Array.isArray(response?.ordersPerDay)
          ? response.ordersPerDay
          : [],
        statusBreakdown: response?.statusBreakdown || {},
        topProducts: Array.isArray(response?.topProducts)
          ? response.topProducts
          : [],
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load analytics right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const statusChartData = useMemo(
    () =>
      Object.entries(analytics.statusBreakdown || {}).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: Number(count) || 0,
      })),
    [analytics.statusBreakdown],
  );

  const topProductChartData = useMemo(
    () =>
      (analytics.topProducts || []).map((product) => ({
        name: product.name,
        quantity: Number(product.quantity || 0),
        revenue: Number(product.revenue || 0),
      })),
    [analytics.topProducts],
  );

  if (loading) {
    return <EmptyState message="Loading analytics..." />;
  }

  if (error) {
    return (
      <SurfaceCard className="p-8 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <ActionButton type="button" className="mt-4" onClick={loadAnalytics}>
          Retry
        </ActionButton>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Today Revenue"
          value={currencyFormatter(analytics.todayRevenue)}
          subtitle="Revenue collected today"
          highlight
        />
        <MetricCard
          title="Today Orders"
          value={analytics.todayOrders}
          subtitle="Orders created today"
        />
        <MetricCard
          title="Average Order Value"
          value={currencyFormatter(analytics.averageOrderValue)}
          subtitle="Revenue per successful order"
        />
        <MetricCard
          title="Customers"
          value={analytics.customerCount}
          subtitle="Registered customer count"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SurfaceCard className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Daily Revenue
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            Revenue trend across the last 30 days.
          </p>
          {analytics.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analytics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => currencyFormatter(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#7a5c0f"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No revenue data yet." />
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Order Status Pie
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            Current mix of pending, confirmed, delivered, and cancelled orders.
          </p>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No order status data yet." />
          )}
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SurfaceCard className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Top 5 Popular Products
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            Ranked by total quantity ordered.
          </p>
          {topProductChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topProductChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value)} items`} />
                <Legend />
                <Bar
                  dataKey="quantity"
                  name="Quantity"
                  fill="#c9a84c"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No product trend data yet." />
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Orders Per Day
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            Daily order volume for the last 30 days.
          </p>
          {analytics.ordersPerDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={analytics.ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value)} orders`} />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Orders"
                  fill="#15803d"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No order volume data yet." />
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
              Lifetime Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-900">
              {currencyFormatter(analytics.totalRevenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
              Total Orders
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-900">
              {analytics.orderCount}
            </p>
          </div>
          <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
              Catalog Size
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-900">
              {analytics.productCount}
            </p>
          </div>
          <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
              Pending Orders
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-900">
              {analytics.pendingOrders}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
};

export default AdminAnalyticsPage;
