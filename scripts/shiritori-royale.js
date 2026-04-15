const AI_TIERS = [
    { name: "Bronze Grunt",    hp: 100, dmgMult: 0.5, speed: 2000, color: "#cd7f32", img: "ai_bronze_1776192974545.png" },
    { name: "Silver Adept",   hp: 150, dmgMult: 1.0, speed: 1500, color: "#c0c0c0", img: "ai_silver_1776192993743.png" },
    { name: "Gold Master",    hp: 250, dmgMult: 1.5, speed: 800,  color: "#ffd700", img: "ai_gold_1776193007883.png"   },
    { name: "Lexical Overlord",hp:400, dmgMult: 2.0, speed: 400,  color: "#ff4b4b", img: "ai_overlord_1776193024488.png" }
];

const AI_PERSONALITIES = [
    { // Bronze Grunt
        intro:   ["I'll crush you easily, rookie.",       "Don't waste my time, amateur.",          "You won't last long."],
        winning: ["Too slow!",                             "Is that all you've got?",                "Struggle harder."],
        losing:  ["Lucky shot...",                         "You got me this time.",                  "I'll get you next round."]
    },
    { // Silver Adept
        intro:   ["Your vocabulary is... basic.",          "I hope you brought more than two-syllable words.", "Let's see what you've got."],
        winning: ["Predictable.",                           "Try harder.",                            "Your words bore me."],
        losing:  ["Not bad, not bad.",                      "You surprised me.",                      "My guard was down."]
    },
    { // Gold Master
        intro:   ["Every word you know, I know better.",   "You've come far. It ends here.",         "I appreciate the effort. Truly."],
        winning: ["Flawless lexicon.",                      "Your defeat was inevitable.",            "Perhaps study more before returning."],
        losing:  ["Impressive. Very.",                      "You've earned this victory.",            "I underestimated your command."]
    },
    { // Lexical Overlord
        intro:   ["I am the Lexical Overlord. Submit.",    "No word you know can stop me.",          "Your words are dust. My words are galaxies."],
        winning: ["OBLITERATED.",                           "Your vocabulary is a rounding error.",   "Did you think you were special?"],
        losing:  ["...Impossible.",                         "You are worthy of this victory.",        "The Arcade has a new champion."]
    }
];

const shiritoriGame = {
    timer: null,
    timeLeft: 100,
    playerHp: 100,
    enemyHp: 100,
    maxPlayerHp: 100,
    currentLetter: '',
    isPlaying: false,
    currentTier: 0,
    lastWordTime: 0,
    comboMult: 1.0,
    score: 0,

    // MATCH-SCOPED: Reset on every new match
    usedWords: new Set(),

    // SESSION-SCOPED: Built once per browser session, persists across matches
    // API-validated words are cached here so we never re-call the API for the same word
    dictionary: new Set(),
    dictionaryReady: false,

    // Common profane/abusive words to block regardless of dictionary
    PROFANITY: new Set([
        "fuck","shit","cunt","bitch","asshole","bastard","damn","dick","cock",
        "pussy","nigger","nigga","faggot","slut","whore","retard","twat",
        "wank","piss","arse","bollocks","motherfucker","fuckup","shithead"
    ]),

    init: function() {
        const tierData = AI_TIERS[this.currentTier];
        this.maxPlayerHp = 100 + (this.currentTier * 50);
        this.playerHp = this.maxPlayerHp;
        this.enemyHp = tierData.hp;
        
        this.comboMult = 1.0;
        this.score = 0;
        document.getElementById('sr-score').textContent = "0";

        // NOTE: usedWords is intentionally NOT reset here.
        // Words played across all tiers in this session remain blocked.
        // usedWords only resets when the player exits to the main Arcade menu.
        this.timeLeft = 100;
        this.isPlaying = true;
        
        if(typeof app !== 'undefined' && app.player.name) {
            document.getElementById('sr-player-name-display').textContent = app.player.name;
        }

        // Dictionary is built ONCE per browser session — words are cached across matches
        // This means API-validated words (like 'hustle') never need to be re-fetched
        if (!this.dictionaryReady && typeof DICTIONARY !== 'undefined') {
            const sanitized = DICTIONARY.filter(w => w.length > 2 && /^[a-zA-Z]+$/.test(w));
            const extras = typeof EXTRA_WORDS !== 'undefined' ? EXTRA_WORDS : [];
            this.dictionary = new Set([
                ...sanitized,
                ...extras.map(w => w.toLowerCase())
            ]);
            this.dictionaryReady = true;
        }

        document.getElementById('sr-history').innerHTML = '';
        document.getElementById('sr-enemy-name').textContent = tierData.name;
        document.getElementById('sr-enemy-name').style.color = tierData.color;
        
        const avatarEl = document.getElementById('sr-enemy-avatar');
        if (avatarEl) {
            avatarEl.src = `assets/${tierData.img}`;
            avatarEl.style.borderColor = tierData.color;
        }

        document.getElementById('sr-rank-badge').textContent = `Tier ${this.currentTier + 1} / ${AI_TIERS.length}`;
        document.getElementById('sr-post-game').classList.add('hidden');
        document.getElementById('sr-form').classList.remove('hidden');
        document.getElementById('sr-input').disabled = false;
        
        this.updateHealth();
        
        const form = document.getElementById('sr-form');
        form.onsubmit = this.submitWord.bind(this);
        
        // AI intro quote
        const personality = AI_PERSONALITIES[this.currentTier];
        if (personality) {
            const quote = personality.intro[Math.floor(Math.random() * personality.intro.length)];
            const quoteEl = document.getElementById('sr-ai-quote');
            if (quoteEl) {
                quoteEl.textContent = `"${quote}" — ${tierData.name}`;
                quoteEl.classList.remove('hidden');
                quoteEl.style.color = tierData.color;
                setTimeout(() => quoteEl.classList.add('hidden'), 4000);
            }
        }
        
        const startWords = ["APPLE","TIGER","HOUSE","TRAIN","GHOST","SWORD","MAGIC","RIVER","FLAME","STORM"];
        const initWord = startWords[Math.floor(Math.random() * startWords.length)];
        this.addHistory(initWord, 'enemy');
        this.currentLetter = initWord.slice(-1).toUpperCase();
        this.usedWords.add(initWord.toLowerCase());
        
        // Update next button
        const nextBtn = document.getElementById('sr-next-btn');
        if (nextBtn) {
            const nextTier = AI_TIERS[this.currentTier + 1];
            nextBtn.textContent = nextTier ? `Fight ${nextTier.name} →` : 'Play Again →';
        }
        
        this.updateUI();
        this.setStatus('Round Start! Word ends in ' + this.currentLetter, false);
        this.lastWordTime = performance.now();
        if(typeof sfx !== 'undefined') sfx.playSuccess();
        this.startTimer();
    },

    stop: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
        clearInterval(this._waitingInterval);
        this._waitingInterval = null;
        document.body.classList.remove('fever-mode');
        // Reset session-scoped used words only when player exits to Arcade
        this.usedWords = new Set();
    },

    startTimer: function() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPlaying) return;

            this.timeLeft -= 1.0 + (this.currentTier * 0.2);

            // ── Combo multiplier based on elapsed time since last word ──
            const elapsed = (performance.now() - this.lastWordTime) / 1000;
            const comboEl = document.getElementById('sr-combo-text');

            if (elapsed < 2) {
                this.comboMult = 2.0;
                comboEl.style.color = "#00ff87";
                comboEl.textContent  = "2.0x FEVER! 🔥";
                document.body.classList.add('fever-mode');
            } else if (elapsed < 5) {
                this.comboMult = 1.5;
                comboEl.style.color = "#f2c94c";
                comboEl.textContent  = "1.5x Combo ⚡";
                document.body.classList.remove('fever-mode');
            } else {
                this.comboMult = 1.0;
                comboEl.style.color = "var(--text-secondary)";
                comboEl.textContent  = "1.0x — answer fast!";
                document.body.classList.remove('fever-mode');
            }

            // ── Timer bar: color tracks urgency green → orange → red ──
            const pct = this.timeLeft;
            const timerFill   = document.getElementById('sr-timer');
            const startLetter = document.getElementById('sr-start-letter');

            timerFill.style.width = Math.max(0, pct) + '%';

            if (pct > 60) {
                timerFill.style.background = 'linear-gradient(90deg, var(--accent-green-light), var(--accent-green-dark))';
                timerFill.classList.remove('urgent');
                if (startLetter) startLetter.style.color = 'var(--accent-green-light)';
            } else if (pct > 30) {
                timerFill.style.background = 'linear-gradient(90deg, #f2c94c, #f2994a)';
                timerFill.classList.remove('urgent');
                if (startLetter) startLetter.style.color = '#f2c94c';
            } else {
                timerFill.style.background = 'linear-gradient(90deg, var(--accent-red-light), var(--accent-red-dark))';
                timerFill.classList.add('urgent');
                if (startLetter) startLetter.style.color = 'var(--accent-red-light)';
            }

            // ── Time Out Penalty ──
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                const dmg = 15 * AI_TIERS[this.currentTier].dmgMult;
                this.damage('player', dmg);
                this.setStatus(`Too slow! −${Math.floor(dmg)} HP penalty ⚠️`, true);
                fx.screenShake(10, 300);
                if(typeof sfx !== 'undefined') sfx.playError();
                this.timeLeft = 100;
                this.lastWordTime = performance.now();
            }

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

    // Called when it's the enemy's turn — hides the required letter so player
    // can't see what the AI is 'thinking', and shows a waiting animation.
    setWaitingState: function() {
        const startLetter = document.getElementById('sr-start-letter');
        const inputEl     = document.getElementById('sr-input');
        const submitBtn   = document.querySelector('#sr-form button[type="submit"]');

        startLetter.textContent = '…';
        startLetter.style.color = 'var(--text-secondary)';
        startLetter.style.opacity = '0.5';
        startLetter.classList.add('waiting');

        inputEl.value = '';
        inputEl.disabled = true;
        inputEl.placeholder = '⏳ Waiting for opponent…';
        inputEl.style.color = 'var(--text-secondary)';
        inputEl.style.fontStyle = 'italic';

        if (submitBtn) submitBtn.disabled = true;

        // Animated dots in the placeholder
        let dots = 0;
        this._waitingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            inputEl.placeholder = '⏳ Opponent is thinking' + '.'.repeat(dots);
        }, 400);
    },

    // Restores the player-turn UI state after the enemy has played.
    setPlayerTurnState: function() {
        clearInterval(this._waitingInterval);
        this._waitingInterval = null;

        const startLetter = document.getElementById('sr-start-letter');
        const inputEl     = document.getElementById('sr-input');
        const submitBtn   = document.querySelector('#sr-form button[type="submit"]');

        startLetter.textContent = this.currentLetter;
        startLetter.style.color = '';
        startLetter.style.opacity = '';
        startLetter.classList.remove('waiting');

        inputEl.disabled = false;
        inputEl.placeholder = 'Enter your word…';
        inputEl.style.color = '';
        inputEl.style.fontStyle = '';
        inputEl.value = '';
        inputEl.focus();

        if (submitBtn) submitBtn.disabled = false;
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
        const pHP = Math.max(0, Math.round(this.playerHp));
        const eHP = Math.max(0, Math.round(this.enemyHp));
        const eMax = AI_TIERS[this.currentTier].hp;

        document.getElementById('sr-player-hp').style.width = (this.playerHp / this.maxPlayerHp * 100) + '%';
        document.getElementById('sr-enemy-hp').style.width  = (this.enemyHp / eMax * 100) + '%';

        const ptxt = document.getElementById('sr-player-hp-text');
        const etxt = document.getElementById('sr-enemy-hp-text');
        if (ptxt) ptxt.textContent = pHP + ' HP';
        if (etxt) etxt.textContent = eHP + ' HP';
    },

    setStatus: function(msg, isError = false) {
        const statusEl = document.getElementById('sr-status');
        statusEl.textContent = msg;
        statusEl.style.color = isError ? "var(--accent-red-light)" : "var(--accent-green-light)";
        if(isError) {
            const form = document.getElementById('sr-form');
            if(form) {
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 400);
            }
        }
    },

    // ── Levenshtein distance between two strings ──
    _levenshtein: function(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1]
                    ? dp[i-1][j-1]
                    : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            }
        }
        return dp[m][n];
    },

    // Returns { word, distance } of the closest dictionary word starting with `letter`,
    // or null if the dictionary is empty / no match found within max 5 edits.
    _getClosestWord: function(input, letter) {
        let best = null;
        let bestDist = Infinity;
        const lc = letter.toLowerCase();
        for (const word of this.dictionary) {
            if (!word.startsWith(lc)) continue;
            const d = this._levenshtein(input, word);
            if (d < bestDist) {
                bestDist = d;
                best = word;
                // Early exit — can't do better than 1 edit
                if (d <= 1) break;
            }
        }
        return best ? { word: best, distance: bestDist } : null;
    },

    // Builds a contextual error message based on how close the player's word
    // was to a valid dictionary entry. Tier personality is layered on top.
    _getInvalidWordMessage: function(input) {
        const closest = this._getClosestWord(input, this.currentLetter);
        const tier = this.currentTier;

        if (closest && closest.distance <= 2) {
            // Near-miss — close to a real word, give encouraging / teasing hint
            const nearMissMessages = [
                [
                    // Bronze — casual & encouraging
                    `Almost! Did you mean "${closest.word}"? 🤔`,
                    `So close! "${closest.word}" would've worked! 💪`,
                    `One letter off! Try "${closest.word}" next time! ✨`,
                ],
                [
                    // Silver — wry acknowledgment
                    `Interesting attempt. "${closest.word}" exists though. 🧐`,
                    `Close, but no. "${closest.word}" is what you were reaching for.`,
                    `Almost cracked it — "${closest.word}" was right there! 🔎`,
                ],
                [
                    // Gold — backhanded
                    `Impressive effort, but "${closest.word}" was the word you sought.`,
                    `A skilled mind wobbles — "${closest.word}" was your target. 🎯`,
                    `You were one move away. "${closest.word}" would've landed. 🔥`,
                ],
                [
                    // Overlord — theatrical
                    `Even you were so close... "${closest.word}" slipped through your fingers. 😈`,
                    `"${closest.word}" — so near, yet so beneath you. Try harder.`,
                    `A glimmer of potential. "${closest.word}" was the word. Don't waste it. 🌌`,
                ]
            ];
            const pool = nearMissMessages[Math.min(tier, 3)];
            return pool[Math.floor(Math.random() * pool.length)];
        } else {
            // Far off — the word isn't close to anything valid
            const farOffMessages = [
                [
                    // Bronze — blunt
                    `"${input}"? That's not a word, rookie! ❌`,
                    `Did you just make that up? Not in the dictionary! 🤦`,
                    `Nope! "${input}" isn't a real word. Try again! 🚫`,
                ],
                [
                    // Silver — condescending
                    `"${input}"... that's not a word. Disappointing.`,
                    `The dictionary has never heard of "${input}". Neither have I. 😒`,
                    `I expected more from you than "${input}". Not a real word.`,
                ],
                [
                    // Gold — dismissive elegance
                    `"${input}" is not a word. I expected better from this caliber of opponent.`,
                    `No dictionary in existence contains "${input}". Recalibrate. 📖`,
                    `A phantom word. "${input}" does not exist. Focus.`,
                ],
                [
                    // Overlord — menacing
                    `"${input}"? You dare submit that to a Lexical Overlord?! OBLITERATED. 🌑`,
                    `That is not a word. That is noise. Like you. ❌`,
                    `"${input}" — a whisper of incompetence. Not found. Not accepted. 👁️`,
                ]
            ];
            const pool = farOffMessages[Math.min(tier, 3)];
            return pool[Math.floor(Math.random() * pool.length)];
        }
    },

    submitWord: async function(e) {
        e.preventDefault();
        if(!this.isPlaying) return;

        const inputEl = document.getElementById('sr-input');
        const input = inputEl.value.trim().toLowerCase();
        if(!input) return;

        // --- Validation Layer 0: Profanity guard (instant, always first) ---
        if(this.PROFANITY.has(input)) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus("Keep it clean! Try another word. 🚫", true);
            inputEl.value = '';
            setTimeout(() => {
                const statusEl = document.getElementById('sr-status');
                if(statusEl && statusEl.textContent.includes('clean')) this.setStatus('Your turn!', false);
            }, 2500);
            return;
        }

        // --- Validation Layer 1: Format checks (instant) ---
        let errorMsg = "";
        if(!input.startsWith(this.currentLetter.toLowerCase())) {
            const msgs = ["Needs to start with " + this.currentLetter + "!", "Whoops, wrong starting letter!", "Follow the chain! Start with " + this.currentLetter];
            errorMsg = msgs[Math.floor(Math.random() * msgs.length)];
        } else if(this.usedWords.has(input)) {
            // usedWords persists across ALL tiers in this session
            const msgs = [
                "You already used that word this session!",
                "That word is burned — find a fresh one!",
                "Used words stay banned all session long!"
            ];
            errorMsg = msgs[Math.floor(Math.random() * msgs.length)];
        }

        if(errorMsg) {
            if(typeof sfx !== 'undefined') sfx.playError();
            this.setStatus(errorMsg, true);
            if(typeof fx !== 'undefined') fx.screenShake(5, 200);
            setTimeout(() => {
                const statusEl = document.getElementById('sr-status');
                if(statusEl && statusEl.textContent === errorMsg) this.setStatus('Your turn!', false);
            }, 3000);
            return;
        }

        // --- Validation Layer 2: Local dictionary (instant, session-cached) ---
        if(this.dictionary.has(input)) {
            this._acceptWord(input);
            return;
        }

        // --- Validation Layer 3: Live Dictionary API fallback ---
        this.setStatus('Checking word...', false);
        inputEl.disabled = true;

        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${input}`, {
                signal: AbortSignal.timeout(4000)
            });

            if(res.ok) {
                // Word is real! Cache it in local Set for this session so we don't call API again
                this.dictionary.add(input);
                inputEl.disabled = false;
                this._acceptWord(input);
            } else {
                // 404 = not a valid English word — show contextual feedback
                inputEl.disabled = false;
                if(typeof sfx !== 'undefined') sfx.playError();
                const msg = this._getInvalidWordMessage(input);
                this.setStatus(msg, true);
                if(typeof fx !== 'undefined') fx.screenShake(5, 200);
                setTimeout(() => {
                    const statusEl = document.getElementById('sr-status');
                    if(statusEl && statusEl.textContent === msg) this.setStatus('Your turn!', false);
                }, 3500);
            }
        } catch(err) {
            // API offline or timed out — fall back to local dictionary only
            inputEl.disabled = false;
            console.warn('Dictionary API unreachable. Using local dictionary only.');
            if(typeof fx !== 'undefined') fx.toast('Offline mode: Using local dictionary', 'error');
            this.setStatus('Your turn!', false);
        }
    },

    _acceptWord: function(input) {
        this.usedWords.add(input);
        this.addHistory(input, 'player');
        
        let baseDmg = input.length;
        const lastLetter = input.slice(-1).toLowerCase();
        
        if(['x', 'z', 'q', 'j', 'v'].includes(lastLetter)) baseDmg *= 1.5;
        let finalDmg = baseDmg * this.comboMult;
        
        const wordScore = Math.floor(finalDmg * 15);
        this.score += wordScore;
        document.getElementById('sr-score').textContent = this.score;
        
        const inputRect = document.getElementById('sr-input').getBoundingClientRect();
        const cx = inputRect.left + inputRect.width / 2;
        const cy = inputRect.top - 20;

        // ── Word Quality Celebrations ──────────────────────────
        const len = input.length;
        // Directional blast pointing UP towards the arena
        const angle = -Math.PI / 2;
        
        if (len >= 11) {
            // LEGENDARY: screen flash + massive banner
            fx.floatingText('LEXICAL DESTROYER! 🌌', cx, cy - 40, '#b34bff', '2.5rem');
            fx.floatingText(`+${wordScore}`, cx, cy, '#f2c94c', '2.2rem');
            fx.createDirectionalExplosion(cx, cy, '#b34bff', 60, angle, Math.PI / 1.5);
            fx.screenPulse();
            fx.screenShake(15, 500);
            if(typeof sfx !== 'undefined') sfx.playCrit();
            if(typeof achievements !== 'undefined') achievements.unlock('logophile');
        } else if (len >= 8) {
            // EPIC: power strike
            fx.floatingText('⚡ Power Strike!', cx, cy - 30, '#ffd700', '1.8rem');
            fx.floatingText(`+${wordScore}`, cx, cy, '#f2c94c', '2rem');
            fx.createDirectionalExplosion(cx, cy, '#ffd700', 35, angle, Math.PI / 2);
            fx.screenShake(10, 300);
            if(typeof sfx !== 'undefined') sfx.playCrit();
        } else if (len >= 5) {
            // NICE: solid hit
            fx.floatingText('Nice Hit!', cx, cy - 25, '#00ff87', '1.4rem');
            fx.floatingText(`+${wordScore}`, cx, cy, '#f2c94c', '2rem');
            fx.createDirectionalExplosion(cx, cy, '#00ff87', 20, angle, Math.PI / 2);
            fx.screenShake(6, 200);
            if(typeof sfx !== 'undefined') sfx.playSuccess();
        } else {
            // BASIC: standard
            fx.floatingText(`+${wordScore}`, cx, cy, '#f2c94c', '2rem');
            fx.createDirectionalExplosion(cx, cy, '#00ff87', 10, angle, Math.PI / 2.5);
            fx.screenShake(3, 100);
            if(typeof sfx !== 'undefined') sfx.playSuccess();
        }

        // Achievement hooks
        if(typeof achievements !== 'undefined') {
            if (!this._firstWordDone) {
                achievements.unlock('first_word');
                this._firstWordDone = true;
            }
            if (this.comboMult >= 2.0) {
                this._comboHits = (this._comboHits || 0) + 1;
                if (this._comboHits >= 3) achievements.unlock('combo_king');
            } else {
                this._comboHits = 0;
            }
        }

        this.damage('enemy', finalDmg);
        this.currentLetter = lastLetter.toUpperCase();
        this.timeLeft = 100; 
        this.lastWordTime = performance.now();

        if(this.enemyHp <= 0) {
            this.endGame();
            return;
        }

        // Switch to waiting state BEFORE enemy turn — do NOT call updateUI()
        // here so the player never sees the letter the AI is 'thinking' about.
        this.setWaitingState();
        this.enemyTurn();
    },


    enemyTurn: function() {
        this.isPlaying = false;
        // setWaitingState() already called by _acceptWord — input is already
        // disabled and showing the animated placeholder.
        this.setStatus('Opponent is thinking…', false);
        
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
                clearInterval(this._waitingInterval);
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
                clearInterval(this._waitingInterval);
                this.endGame();
                return;
            }

            this.isPlaying = true;
            this.timeLeft = 100;
            this.lastWordTime = performance.now();

            // Restore player UI — now safe to reveal the required letter
            this.setPlayerTurnState();
            this.setStatus('Your turn!', false);
            
        }, tier.speed + Math.random() * 500);
    },

    endGame: function() {
        this.isPlaying = false;
        clearInterval(this.timer);
        clearInterval(this._waitingInterval);
        this._waitingInterval = null;
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
                fx.toast('🏆 You are the Lexical Champion! Starting over...', 'success');
                setTimeout(() => { this.currentTier = 0; this.init(); }, 3000);
                return;
            }
        }
        this.init();
    },

    shareResult: function() {
        const won    = this.playerHp > 0;
        const tier   = AI_TIERS[this.currentTier];
        const score  = this.score;
        const isNewHigh = score >= (app && app.player.srHighScore || 0);

        // ── Tier-flavoured openers ──
        const victoryOpeners = [
            `I just demolished ${tier.name} in The Word Arcade. 💪`,
            `${tier.name} tried. I spelled them into the ground. ⚡`,
            `Defeated ${tier.name} with vocabulary alone. 🧠`,
            `The AI didn't stand a chance. ${tier.name} = eliminated. 💥`
        ];
        const defeatOpeners = [
            `${tier.name} absolutely destroyed my vocabulary. 💀`,
            `I was one word away... and I choked. 😬`,
            `${tier.name} has humbled me. I will return. 🔥`,
            `Lost to a machine. Time to hit the dictionary. 📖`
        ];
        const openers = won ? victoryOpeners : defeatOpeners;
        const opener  = openers[Math.floor(Math.random() * openers.length)];

        // ── Emoji health bar (approximate) ──
        const health = Math.round((this.playerHp / this.maxPlayerHp) * 5);
        const hpBar  = '🟩'.repeat(health) + '🟥'.repeat(5 - health);

        // ── Dynamic hook ──
        const hooks = [
            "Think you can survive longer? 👀",
            "Free to play. Free to humiliate. Prove yourself.",
            "Can your brain outspell an AI? Find out.",
            "No download. No sign-up. Just words and warfare."
        ];
        const hook = hooks[Math.floor(Math.random() * hooks.length)];

        const newHighLine = isNewHigh ? '\n🏆 New Personal Best!' : '';

        const text =
`⚔️ Word Arcade — Shiritori Royale
${hpBar}  ${score} pts${newHighLine}
${opener}

${hook}`;

        if (typeof shareManager !== 'undefined') {
            shareManager.openModal(text);
        } else {
            // Fallback
            const full = text + '\nhttps://the-word-arcade.vercel.app';
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(full)
                    .then(() => fx.toast('Result copied! Share it! 🔗', 'success'));
            }
        }
    }
};
