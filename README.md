# 🕹️ The Word Arcade

[![Live Demo](https://img.shields.io/badge/Live-the--word--arcade.vercel.app-00d2ff?style=for-the-badge&logo=vercel)](https://the-word-arcade.vercel.app/)
![Vanilla JS](https://img.shields.io/badge/Built_With-Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-00ff87?style=for-the-badge)
![Supabase Ready](https://img.shields.io/badge/Multiplayer-Supabase_Ready-3ecf8e?style=for-the-badge&logo=supabase)
![PWA Ready](https://img.shields.io/badge/PWA-Installable-blueviolet?style=for-the-badge&logo=pwa)

> **The Word Arcade** is a premium, zero-dependency word gaming platform featuring two distinct lexical combat experiences — live dictionary validation, AI opponents with personality, daily challenges, achievement systems, and real-time multiplayer foundations. Built entirely with Vanilla JS, HTML5, and CSS3.

**Developed & Engineered by [Pranshu Mishra](https://www.linkedin.com/in/pranshumishra27/) · [LinkedIn →](https://www.linkedin.com/in/pranshumishra27/)**

---

## 🎮 Games

### 🧩 Compound Chain
A cerebral puzzle mode where players link compound word sequences from start to finish within a bonus timer.

- **Progressive Difficulty** — The master pool of 30 levels is mapped to a logical difficulty curve, guiding players from simple links to cerebral jumps.
- **Bonus Timer Engine** — Answer faster to earn higher point multipliers.
- **Hardcore Daily Challenge** — A globally seeded puzzle drops every day. Hints are disabled for pure competition, and the full word sequence is revealed exclusively upon victory to build your streak.

### ⚔️ Shiritori Royale
A high-intensity word combat arena. Chain words by their final letter and deal damage to AI opponents.

- **4 AI Tiers** — Bronze Grunt → Silver Adept → Gold Master → Lexical Overlord, each with unique personality, trash talk, and escalating difficulty.
- **Modern Immersive UI/UX** — Next-generation aesthetics with fluid micro-animations, haptic-like visual feedback, and responsive glassmorphism.
- **Context-Aware Feedback** — Sophisticated real-time analysis distinguishes between "close" misspellings and "far-off" invalid words, providing dynamic motivational coaching.
- **Viral Social Sharing** — Seamlessly integrated share cards with strategic celebration triggers for key milestones and high scores.
- **Word Quality Rewards** — 5+ letters = "Nice Hit!" · 8+ = "⚡ Power Strike!" · 11+ = "LEXICAL DESTROYER! 🌌" with screen flash effects.
- **Fever Mode** — Sustain fast combos to trigger full visual and audio overdrive.
- **Session Word Memory** — Words used across all tiers within a session are permanently blocked, forcing vocabulary breadth.
- **Live Dictionary API** — Validated in real-time against `dictionaryapi.dev` for unlimited English vocabulary.

---

## ✨ Platform Features

| Feature | Details |
|---|---|
| 🔥 **Daily Streak** | Play the daily compound puzzle each day to maintain your streak |
| 🏆 **Achievements** | 9 unlockable badges tracked via localStorage with slide-in toasts |
| 👤 **Player Identity** | Persistent profile with high scores for both games |
| 📱 **PWA Installable** | Add to home screen on iOS/Android — launches fullscreen like a native app |
| 🌐 **Live Vocab** | Words validated against real dictionary API — any legitimate English word works |
| 🚫 **Profanity Guard** | Built-in filter blocks abusive input before it hits the dictionary API |
| 🔒 **Anti-Tamper** | DOM integrity monitor protects credits and authorship |
| 🎵 **Audio Synthesis** | Real-time SFX via Web Audio API, featuring dynamic auditory feedback for correct entries and errors |

---

## ⚡ Technical Architecture

```
wordchain-catalogue/
├── index.html               # Single-page app shell + all views
├── styles.css               # Full design system (no framework)
├── data/
│   ├── dictionary.js        # Primary ~10k word base dictionary
│   ├── extra-words.js       # 500+ curated game-friendly words
│   └── compound-levels.js   # 30 unique compound chain levels
└── scripts/
    ├── app.js               # Core controller + tutorial + routing
    ├── daily.js             # Daily challenge engine (date-seeded)
    ├── achievements.js      # Achievement engine + localStorage
    ├── compound-chain.js    # Compound Chain game logic
    ├── shiritori-royale.js  # Shiritori Royale combat engine
    ├── effects.js           # Canvas particle engine + UI effects
    ├── audio.js             # Web Audio API sound synthesizer
    └── multiplayer.js       # Supabase Realtime lobby (beta)
```

**Key design decisions:**
- **Zero build tooling** — runs by opening `index.html` directly with no server
- **3-layer dictionary validation** — local Set → curated extras → live API → graceful offline fallback
- **Namespace-based modules** — all JS lives in global const objects, no module bundler needed
- **Session-scoped word memory** — `usedWords` persists across tiers but resets on Arcade exit

---

## 🚀 Quick Start

```bash
git clone https://github.com/pranshumishra27/the-word-arcade.git
cd the-word-arcade

# Option 1: Open directly (no server needed)
open index.html

# Option 2: Local dev server
npx serve .
```

Visit **[the-word-arcade.vercel.app](https://the-word-arcade.vercel.app/)** for the live production version.

---

## 🌐 Multiplayer (Coming Soon)

The PvP lobby frontend is complete. To activate live multiplayer:

1. Create a project at [supabase.com](https://supabase.com)
2. Get your `Project URL` and `Anon Key`
3. Update `scripts/multiplayer.js`:

```javascript
const supabaseConfig = {
    url: 'YOUR_SUPABASE_URL',
    key: 'YOUR_ANON_KEY'
};
```

4. Push to Vercel — multiplayer goes live instantly.

---

## 🏆 Achievement Badges

| Badge | Icon | How to Earn |
|---|---|---|
| First Word! | 🌟 | Submit your first word in Shiritori Royale |
| Speed Demon | ⚡ | Answer 5 words under 3 seconds each in one match |
| Logophile | 📚 | Play a word with 10 or more letters |
| Dragon Slayer | 🐉 | Defeat the Lexical Overlord |
| Combo King | 👑 | Sustain a 2.0× combo for 3 consecutive hits |
| Perfect Chain | 💎 | Complete Compound Chain without hints |
| Streak Starter | 🔥 | Maintain a 3-day Daily Challenge streak |
| Weekly Warrior | 🏆 | Maintain a 7-day Daily Challenge streak |
| Arcade Legend | 🌌 | Maintain a 30-day Daily Challenge streak |

---

## 📄 License

Open Source under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://www.linkedin.com/in/pranshumishra27/"><strong>Pranshu Mishra</strong></a>
  <br>
  <a href="https://www.linkedin.com/in/pranshumishra27/">LinkedIn</a> · <a href="https://the-word-arcade.vercel.app/">Live Demo</a>
</p>
