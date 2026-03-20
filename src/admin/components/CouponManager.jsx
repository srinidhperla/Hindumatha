import React from "react";

const CouponManager = ({
  coupons,
  onCouponChange,
  onAddCoupon,
  onRemoveCoupon,
}) => (
  <section className="rounded-2xl border border-gold-200/60 bg-gradient-to-br from-white via-cream-50/75 to-gold-50/60 p-6 shadow-[0_14px_34px_rgba(88,60,10,0.09)] admin-motion hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(88,60,10,0.14)]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-primary-900">
          Coupon Management
        </h2>
        <p className="mt-1 text-sm text-primary-600">
          Create offers, set minimum order amounts, and disable old campaigns.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddCoupon}
        className="inline-flex items-center justify-center rounded-xl border border-gold-200/70 px-4 py-2 text-sm font-semibold text-primary-700 admin-motion hover:-translate-y-0.5 hover:bg-gold-50/80"
      >
        Add Coupon
      </button>
    </div>

    <div className="mt-6 space-y-4">
      {coupons.map((coupon, index) => (
        <div
          key={coupon._id || `${coupon.code || "coupon"}-${index}`}
          className="rounded-2xl border border-gold-200/50 bg-white/70 p-4 admin-motion hover:border-gold-300/70 hover:bg-white/90"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-primary-700">
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
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
                placeholder="SWEET10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Type
              </label>
              <select
                value={coupon.type}
                onChange={(event) =>
                  onCouponChange(index, "type", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
              >
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
                <option value="delivery">Free delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Value
              </label>
              <input
                type="number"
                min="0"
                value={coupon.value}
                onChange={(event) =>
                  onCouponChange(index, "value", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
                Minimum Subtotal
              </label>
              <input
                type="number"
                min="0"
                value={coupon.minSubtotal}
                onChange={(event) =>
                  onCouponChange(index, "minSubtotal", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700">
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
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70 disabled:bg-primary-100 disabled:text-primary-400"
                placeholder={coupon.type === "percent" ? "250" : "Not used"}
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-gold-200/70 bg-white px-3 py-2 text-sm font-medium text-primary-700">
                <input
                  type="checkbox"
                  checked={coupon.isActive !== false}
                  onChange={(event) =>
                    onCouponChange(index, "isActive", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gold-300 text-primary-700 focus:ring-gold-300"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => onRemoveCoupon(index)}
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 admin-motion hover:bg-rose-50"
              >
                Remove
              </button>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-sm font-medium text-primary-700">
                Description
              </label>
              <input
                value={coupon.description || ""}
                onChange={(event) =>
                  onCouponChange(index, "description", event.target.value)
                }
                className="mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2 text-primary-800 admin-motion focus:border-gold-400 focus:ring-2 focus:ring-gold-200/70"
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
