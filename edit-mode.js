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
    if (slideshow) attachSlideshowPencil(slideshow);

    // 設置事例ギャラリー
    var gachaGrid = document.getElementById("products-gacha-grid");
    var vendGrid = document.getElementById("products-vend-grid");
    if (gachaGrid) enableProductsGridEditing(gachaGrid);
    if (vendGrid) enableProductsGridEditing(vendGrid);

    // 会社の歴史タイムライン
    var htTimeline = document.getElementById("history-timeline");
    if (htTimeline) enableHistoryEditing(htTimeline);

    // 貸し出し機器一覧
    var eqList = document.getElementById("equipment-list");
    if (eqList) enableEquipmentEditing(eqList);
  }

  // ===== テキスト編集 =====

  function ensureRelative(el) {
    if (window.getComputedStyle(el).position === "static") {
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
    Array.from(el.childNodes).forEach(function (n) { if (n !== pencil) n.remove(); });
    el.insertBefore(box, pencil);
    box.focus();
    function commit() {
      var value = box.value;
      el.setAttribute("data-ck-text", value);
      box.remove();
      el.removeAttribute("data-ck-editing");
      el.insertBefore(document.createTextNode(value), pencil);
      markDirty();
    }
    box.addEventListener("blur", commit);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !isMultiline) { e.preventDefault(); box.blur(); }
    });
  }

  // ===== 画像編集 =====

  function attachImagePencil(imgEl) {
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
    var pencil = makePencilButton("画像を変更", function () { fileInput.click(); });
    pencil.classList.add("ck-pencil-image");
    wrapper.appendChild(pencil);
    wrapper.appendChild(fileInput);
  }

  // ===== スライドショー =====

  function attachSlideshowPencil(slideshowEl) {
    if (slideshowEl.querySelector(".ck-pencil")) return;
    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        var active = slideshowEl.querySelector(".slide.is-active") || slideshowEl.querySelector(".slide");
        if (active) { active.src = newPath; active.setAttribute("data-slide-path", newPath); }
        markDirty();
      });
    });
    var pencil = makePencilButton("表示中の写真を変更", function () { fileInput.click(); });
    pencil.classList.add("ck-pencil-image");
    slideshowEl.appendChild(pencil);
    slideshowEl.appendChild(fileInput);
  }

  // ===== 設置事例ギャラリー =====

  function enableProductsGridEditing(grid) {
    Array.from(grid.querySelectorAll(".products-item")).forEach(attachProductsItemControls);
    addProductsAddButton(grid);
  }

  function attachProductsItemControls(fig) {
    var img = fig.querySelector(".products-photo");
    var cap = fig.querySelector("figcaption");
    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        img.src = newPath;
        img.setAttribute("data-photo-path", newPath);
        markDirty();
      });
    });
    var photoPencil = makePencilButton("写真を変更", function () { fileInput.click(); });
    photoPencil.classList.add("ck-pencil-image");
    fig.appendChild(photoPencil);
    fig.appendChild(fileInput);

    var namePencil = document.createElement("button");
    namePencil.className = "ck-pencil ck-pencil-caption";
    namePencil.type = "button";
    namePencil.title = "名前を編集";
    namePencil.textContent = "✏️";
    namePencil.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit(cap, namePencil, "data-name-text");
    });
    cap.appendChild(namePencil);

    var delBtn = makeDeleteButton(function () {
      if (confirm("この項目を削除しますか？")) { fig.remove(); markDirty(); }
    });
    fig.appendChild(delBtn);
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
      var name = "";
      if (cap) {
        name = cap.getAttribute("data-name-text");
        if (name === null) {
          name = Array.from(cap.childNodes)
            .filter(function (n) { return n.nodeType === Node.TEXT_NODE; })
            .map(function (n) { return n.textContent; })
            .join("").trim();
        }
      }
      return {
        photo: (img && img.getAttribute("data-photo-path")) || "",
        name: name || ""
      };
    });
  }

  // ===== 会社の歴史タイムライン =====

  function enableHistoryEditing(tl) {
    Array.from(tl.querySelectorAll(".ht-item")).forEach(function (row) {
      attachHistoryItemControls(row);
      attachHistoryDragHandle(row, tl);
    });
    addHistoryAddButton(tl);
  }

  function attachHistoryItemControls(row) {
    var year = row.querySelector(".ht-year");
    var title = row.querySelector(".ht-title");
    var desc = row.querySelector(".ht-desc");
    var logoWrap = row.querySelector(".ht-logo-wrap");
    var logoImg = row.querySelector(".ht-logo");

    // ロゴ画像アップロード
    if (logoWrap && logoImg) {
      var logoFileInput = makeFileInput(function (file) {
        readAndUpload(file, function (newPath) {
          logoImg.src = newPath;
          logoImg.setAttribute("data-ht-logo", newPath);
          logoImg.style.display = "";
          markDirty();
        });
      });
      var logoPencil = makePencilButton("ロゴ画像を設定", function () { logoFileInput.click(); });
      logoPencil.classList.add("ck-pencil-image", "ck-pencil-ht-logo");
      logoWrap.appendChild(logoPencil);
      logoWrap.appendChild(logoFileInput);
    }

    attachFieldPencil(year, "data-ht-year", false);
    attachFieldPencil(title, "data-ht-title", false);
    attachFieldPencil(desc, "data-ht-desc", true);

    var delBtn = makeDeleteButton(function () {
      if (confirm("この項目を削除しますか？")) { row.remove(); markDirty(); }
    });
    delBtn.style.position = "absolute";
    delBtn.style.top = "4px";
    delBtn.style.right = "4px";
    var body = row.querySelector(".ht-body");
    if (body) { body.style.position = "relative"; body.appendChild(delBtn); }
  }

  function attachHistoryDragHandle(row, tl) {
    var handle = document.createElement("button");
    handle.className = "ht-drag-handle";
    handle.type = "button";
    handle.title = "ドラッグして並び替え";
    handle.textContent = "⠿";

    handle.addEventListener("mousedown", function () {
      row.setAttribute("draggable", "true");
    });

    row.addEventListener("dragstart", function (e) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "ht-drag");
      row.classList.add("ht-dragging");
    });

    row.addEventListener("dragend", function () {
      row.setAttribute("draggable", "false");
      row.classList.remove("ht-dragging");
      Array.from(tl.querySelectorAll(".ht-drag-over-top, .ht-drag-over-bottom")).forEach(function (el) {
        el.classList.remove("ht-drag-over-top", "ht-drag-over-bottom");
      });
      markDirty();
    });

    row.addEventListener("dragover", function (e) {
      e.preventDefault();
      var dragging = tl.querySelector(".ht-dragging");
      if (!dragging || dragging === row) return;
      Array.from(tl.querySelectorAll(".ht-drag-over-top, .ht-drag-over-bottom")).forEach(function (el) {
        el.classList.remove("ht-drag-over-top", "ht-drag-over-bottom");
      });
      var rect = row.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        row.classList.add("ht-drag-over-top");
        tl.insertBefore(dragging, row);
      } else {
        row.classList.add("ht-drag-over-bottom");
        var next = row.nextSibling;
        tl.insertBefore(dragging, next);
      }
    });

    var body = row.querySelector(".ht-body");
    if (body) body.appendChild(handle);
  }

  function addHistoryAddButton(tl) {
    var wrapper = document.createElement("div");
    wrapper.className = "ht-add-wrapper";
    var addBtn = document.createElement("button");
    addBtn.className = "ck-add-item";
    addBtn.type = "button";
    addBtn.textContent = "＋ 追加";
    addBtn.addEventListener("click", function () {
      var row = document.createElement("div");
      row.className = "ht-item";

      var yearCol = document.createElement("div");
      yearCol.className = "ht-year-col";

      var year = document.createElement("div");
      year.className = "ht-year";
      year.textContent = "";
      year.setAttribute("data-ht-year", "");

      var logoWrap = document.createElement("div");
      logoWrap.className = "ht-logo-wrap";
      var logoImg = document.createElement("img");
      logoImg.className = "ht-logo";
      logoImg.src = "";
      logoImg.setAttribute("data-ht-logo", "");
      logoImg.style.display = "none";
      logoWrap.appendChild(logoImg);

      yearCol.appendChild(year);
      yearCol.appendChild(logoWrap);

      var dot = document.createElement("div");
      dot.className = "ht-dot";

      var body = document.createElement("div");
      body.className = "ht-body";
      body.style.position = "relative";

      var title = document.createElement("div");
      title.className = "ht-title";
      title.textContent = "";
      title.setAttribute("data-ht-title", "");

      var desc = document.createElement("div");
      desc.className = "ht-desc";
      desc.textContent = "";
      desc.setAttribute("data-ht-desc", "");

      body.appendChild(title);
      body.appendChild(desc);
      row.appendChild(yearCol);
      row.appendChild(dot);
      row.appendChild(body);
      tl.insertBefore(row, wrapper);
      attachHistoryItemControls(row);
      attachHistoryDragHandle(row, tl);
      markDirty();
    });
    wrapper.appendChild(addBtn);
    tl.appendChild(wrapper);
  }

  function collectHistoryItems(tl) {
    return Array.from(tl.querySelectorAll(".ht-item")).map(function (row) {
      var year = row.querySelector(".ht-year");
      var title = row.querySelector(".ht-title");
      var desc = row.querySelector(".ht-desc");
      var logoImg = row.querySelector(".ht-logo");
      return {
        year: getAttrOrText(year, "data-ht-year"),
        title: getAttrOrText(title, "data-ht-title"),
        desc: getAttrOrText(desc, "data-ht-desc"),
        logo: (logoImg && logoImg.getAttribute("data-ht-logo")) || ""
      };
    });
  }

  function getAttrOrText(el, attr) {
    if (!el) return "";
    var v = el.getAttribute(attr);
    if (v !== null) return v;
    return Array.from(el.childNodes)
      .filter(function (n) { return n.nodeType === Node.TEXT_NODE; })
      .map(function (n) { return n.textContent; })
      .join("").trim();
  }

  // ===== 貸し出し機器一覧 =====

  function enableEquipmentEditing(list) {
    Array.from(list.querySelectorAll(".eq-card")).forEach(attachEquipmentCardControls);
    addEquipmentAddButton(list);
  }

  function attachEquipmentCardControls(card) {
    var photoWrap = card.querySelector(".eq-photo-wrap");
    var img = card.querySelector(".eq-photo");
    var name = card.querySelector(".eq-name");
    var desc = card.querySelector(".eq-desc");
    var price = card.querySelector(".eq-price");
    var cName = card.querySelector(".eq-contact-name");
    var cTel = card.querySelector(".eq-contact-tel");
    var cEmail = card.querySelector(".eq-contact-email");

    // 写真
    var fileInput = makeFileInput(function (file) {
      readAndUpload(file, function (newPath) {
        img.src = newPath;
        img.setAttribute("data-photo-path", newPath);
        markDirty();
      });
    });
    var photoPencil = makePencilButton("写真を変更", function () { fileInput.click(); });
    photoPencil.classList.add("ck-pencil-image");
    photoWrap.appendChild(photoPencil);
    photoWrap.appendChild(fileInput);

    // テキストフィールド各種
    attachFieldPencil(name, "data-eq-name", false);
    attachFieldPencil(desc, "data-eq-desc", true);
    attachFieldPencil(price, "data-eq-price", false);
    attachInlineFieldPencil(cName, "data-eq-cname", "担当者名");
    attachInlineFieldPencil(cTel, "data-eq-ctel", "電話番号");
    attachInlineFieldPencil(cEmail, "data-eq-cemail", "メールアドレス");

    // 削除ボタン
    var delBtn = makeDeleteButton(function () {
      if (confirm("この機材を削除しますか？")) { card.remove(); markDirty(); }
    });
    card.appendChild(delBtn);
  }

  function attachFieldPencil(el, attr, multiline) {
    if (!el) return;
    el.style.position = "relative";
    var pencil = makePencilButton("編集", function () { startInlineEdit(el, pencil, attr, multiline); });
    el.appendChild(pencil);
  }

  function attachInlineFieldPencil(el, attr, placeholder) {
    if (!el) return;
    el.style.position = "relative";
    var pencil = document.createElement("button");
    pencil.className = "ck-pencil ck-pencil-caption";
    pencil.type = "button";
    pencil.title = placeholder + "を編集";
    pencil.textContent = "✏️";
    pencil.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit(el, pencil, attr, false, placeholder);
    });
    el.appendChild(pencil);
  }

  function startInlineEdit(el, pencil, attr, multiline, placeholder) {
    if (el.querySelector(".ck-edit-box")) return;
    var current = el.getAttribute(attr) || el.textContent.replace("✏️", "").trim();
    var box = document.createElement(multiline ? "textarea" : "input");
    box.className = "ck-edit-box";
    if (!multiline) box.type = "text";
    if (placeholder) box.placeholder = placeholder;
    box.value = current;
    Array.from(el.childNodes).forEach(function (n) { if (n !== pencil) n.remove(); });
    el.insertBefore(box, pencil);
    box.focus();
    function commit() {
      var value = box.value;
      el.setAttribute(attr, value);
      box.remove();
      el.insertBefore(document.createTextNode(value), pencil);
      markDirty();
    }
    box.addEventListener("blur", commit);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !multiline) { e.preventDefault(); box.blur(); }
    });
  }

  function addEquipmentAddButton(list) {
    var wrapper = document.createElement("div");
    wrapper.className = "eq-add-wrapper";
    var addBtn = document.createElement("button");
    addBtn.className = "ck-add-item";
    addBtn.type = "button";
    addBtn.textContent = "＋ 機材を追加";
    addBtn.addEventListener("click", function () {
      var card = buildEquipmentCard({ photo: "", name: "", desc: "", price: "", contactName: "", contactTel: "", contactEmail: "" });
      list.insertBefore(card, wrapper);
      attachEquipmentCardControls(card);
      markDirty();
    });
    wrapper.appendChild(addBtn);
    list.appendChild(wrapper);
  }

  function buildEquipmentCard(item) {
    var card = document.createElement("div");
    card.className = "eq-card";

    var photoWrap = document.createElement("div");
    photoWrap.className = "eq-photo-wrap";
    var img = document.createElement("img");
    img.src = item.photo || "";
    img.setAttribute("data-photo-path", item.photo || "");
    img.className = "eq-photo";
    img.alt = item.name || "";
    photoWrap.appendChild(img);

    var body = document.createElement("div");
    body.className = "eq-body";

    var name = document.createElement("div");
    name.className = "eq-name";
    name.textContent = item.name || "";
    name.setAttribute("data-eq-name", item.name || "");

    var desc = document.createElement("div");
    desc.className = "eq-desc";
    desc.textContent = item.desc || "";
    desc.setAttribute("data-eq-desc", item.desc || "");

    var price = document.createElement("div");
    price.className = "eq-price";
    price.textContent = item.price || "";
    price.setAttribute("data-eq-price", item.price || "");

    var contact = document.createElement("div");
    contact.className = "eq-contact";

    var cLabel = document.createElement("span");
    cLabel.className = "eq-contact-label";
    cLabel.textContent = "担当：";

    var cName = document.createElement("span");
    cName.className = "eq-contact-name";
    cName.textContent = item.contactName || "";
    cName.setAttribute("data-eq-cname", item.contactName || "");

    var cTel = document.createElement("span");
    cTel.className = "eq-contact-tel";
    cTel.textContent = item.contactTel || "";
    cTel.setAttribute("data-eq-ctel", item.contactTel || "");

    var cEmail = document.createElement("span");
    cEmail.className = "eq-contact-email";
    cEmail.textContent = item.contactEmail || "";
    cEmail.setAttribute("data-eq-cemail", item.contactEmail || "");

    contact.appendChild(cLabel);
    contact.appendChild(cName);
    contact.appendChild(cTel);
    contact.appendChild(cEmail);

    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(price);
    body.appendChild(contact);

    card.appendChild(photoWrap);
    card.appendChild(body);
    return card;
  }

  function collectEquipmentItems(list) {
    return Array.from(list.querySelectorAll(".eq-card")).map(function (card) {
      var img = card.querySelector(".eq-photo");
      var name = card.querySelector(".eq-name");
      var desc = card.querySelector(".eq-desc");
      var price = card.querySelector(".eq-price");
      var cName = card.querySelector(".eq-contact-name");
      var cTel = card.querySelector(".eq-contact-tel");
      var cEmail = card.querySelector(".eq-contact-email");
      function getAttr(el, attr) {
        // data-* 属性を最優先。未設定の場合はテキストノードだけを結合（ボタンなど要素ノードを除外）
        if (!el) return "";
        var v = el.getAttribute(attr);
        if (v !== null) return v;
        return Array.from(el.childNodes)
          .filter(function (n) { return n.nodeType === Node.TEXT_NODE; })
          .map(function (n) { return n.textContent; })
          .join("").trim();
      }
      return {
        photo: (img && img.getAttribute("data-photo-path")) || "",
        name: getAttr(name, "data-eq-name"),
        desc: getAttr(desc, "data-eq-desc"),
        price: getAttr(price, "data-eq-price"),
        contactName: getAttr(cName, "data-eq-cname"),
        contactTel: getAttr(cTel, "data-eq-ctel"),
        contactEmail: getAttr(cEmail, "data-eq-cemail")
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

  function makeDeleteButton(onClick) {
    var btn = document.createElement("button");
    btn.className = "ck-delete-item";
    btn.type = "button";
    btn.title = "削除";
    btn.textContent = "✕";
    btn.addEventListener("click", function (e) { e.preventDefault(); onClick(); });
    return btn;
  }

  function readAndUpload(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () { uploadImage(file.name, reader.result, onDone); };
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

  // ===== 保存バー =====

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

  // ===== 保存 =====

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
        // data-ck テキスト要素
        document.querySelectorAll("[data-ck]").forEach(function (el) {
          var key = el.getAttribute("data-ck");
          var savedValue = el.getAttribute("data-ck-text");
          if (savedValue === null) return;
          setValue(contentData, key, savedValue);
        });

        // スライドショー
        var slideshow = document.getElementById("hero-slideshow");
        if (slideshow) {
          contentData.slideshow = Array.from(slideshow.querySelectorAll(".slide")).map(function (img) {
            return img.getAttribute("data-slide-path") || img.getAttribute("src");
          });
        }

        // 設置事例ギャラリー
        var gachaGrid = document.getElementById("products-gacha-grid");
        var vendGrid = document.getElementById("products-vend-grid");
        if (gachaGrid || vendGrid) {
          contentData.products = contentData.products || {};
          if (gachaGrid) contentData.products.gacha = collectProductsItems(gachaGrid);
          if (vendGrid) contentData.products.vend = collectProductsItems(vendGrid);
        }

        // 会社の歴史
        var htTimeline = document.getElementById("history-timeline");
        if (htTimeline) {
          contentData.history = contentData.history || {};
          contentData.history.items = collectHistoryItems(htTimeline);
        }

        // 貸し出し機器一覧
        var eqList = document.getElementById("equipment-list");
        if (eqList) {
          contentData.equipment = contentData.equipment || {};
          contentData.equipment.items = collectEquipmentItems(eqList);
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
