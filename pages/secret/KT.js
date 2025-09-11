// ARG page script — isolated to pages/secret
(function () {
  try {
    // Play arrival sound only when coming from the Konami gate
    function play(src) {
      try { new Audio(src).play().catch(function () {}); } catch (_) {}
    }

    function onReady(fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
      } else {
        fn();
      }
    }

    onReady(function () {
      try {
        if (sessionStorage.getItem('konami-arrival') === '1') {
          sessionStorage.removeItem('konami-arrival');
          play('/audio/se_cat00.wav');
        }
      } catch (_) {}
    });
  } catch (_) {
    // keep this page quiet if anything fails
  }
})();
