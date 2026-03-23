import React, { useEffect, useState } from "react";
import { EmptyState, MetricCard } from "@/admin/components/ui/AdminUi";
import { fetchOrderAnalytics } from "@/services/orderAPI";
import { StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    orderCount: 0,
    productCount: 0,
    categoryTotals: {},
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchOrderAnalytics();
        if (!mounted) return;
        setAnalytics({
          totalRevenue: response.totalRevenue || 0,
          averageOrderValue: response.averageOrderValue || 0,
          orderCount: response.orderCount || 0,
          productCount: response.productCount || 0,
          categoryTotals: response.categoryTotals || {},
          topProducts: response.topProducts || [],
        });
      } catch (requestError) {
        if (!mounted) return;
        setError(
          requestError?.response?.data?.message ||
            "Unable to load analytics right now.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const maxCategoryValue = Math.max(
    100,
    ...Object.values(analytics.categoryTotals || {}),
  );

  if (loading) {
    return <EmptyState message="Loading analytics..." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Lifetime Revenue"
          value={`Rs.${analytics.totalRevenue.toLocaleString("en-IN")}`}
          subtitle="Gross sales to date"
          highlight
        />
        <MetricCard
          title="Average Order Value"
          value={`Rs.${analytics.averageOrderValue.toFixed(0)}`}
          subtitle="Revenue / Orders"
        />
        <MetricCard
          title="Total Orders"
          value={analytics.orderCount}
          subtitle="Customer purchases"
        />
        <MetricCard
          title="Catalog Size"
          value={analytics.productCount}
          subtitle="Products available"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Revenue by Category
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Distribution of completed order revenue across catalog groups.
          </p>
          <div className="space-y-4">
            {Object.entries(analytics.categoryTotals).map(
              ([category, value]) => (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">
                      {category}
                    </span>
                    <span className="text-slate-500">
                      Rs.{value.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-sky-500"
                      style={{
                        width: `${Math.max((value / maxCategoryValue) * 100, 6)}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
            {!Object.keys(analytics.categoryTotals).length && (
              <EmptyState message="No category data yet." />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Top Performing Items
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Products ranked by total order count.
          </p>
          <div className="space-y-3">
            {analytics.topProducts.map(([productName, count], index) => (
              <div
                key={productName}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow text-sm font-medium text-fuchsia-600">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {productName}
                    </p>
                    <p className="text-xs text-slate-500">{count} orders</p>
                  </div>
                </div>
                <StatusChip tone="info">Top seller</StatusChip>
              </div>
            ))}
            {!analytics.topProducts.length && (
              <EmptyState message="No sales yet. Start sharing your treats!" />
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
