/* Remembers where the visitor was in the gallery while a photo is open.
 *
 * The photo view is its own route (/gallery/photo/:code), so the Gallery page
 * unmounts while it is showing and would otherwise come back with its search,
 * filters and scroll position reset. Kept in memory only: a page refresh
 * starts the gallery fresh, which is what a refresh should do. */

let savedView = null;

export const saveGalleryView = (view) => {
  savedView = view;
};

export const peekGalleryView = () => savedView;

export const clearGalleryView = () => {
  savedView = null;
};
