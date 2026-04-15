const fx = {
    canvas: null,
    ctx: null,
    particles: [],
    
    init: function() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        this.loop();
    },
    
    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    loop: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        requestAnimationFrame(this.loop.bind(this));
    },
    
    createExplosion: function(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 3,
                color: color,
                life: 1,
                decay: Math.random() * 0.02 + 0.015,
                gravity: 0.15
            });
        }
    },
    
    createDirectionalExplosion: function(x, y, color, count = 20, targetAngle = 0, spread = Math.PI / 3) {
        for (let i = 0; i < count; i++) {
            // Random angle within the spread around the target angle
            const angle = targetAngle + (Math.random() - 0.5) * spread;
            const speed = Math.random() * 8 + 4; // Faster initial burst
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1,
                decay: Math.random() * 0.02 + 0.02, // Dims slightly faster
                gravity: 0.2 // Slightly heavier gravity for an arc effect
            });
        }
    },
    
    screenPulse: function() {
        const body = document.body;
        body.style.transform = 'scale(1.02)';
        setTimeout(() => {
            body.style.transform = 'scale(1)';
        }, 150);
    },
    
    screenShake: function(intensity = 10, duration = 400) {
        const ui = document.getElementById('app');
        ui.style.transition = 'none';
        
        let start = performance.now();
        const shake = (time) => {
            let elapsed = time - start;
            if (elapsed < duration) {
                let dx = (Math.random() - 0.5) * intensity;
                let dy = (Math.random() - 0.5) * intensity;
                ui.style.transform = `translate(${dx}px, ${dy}px)`;
                requestAnimationFrame(shake);
            } else {
                ui.style.transition = 'transform 0.3s ease';
                ui.style.transform = 'translate(0, 0)';
            }
        };
        requestAnimationFrame(shake);
    },
    
    floatingText: function(text, x, y, color, size = '1.5rem', bold = true) {
        const el = document.createElement('div');
        el.textContent = text;
        Object.assign(el.style, {
            position:      'fixed',
            left:          x + 'px',
            top:           y + 'px',
            color:         color,
            fontSize:      size,
            fontWeight:    bold ? '900' : 'bold',
            fontFamily:    "'Outfit', sans-serif",
            zIndex:        '10000',
            pointerEvents: 'none',
            textShadow:    `0 0 20px ${color}, 0 2px 8px rgba(0,0,0,0.8)`,
            // Start punched-in: tiny, centred on origin
            transform:     'translate(-50%, -50%) scale(0.3)',
            opacity:       '0',
            transition:    'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.08s ease',
            willChange:    'transform, opacity',
        });
        document.body.appendChild(el);

        // Phase 1: Punch in (scale 0.3 → 1.15) — feels snappy
        requestAnimationFrame(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translate(-50%, -50%) scale(1.15)';

            // Phase 2: Settle (1.15 → 1.0) then float upward and fade
            setTimeout(() => {
                el.style.transition = 'none';
                el.style.transform  = 'translate(-50%, -50%) scale(1)';

                let vy = 2.2;         // float speed (px/frame)
                let alpha = 1;
                const decay = 0.018; // fade speed

                const float = () => {
                    y   -= vy;
                    vy  *= 0.97;      // decelerate — eases to a stop
                    alpha -= decay;
                    el.style.top     = y + 'px';
                    el.style.opacity = Math.max(0, alpha);
                    if (alpha > 0) {
                        requestAnimationFrame(float);
                    } else {
                        el.remove();
                    }
                };
                requestAnimationFrame(float);
            }, 140);
        });
    },


    toast: function(message, type = 'error') {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.position = 'fixed';
        el.style.top = '20px';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%) translateY(-50px)';
        el.style.background = type === 'error' ? 'rgba(255,0,0,0.8)' : 'rgba(0,255,135,0.8)';
        el.style.color = '#fff';
        el.style.padding = '15px 30px';
        el.style.borderRadius = '20px';
        el.style.fontFamily = "'Inter', sans-serif";
        el.style.fontWeight = 'bold';
        el.style.zIndex = '10000';
        el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.backdropFilter = 'blur(10px)';
        el.style.border = '1px solid rgba(255,255,255,0.2)';
        
        document.body.appendChild(el);
        
        // Slide in
        setTimeout(() => {
            el.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Slide out
        setTimeout(() => {
            el.style.transform = 'translateX(-50%) translateY(-50px)';
            el.style.opacity = '0';
            setTimeout(() => document.body.removeChild(el), 400);
        }, 4000);
    }
};

window.addEventListener('load', () => {
    fx.init();
});
