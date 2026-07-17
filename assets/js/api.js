(function () {
  const { apiBase, endpoints, adminTokenKey, mediaBase } = window.NAMAKDOON;

  function url(endpoint, query) {
    const u = new URL(`${apiBase}${endpoint}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
      });
    }
    return u.toString();
  }

  function getAdminToken() {
    return sessionStorage.getItem(adminTokenKey) || "";
  }

  function setAdminToken(token) {
    if (token) sessionStorage.setItem(adminTokenKey, token);
    else sessionStorage.removeItem(adminTokenKey);
  }

  function mediaUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = (mediaBase || "").replace(/\/$/, "");
    const clean = String(path).replace(/^\//, "");
    return `${base}/${clean}`;
  }

  async function request(endpoint, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (options.admin) {
      const token = getAdminToken();
      if (!token) throw new Error("توکن ادمین تنظیم نشده است.");
      headers["X-Admin-Token"] = token;
    }

    const res = await fetch(url(endpoint, options.query), {
      method: options.method || "GET",
      headers,
      body: options.body,
    });

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `خطای سرور (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  function normalizeRecipe(row) {
    if (!row) return null;
    const parseMaybe = (value, fallback) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string" && value.trim()) {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    return {
      id: row.id ?? row.recipe_id ?? "",
      slug: row.slug || String(row.id || ""),
      title: row.title || "بدون عنوان",
      description: row.description || "",
      ingredients: parseMaybe(row.ingredients, []),
      steps: parseMaybe(row.steps, []),
      prep_time: Number(row.prep_time) || 0,
      cook_time: Number(row.cook_time) || 0,
      servings_base: Number(row.servings_base) || 4,
      meal_type: row.meal_type || "",
      tags: parseMaybe(row.tags, []).length
        ? parseMaybe(row.tags, [])
        : String(row.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      tips: row.tips || "",
      calories: Number(row.calories) || 0,
      difficulty: row.difficulty || "متوسط",
      image_url: row.image_url || "",
      video_url: row.video_url || "",
      created_at: row.createdAt || row.created_at || "",
      updated_at: row.updatedAt || row.updated_at || "",
    };
  }

  async function verifyAdminToken(token) {
    const candidate = (token || "").trim();
    if (!candidate) throw new Error("توکن را وارد کنید.");

    const res = await fetch(url(endpoints.auth), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": candidate,
      },
      body: JSON.stringify({}),
    });

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      throw new Error(
        (data && (data.error || data.message)) || "توکن نادرست است."
      );
    }
    return data;
  }

  window.NamakAPI = {
    getAdminToken,
    setAdminToken,
    verifyAdminToken,
    mediaUrl,
    async listRecipes() {
      const data = await request(endpoints.list);
      const rows = Array.isArray(data) ? data : data?.recipes || data?.data || [];
      return rows.map(normalizeRecipe).filter(Boolean);
    },
    async getRecipe(id) {
      const data = await request(endpoints.get, { query: { id } });
      const row = data?.recipe || data?.data || data;
      return normalizeRecipe(row);
    },
    async previewRecipe({ text, audioBlob, filename }) {
      const form = new FormData();
      form.append("mode", "preview");
      if (text) form.append("text", text);
      if (audioBlob) form.append("audio", audioBlob, filename || "recording.webm");
      return request(endpoints.create, {
        method: "POST",
        admin: true,
        body: form,
      });
    },
    async publishRecipe(payload) {
      return request(endpoints.create, {
        method: "POST",
        admin: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "publish", ...payload }),
      });
    },
    async uploadMedia(file, kind) {
      const form = new FormData();
      form.append("kind", kind || "image");
      form.append("file", file, file.name || `${kind || "file"}.bin`);
      return request(endpoints.upload, {
        method: "POST",
        admin: true,
        body: form,
      });
    },
    async updateRecipe(id, payload) {
      return request(endpoints.update, {
        method: "POST",
        admin: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
    },
    async deleteRecipe(id) {
      return request(endpoints.delete, {
        method: "POST",
        admin: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    normalizeRecipe,
  };
})();
