/**
 * IRO STREAM Theme Manager
 * Handles dark/light theme toggle with cookie storage
 */

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.html = document.documentElement;
        
        // Default theme is dark
        this.defaultTheme = 'dark';
        
        // Initialize theme
        this.init();
    }
    
    init() {
        // Get saved theme from cookie or use default
        const savedTheme = this.getThemeFromCookie();
        
        // Apply theme
        this.applyTheme(savedTheme || this.defaultTheme);
        
        // Bind events
        this.bindEvents();
    }
    
    bindEvents() {
        // Theme toggle button
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Keyboard shortcut (T)
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 't' && !this.isInputElement(e.target)) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }
    
    isInputElement(element) {
        return element.tagName === 'INPUT' || 
               element.tagName === 'TEXTAREA' || 
               element.tagName === 'SELECT' ||
               element.isContentEditable;
    }
    
    getCurrentTheme() {
        return this.html.getAttribute('data-theme') || this.defaultTheme;
    }
    
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
    
    applyTheme(theme) {
        // Set theme attribute on html element
        this.html.setAttribute('data-theme', theme);
        
        // Save to cookie
        this.saveThemeToCookie(theme);
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
        
        // Update UI feedback
        this.showThemeNotification(theme);
    }
    
    saveThemeToCookie(theme) {
        // Set cookie that expires in 1 year
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        
        document.cookie = `iro-stream-theme=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
    }
    
    getThemeFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('iro-stream-theme=')) {
                return cookie.split('=')[1];
            }
        }
        return null;
    }
    
    showThemeNotification(theme) {
        // Remove existing notification if any
        const existing = document.querySelector('.theme-notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <span>Theme changed to <strong>${theme === 'dark' ? 'Dark' : 'Light'}</strong> mode</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)'};
            color: ${theme === 'dark' ? '#000' : '#fff'};
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 0.9rem;
            max-width: 300px;
        `;
        
        // Close button style
        notification.querySelector('.notification-close').style.cssText = `
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        `;
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        document.body.appendChild(notification);
        
        // Add animation styles if not already present
        if (!document.getElementById('theme-animation-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'theme-animation-styles';
            styleEl.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}