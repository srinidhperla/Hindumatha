import React from "react";

const AddressPickerSearchSection = ({
  addressQuery,
  handleAddressQueryChange,
  addressPredictions,
  handleSelectPrediction,
  addressLookupError,
}) => (
  <div className="px-4 pt-3 sm:px-5">
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={addressQuery}
        onChange={handleAddressQueryChange}
        placeholder="Search for area, street name..."
        className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-11 pr-4 text-sm text-primary-800 placeholder-primary-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        autoFocus
      />
    </div>

    {addressPredictions.length > 0 && (
      <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-primary-200 bg-white shadow-lg">
        {addressPredictions.map((prediction) => {
          const key = prediction.place_id || prediction.description;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="flex w-full items-start gap-3 border-b border-cream-100 px-4 py-3 text-left text-sm text-primary-700 transition hover:bg-caramel-50 last:border-b-0"
            >
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-2">{prediction.description}</span>
            </button>
          );
        })}
      </div>
    )}

    {addressLookupError && (
      <p className="mt-2 text-xs text-amber-600">{addressLookupError}</p>
    )}
  </div>
);

export default AddressPickerSearchSection;
