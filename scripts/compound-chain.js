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
    perfectRun: true,  // tracks whether the player used zero hints all run

    // ──────────────────────────────────────────────────────────────────
    // Build a tiered run: 4 Easy → 4 Medium → 2 Hard
    // Within each tier, order is randomised so every run feels fresh.
    // ──────────────────────────────────────────────────────────────────
    _buildTieredRun: function() {
        const shuffle = arr => arr.sort(() => 0.5 - Math.random());
        const easy   = shuffle(COMPOUND_LEVELS.filter(l => l.tier === 'easy'));
        const medium = shuffle(COMPOUND_LEVELS.filter(l => l.tier === 'medium'));
        const hard   = shuffle(COMPOUND_LEVELS.filter(l => l.tier === 'hard'));
        return [
            ...easy.slice(0, 4),
            ...medium.slice(0, 4),
            ...hard.slice(0, 2)
        ];
    },

    init: function() {
        this.score = 0;
        this.hintUsed = false;
        this.perfectRun = true;
        this.isDailyMode = false;
        document.getElementById('cc-score').textContent = "0";
        if(typeof app !== 'undefined' && app.player.name) {
            document.getElementById('cc-player-name-display').textContent = `Player: ${app.player.name}`;
        }
        // Hide daily end screen if it was visible
        this._hideDailyEnd();
        this.currentRun = this._buildTieredRun();
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
        this._hideDailyEnd();
        if(typeof daily !== 'undefined') {
            const lvl = daily.getDailyLevel();
            this.currentRun = [lvl];
        } else {
            this.currentRun = [COMPOUND_LEVELS[0]];
        }
        this.loadLevel(0);
    },

    loadLevel: function(index) {
        // ── Run complete ──
        if(index >= this.currentRun.length) {
            if (this.isDailyMode) {
                this._showDailyEnd();
            } else {
                // Update perfectRun flag one last time
                if (this.hintUsed) this.perfectRun = false;

                const isPerfect = this.perfectRun;
                const isNewHigh = this.score >= (app.player.ccHighScore || 0);

                document.getElementById('cc-status').textContent =
                    isPerfect ? '⚡ Perfect Run — Zero Hints!' : 'Run complete! Fantastic linkage!';
                document.getElementById('cc-status').style.color =
                    isPerfect ? '#b34bff' : 'var(--accent-green-light)';
                document.getElementById('cc-hint').textContent = '🏆 Circuit Mastery Achieved!';

                // Populate post-game panel
                const newHighEl = document.getElementById('cc-new-high-badge');
                if (newHighEl) newHighEl.classList.toggle('hidden', !isNewHigh);

                const postEl = document.getElementById('cc-post-game');
                if (postEl) postEl.classList.remove('hidden');

                if(typeof fx !== 'undefined') {
                    fx.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#ffd700', 80);
                    if (isPerfect) setTimeout(() =>
                        fx.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#b34bff', 60), 400);
                }

                setTimeout(() => { this.init(); }, 6000);
            }
            return;
        }

        this.currentLevelId = index;
        this.currentWordIndex = 0;
        this.levelData = this.currentRun[index];
        // Timer tightens slightly as the run progresses (never below 15s)
        this.maxTime = Math.max(15, 30 - (index * 1.5));
        this.timeLeft = this.maxTime;
        this.isPlaying = true;

        // ── Difficulty badge in level counter ──
        const tierEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' };
        const tier = this.levelData.tier || 'easy';
        const badge = tierEmoji[tier] || '';
        document.getElementById('cc-level-id').textContent =
            `${badge} ${index + 1} / ${this.currentRun.length}`;

        document.getElementById('cc-input').value = '';
        document.getElementById('cc-status').textContent = '';
        const timerLabel = document.getElementById('cc-status-timer');
        if (timerLabel) timerLabel.textContent = '';
        const postEl = document.getElementById('cc-post-game');
        if (postEl) postEl.classList.add('hidden');

        // Daily mode: hide hint button entirely
        const hintBtn = document.getElementById('cc-buy-hint');
        if (hintBtn) hintBtn.style.display = this.isDailyMode ? 'none' : '';

        // ── Milestone toasts (run positions 3 and 7) ──
        if (index === 3 && !this.isDailyMode) {
            setTimeout(() => {
                if(typeof fx !== 'undefined') fx.toast('🟡 Midway checkpoint! Ramping up the difficulty…', 'success');
            }, 300);
        } else if (index === 7 && !this.isDailyMode) {
            setTimeout(() => {
                if(typeof fx !== 'undefined') fx.toast('🔴 Two hard links left — this is where legends are made!', 'success');
            }, 300);
        }

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

            // ── New High Score detection ──
            const prevHigh = app.player.ccHighScore || 0;
            const isNewHigh = this.score > prevHigh;
            if (isNewHigh) {
                app.player.ccHighScore = this.score;
                app.saveProfile();
                // Toast nudge pointing them at the share button
                setTimeout(() => {
                    if(typeof fx !== 'undefined')
                        fx.toast('🏆 New Personal Best! Hit "Share" to brag! 📤', 'success');
                }, 800);
            }

            // If hint was used on ANY word this run, perfectRun becomes false
            if (this.hintUsed) this.perfectRun = false;

            // Daily challenge hook
            if (this.isDailyMode && typeof daily !== 'undefined') {
                daily.onLevelComplete(this.score);
            }

            // Perfect chain achievement
            if (!this.hintUsed && typeof achievements !== 'undefined') {
                achievements.unlock('perfect_chain');
            }

            document.getElementById('cc-hint').textContent = isNewHigh ? '🏆 New Record!' : 'Circuit complete!';
            document.getElementById('cc-status').textContent = `+${levelScore}${isNewHigh ? '  🏆 NEW HIGH SCORE!' : ' Circuit Completion!'}`;
            document.getElementById('cc-status').style.color = isNewHigh ? '#ffd700' : 'var(--accent-green-light)';
            if(typeof fx !== 'undefined') {
                fx.createExplosion(window.innerWidth / 2, window.innerHeight / 2, isNewHigh ? '#ffd700' : '#60efff', isNewHigh ? 70 : 40);
                fx.screenPulse();
            }
            if(typeof sfx !== 'undefined') sfx.playVictory();

            setTimeout(() => { this.loadLevel(this.currentLevelId + 1); }, 2500);
        }
    },

    // ── Levenshtein distance between two strings ──
    _levenshtein: function(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
        );
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1]
                    ? dp[i-1][j-1]
                    : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            }
        }
        return dp[m][n];
    },

    // Builds a contextual error message based on how close the guess is to the target.
    _getGuessMessage: function(guess, target) {
        if (!guess) return "Type something! The chain needs a link! 🔗";
        const dist = this._levenshtein(guess, target);
        const diff = target.length - guess.length;

        // ── Near miss: 1–2 edits ──
        if (dist === 1) {
            const oneOff = [
                `One letter off! You're SO close! 🔥`,
                `Almost! Just one character away! ✨`,
                `One tiny tweak and you've got it! 💡`,
                `That close! One letter different from the answer! 🎯`
            ];
            return oneOff[Math.floor(Math.random() * oneOff.length)];
        }

        if (dist === 2) {
            const twoOff = [
                `Really close! Just 2 letters away! 💪`,
                `You're almost there — 2 small changes needed! 🔎`,
                `So near! Rethink just 2 characters! ⚡`,
                `That's genuinely close — 2 edits away! Keep going! 🧠`
            ];
            return twoOff[Math.floor(Math.random() * twoOff.length)];
        }

        // ── Warm middle ground: 3–4 edits ──
        if (dist <= 4) {
            // Give a directional nudge without revealing the answer
            if (diff > 1) {
                const longer = [
                    `"${guess}" — think longer! The word has ${target.length} letters. 📏`,
                    `You're on a track — try a ${target.length}-letter word! 🔢`,
                    `Not quite! Needs ${target.length} letters. Stretch it out! 💭`
                ];
                return longer[Math.floor(Math.random() * longer.length)];
            } else if (diff < -1) {
                const shorter = [
                    `"${guess}" is too long! Think of a ${target.length}-letter word. ✂️`,
                    `You're close in spirit — but trim it to ${target.length} letters! 📏`,
                    `Shorten it! The answer is ${target.length} letters. 🔢`
                ];
                return shorter[Math.floor(Math.random() * shorter.length)];
            } else {
                const sameLen = [
                    `"${guess}" — right length, wrong word! Same ${target.length} letters though! 🤔`,
                    `Good letter count — but the word is different! Think harder. 🧩`,
                    `Bzzt! Short circuit — right size, wrong link! ⚡`
                ];
                return sameLen[Math.floor(Math.random() * sameLen.length)];
            }
        }

        // ── Far off: > 4 edits ──
        const farOff = [
            `"${guess}"? That fuse definitely just blew! 💥`,
            `Not even close! The Arcade says... absolutely not. 😅`,
            `Wild guess or bold strategy? Either way — nope! 🎲`,
            `Invalid fusion detected! Try a completely different angle. 🔬`,
            `The chain short-circuited! "${guess}" doesn't link here at all. ⚡`
        ];
        return farOff[Math.floor(Math.random() * farOff.length)];
    },

    submitGuess: async function(e) {
        e.preventDefault();
        if(typeof sfx !== 'undefined') sfx.init();
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
            // ── MANDATORY LEXICAL VALIDATION ──
            const currentWord = this.levelData.chain[this.currentWordIndex].toLowerCase();
            
            // Pause timer during async checks
            this.isPlaying = false;
            
            // 1. STANDALONE VALIDITY
            let isStandalone = false;
            if (typeof DICTIONARY !== 'undefined' && DICTIONARY.includes(guess)) isStandalone = true;
            else if (typeof EXTRA_WORDS !== 'undefined' && EXTRA_WORDS.includes(guess)) isStandalone = true;
            
            const originalStatus = document.getElementById('cc-status').textContent;
            
            if (!isStandalone) {
                inputEl.disabled = true;
                document.getElementById('cc-status').textContent = 'Validating word...';
                try {
                    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`, { signal: AbortSignal.timeout(3000) });
                    if (res.ok) isStandalone = true;
                } catch (err) {
                    // API failure fallback
                }
                inputEl.disabled = false;
                inputEl.focus();
            }

            if (!isStandalone) {
                this.isPlaying = true; // Resume timer
                if(typeof sfx !== 'undefined') sfx.playError();
                const form = document.getElementById('cc-form');
                form.classList.add('shake');
                document.getElementById('cc-status').textContent = "Not a recognized dictionary word! ❌";
                document.getElementById('cc-status').style.color = "var(--accent-red-light)";
                setTimeout(() => form.classList.remove('shake'), 400);
                setTimeout(() => {
                    const currentTxt = document.getElementById('cc-status').textContent;
                    if(currentTxt.includes('recognized')) document.getElementById('cc-status').textContent = "";
                }, 3000);
                return;
            }

            // 2. COMPOUND INTEGRITY & 3. SEMANTIC DRIFT PREVENTION
            const compoundWord = currentWord + guess;
            let isCompound = false;
            
            inputEl.disabled = true;
            document.getElementById('cc-status').textContent = 'Checking compound...';
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${compoundWord}`, { signal: AbortSignal.timeout(3000) });
                if (res.ok) isCompound = true;
            } catch (err) {
                // API failure fallback
            }
            inputEl.disabled = false;
            inputEl.focus();

            if (isCompound) {
                this.isPlaying = true; // Resume timer
                if(typeof sfx !== 'undefined') sfx.playError();
                const form = document.getElementById('cc-form');
                form.classList.add('shake');
                document.getElementById('cc-status').textContent = "That fits the chain, but doesn't match the hint! Try again.";
                document.getElementById('cc-status').style.color = "#f2c94c";
                setTimeout(() => form.classList.remove('shake'), 400);
                setTimeout(() => {
                    const currentTxt = document.getElementById('cc-status').textContent;
                    if(currentTxt.includes('fits the chain')) document.getElementById('cc-status').textContent = "";
                }, 3500);
                return;
            }

            // If it's a standalone word but not a valid compound that forms the right answer or alternate hint,
            // fall through to standard distance / far off errors.
            this.isPlaying = true; // Resume timer
            if(typeof sfx !== 'undefined') sfx.playError();
            const form = document.getElementById('cc-form');
            form.classList.add('shake');

            // Dynamic message based on how close the guess is to the target
            const errorMsg = this._getGuessMessage(guess, targetWord);

            document.getElementById('cc-status').textContent = errorMsg;
            document.getElementById('cc-status').style.color = "var(--accent-red-light)";
            if(typeof fx !== 'undefined') fx.screenShake(5, 200);
            setTimeout(() => form.classList.remove('shake'), 400);

            setTimeout(() => {
                if(document.getElementById('cc-status').textContent === errorMsg) {
                    document.getElementById('cc-status').textContent = "";
                }
            }, 3500);
        }
    },

    // ── Daily End Screen ───────────────────────────────────────────────

    _showDailyEnd: function() {
        const streak = typeof daily !== 'undefined' ? daily.getStreak() : 0;
        const isNewHigh = this.score > (app.player.ccHighScore - 50); // approximate

        // Populate end screen fields
        const scoreEl = document.getElementById('daily-end-score');
        if (scoreEl) scoreEl.textContent = this.score;

        const streakEl = document.getElementById('daily-end-streak');
        if (streakEl) streakEl.textContent = `🔥 ${streak} day streak`;

        const titleEl  = document.getElementById('daily-end-title');
        if (titleEl) titleEl.textContent = isNewHigh ? '🏆 New Record!' : '✅ Chain Complete!';

        // Show end panel, hide form
        const formEl = document.getElementById('cc-form');
        if (formEl) formEl.classList.add('hidden');

        const hintBtn = document.getElementById('cc-buy-hint');
        if (hintBtn) hintBtn.classList.add('hidden');

        const endEl = document.getElementById('daily-end');
        if (endEl) {
            endEl.classList.remove('hidden');
            void endEl.offsetWidth;
            endEl.classList.add('daily-end-visible');
        }

        // Fireworks!
        if (typeof fx !== 'undefined') {
            fx.createExplosion(window.innerWidth / 2, window.innerHeight / 3, '#ffd700', 80);
            fx.screenPulse();
            setTimeout(() => fx.createExplosion(window.innerWidth / 3, window.innerHeight / 2, '#60efff', 50), 400);
            setTimeout(() => fx.createExplosion(window.innerWidth * 2/3, window.innerHeight / 2, '#b34bff', 50), 700);
        }
        if (typeof sfx !== 'undefined') sfx.playVictory();
    },

    _hideDailyEnd: function() {
        const endEl = document.getElementById('daily-end');
        if (endEl) {
            endEl.classList.remove('daily-end-visible');
            endEl.classList.add('hidden');
        }
        const formEl = document.getElementById('cc-form');
        if (formEl) formEl.classList.remove('hidden');
        const hintBtn = document.getElementById('cc-buy-hint');
        if (hintBtn) hintBtn.classList.remove('hidden');
    },

    shareDailyResult: function() {
        const streak = typeof daily !== 'undefined' ? daily.getStreak() : 0;
        const score  = this.score;

        // Build a dynamic brag line
        const brags = [
            `I've been on a ${streak}-day streak & I'm not stopping.`,
            `${streak} days straight. My vocabulary is BUILT different.`,
            `Day ${streak} of outsmarting the algorithm. 🧠`
        ];
        const brag = streak > 1
            ? brags[Math.floor(Math.random() * brags.length)]
            : `First attempt. Nailed it. 🎯`;

        const bars   = '🟩'.repeat(4);
        const hooks  = [
            "Think you can beat that?",
            "Bet you can't top it. 👀",
            "Can you keep up?",
            "Your turn. Don't overthink it."
        ];
        const hook = hooks[Math.floor(Math.random() * hooks.length)];

        const text =
`🔥 Word Arcade — Daily Challenge
${bars}  ${score} pts
${brag}

${hook}`;

        if (typeof shareManager !== 'undefined') {
            shareManager.openModal(text);
        }
    },

    // ── Free-play share ────────────────────────────────────────────────
    shareResult: function() {
        const levelsCompleted = this.currentLevelId;
        const isPerfect = this.perfectRun && !this.hintUsed;
        const score = this.score;
        const prev  = (app && app.player.ccHighScore) || 0;
        const isNewHigh = score >= prev;

        // Progress emoji grid
        const easyBar   = '🟢'.repeat(Math.min(levelsCompleted, 4))  + '⬜'.repeat(Math.max(0, 4 - levelsCompleted));
        const medBar    = '🟡'.repeat(Math.min(Math.max(0, levelsCompleted - 4), 4)) + '⬜'.repeat(Math.max(0, 4 - Math.max(0, levelsCompleted - 4)));
        const hardBar   = '🔴'.repeat(Math.min(Math.max(0, levelsCompleted - 8), 2)) + '⬜'.repeat(Math.max(0, 2 - Math.max(0, levelsCompleted - 8)));
        const grid = `${easyBar}${medBar}${hardBar}`;

        const openers = [
            `I just linked ${levelsCompleted} compound word chains without breaking a sweat. 💪`,
            `${levelsCompleted} chains. ${score} points. No mercy. 🧩`,
            `My brain just solved ${levelsCompleted} compound chains. What's your excuse? 😂`
        ];
        const opener = openers[Math.floor(Math.random() * openers.length)];

        const extras = [];
        if (isPerfect) extras.push('⚡ Perfect Run — zero hints used!');
        if (isNewHigh) extras.push('🏆 Personal Best smashed!');
        const extraLine = extras.length ? '\n' + extras.join('  ') : '';

        const hooks = [
            "Can you beat that? 👀",
            "Think you can chain further?",
            "Free to play. No sign-up. Prove it."
        ];
        const hook = hooks[Math.floor(Math.random() * hooks.length)];

        const text =
`🧩 Word Arcade — Compound Chain
${grid}  ${score} pts
${opener}${extraLine}

${hook}`;

        if (typeof shareManager !== 'undefined') {
            shareManager.openModal(text);
        } else {
            const full = text + '\nhttps://the-word-arcade.vercel.app';
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(full)
                    .then(() => fx.toast('Score copied! Share it! 🔗', 'success'));
            }
        }
    }
};
