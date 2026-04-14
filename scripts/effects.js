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
        el.style.position = 'fixed';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        el.style.fontSize = size;
        el.style.fontWeight = bold ? '900' : 'bold';
        el.style.fontFamily = "'Outfit', sans-serif";
        el.style.zIndex = '1000';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.textShadow = `0 2px 10px ${color}`;
        document.body.appendChild(el);
        
        let life = 1;
        let pos = y;
        const anim = () => {
            life -= 0.01;
            pos -= 1.0;
            el.style.top = pos + 'px';
            el.style.opacity = life;
            el.style.transform = `translate(-50%, -50%) scale(${1 + (1 - life) * 0.5})`;
            
            if (life > 0) {
                requestAnimationFrame(anim);
            } else {
                document.body.removeChild(el);
            }
        };
        requestAnimationFrame(anim);
    }
};

window.addEventListener('load', () => {
    fx.init();
});
