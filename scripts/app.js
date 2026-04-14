const app = {
    views: ['catalogue', 'game-cc', 'game-sr', 'onboarding'],
    player: {
        name: '',
        ccHighScore: 0,
        srHighScore: 0,
        streak: 0
    },
    tutorialStep: 1,
    isDailyMode: false,

    init: function() {
        this.loadProfile();
        if (!this.player.name) {
            this.switchView('onboarding');
        } else {
            this.updateProfileUI();
            this.showCatalogue();
            this.maybeShowTutorial();
        }
    },

    loadProfile: function() {
        const saved = localStorage.getItem('wordchain_player');
        if (saved) {
            this.player = { ...this.player, ...JSON.parse(saved) };
        }
    },

    saveProfile: function() {
        localStorage.setItem('wordchain_player', JSON.stringify(this.player));
        this.updateProfileUI();
    },

    registerPlayer: function(e) {
        if(e) e.preventDefault();
        const input = document.getElementById('player-name-input').value.trim();
        if(input) {
            this.player.name = input;
            this.saveProfile();
            if(typeof sfx !== 'undefined') sfx.playSuccess();
            this.showCatalogue();
            this.showTutorial();
        }
    },

    // ── Tutorial ───────────────────────────────────────────────
    maybeShowTutorial: function() {
        const seen = localStorage.getItem('tutorial_seen');
        if (!seen) this.showTutorial();
    },

    showTutorial: function() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.tutorialStep = 1;
            this._syncTutorialStep();
        }
    },

    nextTutorialStep: function() {
        this.tutorialStep++;
        this._syncTutorialStep();
    },

    _syncTutorialStep: function() {
        document.querySelectorAll('.tutorial-step').forEach((el, i) => {
            el.classList.toggle('hidden', i + 1 !== this.tutorialStep);
        });
        document.querySelectorAll('.t-dot').forEach((el, i) => {
            el.classList.toggle('active', i + 1 === this.tutorialStep);
        });
    },

    closeTutorial: function() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
        localStorage.setItem('tutorial_seen', '1');
    },

    // ── Profile UI ─────────────────────────────────────────────
    updateProfileUI: function() {
        const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        set('profile-name',     this.player.name);
        set('profile-cc-score', this.player.ccHighScore);
        set('profile-sr-score', this.player.srHighScore);
        set('profile-streak',   typeof daily !== 'undefined' ? daily.getStreak() : (this.player.streak || 0));
    },

    // ── Catalogue ──────────────────────────────────────────────
    showCatalogue: function() {
        this.isDailyMode = false;
        this.switchView('catalogue');
        this.updateProfileUI();
        this._renderDailyCard();
    },

    _renderDailyCard: function() {
        if (typeof daily === 'undefined') return;
        const done = daily.isCompletedToday();
        const statusEl = document.getElementById('daily-status');
        const titleEl  = document.getElementById('daily-title');
        if (statusEl) statusEl.textContent = done ? '✅' : '▶️';
        if (titleEl)  titleEl.textContent = done
            ? `Today's puzzle complete! +${daily.getCompletedScore()} pts`
            : "Today's Compound — play now!";
        daily.startCountdown();
    },

    // ── Daily Challenge ────────────────────────────────────────
    launchDailyChallenge: function() {
        if (typeof daily === 'undefined') return;
        if (daily.isCompletedToday()) {
            if (typeof fx !== 'undefined') fx.toast("Already completed today's challenge! Come back tomorrow 🌅", 'error');
            return;
        }
        this.isDailyMode = true;
        this.switchView('game-cc');

        const titleEl = document.getElementById('cc-game-title');
        if (titleEl) titleEl.textContent = '🔥 Daily Challenge';

        compoundChainGame.initDaily();
    },

    // ── Game Launch ────────────────────────────────────────────
    launchGame: function(gameId) {
        this.isDailyMode = false;
        this.switchView(`game-${gameId}`);

        const titleEl = document.getElementById('cc-game-title');
        if (titleEl && gameId === 'cc') titleEl.textContent = 'Compound Circuit';

        if(gameId === 'cc' && typeof compoundChainGame !== 'undefined') {
            compoundChainGame.init();
        } else if(gameId === 'sr' && typeof shiritoriGame !== 'undefined') {
            shiritoriGame.init();
        }
    },

    // ── View Switching ─────────────────────────────────────────
    switchView: function(viewId) {
        if(typeof shiritoriGame !== 'undefined') shiritoriGame.stop();
        if(typeof compoundChainGame !== 'undefined') compoundChainGame.stop();

        this.views.forEach(v => {
            const el = document.getElementById(v);
            if(el) el.classList.toggle('hidden', v !== viewId);
        });

        // Hide footer inside game views, show only in catalogue/onboarding
        const footer = document.getElementById('credits-footer');
        if (footer) footer.style.display = (viewId === 'catalogue' || viewId === 'onboarding') ? '' : 'none';
    },

    // ── Anti-Tamper ────────────────────────────────────────────
    antiTamper: function() {
        setInterval(() => {
            const footer = document.getElementById('credits-footer');
            if(footer && !footer.innerHTML.includes('pranshumishra27')) {
                if(typeof fx !== 'undefined') fx.toast('System Integrity Compromised. Restoring...', 'error');
                setTimeout(() => window.location.reload(), 2000);
            }
        }, 5000);
    }
};

window.addEventListener('load', () => {
    app.init();
    app.antiTamper();
});
