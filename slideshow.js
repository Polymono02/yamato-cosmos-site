(function () {
  var INTERVAL_MS = 7000;

  function initSlideshows() {
    document.querySelectorAll(".hero-slideshow").forEach(function (container) {
      if (container.dataset.slideshowInit) return;
      var slides = container.querySelectorAll(".slide");
      if (slides.length === 0) return;
      container.dataset.slideshowInit = "true";

      var dotsWrap = container.querySelector(".slideshow-dots");
      if (dotsWrap) dotsWrap.innerHTML = "";
      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var dot = document.createElement("span");
          dot.className = "slideshow-dot" + (i === 0 ? " is-active" : "");
          dot.addEventListener("click", function () {
            goTo(i);
          });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }

      var current = 0;

      function goTo(index) {
        slides[current].classList.remove("is-active");
        if (dots[current]) dots[current].classList.remove("is-active");
        current = index % slides.length;
        slides[current].classList.add("is-active");
        if (dots[current]) dots[current].classList.add("is-active");
      }

      if (slides.length > 1) {
        setInterval(function () {
          goTo(current + 1);
        }, INTERVAL_MS);
      }
    });
  }

  document.addEventListener("content-loaded", function () {
    document.querySelectorAll(".hero-slideshow").forEach(function (c) {
      delete c.dataset.slideshowInit;
    });
    initSlideshows();
  });

  document.addEventListener("DOMContentLoaded", initSlideshows);
})();
