(async function () {
  const grid = document.querySelector("[data-home-grid]");
  const countEl = document.querySelector("[data-recipe-count]");
  window.NamakUI.mountShell();
  if (!grid) return;

  try {
    const recipes = await window.NamakAPI.listRecipes();
    if (countEl) {
      countEl.textContent = window.NamakScale.toPersianDigits(recipes.length);
    }
    if (!recipes.length) {
      grid.innerHTML = window.NamakUI.emptyState(
        "هنوز دستوری ثبت نشده",
        "از پنل ادمین اولین دستور را با متن یا ویس اضافه کنید."
      );
      window.NamakUI.observeReveals(grid);
      return;
    }

    grid.innerHTML = recipes.slice(0, 6).map((r) => window.NamakUI.recipeCard(r)).join("");
    window.NamakUI.observeReveals(grid);
  } catch (err) {
    grid.innerHTML = window.NamakUI.emptyState(
      "اتصال به سرور برقرار نشد",
      err.message || "لطفاً ورکفلوهای n8n را فعال کنید."
    );
    window.NamakUI.observeReveals(grid);
  }
})();
