// Device & Browser Information Detection
class DeviceDetector {
    constructor() {
        this.initDetection();
        this.fetchIPInfo();
        this.setupParticleAnimation();
        this.setupFormHandlers();
    }

    // Initialize all device detection
    initDetection() {
        this.detectOS();
        this.detectBrowser();
        this.detectDeviceType();
        this.detectScreenResolution();
        this.detectLanguage();
        this.detectTimezone();
        this.detectWebGL();
        this.generateCanvasFingerprint();
        this.getUserAgent();
    }

    // Detect Operating System
    detectOS() {
        const userAgent = navigator.userAgent;
        let os = 'Неизвестно';

        if (userAgent.indexOf('Win') !== -1) os = 'Windows';
        else if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
        else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
        else if (userAgent.indexOf('Android') !== -1) os = 'Android';
        else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) os = 'iOS';

        // Detect version
        let version = '';
        if (os === 'Windows') {
            if (userAgent.indexOf('Windows NT 10.0') !== -1) version = '10/11';
            else if (userAgent.indexOf('Windows NT 6.3') !== -1) version = '8.1';
            else if (userAgent.indexOf('Windows NT 6.2') !== -1) version = '8';
            else if (userAgent.indexOf('Windows NT 6.1') !== -1) version = '7';
        } else if (os === 'macOS') {
            const match = userAgent.match(/Mac OS X ([0-9_]+)/);
            if (match) version = match[1].replace(/_/g, '.');
        } else if (os === 'Android') {
            const match = userAgent.match(/Android ([0-9.]+)/);
            if (match) version = match[1];
        } else if (os === 'iOS') {
            const match = userAgent.match(/OS ([0-9_]+)/);
            if (match) version = match[1].replace(/_/g, '.');
        }

        this.updateElement('osInfo', version ? `${os} ${version}` : os);
    }

    // Detect Browser
    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = 'Неизвестно';
        let version = '';

        if (userAgent.indexOf('Firefox') !== -1) {
            browser = 'Firefox';
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
            browser = 'Chrome';
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
            browser = 'Safari';
            const match = userAgent.match(/Version\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.indexOf('Edg') !== -1) {
            browser = 'Edge';
            const match = userAgent.match(/Edg\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) {
            browser = 'Opera';
            const match = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/);
            if (match) version = match[1];
        }

        this.updateElement('browserInfo', version ? `${browser} ${version}` : browser);
    }

    // Detect Device Type
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        let deviceType = 'Десктоп';

        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            deviceType = 'Планшет';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            deviceType = 'Мобильный';
        }

        // Add screen size info
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        if (deviceType === 'Десктоп' && screenWidth < 1024) {
            deviceType = 'Десктоп (маленький экран)';
        }

        this.updateElement('deviceType', deviceType);
    }

    // Detect Screen Resolution
    detectScreenResolution() {
        const width = window.screen.width;
        const height = window.screen.height;
        const pixelRatio = window.devicePixelRatio || 1;

        const resolution = `${width}×${height} (×${pixelRatio})`;
        this.updateElement('screenResolution', resolution);
    }

    // Detect Language
    detectLanguage() {
        const language = navigator.language || navigator.userLanguage;
        const languages = navigator.languages ? navigator.languages.join(', ') : language;
        this.updateElement('languageInfo', languages);
    }

    // Detect Timezone
    detectTimezone() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const offset = new Date().getTimezoneOffset();
            const hours = Math.abs(Math.floor(offset / 60));
            const minutes = Math.abs(offset % 60);
            const sign = offset <= 0 ? '+' : '-';

            const offsetStr = `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            this.updateElement('timezoneInfo', `${timezone} (${offsetStr})`);
        } catch (e) {
            this.updateElement('timezoneInfo', 'Недоступно');
        }
    }

    // Detect WebGL Info
    detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    this.updateElement('webglInfo', renderer);
                } else {
                    this.updateElement('webglInfo', 'WebGL поддерживается');
                }
            } else {
                this.updateElement('webglInfo', 'Не поддерживается');
            }
        } catch (e) {
            this.updateElement('webglInfo', 'Ошибка определения');
        }
    }

    // Generate Canvas Fingerprint
    generateCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 200;
            canvas.height = 50;

            // Draw text with various styles
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('SigmaTrade 🔐', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Fingerprint', 4, 17);

            // Get canvas data and create hash
            const dataURL = canvas.toDataURL();
            const hash = this.simpleHash(dataURL);

            this.updateElement('canvasFingerprint', hash.substring(0, 16).toUpperCase());
        } catch (e) {
            this.updateElement('canvasFingerprint', 'Недоступно');
        }
    }

    // Simple hash function
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Get User Agent
    getUserAgent() {
        const userAgent = navigator.userAgent;
        // Truncate if too long
        const truncated = userAgent.length > 100 ? userAgent.substring(0, 97) + '...' : userAgent;
        this.updateElement('userAgent', truncated);
    }

    // Fetch IP and ISP Information
    async fetchIPInfo() {
        try {
            // Try primary API
            const response = await fetch('https://ipapi.co/json/');

            if (response.ok) {
                const data = await response.json();

                // Update IP
                this.updateElementSuccess('ipAddress', data.ip || 'Недоступно');

                // Update ISP
                const isp = data.org || data.isp || 'Недоступно';
                this.updateElementSuccess('ispProvider', isp);

                // Update Location
                let location = 'Недоступно';
                if (data.city && data.country_name) {
                    location = `${data.city}, ${data.region}, ${data.country_name}`;
                } else if (data.country_name) {
                    location = data.country_name;
                }
                this.updateElementSuccess('location', location);
            } else {
                throw new Error('Primary API failed');
            }
        } catch (error) {
            console.error('Error fetching IP info:', error);

            // Fallback to alternative API
            try {
                const fallbackResponse = await fetch('https://api.ipify.org?format=json');

                if (fallbackResponse.ok) {
                    const data = await fallbackResponse.json();
                    this.updateElementSuccess('ipAddress', data.ip || 'Недоступно');
                }

                this.updateElementError('ispProvider', 'Недоступно');
                this.updateElementError('location', 'Недоступно');
            } catch (fallbackError) {
                console.error('Fallback API also failed:', fallbackError);
                this.updateElementError('ipAddress', 'Недоступно');
                this.updateElementError('ispProvider', 'Недоступно');
                this.updateElementError('location', 'Недоступно');
            }
        }
    }

    // Update element with loading state
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = value;
            element.parentElement.classList.remove('loading');
        }
    }

    // Update element with success state
    updateElementSuccess(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = value;
            element.parentElement.classList.remove('loading');
            element.parentElement.style.borderColor = 'rgba(0, 255, 136, 0.3)';
            setTimeout(() => {
                element.parentElement.style.borderColor = '';
            }, 2000);
        }
    }

    // Update element with error state
    updateElementError(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = value;
            element.parentElement.classList.remove('loading');
            element.parentElement.style.borderColor = 'rgba(255, 68, 68, 0.3)';
        }
    }

    // Setup Particle Animation
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

    // Setup Form Handlers
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
                deviceInfo: this.getDeviceInfo()
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

    // Get all device info for submission
    getDeviceInfo() {
        return {
            ip: document.getElementById('ipAddress').textContent,
            isp: document.getElementById('ispProvider').textContent,
            location: document.getElementById('location').textContent,
            os: document.getElementById('osInfo').textContent,
            browser: document.getElementById('browserInfo').textContent,
            device: document.getElementById('deviceType').textContent,
            screen: document.getElementById('screenResolution').textContent,
            language: document.getElementById('languageInfo').textContent,
            timezone: document.getElementById('timezoneInfo').textContent,
            webgl: document.getElementById('webglInfo').textContent,
            canvasFingerprint: document.getElementById('canvasFingerprint').textContent,
            userAgent: document.getElementById('userAgent').textContent
        };
    }

    // Simulate login (replace with actual API call)
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

    // Show success message
    showSuccess(message) {
        const banner = document.getElementById('warningBanner');
        banner.style.background = 'rgba(0, 255, 136, 0.1)';
        banner.style.borderColor = '#00ff88';
        banner.querySelector('.warning-icon').textContent = '✅';
        banner.querySelector('.warning-title').textContent = 'Успех!';
        banner.querySelector('.warning-title').style.color = '#00ff88';
        banner.querySelector('.warning-text').textContent = message;
    }

    // Show error message
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DeviceDetector();
    });
} else {
    new DeviceDetector();
}
