import React from "react";
import { formatINR } from "@/utils/currency";
import { getVariantPrice, isEggTypeAvailable } from "@/utils/productOptions";

const FoodPreferenceMark = ({ type = "egg" }) => {
  const isEggless = type === "eggless";

  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border-[2.5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
        isEggless
          ? "border-[#25803b] bg-[#f1fff4]"
          : "border-[#7a4b1d] bg-[#fff4ef]"
      }`}
      aria-hidden="true"
    >
      <span
        className={`h-5 w-5 rounded-full ${
          isEggless ? "bg-[#22c55e]" : "bg-[#ef4444]"
        }`}
      />
    </span>
  );
};

const MenuQuickAddModal = ({
  quickAddProduct,
  quickAddPortionMeta,
  quickAddEggType,
  setQuickAddEggType,
  quickAddFlavor,
  setQuickAddFlavor,
  quickAddFlavors,
  quickAddWeight,
  setQuickAddWeight,
  quickAddQuantity,
  setQuickAddQuantity,
  quickAddWeights,
  quickAddErrors,
  closeQuickAdd,
  handleQuickAdd,
}) => {
  if (!quickAddProduct) {
    return null;
  }

  const hasEgg = quickAddProduct.isEgg !== false;
  const hasEggless = quickAddProduct.isEggless === true;
  const needsEggType = hasEgg && hasEggless;
  const needsFlavorSelection = quickAddProduct.hasExplicitFlavors;
  const hasWeightOptions = (quickAddProduct.availableWeights?.length || 0) > 0;
  const flavorLocked = needsEggType && !quickAddEggType;
  const weightLockedReason = flavorLocked
    ? "Select Cake Type first"
    : needsFlavorSelection && !quickAddFlavor
      ? "Select Flavor first"
      : "";
  const flavorChoices = quickAddFlavors || [];
  const weightChoices = weightLockedReason
    ? quickAddProduct.availableWeights || []
    : quickAddWeights;
  const resolvedFlavor = quickAddFlavor || quickAddFlavors?.[0]?.name || "";
  const canShowVariantPrice =
    (!hasWeightOptions || Boolean(quickAddWeight)) &&
    (!needsEggType || Boolean(quickAddEggType)) &&
    (!needsFlavorSelection || Boolean(quickAddFlavor));
  const selectedUnitPrice = canShowVariantPrice
    ? getVariantPrice(quickAddProduct, {
        flavorName: resolvedFlavor,
        weightLabel: quickAddWeight,
        eggType: quickAddEggType,
      })
    : 0;
  const selectedTotalPrice = selectedUnitPrice * Number(quickAddQuantity || 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/60 backdrop-blur-sm animate-fadeIn sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeQuickAdd();
        }
      }}
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/50 bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ee_100%)] p-3.5 shadow-[0_26px_70px_rgba(37,18,4,0.32)] animate-fadeInUp sm:max-w-md sm:rounded-[28px] sm:p-4">
        <div className="mb-3 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-primary-200" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">
              Required details
            </p>
            <h3 className="mt-1.5 text-[1.55rem] font-black leading-none text-primary-800 sm:text-[1.75rem]">
              Add {quickAddProduct.name}
            </h3>
            <p className="mt-1.5 max-w-md text-[13px] leading-5 text-primary-500">
              Choose the required details and quantity before adding this
              product to cart.
            </p>
          </div>

          <button
            type="button"
            onClick={closeQuickAdd}
            className="shrink-0 rounded-full border border-[#ecdcc7] bg-white px-3.5 py-1.5 text-xs font-semibold text-primary-600 shadow-sm transition hover:bg-cream-100 active:scale-95"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {(() => {
            const eggOn =
              quickAddProduct.isEgg !== false &&
              isEggTypeAvailable(quickAddProduct, "egg");
            const egglessOn =
              quickAddProduct.isEggless === true &&
              isEggTypeAvailable(quickAddProduct, "eggless");

            if (!eggOn && !egglessOn) {
              return null;
            }

            return (
              <div id="quick-add-type">
                <span className="mb-2 block text-xs font-semibold text-primary-700">
                  Cake Type
                </span>

                <div className="grid gap-2 sm:grid-cols-2">
                  {eggOn && (
                    <button
                      type="button"
                      onClick={() => setQuickAddEggType("egg")}
                      className={`flex min-h-[82px] items-center gap-2.5 rounded-[18px] border px-3 py-3 text-left transition-all ${
                        quickAddEggType === "egg"
                          ? "border-[#d05b4c] bg-[#fff1ed] text-[#8f2d22] shadow-[0_16px_30px_rgba(208,91,76,0.15)]"
                          : "border-[#ead8c2] bg-white text-primary-600 hover:border-[#d9b388] hover:bg-[#fff9f2]"
                      }`}
                    >
                      <FoodPreferenceMark type="egg" />
                      <span className="flex flex-col">
                        <span className="text-sm font-black">Egg</span>
                        <span className="text-xs font-semibold text-[#8f4d39]">
                          Non-Veg
                        </span>
                      </span>
                    </button>
                  )}

                  {egglessOn && (
                    <button
                      type="button"
                      onClick={() => setQuickAddEggType("eggless")}
                      className={`flex min-h-[82px] items-center gap-2.5 rounded-[18px] border px-3 py-3 text-left transition-all ${
                        quickAddEggType === "eggless"
                          ? "border-[#47a55b] bg-[#effcf2] text-[#1b6a31] shadow-[0_16px_30px_rgba(71,165,91,0.15)]"
                          : "border-[#ead8c2] bg-white text-primary-600 hover:border-[#9ed1a9] hover:bg-[#f7fff7]"
                      }`}
                    >
                      <FoodPreferenceMark type="eggless" />
                      <span className="flex flex-col">
                        <span className="text-sm font-black">Eggless</span>
                        <span className="text-xs font-semibold text-[#2f7f43]">
                          Veg
                        </span>
                      </span>
                    </button>
                  )}
                </div>
                {quickAddErrors?.cakeType && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {quickAddErrors.cakeType}
                  </p>
                )}
              </div>
            );
          })()}

          {quickAddProduct.hasExplicitFlavors && (
            <div
              id="quick-add-flavor"
              className={flavorLocked ? "opacity-55" : ""}
            >
              <span className="mb-2 block text-xs font-semibold text-primary-700">
                Flavor
              </span>
              {flavorLocked && (
                <p className="mb-2 text-[11px] font-medium text-primary-400">
                  Lock Select Cake Type first
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {flavorChoices.map((flavor) => {
                  const isSelected = quickAddFlavor === flavor.name;

                  return (
                    <button
                      key={flavor.name}
                      type="button"
                      onClick={() => setQuickAddFlavor(flavor.name)}
                      aria-disabled={flavorLocked}
                      className={`min-h-[38px] rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-[#b45f40] bg-[#b45f40] text-white shadow-[0_14px_26px_rgba(180,95,64,0.26)]"
                          : flavorLocked
                            ? "cursor-not-allowed border-[#e8dfd3] bg-[#f7f4ef] text-primary-400"
                            : "border-[#ead8c2] bg-white text-primary-700 hover:border-[#d3b18f] hover:bg-[#fff8f1]"
                      }`}
                    >
                      {flavor.name}
                    </button>
                  );
                })}
              </div>
              {quickAddErrors?.flavor && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {quickAddErrors.flavor}
                </p>
              )}
            </div>
          )}

          {hasWeightOptions && (
            <div
              id="quick-add-weight"
              className={weightLockedReason ? "opacity-55" : ""}
            >
              <span className="mb-2 block text-xs font-semibold text-primary-700">
                {quickAddPortionMeta.heading}
              </span>
              {weightLockedReason && (
                <p className="mb-2 text-[11px] font-medium text-primary-400">
                  {`Lock ${weightLockedReason}`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {weightChoices.map((weight) => {
                  const isSelected = quickAddWeight === weight.label;

                  return (
                    <button
                      key={weight.label}
                      type="button"
                      onClick={() => setQuickAddWeight(weight.label)}
                      aria-disabled={Boolean(weightLockedReason)}
                      className={`min-h-[38px] rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-[#b45f40] bg-[#b45f40] text-white shadow-[0_14px_26px_rgba(180,95,64,0.26)]"
                          : weightLockedReason
                            ? "cursor-not-allowed border-[#e8dfd3] bg-[#f7f4ef] text-primary-400"
                            : "border-[#ead8c2] bg-white text-primary-700 hover:border-[#d3b18f] hover:bg-[#fff8f1]"
                      }`}
                    >
                      {weight.label}
                    </button>
                  );
                })}
              </div>
              {quickAddErrors?.weight && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {quickAddErrors.weight}
                </p>
              )}
            </div>
          )}

          <div>
            <span className="mb-2 block text-xs font-semibold text-primary-700">
              Quantity
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setQuickAddQuantity((current) => Math.max(1, current - 1))
                }
                className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-[#dec7ab] bg-white text-[1.5rem] font-black text-primary-700 shadow-sm hover:bg-[#fff8f1]"
              >
                -
              </button>
              <div className="flex h-11 min-w-[72px] items-center justify-center rounded-[15px] border border-[#e7d6c2] bg-[#fffaf4] px-4 text-lg font-black text-primary-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                {quickAddQuantity}
              </div>
              <button
                type="button"
                onClick={() => setQuickAddQuantity((current) => current + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-[#dec7ab] bg-white text-[1.5rem] font-black text-primary-700 shadow-sm hover:bg-[#fff8f1]"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#f0d8b7] bg-[linear-gradient(180deg,rgba(255,250,239,0.96),rgba(252,239,213,0.98))] p-3 shadow-[0_18px_36px_rgba(163,113,35,0.12)]">
            {canShowVariantPrice ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white/85 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-primary-700">
                    Price per item
                  </p>
                  <p className="mt-1 text-2xl font-black text-primary-900">
                    {formatINR(selectedUnitPrice)}
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#b45f40] p-3 text-white shadow-[0_16px_30px_rgba(180,95,64,0.22)]">
                  <p className="text-xs font-semibold text-white/85">Total</p>
                  <p className="mt-1 text-2xl font-black">
                    {formatINR(selectedTotalPrice)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[18px] bg-white/85 p-3 text-xs font-medium text-primary-600 shadow-sm">
                {hasWeightOptions
                  ? `Select flavor, cake type, and ${quickAddPortionMeta.singular.toLowerCase()} to see the exact price.`
                  : "Select flavor and cake type to see the exact price."}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={closeQuickAdd}
            className="inline-flex w-full items-center justify-center rounded-full border border-[#e7d6c2] bg-white px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-[#fff8f1] active:scale-[0.99]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#b45f40,#8f3f24)] px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_34px_rgba(143,63,36,0.3)] transition-all hover:brightness-105 active:scale-[0.99]"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuQuickAddModal;
