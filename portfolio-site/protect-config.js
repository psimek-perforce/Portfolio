/* ==========================================================================
   Password protection — configuration (per section)
   --------------------------------------------------------------------------
   Each case study is a "section" identified by its id (matches the article id
   and its <id>.source.html file). For each one:

     enabled: true   → password dialog; content stays AES-256-GCM encrypted
                       until the correct password is entered.
     enabled: false  → content is shown OPENLY (no dialog) by loading the
                       plaintext <id>.source.html. In this mode that source
                       file is public, so it must be deployed alongside the page.

   ALL sections share the SAME password (it is the AES key, never stored here),
   but each section is unlocked independently — entering the password on a
   section reveals only that section.
   To change the password or any content, edit the relevant <id>.source.html
   and re-run:   node encrypt-content.cjs "SHARED-PASSWORD"
   ========================================================================== */
window.ProtectConfig = {
  sections: {
    "ai-test-studio": { enabled: true }
  }
};
