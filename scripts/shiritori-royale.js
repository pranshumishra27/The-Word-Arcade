const AI_TIERS = [
    { name: "Bronze Grunt", hp: 100, dmgMult: 0.5, speed: 2000, color: "#cd7f32", img: "ai_bronze_1776192974545.png" },
    { name: "Silver Adept", hp: 150, dmgMult: 1.0, speed: 1500, color: "#c0c0c0", img: "ai_silver_1776192993743.png" },
    { name: "Gold Master", hp: 250, dmgMult: 1.5, speed: 800, color: "#ffd700", img: "ai_gold_1776193007883.png" },
    { name: "Lexical Overlord", hp: 400, dmgMult: 2.0, speed: 400, color: "#ff4b4b", img: "ai_overlord_1776193024488.png" }
];

const shiritoriGame = {
    timer: null,
    timeLeft: 100,
    playerHp: 100,
    enemyHp: 100,
    maxPlayerHp: 100,
    currentLetter: '',
    usedWords: new Set(),
    dictionary: new Set(),
    isPlaying: false,
    
    currentTier: 0,
    lastWordTime: 0,
    comboMult: 1.0,
    score: 0,

    init: function() {
        const tierData = AI_TIERS[this.currentTier];
        this.maxPlayerHp = 100 + (this.currentTier * 50);
        this.playerHp = this.maxPlayerHp;
        this.enemyHp = tierData.hp;
        
        this.comboMult = 1.0;
        this.score = 0;
        document.getElementById('sr-score').textContent = "0";
        this.usedWords.clear();
        this.timeLeft = 100;
        this.isPlaying = true;

        if (this.dictionary.size === 0 && typeof DICTIONARY !== 'undefined') {
            this.dictionary = new Set(DICTIONARY);
        }

        document.getElementById('sr-history').innerHTML = '';
        document.getElementById('sr-enemy-name').textContent = tierData.name;
        document.getElementById('sr-enemy-name').style.color = tierData.color;
        
        const avatarEl = document.getElementById('sr-enemy-avatar');
        if (avatarEl) {
            avatarEl.src = `assets/${tierData.img}`;
            avatarEl.style.borderColor = tierData.color;
        }

        document.getElementById('sr-rank-badge').textContent = `Tier: ${tierData.name}`;
        document.getElementById('sr-post-game').classList.add('hidden');
        document.getElementById('sr-form').classList.remove('hidden');
        document.getElementById('sr-input').disabled = false;
        
        this.updateHealth();
        
        const form = document.getElementById('sr-form');
        form.onsubmit = this.submitWord.bind(this);
        
        const startWords = ["APPLE", "TIGER", "HOUSE", "TRAIN", "GHOST", "SWORD", "MAGIC"];
        const initWord = startWords[Math.floor(Math.random() * startWords.length)];
        this.addHistory(initWord, 'enemy');
        this.currentLetter = initWord.slice(-1).toUpperCase();
        this.usedWords.add(initWord.toLowerCase());
        
        this.updateUI();
        this.setStatus('Round Start! Word ends in ' + this.currentLetter, false);
        this.lastWordTime = performance.now();
        if(typeof sfx !== 'undefined') sfx.playSuccess();
        this.startTimer();
    },

    stop: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
        document.body.classList.remove('fever-mode');
    },

    startTimer: function() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPlaying) return;
            
            this.timeLeft -= 1.0 + (this.currentTier * 0.2); 
            
            // Calculate Combo
            const elapsed = (performance.now() - this.lastWordTime) / 1000;
            if (elapsed < 2) {
                this.comboMult = 2.0;
                document.getElementById('sr-combo-text').style.color = "#00ff87";
                document.body.classList.add('fever-mode');
            } else if (elapsed < 5) {
                this.comboMult = 1.5;
                document.getElementById('sr-combo-text').style.color = "#f2c94c";
                document.body.classList.remove('fever-mode');
            } else {
                this.comboMult = 1.0;
                document.getElementById('sr-combo-text').style.color = "var(--text-secondary)";
                document.body.classList.remove('fever-mode');
            }
            document.getElementById('sr-combo-text').textContent = this.comboMult.toFixed(1) + "x";

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.damage('player', 15 * AI_TIERS[this.currentTier].dmgMult);
                this.setStatus('Time Out Penalty!', true);
                fx.screenShake(10, 300);
                if(typeof sfx !== 'undefined') sfx.playError();
                this.timeLeft = 100;
                this.lastWordTime = performance.now();
            }
            
            const timerFill = document.getElementById('sr-timer');
            timerFill.style.width = this.timeLeft + '%';
            
            if (this.timeLeft < 30) timerFill.classList.add('urgent');
            else timerFill.classList.remove('urgent');

            if (this.playerHp <= 0 || this.enemyHp <= 0) {
                this.endGame();
            }
        }, 100);
    },

    updateUI: function() {
        document.getElementById('sr-start-letter').textContent = this.currentLetter;
        document.getElementById('sr-input').value = '';
        document.getElementById('sr-input').focus();
    },

    addHistory: function(word, type) {
        const historyEl = document.getElementById('sr-history');
        const item = document.createElement('p');
        item.className = `history-item ${type}`;
        item.textContent = word.toUpperCase();
        historyEl.appendChild(item);
        historyEl.scrollTop = historyEl.scrollHeight;
    },

    damage: function(target, amount) {
        amount = Math.ceil(amount);
        const hpKey = target + 'Hp';
        this[hpKey] = Math.max(0, this[hpKey] - amount);
        this.updateHealth();

        const card = document.getElementById('sr-' + target);
        const rect = card.getBoundingClientRect();
        
        let color = target === 'player' ? '#ff4b4b' : '#3a7bd5';
        if (amount > 15) color = '#b34bff'; // Crit color
        
        fx.floatingText(`-${amount}`, rect.left + rect.width/2, rect.top + 20, color, amount > 15 ? '3rem' : '2rem');
        fx.createExplosion(rect.left + rect.width/2, rect.top + 50, color, amount > 15 ? 20 : 10);
        
        if (amount > 15) {
            if(typeof sfx !== 'undefined') sfx.playCrit();
        } else {
            if(typeof sfx !== 'undefined') sfx.playHit();
        }

        if(amount > 15 || target === 'player') fx.screenShake(amount > 15 ? 8 : 4, 300);
    },

    updateHealth: function() {
        document.getElementById('sr-player-hp').style.width = (this.playerHp / this.maxPlayerHp * 100) + '%';
        let enemyMax = AI_TIERS[this.currentTier].hp;
        document.getElementById('sr-enemy-hp').style.width = (this.enemyHp / enemyMax * 100) + '%';
    },

    setStatus: function(msg, isError = false) {
        const statusEl = document.getElementById('sr-status');
        statusEl.textContent = msg;
        statusEl.style.color = isError ? "var(--accent-red-light)" : "var(--accent-green-light)";
        if(isError) {
            document.getElementById('sr-form').classList.add('shake');
            setTimeout(() => document.getElementById('sr-form').classList.remove('shake'), 400);
        }
    },

    submitWord: function(e) {
        e.preventDefault();
        if(!this.isPlaying) return;

        const input = document.getElementById('sr-input').value.trim().toLowerCase();
        if(!input) return;

        if(!input.startsWith(this.currentLetter.toLowerCase())) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus(`Word must start with ${this.currentLetter}`, true);
            return;
        }
        if(this.usedWords.has(input)) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus('Word already used!', true);
            return;
        }
        if(!this.dictionary.has(input)) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus('Not a valid word!', true);
            return;
        }

        this.usedWords.add(input);
        this.addHistory(input, 'player');
        
        let baseDmg = input.length;
        const lastLetter = input.slice(-1).toLowerCase();
        
        if(['x', 'z', 'q', 'j', 'v'].includes(lastLetter)) baseDmg *= 1.5;
        
        let finalDmg = baseDmg * this.comboMult;
        
        // Score calculation
        const wordScore = Math.floor(finalDmg * 15);
        this.score += wordScore;
        document.getElementById('sr-score').textContent = this.score;
        
        const inputRect = document.getElementById('sr-input').getBoundingClientRect();
        fx.floatingText(`+${wordScore}`, inputRect.left + inputRect.width/2, inputRect.top - 20, '#f2c94c', '2rem');

        this.damage('enemy', finalDmg);
        this.currentLetter = lastLetter.toUpperCase();
        this.timeLeft = 100; 
        this.lastWordTime = performance.now();

        if(this.enemyHp <= 0) {
            this.endGame();
            return;
        }

        this.updateUI();
        this.enemyTurn();
    },

    enemyTurn: function() {
        this.isPlaying = false; 
        document.getElementById('sr-input').disabled = true;
        this.setStatus('Enemy is thinking...', false);
        
        const tier = AI_TIERS[this.currentTier];
        
        setTimeout(() => {
            let aiWord = null;
            let possibleWords = [];

            for(let word of this.dictionary) {
                if(word.startsWith(this.currentLetter.toLowerCase()) && !this.usedWords.has(word)) {
                    possibleWords.push(word);
                    if(possibleWords.length > (40 - this.currentTier * 10)) break; // Higher tier = harder words
                }
            }

            if(possibleWords.length === 0) {
                this.enemyHp = 0;
                this.updateHealth();
                this.setStatus('Enemy has no words left!', false);
                this.endGame();
                return;
            }

            aiWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
            this.usedWords.add(aiWord);
            this.addHistory(aiWord, 'enemy');
            
            let dmg = aiWord.length * tier.dmgMult;
            this.damage('player', dmg);
            this.currentLetter = aiWord.slice(-1).toUpperCase();
            
            if(this.playerHp <= 0) {
                this.endGame();
                return;
            }

            this.isPlaying = true;
            this.timeLeft = 100;
            this.lastWordTime = performance.now();
            document.getElementById('sr-input').disabled = false;
            this.updateUI();
            this.setStatus('Your turn!', false);
            
        }, tier.speed + Math.random() * 500);
    },

    endGame: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
        document.body.classList.remove('fever-mode');
        document.getElementById('sr-form').classList.add('hidden');
        document.getElementById('sr-post-game').classList.remove('hidden');
        
        // Save score if higher
        let isNewHigh = false;
        if (this.score > app.player.srHighScore) {
            app.player.srHighScore = this.score;
            isNewHigh = true;
            app.saveProfile();
        }
        
        if (this.playerHp <= 0) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus("DEFEAT...", true);
            fx.screenPulse();
        } else {
            if(typeof sfx !== 'undefined') sfx.playVictory();
            this.setStatus(isNewHigh ? "VICTORY! NEW RECORD!" : "VICTORY!", false);
            fx.createExplosion(window.innerWidth/2, window.innerHeight/2, '#ffd700', 100);
        }
    },

    nextMatch: function() {
        if (this.enemyHp <= 0) {
            if (this.currentTier < AI_TIERS.length - 1) {
                this.currentTier++;
            } else {
                alert("You are the absolute champion!");
                this.currentTier = 0; // loop
            }
        }
        this.init();
    },

    shareResult: function() {
        const result = this.playerHp > 0 ? "VICTORY" : "DEFEAT";
        const tier = AI_TIERS[this.currentTier].name;
        
        let grid = "";
        for(let i=0; i<5; i++) {
            grid += Math.random() > 0.3 ? "🟩" : "🟨";
        }
        
        const text = `⚔️ Wordchain Nexus | Shiritori Royale\nResult: ${result} against ${tier}\n${grid}\nCombos Chained! Play now!`;
        
        const copySuccess = () => {
            this.setStatus("Copied to clipboard!", false);
            fx.floatingText("Copied! 🔗", window.innerWidth/2, window.innerHeight/2, '#1da1f2');
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(copySuccess).catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                copySuccess();
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    }
};
