const sfx = {
    ctx: null,

    init: function() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone: function(frequency, type, duration, vol = 0.1) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playClick: function() {
        this.init();
        this.playTone(600, 'sine', 0.1, 0.1);
    },

    playHit: function() {
        this.init();
        this.playTone(150, 'sawtooth', 0.2, 0.2);
    },

    playCrit: function() {
        this.init();
        this.playTone(300, 'square', 0.1, 0.3);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.4), 100);
    },

    playError: function() {
        this.init();
        this.playTone(100, 'sawtooth', 0.3, 0.2);
    },

    playSuccess: function() {
        this.init();
        this.playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.2, 0.1), 100);
    },

    playVictory: function() {
        this.init();
        const notes = [400, 500, 600, 800];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.3, 0.15), i * 150);
        });
    }
};

// Auto-initialize audio context on first user interaction to bypass browser autoplay policies
document.addEventListener('click', () => {
    if(sfx.ctx === null) sfx.init();
}, { once: true });
