const compoundChainGame = {
    currentLevelId: 0,
    currentWordIndex: 0,
    currentRun: [],
    levelData: null,
    timer: null,
    timeLeft: 30,
    isPlaying: false,
    score: 0,
    hintsUsedForWord: 0,

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
            const postEl = document.getElementById('cc-post-game');
            if (postEl) postEl.classList.remove('hidden');
            setTimeout(() => { this.init(); }, 5000);
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
        const timerLabel = document.getElementById('cc-status-timer');
        if (timerLabel) timerLabel.textContent = '';
        const postEl = document.getElementById('cc-post-game');
        if (postEl) postEl.classList.add('hidden');

        // Daily mode: hide hint button entirely
        const hintBtn = document.getElementById('cc-buy-hint');
        if (hintBtn) hintBtn.style.display = this.isDailyMode ? 'none' : '';

        this.renderViewer();
        this.startTimer();
    },

    stop: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
    },

    startTimer: function() {
        clearInterval(this.timer);
        const timerFill  = document.getElementById('cc-timer');
        const timerText  = document.getElementById('cc-timer-text');
        const timerLabel = document.getElementById('cc-status-timer');

        this.timer = setInterval(() => {
            if(!this.isPlaying) return;
            if(this.timeLeft > 0) {
                this.timeLeft -= 1;
            }

            const pct = this.timeLeft / this.maxTime * 100;
            if(timerFill) timerFill.style.width = pct + '%';

            if(this.timeLeft > 0) {
                if(timerText) timerText.textContent = "⚡ " + this.timeLeft + "s bonus";
                if(timerFill) timerFill.style.background = pct > 50
                    ? 'linear-gradient(90deg, var(--accent-green-light), var(--accent-green-dark))'
                    : pct > 20
                        ? 'linear-gradient(90deg, #f2c94c, #f2994a)'
                        : 'linear-gradient(90deg, var(--accent-red-light), var(--accent-red-dark))';
                if (timerLabel) timerLabel.textContent = '';
            } else {
                if(timerText) timerText.textContent = "No bonus";
                if(timerFill) timerFill.style.width = '0%';
                if (timerLabel) {
                    timerLabel.textContent = "Bonus time gone — answer anytime!";
                    timerLabel.style.color = "var(--text-secondary)";
                }
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
        this.hintsUsedForWord++;
        document.getElementById('cc-score').textContent = this.score;
        if(typeof sfx !== 'undefined') sfx.playClick();

        const hintEl = document.getElementById('cc-hint');

        if (this.hintsUsedForWord === 1) {
            hintEl.textContent = `${baseHint} — starts with "${targetWord[0].toUpperCase()}"…`;
        } else if (this.hintsUsedForWord === 2) {
            const preview = targetWord.slice(0, 2).toUpperCase();
            hintEl.textContent = `Starts with "${preview}" — ${targetWord.length} letters total`;
        } else {
            const half = Math.ceil(targetWord.length / 2);
            const preview = targetWord.slice(0, half).toUpperCase() + '…';
            hintEl.textContent = `It starts: ${preview}  (${targetWord.length} letters)`;
        }

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
            this.hintsUsedForWord = 0;
            document.getElementById('cc-hint').textContent = this.levelData.hints[this.currentWordIndex + 1];
            document.getElementById('cc-input').focus();
        } else {
            this.isPlaying = false;
            clearInterval(this.timer);

            const levelScore = 50;
            this.score += levelScore;
            document.getElementById('cc-score').textContent = this.score;

            if (this.score > app.player.ccHighScore) {
                app.player.ccHighScore = this.score;
                app.saveProfile();
            }

            // Daily challenge hook
            if (this.isDailyMode && typeof daily !== 'undefined') {
                daily.onLevelComplete(this.score);
            }

            // Perfect chain achievement
            if (!this.hintUsed && typeof achievements !== 'undefined') {
                achievements.unlock('perfect_chain');
            }

            document.getElementById('cc-hint').textContent = "Circuit complete!";
            document.getElementById('cc-status').textContent = `+${levelScore} Circuit Completion!`;
            document.getElementById('cc-status').style.color = "var(--accent-green-light)";
            if(typeof fx !== 'undefined') {
                fx.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#60efff', 40);
                fx.screenPulse();
            }
            if(typeof sfx !== 'undefined') sfx.playVictory();

            setTimeout(() => { this.loadLevel(this.currentLevelId + 1); }, 3000);
        }
    },

    submitGuess: function(e) {
        e.preventDefault();
        if(typeof sfx !== 'undefined') sfx.init(); // ensure audio context is running
        const inputEl = document.getElementById('cc-input');
        const guess = inputEl.value.trim().toLowerCase();

        if (this.currentWordIndex >= this.levelData.chain.length - 1) return;

        const elRect = inputEl.getBoundingClientRect();
        const cx = elRect.left + elRect.width / 2;
        const cy = elRect.top;
        const targetWord = this.levelData.chain[this.currentWordIndex + 1].toLowerCase();

        if (guess === targetWord) {
            this.currentWordIndex++;
            inputEl.value = '';
            document.getElementById('cc-status').textContent = '';
            if(typeof sfx !== 'undefined') sfx.playSuccess();

            const bonus = Math.floor((this.timeLeft / this.maxTime) * 20) + 10;
            this.score += bonus;
            document.getElementById('cc-score').textContent = this.score;
            if(typeof fx !== 'undefined') {
                fx.floatingText(`+${bonus}`, cx, cy - 20, '#00ff87', '2rem');
                fx.createExplosion(cx, cy, '#00ff87', 20);
            }

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
            if(typeof fx !== 'undefined') fx.screenShake(5, 200);
            setTimeout(() => form.classList.remove('shake'), 400);

            setTimeout(() => {
                if(document.getElementById('cc-status').textContent === randomError) {
                    document.getElementById('cc-status').textContent = "";
                }
            }, 3000);
        }
    },

    shareResult: function() {
        const text =
`🧩 The Word Arcade — Compound Chain
Score: ${this.score} pts across ${this.currentLevelId} levels
${'🟩'.repeat(Math.min(this.currentLevelId,5))}${'⬛'.repeat(Math.max(0,5-this.currentLevelId))}
Play free at https://the-word-arcade.vercel.app`;

        const onCopied = () => fx.toast('Score copied! Share it! 🔗', 'success');

        if (navigator.share) {
            navigator.share({ title: 'The Word Arcade', text }).catch(() => {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text).then(onCopied);
                }
            });
        } else if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(onCopied);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            Object.assign(ta.style, { position:'fixed', left:'-9999px' });
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            try { document.execCommand('copy'); onCopied(); } catch(e) {}
            ta.remove();
        }
    }
};
