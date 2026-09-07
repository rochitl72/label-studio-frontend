/* Deployment configuration for the RBG Annotation Studio frontend.
 *
 * Loaded before the bundled app (see index.html), so this wins over the
 * build-time VITE_API_BASE_URL default in src/lib/config.js. Edit this file
 * directly on the server -- it is plain JavaScript, served as-is by nginx,
 * and needs no rebuild.
 *
 * window.API_BASE_PATH -- where the backend API is reached from the browser.
 *
 *   ""                    the page and the API share an origin; every
 *                          request goes to /api/... unchanged. Correct when
 *                          nginx (see nginx/) serves this build and forwards
 *                          /api/ + /health to the backend on the same
 *                          host/port. This is the default -- leave it alone
 *                          for a standard deployment.
 *   "/bkd"                the edge routes by path instead: the browser calls
 *                          /bkd/api/..., and the proxy strips the prefix
 *                          before the backend sees it.
 *   "http://host:8000"    a separately-hosted backend on another origin
 *                          entirely -- requires CORS_ORIGINS on the backend
 *                          (see backend/config.py) to include this
 *                          frontend's real origin, or every request fails.
 *
 * Leave this empty ("") for the standard same-origin deployment -- no CORS
 * configuration exists or is needed anywhere in this stack when you do.
 */
window.API_BASE_PATH = "";
