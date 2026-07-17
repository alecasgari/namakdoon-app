(async function () {
  const root = document.querySelector("[data-recipe-root]");
  if (!root) return;
  window.NamakUI.mountShell();

  const params = new URLSearchParams(window.location.search);
  let slug = (params.get("slug") || "").trim();
  let id = (params.get("id") || "").trim();

  // Support path-style /recipe/<slug>/ if ever rewritten here
  if (!slug && !id) {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const recipeIdx = parts.indexOf("recipe");
    if (recipeIdx >= 0 && parts[recipeIdx + 1]) {
      slug = decodeURIComponent(parts[recipeIdx + 1]);
    }
  }

  if (!slug && !id) {
    root.innerHTML = window.NamakUI.emptyState(
      "دستور پیدا نشد",
      "آدرس دستور ناقص است."
    );
    return;
  }

  let recipe = null;
  let servings = 4;

  function setMeta(name, content, attr = "name") {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function syncSeo(r) {
    const { siteUrl, defaultOgImage } = window.NAMAKDOON;
    const pageUrl = window.namakAbsoluteUrl(window.namakRecipeUrl(r));
    const image =
      window.NamakAPI.mediaUrl(r.image_url) ||
      window.NamakAPI.mediaUrl(r.video_url) ||
      defaultOgImage;
    const description = r.description || `${r.title} — دستور آشپزی در نمکدون`;

    document.title = `${r.title} | نمکدون`;
    setMeta("description", description);
    setMeta("robots", "index,follow,max-image-preview:large");
    setMeta("og:type", "article", "property");
    setMeta("og:locale", "fa_IR", "property");
    setMeta("og:site_name", "نمکدون", "property");
    setMeta("og:title", `${r.title} | نمکدون`, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", pageUrl, "property");
    setMeta("og:image", image, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", r.title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);

    if (window.history?.replaceState) {
      const next = window.namakRecipeUrl(r);
      if (`${window.location.pathname}${window.location.search}` !== next) {
        window.history.replaceState({}, "", next);
      }
    }
  }

  function syncJsonLd(r) {
    const el = document.getElementById("recipe-jsonld");
    if (!el) return;
    const image =
      window.NamakAPI.mediaUrl(r.image_url) ||
      window.NamakAPI.mediaUrl(r.video_url) ||
      undefined;
    const pageUrl = window.namakAbsoluteUrl(window.namakRecipeUrl(r));
    const data = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: r.title,
      description: r.description,
      url: pageUrl,
      image: image ? [image] : undefined,
      inLanguage: "fa",
      author: {
        "@type": "Organization",
        name: "نمکدون",
        url: window.NAMAKDOON.siteUrl,
      },
      recipeYield: `${r.servings_base} نفر`,
      prepTime: `PT${r.prep_time || 0}M`,
      cookTime: `PT${r.cook_time || 0}M`,
      totalTime: `PT${window.NamakScale.totalTime(r)}M`,
      recipeCategory: r.meal_type || undefined,
      keywords: (r.tags || []).join(", "),
      recipeIngredient: (r.ingredients || []).map((i) =>
        typeof i === "string"
          ? i
          : [i.amount, i.unit, i.name].filter(Boolean).join(" ")
      ),
      recipeInstructions: (r.steps || []).map((s, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        text: typeof s === "string" ? s : s.text || s.title || "",
      })),
      nutrition: r.calories
        ? {
            "@type": "NutritionInformation",
            calories: `${r.calories} کالری`,
          }
        : undefined,
      video: window.NamakAPI.mediaUrl(r.video_url)
        ? {
            "@type": "VideoObject",
            name: r.title,
            contentUrl: window.NamakAPI.mediaUrl(r.video_url),
            thumbnailUrl: window.NamakAPI.mediaUrl(r.image_url) || undefined,
          }
        : undefined,
    };
    el.textContent = JSON.stringify(data);
  }

  function mediaHtml(r) {
    const { escapeHtml } = window.NamakUI;
    const image = window.NamakAPI.mediaUrl(r.image_url);
    const video = window.NamakAPI.mediaUrl(r.video_url);
    if (!image && !video) return "";
    const parts = [];
    if (image) {
      parts.push(`
        <button type="button" class="media-zoom" data-lightbox="${escapeHtml(image)}" aria-label="بزرگ‌نمایی عکس">
          <img class="media-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(r.title)}" />
          <span class="media-zoom-hint">برای بزرگ‌نمایی لمس کنید</span>
        </button>
      `);
    }
    if (video) {
      parts.push(`
        <div class="recipe-video">
          <video class="media-video" src="${escapeHtml(video)}" controls playsinline preload="metadata"></video>
        </div>
      `);
    }
    return `<div class="recipe-media">${parts.join("")}</div>`;
  }

  function render() {
    const scaled = window.NamakScale.scaleIngredients(
      recipe.ingredients,
      recipe.servings_base,
      servings
    );
    const { escapeHtml, icon, difficultyLabel } = window.NamakUI;
    const { toPersianDigits, totalTime } = window.NamakScale;

    syncSeo(recipe);
    syncJsonLd(recipe);

    root.innerHTML = `
      <section class="recipe-hero reveal">
        <div class="panel recipe-title-block">
          ${mediaHtml(recipe)}
          <div class="recipe-card-top">
            <span class="meal-badge">${escapeHtml(recipe.meal_type || "وعده")}</span>
          </div>
          <h1>${escapeHtml(recipe.title)}</h1>
          <p>${escapeHtml(recipe.description || "")}</p>
          <div class="chip-row" style="margin-top:.55rem">
            ${(recipe.tags || []).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span>${icon("clock")} آماده‌سازی</span><strong>${toPersianDigits(recipe.prep_time)} دقیقه</strong></div>
          <div class="stat"><span>${icon("flame")} پخت</span><strong>${toPersianDigits(recipe.cook_time)} دقیقه</strong></div>
          <div class="stat"><span>${icon("clock")} مجموع</span><strong>${toPersianDigits(totalTime(recipe))} دقیقه</strong></div>
          <div class="stat"><span>${icon("flame")} سختی</span><strong>${escapeHtml(difficultyLabel(recipe.difficulty))}</strong></div>
        </div>
      </section>

      <div class="servings-control reveal">
        <div>
          <strong>برای چند نفر؟</strong>
          <div class="status-line">مواد لازم بر اساس تعداد نفرات تنظیم می‌شود. پایه: ${toPersianDigits(recipe.servings_base)} نفر${recipe.calories ? ` · حدود ${toPersianDigits(recipe.calories)} کالری برای هر نفر` : ""}</div>
        </div>
        <div class="stepper">
          <button type="button" data-servings-delta="-1" aria-label="کم کردن">−</button>
          <strong data-servings-value>${toPersianDigits(servings)}</strong>
          <button type="button" data-servings-delta="1" aria-label="زیاد کردن">+</button>
        </div>
      </div>

      <div class="detail-grid">
        <section class="panel list-block reveal">
          <h2>مواد لازم</h2>
          <ul class="ingredient-list">
            ${scaled
              .map((item) => {
                const amount = item.amountLabel
                  ? `${item.amountLabel}${item.unit ? " " + escapeHtml(item.unit) : ""}`
                  : escapeHtml(item.unit || "");
                return `<li><span class="bullet">•</span><div><strong>${escapeHtml(item.name || "")}</strong>${amount ? `<div class="status-line">${amount}</div>` : ""}${item.note ? `<div class="status-line">${escapeHtml(item.note)}</div>` : ""}</div></li>`;
              })
              .join("")}
          </ul>
        </section>
        <section class="panel list-block reveal">
          <h2>مراحل تهیه</h2>
          <ol class="step-list">
            ${(recipe.steps || [])
              .map((step, i) => {
                const text = typeof step === "string" ? step : step.text || "";
                return `<li><span class="bullet">${toPersianDigits(i + 1)}</span><div>${escapeHtml(text)}</div></li>`;
              })
              .join("")}
          </ol>
          ${
            recipe.tips
              ? `<div class="tips"><strong>نکته:</strong> ${escapeHtml(recipe.tips)}</div>`
              : ""
          }
        </section>
      </div>
    `;

    window.NamakUI.observeReveals(root);
    window.NamakUI.bindLightbox(root);
    root.querySelectorAll("[data-servings-delta]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = Number(btn.dataset.servingsDelta);
        servings = Math.max(1, Math.min(30, servings + delta));
        render();
      });
    });
  }

  root.innerHTML = `<div class="loading">در حال بارگذاری دستور...</div>`;
  try {
    recipe = await window.NamakAPI.getRecipe(slug ? { slug } : { id });
    if (!recipe) throw new Error("دستور پیدا نشد.");
    servings = recipe.servings_base || 4;
    render();
  } catch (err) {
    root.innerHTML = window.NamakUI.emptyState(
      "خطا در دریافت دستور",
      err.message || "دستور در دسترس نیست."
    );
  }
})();
