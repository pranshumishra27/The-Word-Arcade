const compoundChainGame = {
    currentLevelId: 0,
    currentWordIndex: 0,
    levelData: null,
    timer: null,
    timeLeft: 30,
    isPlaying: false,
    score: 0,

    init: function() {
        this.score = 0;
        document.getElementById('cc-score').textContent = "0";
        this.loadLevel(0);
    },

    loadLevel: function(index) {
        if(index >= COMPOUND_LEVELS.length) {
            document.getElementById('cc-status').textContent = "You've completed all levels!";
            document.getElementById('cc-status').style.color = "var(--accent-green-light)";
            document.getElementById('cc-hint').textContent = "Incredible job!";
            return;
        }

        this.currentLevelId = index;
        this.currentWordIndex = 0;
        this.levelData = COMPOUND_LEVELS[index];
        this.maxTime = Math.max(10, 30 - (index * 1)); 
        this.timeLeft = this.maxTime;
        this.isPlaying = true;

        document.getElementById('cc-level-id').textContent = this.levelData.id;
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
        this.timer = setInterval(() => {
            if(!this.isPlaying) return;
            if(this.timeLeft > 0) {
                this.timeLeft -= 1;
            }
            
            if(this.timeLeft <= 0) {
                document.getElementById('cc-status').textContent = "Time bonus elapsed! Take your time.";
                document.getElementById('cc-status').style.color = "var(--text-secondary)";
            }
            
            document.getElementById('cc-timer-text').textContent = "00:" + (this.timeLeft < 10 ? "0" : "") + this.timeLeft;
            document.getElementById('cc-timer').style.width = (this.timeLeft / this.maxTime * 100) + '%';
        }, 1000);
    },

    buyHint: function() {
        if (this.currentWordIndex >= this.levelData.chain.length - 1) return;
        
        const targetWord = this.levelData.chain[this.currentWordIndex + 1];
        if (this.score >= 50) {
            this.score -= 50;
            document.getElementById('cc-score').textContent = this.score;
            if(typeof sfx !== 'undefined') sfx.playClick();
            document.getElementById('cc-hint').textContent += ` (Starts with "${targetWord[0].toUpperCase()}")`;
            fx.createExplosion(window.innerWidth/2, window.innerHeight/2, '#f2c94c', 15);
        } else {
            if(typeof sfx !== 'undefined') sfx.playError();
            document.getElementById('cc-status').textContent = "Not enough Points (need 50)!";
            document.getElementById('cc-status').style.color = "var(--accent-red-light)";
            setTimeout(() => document.getElementById('cc-status').textContent = "", 2000);
        }
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
