import React, { useState } from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

const AdminGalleryOptionSection = ({
  title,
  description,
  placeholder,
  options,
  selectedValues,
  usesFieldToggle = false,
  fieldToggleValue = "",
  canDeleteSection = false,
  pendingValue,
  priceEntries = [],
  priceInputHeading = "",
  priceInputHint = "",
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
    <fieldset className="rounded-3xl border-[4px] border-primary-900 px-4 pb-4 pt-2">
      <legend className="px-3 text-base font-semibold text-primary-900 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleAllOptions(!isAllSelected)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 admin-motion ${
            isAllSelected
              ? "border-primary-900 bg-primary-900 text-white"
              : "border-primary-300 bg-white hover:border-primary-500"
          }`}
          aria-label={isAllSelected ? `Deselect all ${title}` : `Select all ${title}`}
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
              ? "bg-[#fff5d8] text-primary-900 border border-[rgba(201,168,76,0.5)]" 
              : "text-primary-400 hover:text-primary-700 hover:bg-gold-50"
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

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-primary-600">{description}</p>
        <StatusChip tone="accent">
          {usesFieldToggle ? "Enable field" : "Select boxes"}
        </StatusChip>
      </div>

      <div className="mt-4 grid gap-3">
        {resolvedOptions.map((option) => {
          const isSelected = selectedValues.includes(option);

          return (
            <button
              key={`${title}-${option}`}
              type="button"
              onClick={() => onToggleOption(option)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left admin-motion ${
                isSelected
                  ? "border-primary-900 bg-[#fff5d8] shadow-[0_8px_18px_rgba(18,12,2,0.12)]"
                  : "border-[rgba(42,31,14,0.3)] bg-white/90"
              }`}
            >
              <span
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center border-[3px] ${
                  isSelected
                    ? "border-primary-900 bg-[#f4dfac]"
                    : "border-primary-900 bg-white"
                }`}
              >
                {isSelected ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-primary-900"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-900">
                  {option}
                </span>
                <span className="text-xs text-primary-600">
                  {isSelected ? "Enabled" : "Disabled"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {onPriceChange ? (
        <div className="mt-4 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              {priceInputHeading || "Set price for this cake"}
            </p>
            {priceInputHint ? (
              <p className="mt-1 text-xs text-primary-600">{priceInputHint}</p>
            ) : null}
          </div>

          {!priceEntries.length ? (
            <p className="text-sm text-primary-600">
              Select an option above to enter its price for this image.
            </p>
          ) : (
            <div className="grid gap-3">
              {priceEntries.map((entry) => (
                <label
                  key={`${title}-price-${entry.option}`}
                  className="grid gap-2 rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[#fffaf0] p-3 sm:grid-cols-[1fr,180px] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary-900">
                      {entry.option}
                    </p>
                    <p className="text-xs text-primary-600">
                      Price for this cake image
                    </p>
                  </div>
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
            <div className="mt-4 space-y-2 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                Manage Field
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
              <div className="mt-4 space-y-2 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                  Manage Fields
                </p>
                {options.map((option, index) => (
                  <div
                    key={`${title}-manage-${index}`}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => onRenameOption(index, event.target.value)}
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

              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-gold-200/80 bg-gold-50/40 p-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={pendingValue}
                  onChange={(event) => onPendingValueChange(event.target.value)}
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
