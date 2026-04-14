const app = {
    views: ['catalogue', 'game-cc', 'game-sr', 'onboarding'],
    player: {
        name: '',
        ccHighestLevel: 1,
        ccHighScore: 0,
        srHighScore: 0
    },
    
    init: function() {
        this.loadProfile();
        if (!this.player.name) {
            this.switchView('onboarding');
        } else {
            this.updateProfileUI();
            this.showCatalogue();
        }
    },

    loadProfile: function() {
        const saved = localStorage.getItem('wordchain_player');
        if (saved) {
            this.player = JSON.parse(saved);
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
        }
    },

    updateProfileUI: function() {
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = this.player.name;
        
        const ccScoreEl = document.getElementById('profile-cc-score');
        if (ccScoreEl) ccScoreEl.textContent = this.player.ccHighScore;
        
        const srScoreEl = document.getElementById('profile-sr-score');
        if (srScoreEl) srScoreEl.textContent = this.player.srHighScore;
    },

    showCatalogue: function() {
        this.switchView('catalogue');
    },

    launchGame: function(gameId) {
        this.switchView(`game-${gameId}`);
        if(gameId === 'cc' && typeof compoundChainGame !== 'undefined') {
            compoundChainGame.init();
        } else if(gameId === 'sr' && typeof shiritoriGame !== 'undefined') {
            shiritoriGame.init();
        }
    },

    switchView: function(viewId) {
        if(typeof shiritoriGame !== 'undefined') shiritoriGame.stop();
        if(typeof compoundChainGame !== 'undefined') compoundChainGame.stop();

        this.views.forEach(v => {
            const el = document.getElementById(v);
            if(el) {
                if(v === viewId) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });
    },

    antiTamper: function() {
        setInterval(() => {
            const footer = document.getElementById('credits-footer');
            if(!footer || !footer.innerHTML.includes('pranshumishra27')) {
                console.warn('Security: Footer modification detected. Re-initializing components.');
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
