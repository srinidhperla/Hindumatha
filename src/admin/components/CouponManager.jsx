import React from "react";

const CouponManager = ({
  coupons,
  onCouponChange,
  onAddCoupon,
  onRemoveCoupon,
}) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Coupon Management
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create offers, set minimum order amounts, and disable old campaigns.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddCoupon}
        className="inline-flex items-center justify-center rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
      >
        Add Coupon
      </button>
    </div>

    <div className="mt-6 space-y-4">
      {coupons.map((coupon, index) => (
        <div
          key={coupon._id || `${coupon.code || "coupon"}-${index}`}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Coupon Code
              </label>
              <input
                value={coupon.code}
                onChange={(event) =>
                  onCouponChange(
                    index,
                    "code",
                    event.target.value.toUpperCase(),
                  )
                }
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                placeholder="SWEET10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={coupon.type}
                onChange={(event) =>
                  onCouponChange(index, "type", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              >
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
                <option value="delivery">Free delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <input
                type="number"
                min="0"
                value={coupon.value}
                onChange={(event) =>
                  onCouponChange(index, "value", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Subtotal
              </label>
              <input
                type="number"
                min="0"
                value={coupon.minSubtotal}
                onChange={(event) =>
                  onCouponChange(index, "minSubtotal", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Discount
              </label>
              <input
                type="number"
                min="0"
                value={coupon.maxDiscount ?? ""}
                onChange={(event) =>
                  onCouponChange(index, "maxDiscount", event.target.value)
                }
                disabled={coupon.type !== "percent"}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100"
                placeholder={coupon.type === "percent" ? "250" : "Not used"}
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={coupon.isActive !== false}
                  onChange={(event) =>
                    onCouponChange(index, "isActive", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => onRemoveCoupon(index)}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                value={coupon.description || ""}
                onChange={(event) =>
                  onCouponChange(index, "description", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                placeholder="Describe when this offer should be used"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default CouponManager;
