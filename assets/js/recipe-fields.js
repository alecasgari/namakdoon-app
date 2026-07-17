(function () {
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ingredientsEditorHtml(list = []) {
    const rows = (list.length ? list : [{ name: "", amount: "", unit: "", note: "" }])
      .map((item, idx) => ingredientRow(item, idx))
      .join("");
    return `
      <div class="field-editor" data-ingredients-editor>
        <div data-ingredient-rows>${rows}</div>
        <button type="button" class="btn btn-ghost" data-add-ingredient>+ ماده جدید</button>
      </div>
    `;
  }

  function ingredientRow(item = {}, idx = 0) {
    return `
      <div class="field-editor-row" data-ingredient-row>
        <div class="field-editor-grid">
          <input data-ing-name placeholder="نام ماده" value="${escapeHtml(item.name || "")}" />
          <input data-ing-amount type="number" step="any" placeholder="مقدار" value="${escapeHtml(item.amount ?? "")}" />
          <input data-ing-unit placeholder="واحد" value="${escapeHtml(item.unit || "")}" />
        </div>
        <input data-ing-note placeholder="نکته (اختیاری)" value="${escapeHtml(item.note || "")}" />
        <div class="field-editor-actions">
          <span class="status-line">ماده ${idx + 1}</span>
          <button type="button" class="btn btn-danger" data-remove-ingredient>حذف</button>
        </div>
      </div>
    `;
  }

  function stepsEditorHtml(list = []) {
    const rows = (list.length ? list : [{ text: "" }])
      .map((item, idx) => {
        const text = typeof item === "string" ? item : item.text || "";
        return stepRow(text, idx);
      })
      .join("");
    return `
      <div class="field-editor" data-steps-editor>
        <div data-step-rows>${rows}</div>
        <button type="button" class="btn btn-ghost" data-add-step>+ مرحله جدید</button>
      </div>
    `;
  }

  function stepRow(text = "", idx = 0) {
    return `
      <div class="field-editor-row" data-step-row>
        <textarea data-step-text rows="2" placeholder="متن مرحله">${escapeHtml(text)}</textarea>
        <div class="field-editor-actions">
          <span class="status-line">مرحله ${idx + 1}</span>
          <button type="button" class="btn btn-danger" data-remove-step>حذف</button>
        </div>
      </div>
    `;
  }

  function bindIngredientsEditor(root) {
    const editor = root.querySelector("[data-ingredients-editor]");
    if (!editor || editor.dataset.bound === "1") return;
    editor.dataset.bound = "1";
    const rowsHost = editor.querySelector("[data-ingredient-rows]");
    editor.querySelector("[data-add-ingredient]")?.addEventListener("click", () => {
      rowsHost.insertAdjacentHTML("beforeend", ingredientRow({}, rowsHost.children.length));
      renumber(rowsHost, "ماده");
    });
    editor.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-ingredient]");
      if (!btn) return;
      const row = btn.closest("[data-ingredient-row]");
      if (rowsHost.children.length <= 1) {
        row.querySelectorAll("input").forEach((i) => (i.value = ""));
        return;
      }
      row.remove();
      renumber(rowsHost, "ماده");
    });
  }

  function bindStepsEditor(root) {
    const editor = root.querySelector("[data-steps-editor]");
    if (!editor || editor.dataset.bound === "1") return;
    editor.dataset.bound = "1";
    const rowsHost = editor.querySelector("[data-step-rows]");
    editor.querySelector("[data-add-step]")?.addEventListener("click", () => {
      rowsHost.insertAdjacentHTML("beforeend", stepRow("", rowsHost.children.length));
      renumber(rowsHost, "مرحله");
    });
    editor.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-step]");
      if (!btn) return;
      const row = btn.closest("[data-step-row]");
      if (rowsHost.children.length <= 1) {
        row.querySelector("textarea").value = "";
        return;
      }
      row.remove();
      renumber(rowsHost, "مرحله");
    });
  }

  function renumber(host, label) {
    [...host.children].forEach((row, i) => {
      const el = row.querySelector(".status-line");
      if (el) el.textContent = `${label} ${i + 1}`;
    });
  }

  function readIngredients(root) {
    return [...root.querySelectorAll("[data-ingredient-row]")]
      .map((row) => ({
        name: row.querySelector("[data-ing-name]")?.value.trim() || "",
        amount: Number(row.querySelector("[data-ing-amount]")?.value) || 0,
        unit: row.querySelector("[data-ing-unit]")?.value.trim() || "",
        note: row.querySelector("[data-ing-note]")?.value.trim() || "",
      }))
      .filter((i) => i.name);
  }

  function readSteps(root) {
    return [...root.querySelectorAll("[data-step-row]")]
      .map((row) => ({
        text: row.querySelector("[data-step-text]")?.value.trim() || "",
      }))
      .filter((s) => s.text);
  }

  window.NamakFields = {
    ingredientsEditorHtml,
    stepsEditorHtml,
    bindIngredientsEditor,
    bindStepsEditor,
    readIngredients,
    readSteps,
  };
})();
