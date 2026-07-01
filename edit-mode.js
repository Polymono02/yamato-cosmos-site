(function () {
  var pw = sessionStorage.getItem("ck_admin_pw");
  if (!pw) return;

  document.addEventListener("content-loaded", function () {
    enableEditMode();
  });

  function enableEditMode() {
    document.body.classList.add("ck-edit-mode");
    addSaveBar();
    document.querySelectorAll("[data-ck]").forEach(attachTextPencil);
    var slideshow = document.getElementById("hero-slideshow");
    if (slideshow) {
      attachSlideshowPencil(slideshow);
    }
    var gachaGrid = document.getElementById("products-gacha-grid");
    var vendGrid = document.getElementById("products-vend-grid");
    if (gachaGrid) enableProductsGridEditing(gachaGrid);
    if (vendGrid) enableProductsGridEditing(vendGrid);
  }

  function ensureRelative(el) {
    var style = window.getComputedStyle(el);
    if (style.position === "static") {
      el.classList.add("ck-relative");
    }
  }

  function attachTextPencil(el) {
    if (el.getAttribute("data-ck-attr") === "src") {
      attachImagePencil(el, el.getAttribute("data-ck"));
      return;
    }
    ensureRelative(el);
    var pencil = document.createElement("button");
    pencil.className = "ck-pencil";
    pencil.type = "button";
    pencil.title = "編集";
    pencil.textContent = "✏️";
    pencil.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startTextEdit(el);
    });
    el.appendChild(pencil);
  }

  function startTextEdit(el) {
    if (el.querySelector(".ck-edit-box")) return;
    var isMultiline = el.tagName === "P" || (el.textContent || "").length > 60;
    var box = document.createElement(isMultiline ? "textarea" : "input");
    box.className = "ck-edit-box";
    if (!isMultiline) box.type = "text";
    box.value = el.getAttribute("data-ck-text") || el.textContent.trim();

    var pencil = el.querySelector(".ck-pencil");
    el.setAttribute("data-ck-editing", "true");
    Array.from(el.childNodes).forEach(function (n) {
      if (n !== pencil) n.remove();
    });
    el.insertBefore(box, pencil);
    box.focus();

    function commit() {
      var value = box.value;
      el.setAttribute("data-ck-text", value);
      box.remove();
      el.removeAttribute("data-ck-editing");
      var textNode = document.createTextNode(value);
      el.insertBefore(textNode, pencil);
      markDirty();
    }

    box.addEventListener("blur", commit);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !isMultiline) {
        e.preventDefault();
        box.blur();
      }
    });
  }

  function attachImagePencil(imgEl, ckKey) {
    var wrapper = imgEl.parentElement;
    if (!wrapper.classList.contains("ck-image-wrap")) {
      var box = document.createElement("span");
      box.className = "ck-image-wrap";
      wrapper.insertBefore(box, imgEl);
      box.appendChild(imgEl);
      wrapper = box;
    }
    if (wrapper.querySelector(".ck-pencil")) return;

    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        imgEl.src = newPath;
        imgEl.setAttribute("data-ck-text", newPath);
        markDirty();
      });
    });

    var pencil = makePencilButton("画像を変更", function () {
      fileInput.click();
    });
    pencil.classList.add("ck-pencil-image");

    wrapper.appendChild(pencil);
    wrapper.appendChild(fileInput);
  }

  function attachSlideshowPencil(slideshowEl) {
    if (slideshowEl.querySelector(".ck-pencil")) return;

    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        var active = slideshowEl.querySelector(".slide.is-active") || slideshowEl.querySelector(".slide");
        if (active) {
          active.src = newPath;
          active.setAttribute("data-slide-path", newPath);
        }
        markDirty();
      });
    });

    var pencil = makePencilButton("表示中の写真を変更", function () {
      fileInput.click();
    });
    pencil.classList.add("ck-pencil-image");

    slideshowEl.appendChild(pencil);
    slideshowEl.appendChild(fileInput);
  }

  // ===== 設置事例ギャラリー編集 =====

  function enableProductsGridEditing(grid) {
    Array.from(grid.querySelectorAll(".products-item")).forEach(function (fig) {
      attachProductsItemControls(fig);
    });
    addProductsAddButton(grid);
  }

  function attachProductsItemControls(fig) {
    var img = fig.querySelector(".products-photo");
    var cap = fig.querySelector("figcaption");

    // 写真変更ボタン
    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        img.src = newPath;
        img.setAttribute("data-photo-path", newPath);
        markDirty();
      });
    });
    var photoPencil = makePencilButton("写真を変更", function () {
      fileInput.click();
    });
    photoPencil.classList.add("ck-pencil-image");
    fig.appendChild(photoPencil);
    fig.appendChild(fileInput);

    // 名前編集ボタン（キャプションの横にインライン表示）
    var namePencil = document.createElement("button");
    namePencil.className = "ck-pencil ck-pencil-caption";
    namePencil.type = "button";
    namePencil.title = "名前を編集";
    namePencil.textContent = "✏️";
    namePencil.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startProductsNameEdit(cap, namePencil);
    });
    cap.appendChild(namePencil);

    // 削除ボタン
    var delBtn = document.createElement("button");
    delBtn.className = "ck-delete-item";
    delBtn.type = "button";
    delBtn.title = "削除";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (confirm("この項目を削除しますか？")) {
        fig.remove();
        markDirty();
      }
    });
    fig.appendChild(delBtn);
  }

  function startProductsNameEdit(cap, pencil) {
    if (cap.querySelector(".ck-edit-box")) return;
    var current = cap.getAttribute("data-name-text") ||
      cap.textContent.replace("✏️", "").trim();
    var box = document.createElement("input");
    box.type = "text";
    box.className = "ck-edit-box";
    box.value = current;

    Array.from(cap.childNodes).forEach(function (n) { if (n !== pencil) n.remove(); });
    cap.insertBefore(box, pencil);
    box.focus();

    function commit() {
      var value = box.value;
      cap.setAttribute("data-name-text", value);
      box.remove();
      cap.insertBefore(document.createTextNode(value), pencil);
      markDirty();
    }
    box.addEventListener("blur", commit);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); box.blur(); }
    });
  }

  function addProductsAddButton(grid) {
    var wrapper = document.createElement("div");
    wrapper.className = "products-add-wrapper";
    var addBtn = document.createElement("button");
    addBtn.className = "ck-add-item";
    addBtn.type = "button";
    addBtn.textContent = "＋ 追加";
    addBtn.addEventListener("click", function () {
      var fig = document.createElement("figure");
      fig.className = "products-item";
      var img = document.createElement("img");
      img.src = "";
      img.setAttribute("data-photo-path", "");
      img.className = "products-photo";
      var cap = document.createElement("figcaption");
      cap.textContent = "";
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.insertBefore(fig, wrapper);
      attachProductsItemControls(fig);
      markDirty();
    });
    wrapper.appendChild(addBtn);
    grid.appendChild(wrapper);
  }

  function collectProductsItems(grid) {
    return Array.from(grid.querySelectorAll(".products-item")).map(function (fig) {
      var img = fig.querySelector(".products-photo");
      var cap = fig.querySelector("figcaption");
      return {
        photo: (img && img.getAttribute("data-photo-path")) || "",
        name: (cap && (cap.getAttribute("data-name-text") || cap.textContent.replace("✏️", "").trim())) || ""
      };
    });
  }

  // ===== 共通ユーティリティ =====

  function makeFileInput(onFile) {
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function () {
      var file = fileInput.files[0];
      if (file) onFile(file);
    });
    return fileInput;
  }

  function makePencilButton(title, onClick) {
    var pencil = document.createElement("button");
    pencil.className = "ck-pencil";
    pencil.type = "button";
    pencil.title = title;
    pencil.textContent = "✏️";
    pencil.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return pencil;
  }

  function readAndUpload(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
      uploadImage(file.name, reader.result, onDone);
    };
    reader.readAsDataURL(file);
  }

  function uploadImage(filename, dataUrl, onDone) {
    var base64 = dataUrl.split(",")[1];
    var statusBar = document.getElementById("ck-save-status");
    if (statusBar) statusBar.textContent = "画像をアップロード中...";
    fetch("/.netlify/functions/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, filename: filename, dataBase64: base64 })
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (result) {
        if (!result.ok) {
          if (statusBar) statusBar.textContent = "アップロード失敗: " + (result.data.error || "");
          return;
        }
        if (statusBar) statusBar.textContent = "画像を反映しました（保存ボタンも押してください）";
        onDone(result.data.path);
      })
      .catch(function (err) {
        if (statusBar) statusBar.textContent = "エラー: " + err;
      });
  }

  function markDirty() {
    var saveBtn = document.getElementById("ck-save-btn");
    if (saveBtn) saveBtn.classList.add("ck-dirty");
  }

  function addSaveBar() {
    if (document.getElementById("ck-save-bar")) return;
    var bar = document.createElement("div");
    bar.id = "ck-save-bar";

    var status = document.createElement("span");
    status.id = "ck-save-status";
    status.textContent = "編集モード：鉛筆マークをクリックして編集できます";

    var saveBtn = document.createElement("button");
    saveBtn.id = "ck-save-btn";
    saveBtn.textContent = "保存する";
    saveBtn.addEventListener("click", saveAll);

    var logoutBtn = document.createElement("button");
    logoutBtn.id = "ck-logout-btn";
    logoutBtn.textContent = "編集モード終了";
    logoutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("ck_admin_pw");
      location.reload();
    });

    bar.appendChild(status);
    bar.appendChild(saveBtn);
    bar.appendChild(logoutBtn);
    document.body.appendChild(bar);
  }

  function setValue(obj, path, value) {
    var parts = path.split(".");
    var last = parts.pop();
    var target = parts.reduce(function (o, k) { return o[k] = o[k] || {}; }, obj);
    target[last] = value;
  }

  function saveAll() {
    var statusBar = document.getElementById("ck-save-status");
    statusBar.textContent = "保存中...";

    fetch("content.json", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (contentData) {
        document.querySelectorAll("[data-ck]").forEach(function (el) {
          var key = el.getAttribute("data-ck");
          var savedValue = el.getAttribute("data-ck-text");
          if (savedValue === null) return;
          setValue(contentData, key, savedValue);
        });

        var slideshow = document.getElementById("hero-slideshow");
        if (slideshow) {
          var paths = Array.from(slideshow.querySelectorAll(".slide")).map(function (img) {
            return img.getAttribute("data-slide-path") || img.getAttribute("src");
          });
          contentData.slideshow = paths;
        }

        // 設置事例ギャラリー保存
        var gachaGrid = document.getElementById("products-gacha-grid");
        var vendGrid = document.getElementById("products-vend-grid");
        if (gachaGrid || vendGrid) {
          contentData.products = contentData.products || {};
          if (gachaGrid) contentData.products.gacha = collectProductsItems(gachaGrid);
          if (vendGrid) contentData.products.vend = collectProductsItems(vendGrid);
        }

        return fetch("/.netlify/functions/save-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw, content: contentData })
        });
      })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (result) {
        if (result.ok) {
          statusBar.textContent = "保存しました。サイトへの反映まで少し時間がかかります。";
          document.getElementById("ck-save-btn").classList.remove("ck-dirty");
        } else {
          statusBar.textContent = "エラー: " + (result.data.error || "保存に失敗しました");
        }
      })
      .catch(function (err) {
        statusBar.textContent = "エラー: " + err;
      });
  }
})();
