import React, { useState } from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-2.5 text-sm text-[#1f1709] shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]";

const AdminGalleryOptionSection = ({
  title,
  placeholder,
  options,
  selectedValues,
  usesFieldToggle = false,
  fieldToggleValue = "",
  canDeleteSection = false,
  pendingValue,
  priceEntries = [],
  onPendingValueChange,
  onPriceChange,
  onToggleOption,
  onToggleAllOptions,
  onAddOption,
  onRenameOption,
  onDeleteOption,
  onRenameSection,
  onDeleteSection,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const resolvedOptions = usesFieldToggle
    ? [String(fieldToggleValue || "").trim()].filter(Boolean)
    : options;
  const isAllSelected =
    resolvedOptions.length > 0 &&
    resolvedOptions.every((option) => selectedValues.includes(option));

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <fieldset className="rounded-2xl border border-[#e3d7bb] px-4 pb-4 pt-2">
        <legend className="px-3 text-base font-semibold text-[#1f1709] flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleAllOptions(!isAllSelected)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 admin-motion ${
              isAllSelected
                ? "border-[#1f1709] bg-[#1f1709] text-[#f3dd96]"
                : "border-[#ebe1cb] bg-white hover:border-primary-500"
            }`}
            aria-label={
              isAllSelected ? `Deselect all ${title}` : `Select all ${title}`
            }
          >
            {isAllSelected && (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          {title}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full admin-motion ${
              isEditing
                ? "bg-[#faf6ec] text-[#1f1709] border border-[rgba(201,168,76,0.5)]"
                : "text-[#7d6c4d] hover:text-[#5c4a26] hover:bg-[#faf6ec]"
            }`}
            aria-label={`Edit ${title} options`}
            title={`Edit ${title} options`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        </legend>

        <div className="flex flex-wrap gap-1.5">
          {resolvedOptions.map((option) => {
            const isSelected = selectedValues.includes(option);

            return (
              <button
                key={`${title}-${option}`}
                type="button"
                onClick={() => onToggleOption(option)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold admin-motion ${
                  isSelected
                    ? "border-[#1f1709] bg-[#1f1709] text-[#f3dd96]"
                    : "border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
                }`}
              >
                {isSelected ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
                {option}
              </button>
            );
          })}
        </div>

        {onPriceChange && priceEntries.length ? (
          <div className="mt-3">
            <div className="mb-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c4a26]">
                Price for this cake (₹)
              </p>
            </div>

            {!priceEntries.length ? (
              <p className="text-sm text-[#5c4a26]">
                Select an option above to enter its price for this image.
              </p>
            ) : (
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {priceEntries.map((entry) => (
                  <label
                    key={`${title}-price-${entry.option}`}
                    className="grid grid-cols-[1fr,110px] items-center gap-2"
                  >
                    <span className="truncate text-sm font-medium text-[#1f1709]">
                      {entry.option}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={entry.price}
                      onChange={(event) =>
                        onPriceChange(entry.option, event.target.value)
                      }
                      className={inputClassName}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {isEditing ? (
          <>
            {onRenameSection ? (
              <div className="mt-3 space-y-2 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c4a26]">
                  Manage Field
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => onRenameSection?.(event.target.value)}
                    className={inputClassName}
                  />
                  <ActionButton
                    type="button"
                    variant="danger"
                    disabled={!canDeleteSection}
                    onClick={() => onDeleteSection?.()}
                  >
                    Delete Field
                  </ActionButton>
                </div>
              </div>
            ) : null}

            {!usesFieldToggle ? (
              <>
                <div className="mt-3 space-y-2 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c4a26]">
                    Manage Fields
                  </p>
                  {options.map((option, index) => (
                    <div
                      key={`${title}-manage-${index}`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          onRenameOption(index, event.target.value)
                        }
                        className={inputClassName}
                      />
                      <ActionButton
                        type="button"
                        variant="danger"
                        onClick={() => onDeleteOption(index)}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingValue}
                    onChange={(event) =>
                      onPendingValueChange(event.target.value)
                    }
                    placeholder={placeholder}
                    className={inputClassName}
                  />
                  <ActionButton type="button" onClick={onAddOption}>
                    Add
                  </ActionButton>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </fieldset>
    </SurfaceCard>
  );
};

export default AdminGalleryOptionSection;
