// ═══════════════════════════════════════════════════════
// daily.js — Daily Challenge Engine
// Date-seeded puzzle: same worldwide puzzle each day.
// No backend required — seed is derived from the calendar date.
// ═══════════════════════════════════════════════════════

const daily = {

    getTodayKey: function() {
        // e.g. "2026-04-15" — used as both seed and localStorage key
        return new Date().toISOString().slice(0, 10);
    },

    // Deterministic hash of a string → stable index into COMPOUND_LEVELS
    _hashSeed: function(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return Math.abs(h);
    },

    getDailyLevel: function() {
        if (typeof COMPOUND_LEVELS === 'undefined') return null;
        const idx = this._hashSeed(this.getTodayKey()) % COMPOUND_LEVELS.length;
        return COMPOUND_LEVELS[idx];
    },

    isCompletedToday: function() {
        return localStorage.getItem('daily_done_' + this.getTodayKey()) !== null;
    },

    getCompletedScore: function() {
        return parseInt(localStorage.getItem('daily_done_' + this.getTodayKey())) || 0;
    },

    markCompleted: function(score) {
        const key = this.getTodayKey();
        if (this.isCompletedToday()) return; // don't overwrite same day
        localStorage.setItem('daily_done_' + key, score);
        this._updateStreak();
    },

    _updateStreak: function() {
        const today = this.getTodayKey();
        const lastPlayed = localStorage.getItem('streak_last') || '';
        let streak = parseInt(localStorage.getItem('streak_count')) || 0;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);

        if (lastPlayed === today) {
            // Already counted today, nothing to do
            return;
        } else if (lastPlayed === yKey) {
            // Played yesterday — increment streak
            streak++;
        } else {
            // Missed a day — reset
            streak = 1;
        }

        localStorage.setItem('streak_count', streak);
        localStorage.setItem('streak_last', today);
        app.player.streak = streak;
        app.saveProfile();
    },

    getStreak: function() {
        return parseInt(localStorage.getItem('streak_count')) || 0;
    },

    // Called by CC game engine when daily mode is active
    onLevelComplete: function(score) {
        this.markCompleted(score);
        if (typeof achievements !== 'undefined') {
            const streak = this.getStreak();
            if (streak >= 3)  achievements.unlock('daily_3');
            if (streak >= 7)  achievements.unlock('daily_7');
            if (streak >= 30) achievements.unlock('daily_30');
        }
    },

    // Returns a formatted countdown string to next challenge
    getCountdown: function() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    // Render the daily countdown live
    startCountdown: function() {
        const el = document.getElementById('daily-countdown');
        if (!el) return;
        clearInterval(this._countdownTimer);
        this._countdownTimer = setInterval(() => {
            if (el) el.textContent = 'Next challenge in ' + this.getCountdown();
        }, 1000);
    }
};
