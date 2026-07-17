/**
 * Namakdoon site + API config
 */
(function () {
  const host = window.location.hostname;
  const isCustomDomain =
    host === "namakdoon.alecasgari.com" || host === "www.namakdoon.alecasgari.com";
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

  const basePath = isCustomDomain || isLocal ? "" : "/namakdoon-app";
  const siteUrl = isCustomDomain
    ? "https://namakdoon.alecasgari.com"
    : isLocal
      ? window.location.origin
      : "https://alecasgari.github.io/namakdoon-app";

  window.NAMAKDOON = {
    brand: "نمکدون",
    brandEn: "Namakdoon",
    siteUrl,
    basePath,
    apiBase: "https://n8n.alecasgari.com/webhook",
    endpoints: {
      list: "/namakdoon-list",
      get: "/namakdoon-get",
      create: "/namakdoon-create",
      update: "/namakdoon-update",
      delete: "/namakdoon-delete",
      auth: "/namakdoon-auth",
    },
    adminTokenKey: "namakdoon_admin_token",
  };

  window.namakPath = function (path) {
    const clean = String(path ?? "")
      .replace(/^\//, "")
      .replace(/^\.\//, "");
    if (!clean) {
      return basePath ? `${basePath}/` : "/";
    }
    const joined = `${basePath}/${clean}`.replace(/\/{2,}/g, "/");
    return joined.startsWith("/") ? joined : `/${joined}`;
  };

  window.namakSearchUrl = function (query) {
    const q = String(query || "").trim();
    const base = window.namakPath("recipes/");
    return q ? `${base}?q=${encodeURIComponent(q)}` : base;
  };
})();
