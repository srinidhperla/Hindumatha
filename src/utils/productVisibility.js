/* ── Product channel visibility ────────────────────────────────────────────
 * The ERP and the website share ONE product catalog, so a product carries
 * flags saying where it may appear:
 *
 *   showOnWebsite     — listed in the menu / gallery / home
 *   allowOnlineOrder  — may be added to the cart and ordered
 *   availableInBilling— appears on the shop counter (ERP only, ignored here)
 *   isActive          — master switch; false means archived
 *
 * Why filter here and not in the API: the admin panel and the storefront both
 * read GET /api/products through the same Redux slice. Filtering the endpoint
 * would hide products from the admin too, leaving no way to un-hide them.
 * The server still enforces allowOnlineOrder at checkout — see
 * backend/services/orderWorkflowService.js validateAndPriceOrder.
 *
 * Flags are missing on older documents, so every check treats undefined as
 * "allowed" and only an explicit `false` hides anything.
 * ───────────────────────────────────────────────────────────────────────── */

export const isProductActive = (product) =>
  product?.visibility?.isActive !== false;

export const isVisibleOnWebsite = (product) =>
  isProductActive(product) && product?.visibility?.showOnWebsite !== false;

export const canOrderOnline = (product) =>
  isVisibleOnWebsite(product) && product?.visibility?.allowOnlineOrder !== false;

/** Products the storefront may list. */
export const filterWebsiteProducts = (products = []) =>
  (Array.isArray(products) ? products : []).filter(isVisibleOnWebsite);

/** Products the storefront may sell. */
export const filterOrderableProducts = (products = []) =>
  (Array.isArray(products) ? products : []).filter(canOrderOnline);

/**
 * Reason a product cannot be ordered online, or '' when it can.
 * Used for the "display only" note on a product card.
 */
export const orderBlockReason = (product) => {
  if (!isProductActive(product)) return 'This item is no longer available.';
  if (product?.visibility?.allowOnlineOrder === false) {
    return 'Available in the shop only — please visit us or call to order.';
  }
  return '';
};
