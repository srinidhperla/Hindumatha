import React, { useMemo } from "react";
import { StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const getSelectionOption = (selections = [], sectionKey) =>
  String(
    (Array.isArray(selections) ? selections : []).find(
      (selection) => selection.sectionKey === sectionKey,
    )?.option || "",
  ).trim();

const AdminGalleryCombinationPricingSection = ({
  combinations = [],
  cakeTypes = [],
  eggOptions = [],
  flavorOptions = [],
  onToggleCombination,
  onChangeCombinationPrice,
}) => {
  const combinationsByKey = useMemo(
    () =>
      new Map(
        combinations.map((entry) => [
          [
            getSelectionOption(entry.selections, "cakeTypes"),
            getSelectionOption(entry.selections, "eggOptions"),
            getSelectionOption(entry.selections, "flavors"),
          ].join("||"),
          entry,
        ]),
      ),
    [combinations],
  );

  if (!cakeTypes.length || !eggOptions.length || !flavorOptions.length) {
    return (
      <SurfaceCard className="p-4 sm:p-5">
        <p className="text-sm text-primary-600">
          Add Cake Type, Egg Type, and Flavor options first to build the pricing matrix.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
            Combination Pricing
          </h3>
          <p className="mt-1 text-sm text-primary-600">
            Set one base price per kg for each Cake Type, Egg Type, and Flavor combination.
          </p>
        </div>
        <StatusChip tone="accent">
          {cakeTypes.length * eggOptions.length * flavorOptions.length} combos
        </StatusChip>
      </div>

      <div className="space-y-5">
        {cakeTypes.map((cakeType) => (
          <div
            key={cakeType}
            className="rounded-3xl border border-[rgba(201,168,76,0.26)] bg-white/80 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[rgba(42,31,14,0.16)] pb-3">
              <h4 className="text-lg font-bold text-primary-900">{cakeType}</h4>
              <StatusChip tone="info">{eggOptions.length} egg columns</StatusChip>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
                      Flavor
                    </th>
                    {eggOptions.map((eggType) => (
                      <th
                        key={`${cakeType}-${eggType}-heading`}
                        className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-600"
                      >
                        {eggType}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flavorOptions.map((flavor) => (
                    <tr key={`${cakeType}-${flavor}`}>
                      <td className="px-3 py-2 align-top text-sm font-semibold text-primary-900">
                        {flavor}
                      </td>
                      {eggOptions.map((eggType) => {
                        const mapKey = [cakeType, eggType, flavor].join("||");
                        const entry = combinationsByKey.get(mapKey);
                        const isEnabled = Boolean(entry?.isEnabled);

                        return (
                          <td key={mapKey} className="px-3 py-2 align-top">
                            <div
                              className={`rounded-2xl border p-3 admin-motion ${
                                isEnabled
                                  ? "border-primary-900 bg-[#fff5d8]"
                                  : "border-[rgba(42,31,14,0.18)] bg-white"
                              }`}
                            >
                              <label className="flex items-center gap-2 text-sm font-medium text-primary-900">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(event) =>
                                    onToggleCombination(entry?.selections || [
                                      {
                                        sectionKey: "cakeTypes",
                                        sectionTitle: "Cake Type",
                                        option: cakeType,
                                      },
                                      {
                                        sectionKey: "eggOptions",
                                        sectionTitle: "Egg Type",
                                        option: eggType,
                                      },
                                      {
                                        sectionKey: "flavors",
                                        sectionTitle: "Flavor",
                                        option: flavor,
                                      },
                                    ], event.target.checked)
                                  }
                                />
                                {isEnabled ? "Enabled" : "Disabled"}
                              </label>

                              <label className="mt-3 block text-xs font-medium uppercase tracking-[0.12em] text-primary-600">
                                Price per kg
                                <input
                                  type="number"
                                  min="0"
                                  value={entry?.price ?? 0}
                                  disabled={!isEnabled}
                                  onChange={(event) =>
                                    onChangeCombinationPrice(
                                      entry?.selections || [
                                        {
                                          sectionKey: "cakeTypes",
                                          sectionTitle: "Cake Type",
                                          option: cakeType,
                                        },
                                        {
                                          sectionKey: "eggOptions",
                                          sectionTitle: "Egg Type",
                                          option: eggType,
                                        },
                                        {
                                          sectionKey: "flavors",
                                          sectionTitle: "Flavor",
                                          option: flavor,
                                        },
                                      ],
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 block w-full rounded-xl border border-gold-200/70 bg-white px-3 py-2 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70 disabled:cursor-not-allowed disabled:bg-primary-50/60"
                                />
                              </label>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
};

export default AdminGalleryCombinationPricingSection;
