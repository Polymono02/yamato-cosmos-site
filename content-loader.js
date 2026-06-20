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

      document.dispatchEvent(new CustomEvent("content-loaded"));
    })
    .catch(function (err) {
      console.error("content.json の読み込みに失敗しました", err);
    });
})();
