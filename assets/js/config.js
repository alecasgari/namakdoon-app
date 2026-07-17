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
    mediaBase: "https://n8n.alecasgari.com/media",
    defaultOgImage: `${siteUrl}${basePath}/assets/img/og-cover.png`.replace(
      /([^:]\/)\/+/g,
      "$1"
    ),
    endpoints: {
      list: "/namakdoon-list",
      get: "/namakdoon-get",
      create: "/namakdoon-create",
      update: "/namakdoon-update",
      delete: "/namakdoon-delete",
      auth: "/namakdoon-auth",
      upload: "/namakdoon-upload",
      sitemap: "/namakdoon-sitemap",
    },
    adminTokenKey: "namakdoon_admin_token",
    themeKey: "namakdoon_theme",
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

  window.namakSlugify = function (value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06ff\u0750-\u077fa-z0-9-]+/gi, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  };

  window.namakRecipeUrl = function (recipe) {
    if (!recipe) return window.namakPath("recipe/");
    const slug = String(recipe.slug || "").trim();
    if (slug && slug !== String(recipe.id)) {
      return window.namakPath(`recipe/?slug=${encodeURIComponent(slug)}`);
    }
    if (slug) {
      return window.namakPath(`recipe/?slug=${encodeURIComponent(slug)}`);
    }
    return window.namakPath(`recipe/?id=${encodeURIComponent(recipe.id)}`);
  };

  window.namakAbsoluteUrl = function (pathOrUrl) {
    if (!pathOrUrl) return siteUrl + (basePath || "") + "/";
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith("/")
      ? pathOrUrl
      : window.namakPath(pathOrUrl);
    return `${siteUrl}${path}`;
  };
})();
