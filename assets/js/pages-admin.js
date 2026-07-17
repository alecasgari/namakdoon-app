(async function () {
  const root = document.querySelector("[data-admin-root]");
  if (!root) return;
  window.NamakUI.mountShell();

  let mediaRecorder = null;
  let chunks = [];
  let recordedBlob = null;
  let recipes = [];

  function tokenForm() {
    return `
      <section class="admin-card reveal">
        <h2>ورود</h2>
        <p class="status-line">فقط ادمین با توکن درست وارد پنل می‌شود. توکن نادرست پذیرفته نمی‌شود.</p>
        <div class="stack" style="margin-top:1rem">
          <div class="field">
            <label for="admin-token">توکن ادمین</label>
            <input id="admin-token" type="password" autocomplete="current-password" placeholder="توکن ادمین" />
          </div>
          <button type="button" class="btn btn-dark" data-save-token>ورود</button>
          <div class="status-line" data-login-status></div>
        </div>
      </section>
    `;
  }

  function adminPanel() {
    return `
      <div class="admin-layout">
        <section class="admin-card reveal">
          <h2>افزودن دستور جدید</h2>
          <p class="status-line">متن گفت‌وگو با AI یا ویس/فایل صوتی را بدهید؛ n8n با Gemini آن را به دستور ساخت‌یافته تبدیل می‌کند.</p>
          <div class="stack" style="margin-top:1rem">
            <div class="field">
              <label for="recipe-text">متن</label>
              <textarea id="recipe-text" placeholder="مثلاً خروجی گفت‌وگوی AI یا توضیح آزاد دستور..."></textarea>
            </div>
            <div class="record-box" data-record-box>
              <div style="display:flex;align-items:center;gap:.6rem">
                <span class="record-pulse" aria-hidden="true"></span>
                <strong>ضبط ویس یا آپلود فایل</strong>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:.55rem">
                <button type="button" class="btn btn-dark" data-record-toggle>${window.NamakUI.icon("mic")} شروع ضبط</button>
                <label class="btn btn-ghost" style="cursor:pointer">
                  انتخاب فایل
                  <input type="file" accept="audio/*" data-audio-file hidden />
                </label>
                <button type="button" class="btn btn-ghost" data-clear-audio>پاک کردن صدا</button>
              </div>
              <div class="status-line" data-audio-status>صدایی انتخاب نشده</div>
            </div>
            <button type="button" class="btn btn-primary" data-create>${window.NamakUI.icon("plus")} ساخت و ذخیره دستور</button>
            <div class="status-line" data-create-status></div>
          </div>
        </section>

        <section class="admin-card reveal">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;margin-bottom:.8rem">
            <h2 style="margin:0">مدیریت دستورها</h2>
            <button type="button" class="btn btn-ghost" data-logout>خروج</button>
          </div>
          <div class="stack" data-admin-list></div>
        </section>
      </div>

      <section class="admin-card reveal" data-edit-card hidden style="margin-top:1rem">
        <h2>ویرایش دستور</h2>
        <div class="stack">
          <input type="hidden" id="edit-id" />
          <div class="field"><label for="edit-title">عنوان</label><input id="edit-title" /></div>
          <div class="field"><label for="edit-description">توضیح</label><textarea id="edit-description"></textarea></div>
          <div class="field"><label for="edit-meal">وعده</label><input id="edit-meal" placeholder="ناهار / شام / ..." /></div>
          <div class="field"><label for="edit-difficulty">سختی</label>
            <select id="edit-difficulty">
              <option value="آسان">آسان</option>
              <option value="متوسط">متوسط</option>
              <option value="سخت">سخت</option>
            </select>
          </div>
          <div class="field"><label for="edit-servings">نفرات پایه</label><input id="edit-servings" type="number" min="1" /></div>
          <div class="field"><label for="edit-prep">آماده‌سازی (دقیقه)</label><input id="edit-prep" type="number" min="0" /></div>
          <div class="field"><label for="edit-cook">پخت (دقیقه)</label><input id="edit-cook" type="number" min="0" /></div>
          <div class="field"><label for="edit-calories">کالری هر نفر</label><input id="edit-calories" type="number" min="0" /></div>
          <div class="field"><label for="edit-tags">تگ‌ها (با ویرگول)</label><input id="edit-tags" /></div>
          <div class="field"><label for="edit-ingredients">مواد (JSON)</label><textarea id="edit-ingredients" style="min-height:160px"></textarea></div>
          <div class="field"><label for="edit-steps">مراحل (JSON)</label><textarea id="edit-steps" style="min-height:160px"></textarea></div>
          <div class="field"><label for="edit-tips">نکات</label><textarea id="edit-tips"></textarea></div>
          <div style="display:flex;gap:.6rem;flex-wrap:wrap">
            <button type="button" class="btn btn-primary" data-save-edit>ذخیره تغییرات</button>
            <button type="button" class="btn btn-ghost" data-cancel-edit>انصراف</button>
          </div>
          <div class="status-line" data-edit-status></div>
        </div>
      </section>
    `;
  }

  function renderList() {
    const host = root.querySelector("[data-admin-list]");
    if (!host) return;
    if (!recipes.length) {
      host.innerHTML = window.NamakUI.emptyState(
        "دستوری نیست",
        "اولین دستور را از فرم سمت راست بسازید."
      );
      return;
    }
    host.innerHTML = recipes
      .map(
        (r) => `
        <article class="panel" style="padding:.9rem">
          <strong>${window.NamakUI.escapeHtml(r.title)}</strong>
          <div class="status-line">${window.NamakUI.escapeHtml(r.meal_type || "")} · ${window.NamakScale.toPersianDigits(r.servings_base)} نفر</div>
          <div style="display:flex;gap:.45rem;margin-top:.7rem;flex-wrap:wrap">
            <button type="button" class="btn btn-ghost" data-edit-id="${window.NamakUI.escapeHtml(r.id)}">${window.NamakUI.icon("edit")} ویرایش</button>
            <button type="button" class="btn btn-danger" data-delete-id="${window.NamakUI.escapeHtml(r.id)}">${window.NamakUI.icon("trash")} حذف</button>
          </div>
        </article>
      `
      )
      .join("");

    host.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => openEdit(btn.dataset.editId));
    });
    host.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("این دستور حذف شود؟")) return;
        try {
          await window.NamakAPI.deleteRecipe(btn.dataset.deleteId);
          window.NamakUI.showToast("دستور حذف شد");
          await refresh();
        } catch (err) {
          window.NamakUI.showToast(err.message, "error");
        }
      });
    });
  }

  function openEdit(id) {
    const recipe = recipes.find((r) => String(r.id) === String(id));
    if (!recipe) return;
    const card = root.querySelector("[data-edit-card]");
    card.hidden = false;
    root.querySelector("#edit-id").value = recipe.id;
    root.querySelector("#edit-title").value = recipe.title || "";
    root.querySelector("#edit-description").value = recipe.description || "";
    root.querySelector("#edit-meal").value = recipe.meal_type || "";
    root.querySelector("#edit-difficulty").value =
      window.NamakUI.difficultyLabel(recipe.difficulty);
    root.querySelector("#edit-servings").value = recipe.servings_base || 4;
    root.querySelector("#edit-prep").value = recipe.prep_time || 0;
    root.querySelector("#edit-cook").value = recipe.cook_time || 0;
    root.querySelector("#edit-calories").value = recipe.calories || 0;
    root.querySelector("#edit-tags").value = (recipe.tags || []).join("، ");
    root.querySelector("#edit-ingredients").value = JSON.stringify(
      recipe.ingredients || [],
      null,
      2
    );
    root.querySelector("#edit-steps").value = JSON.stringify(
      recipe.steps || [],
      null,
      2
    );
    root.querySelector("#edit-tips").value = recipe.tips || "";
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function refresh() {
    recipes = await window.NamakAPI.listRecipes();
    renderList();
  }

  function bindAdminEvents() {
    root.querySelector("[data-logout]")?.addEventListener("click", () => {
      window.NamakAPI.setAdminToken("");
      window.NamakUI.updateAuthNav();
      window.NamakUI.showToast("خارج شدید");
      mount();
    });

    root.querySelector("[data-cancel-edit]")?.addEventListener("click", () => {
      root.querySelector("[data-edit-card]").hidden = true;
    });

    root.querySelector("[data-save-edit]")?.addEventListener("click", async () => {
      const status = root.querySelector("[data-edit-status]");
      status.textContent = "در حال ذخیره...";
      try {
        const id = root.querySelector("#edit-id").value;
        const ingredients = JSON.parse(
          root.querySelector("#edit-ingredients").value || "[]"
        );
        const steps = JSON.parse(root.querySelector("#edit-steps").value || "[]");
        const tags = root
          .querySelector("#edit-tags")
          .value.split(/[,،]/)
          .map((t) => t.trim())
          .filter(Boolean);
        await window.NamakAPI.updateRecipe(id, {
          title: root.querySelector("#edit-title").value.trim(),
          description: root.querySelector("#edit-description").value.trim(),
          meal_type: root.querySelector("#edit-meal").value.trim(),
          difficulty: root.querySelector("#edit-difficulty").value,
          servings_base: Number(root.querySelector("#edit-servings").value) || 4,
          prep_time: Number(root.querySelector("#edit-prep").value) || 0,
          cook_time: Number(root.querySelector("#edit-cook").value) || 0,
          calories: Number(root.querySelector("#edit-calories").value) || 0,
          tags,
          ingredients,
          steps,
          tips: root.querySelector("#edit-tips").value.trim(),
        });
        status.textContent = "ذخیره شد.";
        window.NamakUI.showToast("تغییرات ذخیره شد");
        root.querySelector("[data-edit-card]").hidden = true;
        await refresh();
      } catch (err) {
        status.textContent = err.message;
        window.NamakUI.showToast(err.message, "error");
      }
    });

    const box = root.querySelector("[data-record-box]");
    const statusAudio = root.querySelector("[data-audio-status]");
    const toggle = root.querySelector("[data-record-toggle]");

    toggle?.addEventListener("click", async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        recordedBlob = null;
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          recordedBlob = new Blob(chunks, { type: "audio/webm" });
          statusAudio.textContent = "ویس ضبط شد و آماده ارسال است.";
          box.classList.remove("is-recording");
          toggle.innerHTML = `${window.NamakUI.icon("mic")} شروع ضبط`;
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorder.start();
        box.classList.add("is-recording");
        toggle.innerHTML = `${window.NamakUI.icon("mic")} توقف ضبط`;
        statusAudio.textContent = "در حال ضبط...";
      } catch {
        window.NamakUI.showToast("دسترسی به میکروفون ممکن نشد", "error");
      }
    });

    root.querySelector("[data-audio-file]")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      recordedBlob = file;
      statusAudio.textContent = `فایل انتخاب شد: ${file.name}`;
    });

    root.querySelector("[data-clear-audio]")?.addEventListener("click", () => {
      recordedBlob = null;
      chunks = [];
      statusAudio.textContent = "صدایی انتخاب نشده";
      const fileInput = root.querySelector("[data-audio-file]");
      if (fileInput) fileInput.value = "";
    });

    root.querySelector("[data-create]")?.addEventListener("click", async () => {
      const text = root.querySelector("#recipe-text").value.trim();
      const status = root.querySelector("[data-create-status]");
      if (!text && !recordedBlob) {
        window.NamakUI.showToast("متن یا صدا لازم است", "error");
        return;
      }
      status.textContent = "در حال پردازش با Gemini...";
      try {
        const result = await window.NamakAPI.createRecipe({
          text,
          audioBlob: recordedBlob,
          filename: recordedBlob?.name || "recording.webm",
        });
        status.textContent = "دستور ساخته و ذخیره شد.";
        window.NamakUI.showToast("دستور جدید اضافه شد");
        root.querySelector("#recipe-text").value = "";
        recordedBlob = null;
        root.querySelector("[data-audio-status]").textContent =
          "صدایی انتخاب نشده";
        await refresh();
        if (result?.id || result?.recipe?.id) {
          /* keep user on admin */
        }
      } catch (err) {
        status.textContent = err.message;
        window.NamakUI.showToast(err.message, "error");
      }
    });
  }

  function bindLoginForm() {
    const btn = root.querySelector("[data-save-token]");
    const input = root.querySelector("#admin-token");
    const status = root.querySelector("[data-login-status]");

    const submit = async () => {
      const value = (input?.value || "").trim();
      if (!value) {
        window.NamakUI.showToast("توکن را وارد کنید", "error");
        return;
      }
      btn.disabled = true;
      if (status) status.textContent = "در حال بررسی توکن...";
      try {
        await window.NamakAPI.verifyAdminToken(value);
        window.NamakAPI.setAdminToken(value);
        window.NamakUI.updateAuthNav();
        window.NamakUI.showToast("ورود موفق بود");
        await mount();
      } catch (err) {
        window.NamakAPI.setAdminToken("");
        window.NamakUI.updateAuthNav();
        if (status) status.textContent = err.message || "توکن نادرست است.";
        window.NamakUI.showToast(err.message || "توکن نادرست است.", "error");
      } finally {
        btn.disabled = false;
      }
    };

    btn?.addEventListener("click", submit);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  }

  async function mount() {
    const token = window.NamakAPI.getAdminToken();
    if (!token) {
      root.innerHTML = tokenForm();
      window.NamakUI.observeReveals(root);
      window.NamakUI.updateAuthNav();
      bindLoginForm();
      return;
    }

    root.innerHTML = `<div class="loading">در حال بررسی نشست...</div>`;
    try {
      await window.NamakAPI.verifyAdminToken(token);
    } catch {
      window.NamakAPI.setAdminToken("");
      window.NamakUI.updateAuthNav();
      root.innerHTML = tokenForm();
      window.NamakUI.observeReveals(root);
      bindLoginForm();
      const status = root.querySelector("[data-login-status]");
      if (status) status.textContent = "نشست نامعتبر است. دوباره وارد شوید.";
      return;
    }

    window.NamakUI.updateAuthNav();
    root.innerHTML = adminPanel();
    window.NamakUI.observeReveals(root);
    bindAdminEvents();
    try {
      await refresh();
    } catch (err) {
      root.querySelector("[data-admin-list]").innerHTML =
        window.NamakUI.emptyState("خطا در دریافت لیست", err.message);
    }
  }

  mount();
})();
