(function () {
  function getValue(obj, path) {
    return path.split(".").reduce(function (o, key) {
      return o && o[key] !== undefined ? o[key] : undefined;
    }, obj);
  }

  fetch("content.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      document.querySelectorAll("[data-ck]").forEach(function (el) {
        var value = getValue(data, el.getAttribute("data-ck"));
        if (value === undefined) return;
        var attr = el.getAttribute("data-ck-attr");
        if (attr) {
          el.setAttribute(attr, value);
        } else {
          el.textContent = value;
        }
      });

      // スライドショー
      var slideshow = document.getElementById("hero-slideshow");
      if (slideshow && Array.isArray(data.slideshow) && data.slideshow.length > 0) {
        var existing = slideshow.querySelectorAll(".slide");
        existing.forEach(function (img) { img.remove(); });
        data.slideshow.forEach(function (src, i) {
          var img = document.createElement("img");
          img.src = src;
          img.alt = "ヤマトコスモス 写真" + (i + 1);
          img.className = "slide" + (i === 0 ? " is-active" : "");
          slideshow.insertBefore(img, slideshow.firstChild);
        });
      }

      // 設置事例ギャラリー
      function renderProductsGrid(gridId, items) {
        var grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = "";
        (items || []).forEach(function (item) {
          var fig = document.createElement("figure");
          fig.className = "products-item";
          var img = document.createElement("img");
          img.src = item.photo || "";
          img.setAttribute("data-photo-path", item.photo || "");
          img.alt = item.name || "";
          img.className = "products-photo";
          var cap = document.createElement("figcaption");
          cap.textContent = item.name || "";
          fig.appendChild(img);
          fig.appendChild(cap);
          grid.appendChild(fig);
        });
      }
      if (data.products) {
        renderProductsGrid("products-gacha-grid", data.products.gacha);
        renderProductsGrid("products-vend-grid", data.products.vend);
      }

      // 貸し出し機器一覧
      function renderEquipmentList(items) {
        var list = document.getElementById("equipment-list");
        if (!list) return;
        list.innerHTML = "";
        (items || []).forEach(function (item) {
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

          var desc = document.createElement("div");
          desc.className = "eq-desc";
          desc.textContent = item.desc || "";

          var price = document.createElement("div");
          price.className = "eq-price";
          price.textContent = item.price || "";

          var contact = document.createElement("div");
          contact.className = "eq-contact";

          var cLabel = document.createElement("span");
          cLabel.className = "eq-contact-label";
          cLabel.textContent = "担当：";

          var cName = document.createElement("span");
          cName.className = "eq-contact-name";
          cName.textContent = item.contactName || "";

          var cTel = document.createElement("span");
          cTel.className = "eq-contact-tel";
          cTel.textContent = item.contactTel || "";

          var cEmail = document.createElement("span");
          cEmail.className = "eq-contact-email";
          cEmail.textContent = item.contactEmail || "";

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
          list.appendChild(card);
        });
      }
      if (data.equipment) {
        renderEquipmentList(data.equipment.items);
      }

      document.dispatchEvent(new CustomEvent("content-loaded"));
    })
    .catch(function (err) {
      console.error("content.json の読み込みに失敗しました", err);
    });
})();
