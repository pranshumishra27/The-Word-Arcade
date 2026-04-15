// ═══════════════════════════════════════════════════════════
// share-manager.js — Universal Social Sharing for The Word Arcade
// Used by both Compound Chain and Shiritori Royale.
// ═══════════════════════════════════════════════════════════

const shareManager = {

    _currentText: '',
    _currentUrl:  'https://the-word-arcade.vercel.app',

    // ── Public API ─────────────────────────────────────────────────────

    /** Opens the share modal pre-loaded with the given text/url */
    openModal: function(text, url) {
        this._currentText = text;
        this._currentUrl  = url || 'https://the-word-arcade.vercel.app';

        const preview = document.getElementById('share-preview-text');
        if (preview) preview.textContent = text;

        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Force reflow then fade in
            void modal.offsetWidth;
            modal.classList.add('share-modal-visible');
        }
    },

    closeModal: function() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.remove('share-modal-visible');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    },

    // ── Platform Handlers ──────────────────────────────────────────────

    shareTwitter: function() {
        const encoded = encodeURIComponent(this._currentText + '\n' + this._currentUrl);
        window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,width=600,height=400');
        this._flash('twitter-btn');
    },

    shareWhatsApp: function() {
        const encoded = encodeURIComponent(this._currentText + '\n' + this._currentUrl);
        // wa.me works on both desktop (web.whatsapp.com) and mobile (native app)
        window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
        this._flash('whatsapp-btn');
    },

    shareTelegram: function() {
        const encodedUrl  = encodeURIComponent(this._currentUrl);
        const encodedText = encodeURIComponent(this._currentText);
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank', 'noopener');
        this._flash('telegram-btn');
    },

    shareFacebook: function() {
        const encodedUrl = encodeURIComponent(this._currentUrl);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,width=600,height=400');
        this._flash('facebook-btn');
    },

    copyToClipboard: function() {
        const full = this._currentText + '\n' + this._currentUrl;
        const btn  = document.getElementById('copy-btn');

        const onCopied = () => {
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML   = '✅ Copied!';
                btn.style.background = 'linear-gradient(135deg, #00ff87, #00d46a)';
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.style.background = '';
                }, 2000);
            }
            if (typeof fx !== 'undefined') fx.toast('Copied to clipboard! 🔗', 'success');
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(full).then(onCopied).catch(() => this._execCopy(full, onCopied));
        } else {
            this._execCopy(full, onCopied);
        }
    },

    // ── Native Share (mobile) ──────────────────────────────────────────

    shareNative: function() {
        if (navigator.share) {
            navigator.share({
                title: 'The Word Arcade',
                text:  this._currentText,
                url:   this._currentUrl
            }).catch(() => {
                // User cancelled or unsupported — silently ignore
            });
        } else {
            this.copyToClipboard();
        }
    },

    // ── Helpers ────────────────────────────────────────────────────────

    _flash: function(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
    },

    _execCopy: function(text, onSuccess) {
        const ta = document.createElement('textarea');
        ta.value = text;
        Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); onSuccess(); } catch(e) {}
        ta.remove();
    }
};
