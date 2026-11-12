import React from "react";
import { FiSearch } from "react-icons/fi";

/* Filter chips: one row that scrolls sideways instead of wrapping into a
 * block, so a long category list never pushes the page content down. */
export const ChipRow = ({ options, value, onChange, className = "" }) => (
  <div
    className={`flex gap-2 overflow-x-auto pb-0.5 no-scrollbar ${className}`}
    role="tablist"
  >
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          type="button"
          role="tab"
          aria-selected={active}
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold admin-motion ${
            active
              ? "bg-[#1f1709] text-[#f3dd96]"
              : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  className = "",
}) => (
  <label className={`relative block ${className}`}>
    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8936a]" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="ws-input !pl-9"
    />
  </label>
);

/* Search on the left, actions on the right, chips underneath. */
const WorkspaceToolbar = ({
  search,
  actions,
  chips,
  footer,
  className = "",
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex flex-wrap items-center gap-2">
      {search && <SearchInput {...search} className="min-w-[180px] flex-1" />}
      {actions && (
        <div className="ws-toolbar-actions flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
    {chips && <ChipRow {...chips} />}
    {footer}
  </div>
);

export default WorkspaceToolbar;
