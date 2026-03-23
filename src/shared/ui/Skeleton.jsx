import React from "react";

/**
 * Skeleton loading component with various variants
 * Uses the skeleton animation defined in global CSS
 */

const Skeleton = ({ className = "", variant = "default" }) => {
  const baseClass = "skeleton";

  const variantClasses = {
    default: "h-4 w-full rounded",
    text: "skeleton-text h-4 rounded",
    title: "h-8 w-3/4 rounded",
    avatar: "h-12 w-12 rounded-full",
    image: "skeleton-image h-48 w-full rounded-xl",
    card: "h-64 w-full rounded-2xl",
    button: "h-10 w-24 rounded-full",
    circle: "h-10 w-10 rounded-full",
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant] || variantClasses.default} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Pre-built skeleton patterns for common use cases
 */

export const ProductCardSkeleton = () => (
  <div className="glass-card overflow-hidden">
    <Skeleton variant="image" className="h-48" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="title" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton variant="button" />
      </div>
    </div>
  </div>
);

export const MenuItemSkeleton = () => (
  <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-4 rounded-2xl border border-primary-100 bg-cream-50 p-4 sm:grid-cols-[minmax(0,1fr)_140px]">
    <div className="space-y-3">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="title" className="w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-16" />
      </div>
    </div>
    <Skeleton variant="image" className="h-[100px] sm:h-[140px] rounded-xl" />
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="w-20" />
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
    <div className="flex items-center justify-between pt-2">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="button" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="glass-card p-6 space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton variant="avatar" className="h-16 w-16" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
    <Skeleton variant="button" className="w-full h-12" />
  </div>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton variant="text" />
      </td>
    ))}
  </tr>
);

export const GalleryImageSkeleton = () => (
  <div className="aspect-square overflow-hidden rounded-xl">
    <Skeleton variant="image" className="h-full w-full" />
  </div>
);

export default Skeleton;
