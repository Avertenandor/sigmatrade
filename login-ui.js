/**
 * Login UI Module
 * Handles: Particle Animation, Form Handling, UI Interactions
 */

class LoginUI {
    constructor(detector) {
        this.detector = detector;
        this.setupParticleAnimation();
        this.setupFormHandlers();
    }

    /**
     * Setup Particle Animation
     */
    setupParticleAnimation() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around screen
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Create particles
        const particles = [];
        const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - distance / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Setup Form Handlers
     */
    setupFormHandlers() {
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);

                if (input.type === 'password') {
                    input.type = 'text';
                    button.querySelector('.eye-icon').textContent = '👁️‍🗨️';
                } else {
                    input.type = 'password';
                    button.querySelector('.eye-icon').textContent = '👁️';
                }
            });
        });

        // Form submission
        const form = document.getElementById('loginForm');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const formData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                masterPassword: document.getElementById('masterPassword').value,
                transactionHash: document.getElementById('transactionHash').value,
                deviceInfo: this.detector.getDeviceInfo()
            };

            // Validate transaction hash if provided
            const txHash = formData.transactionHash;
            if (txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
                this.showError('Неверный формат хеша транзакции. Должен начинаться с 0x и содержать 64 hex символа.');
                return;
            }

            // Show loading state
            submitBtn.classList.add('loading');

            // Simulate API call
            try {
                await this.simulateLogin(formData);

                // Success
                this.showSuccess('Вход выполнен успешно!');

                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                submitBtn.classList.remove('loading');
                this.showError(error.message || 'Ошибка входа. Проверьте данные и попробуйте снова.');
            }
        });
    }

    /**
     * Simulate login (replace with actual API call)
     */
    async simulateLogin(formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // For demo purposes, just log the data
                console.log('Login attempt with data:', formData);

                // Simulate success
                resolve();

                // To simulate error, use:
                // reject(new Error('Неверный логин или пароль'));
            }, 2000);
        });
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const banner = document.getElementById('warningBanner');
        banner.style.background = 'rgba(0, 255, 136, 0.1)';
        banner.style.borderColor = '#00ff88';
        banner.querySelector('.warning-icon').textContent = '✅';
        banner.querySelector('.warning-title').textContent = 'Успех!';
        banner.querySelector('.warning-title').style.color = '#00ff88';
        banner.querySelector('.warning-text').textContent = message;
    }

    /**
     * Show error message
     */
    showError(message) {
        const banner = document.getElementById('warningBanner');
        banner.style.background = 'rgba(255, 68, 68, 0.1)';
        banner.style.borderColor = '#ff4444';
        banner.querySelector('.warning-icon').textContent = '❌';
        banner.querySelector('.warning-title').textContent = 'Ошибка!';
        banner.querySelector('.warning-title').style.color = '#ff4444';
        banner.querySelector('.warning-text').textContent = message;

        // Scroll to banner
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.LoginUI = LoginUI;
}
