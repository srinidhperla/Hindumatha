import React from "react";

const ProfileForm = ({
  formData,
  user,
  error,
  loading,
  onChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div>
      <h2 className="mb-1 text-lg font-bold text-[#2a1f0e] sm:text-xl">
        Personal Details
      </h2>
      <p className="text-sm text-[#6a5130]">
        Keep your contact info up to date for faster checkout.
      </p>
    </div>

    <div className="profile-grid">
      <label className="block">
        <span className="commerce-field-label">Full Name</span>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          className="commerce-input"
          required
        />
      </label>

      <label className="block">
        <span className="commerce-field-label">Phone Number</span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          className="commerce-input"
          required
        />
      </label>
    </div>

    {(error || user?.email) && (
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[#f7ecd2a8] px-5 py-4 text-sm text-[#6a5130]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#efe1b8]">
          <svg
            className="h-5 w-5 text-[#7a5c0f]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        </div>
        <div>
          <p>
            Signed in as{" "}
            <span className="font-semibold text-[#2a1f0e]">{user?.email}</span>
          </p>
          {error ? <p className="mt-1 text-red-600">{error}</p> : null}
        </div>
      </div>
    )}

    <div className="flex justify-end">
      <button
        type="submit"
        disabled={loading}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  </form>
);

export default ProfileForm;
