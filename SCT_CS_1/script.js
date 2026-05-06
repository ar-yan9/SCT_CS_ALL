(function () {
  "use strict";

  /**
   * Normalize shift to be within [-25, 25].
   */
  function normalizeShift(raw) {
    var shift = Number(raw);
    if (!Number.isFinite(shift) || Number.isNaN(shift)) return 0;
    // Reduce modulo 26 while preserving sign
    shift = ((shift % 26) + 26) % 26; // now in [0,25]
    if (shift > 25) shift = shift - 26; // safety, though not needed after modulo
    return shift;
  }

  /**
   * Caesar shift a single character. Preserves case; non-letters unchanged.
   */
  function shiftChar(char, shift) {
    var code = char.charCodeAt(0);
    var aCode, zCode;
    // Uppercase A-Z
    if (code >= 65 && code <= 90) {
      aCode = 65;
      zCode = 90;
    } else if (code >= 97 && code <= 122) {
      // Lowercase a-z
      aCode = 97;
      zCode = 122;
    } else {
      return char; // leave non-letters
    }

    var alphaIndex = code - aCode; // 0..25
    var shifted = (alphaIndex + shift + 26) % 26; // wrap
    return String.fromCharCode(aCode + shifted);
  }

  /**
   * Transform text by shifting each letter with provided shift.
   */
  function transform(text, shift) {
    var normalized = normalizeShift(shift);
    var result = "";
    for (var i = 0; i < text.length; i++) {
      result += shiftChar(text[i], normalized);
    }
    return result;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setOutput(value) {
    $("outputText").value = value;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  function updateThemeIcon() {
    var isLight = document.documentElement.classList.contains("light");
    $("themeIcon").textContent = isLight ? "🌙" : "☀️";
    $("themeToggle").setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
  }

  function applyThemeFromPreference() {
    var saved = localStorage.getItem("cc-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
    } else if (saved === "dark") {
      document.documentElement.classList.remove("light");
    } else {
      // System preference fallback
      var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      if (prefersLight) {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
    updateThemeIcon();
  }

  function toggleTheme() {
    var root = document.documentElement;
    var willBeLight = !root.classList.contains("light");
    root.classList.toggle("light", willBeLight);
    localStorage.setItem("cc-theme", willBeLight ? "light" : "dark");
    updateThemeIcon();
  }

  function initEvents() {
    $("encryptBtn").addEventListener("click", function () {
      var text = $("inputText").value;
      var shift = Number($("shiftInput").value);
      setOutput(transform(text, shift));
    });

    $("decryptBtn").addEventListener("click", function () {
      var text = $("inputText").value;
      var shift = Number($("shiftInput").value);
      setOutput(transform(text, -shift));
    });

    $("clearBtn").addEventListener("click", function () {
      $("inputText").value = "";
      setOutput("");
      $("inputText").focus();
    });

    $("copyBtn").addEventListener("click", function () {
      var text = $("outputText").value;
      if (!text) return;
      copyToClipboard(text);
    });

    $("themeToggle").addEventListener("click", toggleTheme);

    // Keyboard shortcuts
    document.addEventListener("keydown", function (ev) {
      if (ev.ctrlKey && ev.key.toLowerCase() === "e") {
        ev.preventDefault();
        $("encryptBtn").click();
      } else if (ev.ctrlKey && ev.key.toLowerCase() === "d") {
        ev.preventDefault();
        $("decryptBtn").click();
      } else if (ev.ctrlKey && ev.key.toLowerCase() === "l") {
        ev.preventDefault();
        $("clearBtn").click();
      }
    });
  }

  // Initialize
  applyThemeFromPreference();
  window.addEventListener("DOMContentLoaded", initEvents);
})();

