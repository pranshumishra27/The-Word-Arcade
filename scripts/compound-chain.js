const compoundChainGame = {
    currentLevelId: 0,
    currentWordIndex: 0,
    currentRun: [],
    levelData: null,
    timer: null,
    timeLeft: 30,
    isPlaying: false,
    score: 0,
    hintsUsedForWord: 0,  // tracks how many hints revealed for the current word

    init: function() {
        this.score = 0;
        this.hintUsed = false;
        this.isDailyMode = false;
        document.getElementById('cc-score').textContent = "0";
        if(typeof app !== 'undefined' && app.player.name) {
            document.getElementById('cc-player-name-display').textContent = `Player: ${app.player.name}`;
        }
        let pool = [...COMPOUND_LEVELS].sort(() => 0.5 - Math.random());
        this.currentRun = pool.slice(0, 10);
        this.loadLevel(0);
    },

    // Daily challenge mode — loads a single seeded level
    initDaily: function() {
        this.score = 0;
        this.hintUsed = false;
        this.isDailyMode = true;
        document.getElementById('cc-score').textContent = "0";
        if(typeof app !== 'undefined' && app.player.name) {
            document.getElementById('cc-player-name-display').textContent = `Player: ${app.player.name}`;
        }
        if(typeof daily !== 'undefined') {
            const lvl = daily.getDailyLevel();
            this.currentRun = [lvl];
        } else {
            this.currentRun = [COMPOUND_LEVELS[0]];
        }
        this.loadLevel(0);
    },

    loadLevel: function(index) {
        if(index >= this.currentRun.length) {
            document.getElementById('cc-status').textContent = "Run complete! Fantastic linkage!";
            document.getElementById('cc-status').style.color = "var(--accent-green-light)";
            document.getElementById('cc-hint').textContent = "Circuit Mastery Achieved!";
            
            setTimeout(() => {
                this.init(); // Auto-restart a fresh run
            }, 5000);
            return;
        }

        this.currentLevelId = index;
        this.currentWordIndex = 0;
        this.levelData = this.currentRun[index];
        this.maxTime = Math.max(10, 30 - (index * 1)); 
        this.timeLeft = this.maxTime;
        this.isPlaying = true;

        document.getElementById('cc-level-id').textContent = (index + 1) + " / " + this.currentRun.length;
        document.getElementById('cc-input').value = '';
        document.getElementById('cc-status').textContent = '';
        
        this.renderViewer();
        this.startTimer();
    },

    stop: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
    },

    startTimer: function() {
        clearInterval(this.timer);
        const timerFill = document.getElementById('cc-timer');
        const timerText = document.getElementById('cc-timer-text');
        const statusEl  = document.getElementById('cc-status');

        this.timer = setInterval(() => {
            if(!this.isPlaying) return;
            if(this.timeLeft > 0) {
                this.timeLeft -= 1;
            }

            const pct = this.timeLeft / this.maxTime * 100;
            timerFill.style.width = pct + '%';

            if(this.timeLeft > 0) {
                // Show countdown while bonus is still active
                timerText.textContent = "⚡ " + this.timeLeft + "s bonus";
                timerFill.style.background = pct > 50
                    ? 'linear-gradient(90deg, var(--accent-green-light), var(--accent-green-dark))'
                    : pct > 20
                        ? 'linear-gradient(90deg, #f2c94c, #f2994a)'
                        : 'linear-gradient(90deg, var(--accent-red-light), var(--accent-red-dark))';
                statusEl.textContent = '';
            } else {
                timerText.textContent = "No bonus";
                timerFill.style.width = '0%';
                statusEl.textContent = "Bonus timer gone — answer anytime!";
                statusEl.style.color = "var(--text-secondary)";
            }
        }, 1000);
    },

    buyHint: function() {
        if (this.currentWordIndex >= this.levelData.chain.length - 1) return;

        const targetWord = this.levelData.chain[this.currentWordIndex + 1];
        const baseHint   = this.levelData.hints[this.currentWordIndex + 1];

        if (this.score < 50) {
            if(typeof sfx !== 'undefined') sfx.playError();
            document.getElementById('cc-status').textContent = "Need 50 pts for a hint!";
            document.getElementById('cc-status').style.color = "var(--accent-red-light)";
            setTimeout(() => document.getElementById('cc-status').textContent = "", 2000);
            return;
        }

        this.score -= 50;
        this.hintUsed = true;
        this.hintsUsedForWord++; // track per-word hint count
        document.getElementById('cc-score').textContent = this.score;
        if(typeof sfx !== 'undefined') sfx.playClick();

        const hintEl = document.getElementById('cc-hint');

        // Build a progressively more revealing hint each time
        if (this.hintsUsedForWord === 1) {
            // First hint: show the clue + first letter
            hintEl.textContent = `${baseHint} — starts with "${targetWord[0].toUpperCase()}"…`;
        } else if (this.hintsUsedForWord === 2) {
            // Second hint: show first 2 letters + length
            const preview = targetWord.slice(0, 2).toUpperCase();
            hintEl.textContent = `Starts with "${preview}" — ${targetWord.length} letters total`;
        } else {
            // Third+ hint: reveal half the word
            const half = Math.ceil(targetWord.length / 2);
            const preview = targetWord.slice(0, half).toUpperCase() + '…';
            hintEl.textContent = `It starts: ${preview}  (${targetWord.length} letters)`;
        }

        // Explosion from the hint button, not screen center
        const btnEl = document.getElementById('cc-buy-hint');
        const rect = btnEl ? btnEl.getBoundingClientRect() : null;
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.top : window.innerHeight / 2;
        if(typeof fx !== 'undefined') fx.createExplosion(cx, cy, '#f2c94c', 15);
    },

    renderViewer: function() {
        const viewer = document.getElementById('cc-chain-viewer');
        viewer.innerHTML = '';
        
        this.levelData.chain.forEach((word, index) => {
            const el = document.createElement('div');
            if (index <= this.currentWordIndex) {
                el.className = 'chain-tile newly-added';
                el.textContent = word;
            } else {
                el.className = 'chain-tile locked';
                el.textContent = '?'.repeat(word.length);
            }
            viewer.appendChild(el);

            if (index < this.levelData.chain.length - 1) {
                const path = document.createElement('div');
                path.className = 'circuit-path' + (index < this.currentWordIndex ? ' active' : '');
                viewer.appendChild(path);
            }
        });

        if (this.currentWordIndex < this.levelData.chain.length - 1) {
            // Reset hint counter for the new word being guessed
            this.hintsUsedForWord = 0;
            document.getElementById('cc-hint').textContent = this.levelData.hints[this.currentWordIndex + 1];
            document.getElementById('cc-input').focus();
        } else {
            this.isPlaying = false;
            clearInterval(this.timer);
            // 50 points completion bonus
            const levelScore = 50;
            this.score += levelScore;
            document.getElementById('cc-score').textContent = this.score;
            
            // Save global profile high score
            if (this.score > app.player.ccHighScore) {
                app.player.ccHighScore = this.score;
                app.saveProfile();
            }
            
            document.getElementById('cc-hint').textContent = "Circuit complete!";
            document.getElementById('cc-status').textContent = `+${levelScore} Circuit Completion!`;
            document.getElementById('cc-status').style.color = "var(--accent-green-light)";
            fx.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#60efff', 40);
            if(typeof sfx !== 'undefined') sfx.playVictory();
            fx.screenPulse();
            
            // Allow them to look at the completed circuit for a bit
            setTimeout(() => {
                this.loadLevel(this.currentLevelId + 1);
            }, 3000);
        }
    },

    submitGuess: function(e) {
        e.preventDefault();
        const inputEl = document.getElementById('cc-input');
        const guess = inputEl.value.trim().toLowerCase();
        
        if (this.currentWordIndex >= this.levelData.chain.length - 1) return;

        const elRect = inputEl.getBoundingClientRect();
        const targetWord = this.levelData.chain[this.currentWordIndex + 1].toLowerCase();

        if (guess === targetWord) {
            this.currentWordIndex++;
            inputEl.value = '';
            document.getElementById('cc-status').textContent = '';
            if(typeof sfx !== 'undefined') sfx.playSuccess();
            
            // Dynamic Bonus Calculation
            const bonus = Math.floor((this.timeLeft / this.maxTime) * 20) + 10;
            this.score += bonus;
            document.getElementById('cc-score').textContent = this.score;
            fx.floatingText(`+${bonus}`, elRect.left + elRect.width/2, elRect.top - 20, '#00ff87', '2rem');
            fx.createExplosion(elRect.left + elRect.width/2, elRect.top, '#00ff87', 20);
            
            // Reset Bonus Timer
            this.timeLeft = this.maxTime;

            this.renderViewer();
        } else {
            if(typeof sfx !== 'undefined') sfx.playError();
            const form = document.getElementById('cc-form');
            form.classList.add('shake');
            
            const playfulErrors = [
                "Bzzt! Short circuit! Try again.",
                "That word doesn't quite link up...",
                "Invalid fusion detected!",
                "Nope, that fuse just blew!",
                "The Arcade says... Nah.",
                "Spelling glitch? Or just a wild guess?",
                "Not the right spark!"
            ];
            const randomError = playfulErrors[Math.floor(Math.random() * playfulErrors.length)];
            
            document.getElementById('cc-status').textContent = randomError;
            document.getElementById('cc-status').style.color = "var(--accent-red-light)";
            fx.screenShake(5, 200);
            setTimeout(() => form.classList.remove('shake'), 400);
            
            // Clear the text after a few seconds so it doesn't stay there forever
            setTimeout(() => {
                if(document.getElementById('cc-status').textContent === randomError) {
                    document.getElementById('cc-status').textContent = "";
                }
            }, 3000);
        }
    }
};
