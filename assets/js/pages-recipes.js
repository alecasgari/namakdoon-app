(async function () {
  const grid = document.querySelector("[data-recipes-grid]");
  const searchInput = document.querySelector("[data-search]");
  const filtersEl = document.querySelector("[data-filters]");
  if (!grid) return;

  window.NamakUI.mountShell();
  let recipes = [];
  let activeTag = "all";

  function uniqueTags(list) {
    const set = new Set();
    list.forEach((r) => (r.tags || []).forEach((t) => set.add(t)));
    return [...set];
  }

  function renderFilters() {
    const tags = uniqueTags(recipes);
    filtersEl.innerHTML =
      `<button type="button" class="filter-chip is-on" data-tag="all">همه</button>` +
      tags
        .map(
          (t) =>
            `<button type="button" class="filter-chip" data-tag="${window.NamakUI.escapeHtml(t)}">${window.NamakUI.escapeHtml(t)}</button>`
        )
        .join("");

    filtersEl.querySelectorAll("[data-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.dataset.tag;
        filtersEl
          .querySelectorAll(".filter-chip")
          .forEach((b) => b.classList.toggle("is-on", b === btn));
        render();
      });
    });
  }

  function filtered() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    return recipes.filter((r) => {
      const tagOk = activeTag === "all" || (r.tags || []).includes(activeTag);
      if (!tagOk) return false;
      if (!q) return true;
      const hay = [r.title, r.description, r.meal_type, ...(r.tags || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function render() {
    const list = filtered();
    if (!list.length) {
      grid.innerHTML = window.NamakUI.emptyState(
        "موردی پیدا نشد",
        "عبارت جستجو یا فیلتر را تغییر دهید."
      );
      window.NamakUI.observeReveals(grid);
      return;
    }
    grid.innerHTML = list.map((r) => window.NamakUI.recipeCard(r)).join("");
    window.NamakUI.observeReveals(grid);
  }

  try {
    recipes = await window.NamakAPI.listRecipes();
    renderFilters();
    render();
  } catch (err) {
    grid.innerHTML = window.NamakUI.emptyState(
      "خطا در دریافت دستورها",
      err.message || "سرور در دسترس نیست."
    );
  }

  searchInput?.addEventListener("input", () => render());
})();
