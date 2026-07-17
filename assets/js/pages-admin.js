(async function () {
  const root = document.querySelector("[data-admin-root]");
  if (!root) return;
  window.NamakUI.mountShell();

  let mediaRecorder = null;
  let chunks = [];
  let recordedBlob = null;
  let recipes = [];
  let audioCtx = null;
  let analyser = null;
  let rafId = 0;
  let previewDraft = null;
  let pendingImageFile = null;
  let pendingVideoFile = null;
  let pendingImageUrl = "";
  let pendingVideoUrl = "";

  function mediaDropHtml({ kind, inputAttr }) {
    const isImage = kind === "image";
    const title = isImage ? "عکس (اختیاری)" : "ویدیو (اختیاری)";
    const hint = isImage ? "PNG، JPG یا WebP" : "MP4، WebM یا MOV";
    const accept = isImage ? "image/*" : "video/*";
    const iconName = isImage ? "image" : "video";
    return `
      <div class="media-drop" data-media-kind="${kind}">
        <input type="file" accept="${accept}" ${inputAttr} hidden />
        <div class="media-drop-empty" data-media-empty>
          <span class="media-drop-icon">${window.NamakUI.icon(iconName)}</span>
          <strong>${title}</strong>
          <span class="status-line">${hint}</span>
          <button type="button" class="btn btn-ghost" data-media-pick>انتخاب فایل</button>
        </div>
        <div class="media-drop-preview" data-media-preview hidden>
          ${
            isImage
              ? `<img class="media-drop-thumb" alt="پیش‌نمایش عکس" data-media-thumb />`
              : `<video class="media-drop-thumb" controls playsinline data-media-thumb></video>`
          }
          <div class="media-drop-bar">
            <span class="media-drop-name" data-media-name></span>
            <button type="button" class="btn btn-ghost" data-media-clear>حذف</button>
          </div>
        </div>
      </div>
    `;
  }

  function revokeUrl(url) {
    if (url && String(url).startsWith("blob:")) URL.revokeObjectURL(url);
  }

  function setDropPreview(drop, file, objectUrl) {
    const empty = drop.querySelector("[data-media-empty]");
    const preview = drop.querySelector("[data-media-preview]");
    const thumb = drop.querySelector("[data-media-thumb]");
    const name = drop.querySelector("[data-media-name]");
    if (!file || !objectUrl) {
      empty.hidden = false;
      preview.hidden = true;
      if (thumb) {
        if (thumb.tagName === "VIDEO") {
          thumb.removeAttribute("src");
          thumb.load?.();
        } else {
          thumb.removeAttribute("src");
        }
      }
      if (name) name.textContent = "";
      return;
    }
    empty.hidden = true;
    preview.hidden = false;
    thumb.src = objectUrl;
    name.textContent = file.name;
  }

  function clearCreateMedia() {
    revokeUrl(pendingImageUrl);
    revokeUrl(pendingVideoUrl);
    pendingImageFile = null;
    pendingVideoFile = null;
    pendingImageUrl = "";
    pendingVideoUrl = "";
    root.querySelectorAll("input[data-image-file], input[data-video-file]").forEach((input) => {
      const drop = input.closest("[data-media-kind]");
      input.value = "";
      if (drop) setDropPreview(drop, null, "");
    });
  }

  function bindMediaDrop(drop, onChange) {
    const input = drop.querySelector('input[type="file"]');
    const pick = drop.querySelector("[data-media-pick]");
    const clear = drop.querySelector("[data-media-clear]");
    let localUrl = "";

    const applyFile = (file) => {
      revokeUrl(localUrl);
      localUrl = file ? URL.createObjectURL(file) : "";
      setDropPreview(drop, file || null, localUrl);
      onChange(file || null, localUrl);
    };

    pick?.addEventListener("click", () => input?.click());
    drop.addEventListener("click", (e) => {
      if (e.target.closest("button, video, a")) return;
      if (!drop.querySelector("[data-media-preview]")?.hidden) return;
      input?.click();
    });
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("is-drag");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("is-drag"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("is-drag");
      const file = e.dataTransfer?.files?.[0];
      if (!file || !input) return;
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch {
        /* some browsers block assigning input.files */
      }
      applyFile(file);
    });
    input?.addEventListener("change", () => {
      applyFile(input.files?.[0] || null);
    });
    clear?.addEventListener("click", (e) => {
      e.stopPropagation();
      input.value = "";
      applyFile(null);
    });
  }

  function tokenForm() {
    return `
      <section class="admin-card reveal">
        <h2>ورود</h2>
        <p class="status-line">فقط ادمین با توکن درست وارد پنل می‌شود.</p>
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
          <p class="status-line">متن یا ویس بدهید؛ اول پیش‌نمایش می‌بینید و بعد از تأیید منتشر می‌شود.</p>
          <div class="stack" style="margin-top:1rem">
            <div class="field">
              <label for="recipe-text">متن</label>
              <textarea id="recipe-text" placeholder="خروجی گفت‌وگو با AI یا توضیح دستور..."></textarea>
            </div>
            <div class="record-box" data-record-box>
              <div class="mic-viz" data-mic-viz hidden>
                <span class="mic-viz-icon">${window.NamakUI.icon("mic")}</span>
              </div>
              <div style="display:flex;align-items:center;gap:.6rem;justify-content:center">
                <strong>ضبط ویس یا آپلود فایل</strong>
              </div>
              <div class="record-actions">
                <button type="button" class="btn btn-icon btn-record" data-record-toggle aria-label="شروع ضبط">
                  <span class="record-dot" aria-hidden="true"></span>
                </button>
                <label class="btn btn-ghost btn-icon" style="cursor:pointer" aria-label="انتخاب فایل صدا" title="انتخاب فایل">
                  ${window.NamakUI.icon("upload")}
                  <input type="file" accept="audio/*" data-audio-file hidden />
                </label>
                <button type="button" class="btn btn-ghost btn-icon" data-clear-audio aria-label="پاک کردن صدا" title="پاک کردن صدا">${window.NamakUI.icon("trash")}</button>
              </div>
              <div class="status-line" data-audio-status style="text-align:center">صدایی انتخاب نشده</div>
            </div>
            ${mediaDropHtml({ kind: "image", inputAttr: 'data-image-file' })}
            ${mediaDropHtml({ kind: "video", inputAttr: 'data-video-file' })}
            <button type="button" class="btn btn-primary" data-create>${window.NamakUI.icon("plus")} ساخت پیش‌نمایش</button>
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

      <section class="admin-card" data-edit-card hidden style="margin-top:1rem">
        <h2>ویرایش دستور</h2>
        <div class="stack">
          <input type="hidden" id="edit-id" />
          <div class="field"><label for="edit-title">عنوان</label><input id="edit-title" /></div>
          <div class="field"><label for="edit-slug">اسلاگ آدرس</label><input id="edit-slug" placeholder="مثلا khoresh-gheymeh" dir="ltr" /></div>
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
          <div class="field"><label>مواد لازم</label><div data-edit-ingredients-host></div></div>
          <div class="field"><label>مراحل</label><div data-edit-steps-host></div></div>
          <div class="field"><label for="edit-tips">نکات</label><textarea id="edit-tips"></textarea></div>
          <div class="field"><label for="edit-image-url">آدرس عکس</label><input id="edit-image-url" placeholder="اختیاری" /></div>
          <div class="field"><label for="edit-video-url">آدرس ویدیو</label><input id="edit-video-url" placeholder="اختیاری" /></div>
          ${mediaDropHtml({ kind: "image", inputAttr: 'data-edit-image-file' })}
          ${mediaDropHtml({ kind: "video", inputAttr: 'data-edit-video-file' })}
          <div style="display:flex;gap:.6rem;flex-wrap:wrap">
            <button type="button" class="btn btn-primary" data-save-edit>ذخیره تغییرات</button>
            <button type="button" class="btn btn-ghost" data-cancel-edit>انصراف</button>
          </div>
          <div class="status-line" data-edit-status></div>
        </div>
      </section>

      <div class="preview-modal" data-preview-modal hidden>
        <div class="preview-modal-backdrop" data-close-preview></div>
        <div class="preview-modal-sheet">
          <div class="preview-modal-head">
            <strong>پیش‌نمایش دستور</strong>
            <button type="button" class="icon-btn" data-close-preview aria-label="بستن">${window.NamakUI.icon("close")}</button>
          </div>
          <div class="preview-modal-scroll">
            <div class="stack" data-preview-body></div>
          </div>
          <div class="preview-modal-foot">
            <div class="preview-actions">
              <button type="button" class="btn btn-primary" data-confirm-publish>تأیید و انتشار</button>
              <button type="button" class="btn btn-ghost" data-close-preview>انصراف</button>
            </div>
            <div class="status-line" data-preview-status></div>
          </div>
        </div>
      </div>
    `;
  }

  function stopMeter() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    const viz = root.querySelector("[data-mic-viz]");
    if (viz) {
      viz.style.setProperty("--level", "0");
      viz.classList.remove("is-live");
      viz.hidden = true;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
      analyser = null;
    }
  }

  function startMeter(stream) {
    const viz = root.querySelector("[data-mic-viz]");
    if (!viz) return;
    viz.hidden = false;
    viz.classList.add("is-live");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 4.5);
      viz.style.setProperty("--level", String(level));
      rafId = requestAnimationFrame(tick);
    };
    tick();
  }

  function renderList() {
    const host = root.querySelector("[data-admin-list]");
    if (!host) return;
    if (!recipes.length) {
      host.innerHTML = window.NamakUI.emptyState(
        "دستوری نیست",
        "اولین دستور را بسازید و تأیید کنید."
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
    card.classList.remove("reveal");
    card.style.opacity = "1";
    card.style.transform = "none";
    root.querySelector("#edit-id").value = recipe.id;
    root.querySelector("#edit-title").value = recipe.title || "";
    root.querySelector("#edit-slug").value = recipe.slug || "";
    root.querySelector("#edit-description").value = recipe.description || "";
    root.querySelector("#edit-meal").value = recipe.meal_type || "";
    root.querySelector("#edit-difficulty").value =
      window.NamakUI.difficultyLabel(recipe.difficulty);
    root.querySelector("#edit-servings").value = recipe.servings_base || 4;
    root.querySelector("#edit-prep").value = recipe.prep_time || 0;
    root.querySelector("#edit-cook").value = recipe.cook_time || 0;
    root.querySelector("#edit-calories").value = recipe.calories || 0;
    root.querySelector("#edit-tags").value = (recipe.tags || []).join("، ");
    root.querySelector("#edit-tips").value = recipe.tips || "";
    root.querySelector("#edit-image-url").value = recipe.image_url || "";
    root.querySelector("#edit-video-url").value = recipe.video_url || "";
    const ingHost = root.querySelector("[data-edit-ingredients-host]");
    const stepHost = root.querySelector("[data-edit-steps-host]");
    ingHost.innerHTML = window.NamakFields.ingredientsEditorHtml(recipe.ingredients);
    stepHost.innerHTML = window.NamakFields.stepsEditorHtml(recipe.steps);
    window.NamakFields.bindIngredientsEditor(ingHost);
    window.NamakFields.bindStepsEditor(stepHost);
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openPreview(recipe) {
    previewDraft = recipe;
    const modal = root.querySelector("[data-preview-modal]");
    const body = root.querySelector("[data-preview-body]");
    const { escapeHtml } = window.NamakUI;
    const mediaBits = [];
    if (pendingImageUrl) {
      mediaBits.push(
        `<div class="preview-media"><img src="${escapeHtml(pendingImageUrl)}" alt="پیش‌نمایش عکس" /></div>`
      );
    }
    if (pendingVideoUrl) {
      mediaBits.push(
        `<div class="preview-media"><video src="${escapeHtml(pendingVideoUrl)}" controls playsinline></video></div>`
      );
    }
    body.innerHTML = `
      ${mediaBits.join("")}
      <div class="field"><label>عنوان</label><input data-prev-title value="${escapeHtml(recipe.title || "")}" /></div>
      <div class="field"><label>اسلاگ آدرس</label><input data-prev-slug value="${escapeHtml(recipe.slug || window.namakSlugify(recipe.title) || "")}" dir="ltr" /></div>
      <div class="field"><label>توضیح</label><textarea data-prev-description>${escapeHtml(recipe.description || "")}</textarea></div>
      <div class="field"><label>وعده</label><input data-prev-meal value="${escapeHtml(recipe.meal_type || "")}" /></div>
      <div class="field"><label>مواد لازم</label><div data-prev-ingredients-host>${window.NamakFields.ingredientsEditorHtml(recipe.ingredients || [])}</div></div>
      <div class="field"><label>مراحل</label><div data-prev-steps-host>${window.NamakFields.stepsEditorHtml(recipe.steps || [])}</div></div>
      <div class="field"><label>تگ‌ها</label><input data-prev-tags value="${escapeHtml((recipe.tags || []).join("، "))}" /></div>
      <div class="field"><label>نکات</label><textarea data-prev-tips>${escapeHtml(recipe.tips || "")}</textarea></div>
      <div class="status-line">زمان آماده‌سازی: ${window.NamakScale.toPersianDigits(recipe.prep_time || 0)} · پخت: ${window.NamakScale.toPersianDigits(recipe.cook_time || 0)} · ${window.NamakScale.toPersianDigits(recipe.servings_base || 4)} نفر · ${escapeHtml(recipe.difficulty || "متوسط")}</div>
    `;
    window.NamakFields.bindIngredientsEditor(body.querySelector("[data-prev-ingredients-host]"));
    window.NamakFields.bindStepsEditor(body.querySelector("[data-prev-steps-host]"));
    modal.hidden = false;
    document.body.classList.add("preview-open");
    root.querySelector("[data-preview-status]").textContent = "";
  }

  function closePreview() {
    const modal = root.querySelector("[data-preview-modal]");
    if (modal) modal.hidden = true;
    document.body.classList.remove("preview-open");
    previewDraft = null;
  }

  function readPreviewPayload() {
    const body = root.querySelector("[data-preview-body]");
    const tags = (body.querySelector("[data-prev-tags]")?.value || "")
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      slug:
        body.querySelector("[data-prev-slug]")?.value.trim() ||
        window.namakSlugify(body.querySelector("[data-prev-title]")?.value) ||
        previewDraft?.slug ||
        `recipe-${Date.now()}`,
      title: body.querySelector("[data-prev-title]")?.value.trim() || "",
      description: body.querySelector("[data-prev-description]")?.value.trim() || "",
      meal_type: body.querySelector("[data-prev-meal]")?.value.trim() || "",
      tips: body.querySelector("[data-prev-tips]")?.value.trim() || "",
      tags,
      ingredients: window.NamakFields.readIngredients(body.querySelector("[data-prev-ingredients-host]")),
      steps: window.NamakFields.readSteps(body.querySelector("[data-prev-steps-host]")),
      prep_time: Number(previewDraft?.prep_time) || 0,
      cook_time: Number(previewDraft?.cook_time) || 0,
      servings_base: Number(previewDraft?.servings_base) || 4,
      calories: Number(previewDraft?.calories) || 0,
      difficulty: previewDraft?.difficulty || "متوسط",
      image_url: previewDraft?.image_url || "",
      video_url: previewDraft?.video_url || "",
    };
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

    root.querySelectorAll("[data-close-preview]").forEach((el) => {
      el.addEventListener("click", closePreview);
    });

    const createImageDrop = root.querySelector('[data-media-kind="image"] input[data-image-file]')?.closest("[data-media-kind]");
    const createVideoDrop = root.querySelector('[data-media-kind="video"] input[data-video-file]')?.closest("[data-media-kind]");
    if (createImageDrop) {
      bindMediaDrop(createImageDrop, (file, url) => {
        pendingImageFile = file;
        pendingImageUrl = url || "";
      });
    }
    if (createVideoDrop) {
      bindMediaDrop(createVideoDrop, (file, url) => {
        pendingVideoFile = file;
        pendingVideoUrl = url || "";
      });
    }

    root.querySelectorAll("[data-edit-card] [data-media-kind]").forEach((drop) => {
      bindMediaDrop(drop, () => {});
    });

    root.querySelector("[data-confirm-publish]")?.addEventListener("click", async () => {
      const status = root.querySelector("[data-preview-status]");
      const btn = root.querySelector("[data-confirm-publish]");
      status.textContent = "در حال انتشار...";
      btn.disabled = true;
      try {
        const payload = readPreviewPayload();
        if (!payload.title) throw new Error("عنوان لازم است.");
        if (pendingImageFile) {
          status.textContent = "در حال آپلود عکس...";
          const up = await window.NamakAPI.uploadMedia(pendingImageFile, "image");
          payload.image_url = up.url || up.path || "";
        }
        if (pendingVideoFile) {
          status.textContent = "در حال آپلود ویدیو...";
          const up = await window.NamakAPI.uploadMedia(pendingVideoFile, "video");
          payload.video_url = up.url || up.path || "";
        }
        status.textContent = "در حال انتشار...";
        await window.NamakAPI.publishRecipe(payload);
        status.textContent = "منتشر شد.";
        window.NamakUI.showToast("دستور منتشر شد");
        closePreview();
        root.querySelector("#recipe-text").value = "";
        recordedBlob = null;
        clearCreateMedia();
        root.querySelector("[data-audio-status]").textContent = "صدایی انتخاب نشده";
        await refresh();
      } catch (err) {
        status.textContent = err.message;
        window.NamakUI.showToast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    root.querySelector("[data-save-edit]")?.addEventListener("click", async () => {
      const status = root.querySelector("[data-edit-status]");
      status.textContent = "در حال ذخیره...";
      try {
        const id = root.querySelector("#edit-id").value;
        let image_url = root.querySelector("#edit-image-url").value.trim();
        let video_url = root.querySelector("#edit-video-url").value.trim();
        const imageFile = root.querySelector("[data-edit-image-file]")?.files?.[0];
        const videoFile = root.querySelector("[data-edit-video-file]")?.files?.[0];
        if (imageFile) {
          const up = await window.NamakAPI.uploadMedia(imageFile, "image");
          image_url = up.url || up.path || image_url;
        }
        if (videoFile) {
          const up = await window.NamakAPI.uploadMedia(videoFile, "video");
          video_url = up.url || up.path || video_url;
        }
        const tags = root
          .querySelector("#edit-tags")
          .value.split(/[,،]/)
          .map((t) => t.trim())
          .filter(Boolean);
        await window.NamakAPI.updateRecipe(id, {
          title: root.querySelector("#edit-title").value.trim(),
          slug:
            root.querySelector("#edit-slug").value.trim() ||
            window.namakSlugify(root.querySelector("#edit-title").value) ||
            id,
          description: root.querySelector("#edit-description").value.trim(),
          meal_type: root.querySelector("#edit-meal").value.trim(),
          difficulty: root.querySelector("#edit-difficulty").value,
          servings_base: Number(root.querySelector("#edit-servings").value) || 4,
          prep_time: Number(root.querySelector("#edit-prep").value) || 0,
          cook_time: Number(root.querySelector("#edit-cook").value) || 0,
          calories: Number(root.querySelector("#edit-calories").value) || 0,
          tags,
          ingredients: window.NamakFields.readIngredients(
            root.querySelector("[data-edit-ingredients-host]")
          ),
          steps: window.NamakFields.readSteps(root.querySelector("[data-edit-steps-host]")),
          tips: root.querySelector("#edit-tips").value.trim(),
          image_url,
          video_url,
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
          toggle.setAttribute("aria-label", "شروع ضبط");
          toggle.innerHTML = `<span class="record-dot" aria-hidden="true"></span>`;
          stopMeter();
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorder.start();
        box.classList.add("is-recording");
        toggle.setAttribute("aria-label", "توقف ضبط");
        toggle.innerHTML = `<span class="record-dot" aria-hidden="true"></span>`;
        statusAudio.textContent = "در حال ضبط... با صدای شما موجک تکان می‌خورد.";
        startMeter(stream);
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
      status.textContent = "در حال ساخت پیش‌نمایش با Gemini...";
      try {
        const result = await window.NamakAPI.previewRecipe({
          text,
          audioBlob: recordedBlob,
          filename: recordedBlob?.name || "recording.webm",
        });
        const recipe = window.NamakAPI.normalizeRecipe(result.recipe || result);
        status.textContent = "پیش‌نمایش آماده است. تأیید کنید تا منتشر شود.";
        openPreview(recipe);
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
    document.body.classList.remove("preview-open");
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
