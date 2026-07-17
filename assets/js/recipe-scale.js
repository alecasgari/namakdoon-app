(function () {
  function toPersianDigits(value) {
    return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "";
    const rounded =
      Math.abs(n - Math.round(n)) < 0.05
        ? Math.round(n)
        : Math.round(n * 10) / 10;
    return toPersianDigits(rounded);
  }

  function scaleAmount(amount, fromServings, toServings) {
    const a = Number(amount);
    const from = Number(fromServings) || 1;
    const to = Number(toServings) || from;
    if (!Number.isFinite(a)) return amount;
    return (a * to) / from;
  }

  function scaleIngredients(ingredients, baseServings, targetServings) {
    return (ingredients || []).map((item) => {
      if (typeof item === "string") return { name: item, amount: "", unit: "" };
      const scaled = scaleAmount(item.amount, baseServings, targetServings);
      return {
        ...item,
        amount: item.amount === "" || item.amount == null ? "" : scaled,
        amountLabel:
          item.amount === "" || item.amount == null
            ? ""
            : formatNumber(scaled),
      };
    });
  }

  function difficultyLabel(value) {
    const map = {
      easy: "آسان",
      medium: "متوسط",
      hard: "سخت",
      آسان: "آسان",
      متوسط: "متوسط",
      سخت: "سخت",
    };
    return map[value] || value || "متوسط";
  }

  function totalTime(recipe) {
    return (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
  }

  window.NamakScale = {
    toPersianDigits,
    formatNumber,
    scaleIngredients,
    difficultyLabel,
    totalTime,
  };
})();
