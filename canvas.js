// Create 3D scrolling world with planets and stars
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle system for stars
const particles = [];
const planets = [];

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 100;
        this.vz = 0.5 + Math.random() * 0.5;
        this.size = 1 + Math.random() * 2;
        this.opacity = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.z -= this.vz;
        if (this.z <= 0) {
            this.z = 100;
        }
    }

    draw() {
        const scale = 1 / this.z;
        const x = (this.x - canvas.width / 2) * scale + canvas.width / 2;
        const y = (this.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = this.size * scale;

        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * (1 - this.z / 100)})`;
        ctx.fillRect(x, y, size, size);
    }
}

class Planet {
    constructor(x, y, size, color, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = 150 + Math.random() * 100;
    }

    update() {
        this.angle += this.speed;
    }

    draw() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const x = centerX + Math.cos(this.angle) * this.orbitRadius;
        const y = centerY + Math.sin(this.angle) * this.orbitRadius;

        // Planet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', ', 0.3)');
        ctx.beginPath();
        ctx.arc(x, y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize particles and planets
function init() {
    for (let i = 0; i < 100; i++) {
        particles.push(new Star());
    }

    planets.push(new Planet(canvas.width / 2, canvas.height / 2, 30, 'rgb(0, 200, 255)', 0.003));
    planets.push(new Planet(canvas.width / 2, canvas.height / 2, 20, 'rgb(255, 0, 136)', 0.005));
    planets.push(new Planet(canvas.width / 2, canvas.height / 2, 15, 'rgb(0, 255, 136)', 0.007));
}

// Animation loop
function animate() {
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles (scrolling stars)
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Update and draw planets
    planets.forEach(planet => {
        planet.update();
        planet.draw();
    });

    // Draw connections between particles
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

init();
animate();