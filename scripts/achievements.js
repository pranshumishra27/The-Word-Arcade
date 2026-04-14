// ═══════════════════════════════════════════════════════
// achievements.js — Achievement Engine
// Tracks milestones via localStorage. Badges are unlocked
// permanently and shown as a toast + grid on the profile.
// ═══════════════════════════════════════════════════════

const achievements = {

    BADGES: {
        'first_word':    { name: 'First Word!',      icon: '🌟', desc: 'Submit your first word in Shiritori Royale' },
        'speed_demon':   { name: 'Speed Demon',       icon: '⚡', desc: 'Answer 5 words under 3 seconds each in one match' },
        'logophile':     { name: 'Logophile',         icon: '📚', desc: 'Play a word with 10 or more letters' },
        'dragon_slayer': { name: 'Dragon Slayer',     icon: '🐉', desc: 'Defeat the Lexical Overlord' },
        'combo_king':    { name: 'Combo King',        icon: '👑', desc: 'Sustain a 2.0× combo for 3 consecutive hits' },
        'perfect_chain': { name: 'Perfect Chain',     icon: '💎', desc: 'Complete a Compound Chain level without using any hints' },
        'daily_3':       { name: 'Streak Starter',    icon: '🔥', desc: 'Maintain a 3-day Daily Challenge streak' },
        'daily_7':       { name: 'Weekly Warrior',    icon: '🏆', desc: 'Maintain a 7-day Daily Challenge streak' },
        'daily_30':      { name: 'Arcade Legend',     icon: '🌌', desc: 'Maintain a 30-day Daily Challenge streak' },
    },

    // Load earned status from localStorage
    load: function() {
        const saved = localStorage.getItem('wordarcade_achievements');
        if (saved) {
            const earned = JSON.parse(saved);
            earned.forEach(id => {
                if (this.BADGES[id]) this.BADGES[id].earned = true;
            });
        }
        this.renderGrid();
    },

    // Save earned badges to localStorage
    save: function() {
        const earned = Object.keys(this.BADGES).filter(id => this.BADGES[id].earned);
        localStorage.setItem('wordarcade_achievements', JSON.stringify(earned));
    },

    // Unlock a badge by ID
    unlock: function(id) {
        if (!this.BADGES[id] || this.BADGES[id].earned) return;
        this.BADGES[id].earned = true;
        this.save();
        this.showToast(this.BADGES[id]);
        this.renderGrid();
    },

    // Show a floating achievement toast
    showToast: function(badge) {
        const el = document.createElement('div');
        el.innerHTML = `
            <div style="font-size:1.5rem; margin-bottom:4px;">${badge.icon}</div>
            <div style="font-weight:800; font-size:0.9rem;">Achievement Unlocked!</div>
            <div style="font-size:0.85rem; opacity:0.9;">${badge.name}</div>
        `;
        Object.assign(el.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: 'linear-gradient(135deg, #f2c94c, #f2994a)',
            color: '#333',
            padding: '15px 20px',
            borderRadius: '16px',
            fontFamily: "'Outfit', sans-serif",
            zIndex: '10001',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(242,201,76,0.5)',
            transform: 'translateX(120px)',
            transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            minWidth: '180px'
        });
        document.body.appendChild(el);
        setTimeout(() => el.style.transform = 'translateX(0)', 10);
        setTimeout(() => {
            el.style.transform = 'translateX(120px)';
            setTimeout(() => el.remove(), 500);
        }, 4000);
    },

    // Render the badge grid on the profile card
    renderGrid: function() {
        const container = document.getElementById('achievements-grid');
        if (!container) return;
        container.innerHTML = '';
        Object.entries(this.BADGES).forEach(([id, badge]) => {
            const tile = document.createElement('div');
            tile.className = 'badge-tile' + (badge.earned ? ' earned' : ' locked');
            tile.title = badge.desc;
            tile.innerHTML = `<span>${badge.earned ? badge.icon : '🔒'}</span>`;
            tile.setAttribute('aria-label', badge.name + (badge.earned ? ' — Earned' : ' — Locked'));
            container.appendChild(tile);
        });
    }
};

window.addEventListener('load', () => achievements.load());
