import React from "react";
import { isEggTypeAvailable } from "@/utils/productOptions";

const MenuQuickAddModal = ({
  quickAddProduct,
  quickAddPortionMeta,
  quickAddEggType,
  setQuickAddEggType,
  quickAddFlavor,
  setQuickAddFlavor,
  quickAddWeight,
  setQuickAddWeight,
  quickAddQuantity,
  setQuickAddQuantity,
  quickAddWeights,
  closeQuickAdd,
  handleQuickAdd,
}) => {
  if (!quickAddProduct) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickAdd();
      }}
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-warm sm:p-6 animate-fadeInUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-primary-200" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary-500">
              Required details
            </p>
            <h3 className="mt-2 text-xl sm:text-2xl font-bold text-primary-800">
              Add {quickAddProduct.name}
            </h3>
            <p className="mt-1.5 sm:mt-2 text-sm leading-6 text-primary-500">
              Choose the required flavor,
              {` ${quickAddPortionMeta.singular},`} and quantity before adding
              this product to cart.
            </p>
          </div>
          <button
            type="button"
            onClick={closeQuickAdd}
            className="rounded-full bg-cream-100 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-cream-200 active:scale-95 transition flex-shrink-0"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {(() => {
            const eggOn =
              quickAddProduct.isEgg !== false &&
              isEggTypeAvailable(quickAddProduct, "egg");
            const egglessOn =
              quickAddProduct.isEggless === true &&
              isEggTypeAvailable(quickAddProduct, "eggless");
            if (!eggOn && !egglessOn) return null;
            return (
              <label id="quick-add-type" className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-primary-700">
                  Cake Type
                </span>
                <div className="flex gap-3">
                  {eggOn && (
                    <button
                      type="button"
                      onClick={() => setQuickAddEggType("egg")}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        quickAddEggType === "egg"
                          ? "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-300"
                          : "border-primary-200 bg-cream-50 text-primary-600 hover:bg-cream-100"
                      }`}
                    >
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />
                      Egg
                    </button>
                  )}
                  {egglessOn && (
                    <button
                      type="button"
                      onClick={() => setQuickAddEggType("eggless")}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        quickAddEggType === "eggless"
                          ? "border-green-400 bg-green-50 text-green-700 ring-1 ring-green-300"
                          : "border-primary-200 bg-cream-50 text-primary-600 hover:bg-cream-100"
                      }`}
                    >
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                      Eggless
                    </button>
                  )}
                </div>
              </label>
            );
          })()}

          {quickAddProduct.hasExplicitFlavors && (
            <label id="quick-add-flavor" className="block">
              <span className="mb-2 block text-sm font-medium text-primary-700">
                Flavor
              </span>
              <select
                value={quickAddFlavor}
                onChange={(event) => setQuickAddFlavor(event.target.value)}
                className="w-full rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-sm text-primary-800 outline-none transition focus:border-primary-600 focus:bg-white focus:ring-1 focus:ring-primary-600"
              >
                <option value="">Select flavor</option>
                {quickAddProduct.availableFlavors.map((flavor) => (
                  <option key={flavor.name} value={flavor.name}>
                    {flavor.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label id="quick-add-weight" className="block">
            <span className="mb-2 block text-sm font-medium text-primary-700">
              {quickAddPortionMeta.heading}
            </span>
            <select
              value={quickAddWeight}
              onChange={(event) => setQuickAddWeight(event.target.value)}
              className="w-full rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-sm text-primary-800 outline-none transition focus:border-primary-600 focus:bg-white focus:ring-1 focus:ring-primary-600"
            >
              <option value="">{`Select ${quickAddPortionMeta.singular}`}</option>
              {quickAddWeights.map((weight) => (
                <option key={weight.label} value={weight.label}>
                  {weight.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-primary-700">
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setQuickAddQuantity((current) => Math.max(1, current - 1))
                }
                className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-lg font-bold text-primary-700 hover:bg-cream-100"
              >
                -
              </button>
              <div className="min-w-[72px] rounded-xl border border-primary-200 bg-white px-4 py-3 text-center text-base font-bold text-primary-800">
                {quickAddQuantity}
              </div>
              <button
                type="button"
                onClick={() => setQuickAddQuantity((current) => current + 1)}
                className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-lg font-bold text-primary-700 hover:bg-cream-100"
              >
                +
              </button>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeQuickAdd}
            className="inline-flex items-center justify-center rounded-full border border-primary-200 px-5 py-3 font-medium text-primary-700 hover:bg-cream-100 active:scale-95 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 font-medium text-white hover:shadow-warm active:scale-[0.97] transition-all"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuQuickAddModal;
