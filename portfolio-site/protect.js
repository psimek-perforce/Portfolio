/* ==========================================================================
   Password protection — logic (per section, shared password)

   Each protected region declares:
       data-protected
       data-section="<id>"                 (matches ProtectedPayloads[<id>])
       data-open-src="<id>.source.html"     (plaintext, used only in open mode)

   Per-section behaviour comes from ProtectConfig.sections[<id>].enabled:
     • false → OPEN: fetch the plaintext source and render it (no dialog).
     • true  → LOCKED: show a password dialog; on the correct password, decrypt
               ProtectedPayloads[<id>] (AES-256-GCM, PBKDF2 key) and inject it.

   All sections share ONE password, but each section is unlocked INDEPENDENTLY:
   entering the password on a section reveals only that section.

   Requires a secure context (https or http://localhost). Not available on
   file:// — open through a local server or your hosting (GitHub Pages is https).
   ========================================================================== */
(function () {
  "use strict";

  function fromB64(b64) {
    var bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function decrypt(password, payload) {
    var subtle = window.crypto && window.crypto.subtle;
    if (!subtle) throw new Error("no-subtle");
    var enc = new TextEncoder();
    var baseKey = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    var key = await subtle.deriveKey(
      { name: "PBKDF2", salt: fromB64(payload.salt), iterations: payload.iter, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    var plain = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(payload.iv) }, key, fromB64(payload.data));
    return new TextDecoder().decode(plain);
  }

  var ICON =
    '<div class="lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>';

  document.addEventListener("DOMContentLoaded", function () {
    var cfg = window.ProtectConfig || {};
    var sectionsCfg = cfg.sections || {};
    var payloads = window.ProtectedPayloads || {};
    var regions = Array.prototype.slice.call(document.querySelectorAll("[data-protected]"));
    if (!regions.length) return;
    var hasSubtle = !!(window.crypto && window.crypto.subtle);

    // Track regions that are currently locked, so one password unlocks all.
    var locked = [];

    regions.forEach(function (region) {
      var id = region.getAttribute("data-section") || "";
      var conf = sectionsCfg[id] || {};
      var enabled = conf.enabled !== false; // default: protected
      var mount = region.querySelector(".protected-mount");
      var skel = region.querySelector(".lock-skeleton");

      if (!enabled) {
        // OPEN mode — render plaintext source directly, no dialog.
        if (skel) skel.parentNode.removeChild(skel);
        region.classList.remove("is-locked");
        var openUrl = region.getAttribute("data-open-src") || (id + ".source.html");
        fetch(openUrl)
          .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
          .then(function (html) {
            if (mount) mount.innerHTML = html;
            if (typeof window.initLightbox === "function") window.initLightbox(mount);
          })
          .catch(function () {
            console.warn("[protect] '" + id + "' is open (enabled:false) but '" + openUrl +
              "' was not found. Deploy it alongside the page.");
          });
        return;
      }

      // LOCKED mode
      region.classList.add("is-locked");
      var overlay = document.createElement("div");
      overlay.className = "lock-overlay";

      if (!hasSubtle || !payloads[id]) {
        overlay.innerHTML =
          '<div class="lock-card">' + ICON +
          '<h4 class="lock-title">Protected content unavailable</h4>' +
          '<p class="lock-sub">' +
            (!hasSubtle
              ? 'Open this page over <strong>https</strong> or <strong>http://localhost</strong> (not file://) to unlock.'
              : 'Encrypted content for "' + id + '" failed to load.') +
          '</p></div>';
        region.appendChild(overlay);
        return;
      }

      overlay.innerHTML =
        '<form class="lock-card" autocomplete="off">' + ICON +
          '<h4 class="lock-title">This case study is protected</h4>' +
          '<p class="lock-sub">This product hasn\'t been released yet, so the full case study is password‑protected. Enter the password to view it.</p>' +
          '<input class="lock-input" type="password" placeholder="Password" aria-label="Password" required />' +
          '<button class="btn btn-primary lock-btn" type="submit">Unlock</button>' +
          '<p class="lock-error" role="alert" hidden>Incorrect password. Try again.</p>' +
        '</form>';
      region.appendChild(overlay);

      var entry = { region: region, mount: mount, skel: skel, id: id, overlay: overlay };
      locked.push(entry);

      var form = overlay.querySelector("form");
      var input = overlay.querySelector(".lock-input");
      var error = overlay.querySelector(".lock-error");
      var btn = overlay.querySelector(".lock-btn");

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        error.hidden = true;
        btn.disabled = true; btn.textContent = "Unlocking…";
        var pw = input.value;
        // Reveal ONLY this section (each tab is unlocked independently,
        // even though all sections share the same password).
        try {
          await reveal(entry, pw);
        } catch (err) {
          btn.disabled = false; btn.textContent = "Unlock";
          error.hidden = false; input.value = ""; input.focus();
          var card = overlay.querySelector(".lock-card");
          card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        }
      });
    });

    // Decrypt one section's payload and inject it; throws on wrong password.
    async function reveal(entry, pw) {
      if (!entry.region.classList.contains("is-locked")) return; // already open
      var html = await decrypt(pw, payloads[entry.id]);
      if (entry.mount) entry.mount.innerHTML = html;
      if (entry.skel && entry.skel.parentNode) entry.skel.parentNode.removeChild(entry.skel);
      entry.region.classList.remove("is-locked");
      if (entry.overlay && entry.overlay.parentNode) entry.overlay.parentNode.removeChild(entry.overlay);
      if (typeof window.initLightbox === "function") window.initLightbox(entry.mount);
    }
  });
})();
