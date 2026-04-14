# 🕹️ The Word Arcade

![Vanilla JS Architecture](https://img.shields.io/badge/Architecture-Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)
![Supabase Ready](https://img.shields.io/badge/Multiplayer-Supabase_Ready-3ecf8e?style=for-the-badge&logo=supabase)

**The Word Arcade** is a highly polished, zero-dependency suite of lexical combat and puzzle games built entirely with high-performance Vanilla JavaScript, HTML5, and CSS3. Engineered without bulky build tools or heavy frameworks, it is designed to run blazingly fast both entirely offline or dynamically hosted on the edge.

Developed and engineered by [Pranshu Mishra](https://github.com/pranshumishra27).

---

## 🎮 The Games

### 1. Compound Chains
A relaxing, cerebral puzzle module where players must logically link a provided sequence of compound words from start to finish. 
*   **Dynamic Bonus Engine**: Time is not an enemy, but a reward. Finish rapidly for high bonus multipliers. 
*   **Progressive Difficulty**: 20 distinct levels scaling from simple two-word fuses to massive associative leaps.

### 2. Shiritori Royale
A high-intensity, combative typing arena inspired by the Japanese word game *Shiritori*. Face off against AI avatars by chaining words using the final letter of the previous attack.
*   **Fever Mode Engine**: Maintaining a fast combo (under 2 seconds per attack) triggers global visual and audio overdrive.
*   **Adaptive AI Matrix**: Face down the Bronze Grunt up to the Lexical Overlord across complex, expanding vocabularies.

---

## ⚡ Technical Architecture

This application strictly adheres to an incredibly pure, isolated architecture pattern:

*   **Zero Dependencies**: No Webpack, no NPM installs, no React overhead. The application runs immediately upon rendering the canvas.
*   **Custom Particle Engine**: Bypasses external graphic libraries by utilizing a custom `<canvas>` based `effects.js` particle synthesizer for explosions and floating points.
*   **Audio Synthesis**: Employs organic Web Audio API oscillators to generate real-time 8-bit sound effects (hits, crits, error bells) without relying on heavy external `.mp3` loading.
*   **Event-Driven Economy**: Features isolated game states with a persistent global identity overlay using browser `localStorage` to securely save High Scores across sessions.

---

## 🚀 Quick Start / Local Deployment

Because the architecture relies on zero build-logic, firing up the Arcade locally takes roughly 2 seconds:

1. Clone the repository: `git clone https://github.com/pranshumishra27/the-word-arcade.git`
2. Open the directory.
3. Simply double-click `index.html` to instantly run the application natively in your browser. No server required.

---

## 🌐 Multiplayer Roadmap (Supabase Integration)

The frontend architecture and Realtime UI lobbies for **PvP Betting & Co-Op** are fully established. 
The application awaits a configuration of `multiplayer.js` with live environment keys to route WebSocket events via **Supabase**.

```javascript
const supabaseConfig = {
    url: 'PRODUCTION_URL_HERE',
    key: 'PRODUCTION_ANON_KEY_HERE'
};
```

---

*Open Source under the MIT License.*
