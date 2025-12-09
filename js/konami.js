// Desktop-only Konami code listener for homepage
(function () {
  try {
    var root = document.documentElement;
    if (!root || !root.classList || !root.classList.contains("homepage"))
      return;

    // Heuristic desktop check: fine pointer, no touch, no mobile UA
    var hasFinePointer = false;
    try {
      hasFinePointer =
        window.matchMedia && window.matchMedia("(pointer:fine)").matches;
    } catch (e) {}
    var hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    var isMobileUA = /Mobi|Android|iP(hone|od|ad)|Tablet|Mobile|Touch/i.test(
      navigator.userAgent,
    );
      var isDesktop = hasFinePointer && !hasTouch && !isMobileUA;
      if (!isDesktop) return;

      // SFX setup
      var beepSrc = "/audio/se_plst00.wav";
      var successSrc = "/audio/se_cat00.wav";
      try {
        var _preBeep = new Audio(beepSrc);
        _preBeep.preload = "auto";
        _preBeep.load();
        var _preSuccess = new Audio(successSrc);
        _preSuccess.preload = "auto";
        _preSuccess.load();
      } catch (e) {}

      function playSfx(src) {
        try {
          var a = new Audio(src);
          a.play().catch(function () {});
        } catch (e) {}
      }

      var sequence = [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
      "Enter",
    ];
    var index = 0;

    window.addEventListener("keydown", function (e) {
      if (!e || typeof e.key !== "string") return;
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key; // normalize letters
      var expected = sequence[index];

      if (key === expected) {
        index += 1;
        // Per-correct-key beep
        playSfx(beepSrc);
        if (index === sequence.length) {
          index = 0;
          try {
            // Mark arrival so secret page can play success sound
            try {
              sessionStorage.setItem("konami-arrival", "1");
            } catch (_) {}
            // Navigate to secret page (sound will play there)
            setTimeout(function () {
              window.location.href = "pages/secret/konami.html";
            }, 120);
          } catch (_) {}
        }
      } else {
        // Reset, but allow immediate restart if key matches first
        var restart = key === sequence[0];
        index = restart ? 1 : 0;
        if (restart) {
          // Count this as the first correct key
          playSfx(beepSrc);
        }
      }
    });
  } catch (_) {
    // Fail silently — this is a playful easter egg
  }
})();
