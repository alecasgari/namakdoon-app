(function () {
  const { toPersianDigits, difficultyLabel, totalTime } = window.NamakScale;

  const PLACEHOLDERS = [
    "زرشک‌پلو با مرغ...",
    "جستجو با ماده: زعفران",
    "تگ: سریع و ساده",
    "وعده: ناهار",
    "اسم غذا یا هر چیزی...",
  ];

  function icon(name) {
    const icons = {
      search:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
      clock:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      users:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a3 3 0 0 1 0 5.8"/></svg>',
      flame:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c2 3 1 5 1 5s2-1 3-3c3 3 4 6 4 8a7 7 0 1 1-14 0c0-3 2-6 6-10z"/></svg>',
      mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>',
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      trash:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 12h8l1-12"/></svg>',
      edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="m12 6 4 4"/></svg>',
      tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10 12 2H4v8l8 8 8-8z"/><circle cx="8.5" cy="7.5" r="1.2"/></svg>',
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7"/><path d="M6 10v9h12v-9"/></svg>',
      book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 0-2 2V5z"/><path d="M17 3v18"/><path d="M8 7h5M8 11h5"/></svg>',
      panel:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>',
      close:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      salt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l2 4H6l2-4z"/><path d="M6 8h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/><path d="M10 12h.01M14 14h.01M12 16h.01"/></svg>',
    };
    return icons[name] || "";
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.nav === page);
    });
  }

  function updateAuthNav() {
    const loggedIn = Boolean(window.NamakAPI?.getAdminToken?.());
    const label = loggedIn ? "پنل" : "ورود";
    document.querySelectorAll("[data-admin-label]").forEach((el) => {
      el.textContent = label;
    });
  }

  function wireNavLinks() {
    document.querySelectorAll("[data-href]").forEach((el) => {
      el.setAttribute("href", window.namakPath(el.getAttribute("data-href") ?? ""));
    });
    updateAuthNav();
  }

  function goSearch(query) {
    window.location.href = window.namakSearchUrl(query);
  }

  function showToast(message, type = "info") {
    let host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 280);
    }, 2800);
  }

  function recipeCard(recipe) {
    const href = window.namakPath(`recipe/?id=${encodeURIComponent(recipe.id)}`);
    const tags = (recipe.tags || [])
      .slice(0, 3)
      .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
      .join("");
    return `
      <article class="recipe-card reveal" data-id="${escapeHtml(recipe.id)}">
        <a class="recipe-card-link" href="${href}">
          <div class="recipe-card-top">
            <span class="meal-badge">${escapeHtml(recipe.meal_type || "وعده")}</span>
          </div>
          <h3 class="recipe-card-title">${escapeHtml(recipe.title)}</h3>
          <p class="recipe-card-desc">${escapeHtml(recipe.description || "دستور خوش‌طعم از نمکدون")}</p>
          <div class="recipe-meta">
            <span>${icon("clock")} ${toPersianDigits(totalTime(recipe))} دقیقه</span>
            <span>${icon("flame")} ${escapeHtml(difficultyLabel(recipe.difficulty))}</span>
            <span>${icon("users")} ${toPersianDigits(recipe.servings_base)} نفر</span>
          </div>
          <div class="chip-row">${tags}</div>
        </a>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function observeReveals(root = document) {
    const items = root.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  function emptyState(title, text) {
    return `
      <div class="empty-state reveal">
        <div class="empty-icon">${icon("salt")}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  function bindSearchForms(root = document) {
    root.querySelectorAll("[data-global-search]").forEach((form) => {
      if (form.dataset.bound === "1") return;
      form.dataset.bound = "1";
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector("[data-search-input]");
        goSearch(input?.value || "");
        closeSearchModal();
      });
    });
  }

  function animatePlaceholders(root = document) {
    root.querySelectorAll("[data-search-input]").forEach((input) => {
      if (input.dataset.phAnim === "1") return;
      input.dataset.phAnim = "1";
      let i = 0;
      const tick = () => {
        if (document.activeElement === input || input.value) return;
        input.setAttribute("placeholder", PLACEHOLDERS[i % PLACEHOLDERS.length]);
        i += 1;
      };
      tick();
      setInterval(tick, 2600);
    });
  }

  function ensureSearchModal() {
    let modal = document.querySelector("[data-search-modal]");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "search-modal";
    modal.setAttribute("data-search-modal", "");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="search-modal-backdrop" data-close-search></div>
      <div class="search-modal-sheet" role="dialog" aria-modal="true" aria-label="جستجو">
        <div class="search-modal-head">
          <strong>جستجو در نمکدون</strong>
          <button type="button" class="icon-btn" data-close-search aria-label="بستن">${icon("close")}</button>
        </div>
        <form class="hero-search modal-search" data-global-search novalidate>
          <div class="hero-search-shell">
            <span class="hero-search-icon">${icon("search")}</span>
            <input type="search" name="q" data-search-input autocomplete="off" enterkeyhint="search" placeholder="عنوان، تگ، ماده یا اسم غذا..." aria-label="جستجوی دستور" />
            <button type="submit" class="hero-search-btn">برو</button>
          </div>
          <div class="hero-search-hints">
            <button type="button" class="hint-chip" data-hint="مرغ">مرغ</button>
            <button type="button" class="hint-chip" data-hint="ناهار">ناهار</button>
            <button type="button" class="hint-chip" data-hint="سریع">سریع</button>
            <button type="button" class="hint-chip" data-hint="برنج">برنج</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-search]").forEach((el) => {
      el.addEventListener("click", closeSearchModal);
    });
    modal.querySelectorAll("[data-hint]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = modal.querySelector("[data-search-input]");
        if (input) input.value = btn.dataset.hint || "";
        goSearch(btn.dataset.hint || "");
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSearchModal();
    });
    bindSearchForms(modal);
    animatePlaceholders(modal);
    return modal;
  }

  function openSearchModal() {
    const modal = ensureSearchModal();
    modal.hidden = false;
    document.body.classList.add("search-open");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    const input = modal.querySelector("[data-search-input]");
    setTimeout(() => input?.focus(), 180);
  }

  function closeSearchModal() {
    const modal = document.querySelector("[data-search-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("search-open");
    setTimeout(() => {
      modal.hidden = true;
    }, 220);
  }

  function mountMobileTabbar() {
    if (document.querySelector(".mobile-tabbar")) return;
    const nav = document.createElement("nav");
    nav.className = "mobile-tabbar";
    nav.setAttribute("aria-label", "منوی موبایل");
    nav.innerHTML = `
      <div class="mobile-tabbar-inner">
        <a class="tabbar-item" data-nav="home" data-href="">
          <span class="tabbar-icon">${icon("home")}</span>
          <span class="tabbar-label">خانه</span>
        </a>
        <a class="tabbar-item" data-nav="recipes" data-href="recipes/">
          <span class="tabbar-icon">${icon("book")}</span>
          <span class="tabbar-label">دستورها</span>
        </a>
        <button type="button" class="tabbar-item tabbar-item-accent" data-open-search>
          <span class="tabbar-icon">${icon("search")}</span>
          <span class="tabbar-label">جستجو</span>
        </button>
      </div>
    `;
    document.body.appendChild(nav);
    nav.querySelector("[data-open-search]")?.addEventListener("click", openSearchModal);
  }

  function mountShell() {
    mountMobileTabbar();
    ensureSearchModal();
    wireNavLinks();
    bindSearchForms(document);
    animatePlaceholders(document);
    setActiveNav();
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = toPersianDigits(new Date().getFullYear());
  }

  window.NamakUI = {
    icon,
    recipeCard,
    escapeHtml,
    observeReveals,
    emptyState,
    showToast,
    mountShell,
    updateAuthNav,
    openSearchModal,
    closeSearchModal,
    goSearch,
    difficultyLabel,
  };
})();
