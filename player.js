/**
 * IRO STREAM Video Player
 * Open Source Video Player with Netlify Functions Backend
 * GitHub: https://github.com/IROTECHLAB/IROSTREAM
 * License: MIT
 */

class IroStreamPlayer {
    constructor() {
        // DOM Elements
        this.urlSection = document.getElementById('urlSection');
        this.playerSection = document.getElementById('playerSection');
        this.playerContainer = document.getElementById('playerContainer');
        this.video = document.getElementById('videoPlayer');
        this.urlInput = document.getElementById('videoUrl');
        this.loadBtn = document.getElementById('loadBtn');
        this.backBtn = document.getElementById('backBtn');
        this.useProxyCheckbox = document.getElementById('useProxy');
        
        // Overlays
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.loadingProgress = document.getElementById('loadingProgress');
        this.loadingProgressFill = document.getElementById('loadingProgressFill');
        this.playOverlay = document.getElementById('playOverlay');
        this.errorOverlay = document.getElementById('errorOverlay');
        this.errorText = document.getElementById('errorText');
        this.bufferIndicator = document.getElementById('bufferIndicator');
        
        // Network Slow Indicator
        this.networkSlowIndicator = document.getElementById('networkSlowIndicator');
        this.slowProgressFill = document.getElementById('slowProgressFill');
        
        // Controls
        this.controls = document.getElementById('controls');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.bigPlayBtn = document.getElementById('bigPlayBtn');
        this.skipBackBtn = document.getElementById('skipBackBtn');
        this.skipForwardBtn = document.getElementById('skipForwardBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeFill = document.getElementById('volumeFill');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.pipBtn = document.getElementById('pipBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.speedMenu = document.getElementById('speedMenu');
        this.speedValue = document.getElementById('speedValue');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Progress
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBuffer = document.getElementById('progressBuffer');
        this.progressPlayed = document.getElementById('progressPlayed');
        this.progressThumb = document.getElementById('progressThumb');
        this.progressTooltip = document.getElementById('progressTooltip');
        
        // Time Display
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.timeInputWrapper = document.getElementById('timeInputWrapper');
        this.timeInput = document.getElementById('timeInput');
        this.timeGoBtn = document.getElementById('timeGoBtn');
        
        // Stats
        this.bufferPercent = document.getElementById('bufferPercent');
        this.networkSpeed = document.getElementById('networkSpeed');
        
        // Shortcuts Modal
        this.shortcutsModal = document.getElementById('shortcutsModal');
        this.closeShortcuts = document.getElementById('closeShortcuts');
        
        // State
        this.isPlaying = false;
        this.isMuted = false;
        this.isFullscreen = false;
        this.controlsTimeout = null;
        this.cursorTimeout = null;
        this.lastVolume = 1;
        this.currentUrl = '';
        this.originalUrl = '';
        this.loadStartTime = 0;
        this.bytesLoaded = 0;
        
        // Netlify Functions Proxy URL
        this.netlifyProxyUrl = '/.netlify/functions/proxy';
        
        // Buffer Management
        this.bufferCheckInterval = null;
        this.targetBufferAhead = 60; // seconds to buffer ahead
        this.historyBufferRatio = 0.10; // 10% of watched video as history buffer
        this.maxWatchedPosition = 0; // track furthest watched position
        this.bufferRanges = []; // store all buffer ranges for visualization
        
        // Network speed tracking
        this.lastBufferTime = 0;
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
        this.maxSpeedSamples = 10; // rolling average of last 10 samples
        
        // Network slow detection
        this.networkSlowCheckInterval = null;
        this.lastSpeedCheckTime = 0;
        this.slowSpeedThreshold = 100000; // 100 KB/s threshold for slow network
        this.slowDurationThreshold = 3000; // 3 seconds of slow speed to trigger warning
        this.slowStartTime = 0;
        this.isNetworkSlow = false;
        
        // Range request support detection
        this.supportsRangeRequests = null; // null = unknown, true/false after check
        this.rangeRequestChecked = false;
        
        // Retry tracking
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Loading tracking
        this.loadedBytes = 0;
        this.totalBytes = 0;
        this.loadProgress = 0;
        
        // HLS/DASH instances
        this.hlsInstance = null;
        this.dashInstance = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupVideoEvents();
        this.updateVolumeUI();
        
        // Focus input on load
        this.urlInput.focus();
        
        // Check for URL in query params
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get('url');
        if (videoUrl) {
            this.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }
        
        // Check for saved proxy preference
        this.loadProxyPreference();
        
        console.log('🎬 IRO STREAM Player initialized');
        console.log('📚 GitHub: https://github.com/IROTECHLAB/IROSTREAM');
        console.log('📜 License: MIT');
        console.log('📢 Telegram: https://t.me/Irotechlab');
    }
    
    bindEvents() {
        // URL Input
        this.loadBtn.addEventListener('click', () => this.loadVideo());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadVideo();
        });
        this.backBtn.addEventListener('click', () => this.showUrlSection());
        this.retryBtn.addEventListener('click', () => this.loadVideo());
        
        // Proxy toggle
        this.useProxyCheckbox.addEventListener('change', (e) => {
            this.saveProxyPreference(e.target.checked);
        });
        
        // Play Controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.bigPlayBtn.addEventListener('click', () => this.togglePlay());
        this.skipBackBtn.addEventListener('click', () => this.skip(-10));
        this.skipForwardBtn.addEventListener('click', () => this.skip(10));
        
        // Volume
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Progress Bar
        this.progressContainer.addEventListener('click', (e) => this.seek(e));
        this.progressContainer.addEventListener('mousemove', (e) => this.updateTooltip(e));
        
        // Add drag support for progress bar
        let isDragging = false;
        this.progressContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.seek(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.seek(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Fullscreen & PiP
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.pipBtn.addEventListener('click', () => this.togglePiP());
        
        // Time Input - click time display to show input
        this.timeDisplay.addEventListener('click', () => this.showTimeInput());
        this.timeGoBtn.addEventListener('click', () => this.jumpToInputTime());
        this.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.jumpToInputTime();
        });
        this.timeInput.addEventListener('blur', () => {
            setTimeout(() => this.hideTimeInput(), 200);
        });
        
        // Speed Menu
        this.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speedMenu.classList.toggle('active');
        });
        
        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed);
                this.setPlaybackSpeed(speed);
            });
        });
        
        // Custom speed input
        const customSpeedInput = document.getElementById('customSpeedInput');
        const customSpeedBtn = document.getElementById('customSpeedBtn');
        
        if (customSpeedBtn && customSpeedInput) {
            customSpeedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = parseFloat(customSpeedInput.value);
                if (speed >= 0.1 && speed <= 100) {
                    this.setPlaybackSpeed(speed);
                    customSpeedInput.value = '';
                }
            });
            
            customSpeedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    const speed = parseFloat(customSpeedInput.value);
                    if (speed >= 0.1 && speed <= 100) {
                        this.setPlaybackSpeed(speed);
                        customSpeedInput.value = '';
                    }
                }
            });
            
            customSpeedInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Close speed menu when clicking outside
        document.addEventListener('click', () => {
            this.speedMenu.classList.remove('active');
        });
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Controls visibility
        this.playerContainer.addEventListener('mousemove', () => this.showControls());
        this.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Click to play/pause
        this.video.addEventListener('click', () => this.togglePlay());
        
        // Double-click to fullscreen
        this.video.addEventListener('dblclick', () => this.toggleFullscreen());
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        
        // Listen for theme changes
        document.addEventListener('themeChange', (e) => {
            this.updatePlayerForTheme(e.detail.theme);
        });
    }
    
    setupVideoEvents() {
        // Loading states
        this.video.addEventListener('loadstart', () => {
            this.loadStartTime = Date.now();
            this.maxWatchedPosition = 0;
            this.bufferRanges = [];
            this.showLoading('Loading video...');
            this.retryCount = 0;
            this.loadedBytes = 0;
            this.totalBytes = 0;
            this.loadProgress = 0;
            this.updateLoadingProgress(0);
            
            // Start network speed monitoring
            this.startNetworkSpeedMonitoring();
        });
        
        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }
            
            this.durationEl.textContent = this.formatTime(this.video.duration);
            this.updateLoadingProgress(30);
            this.showLoading('Buffering video...');
            
            // Start buffer management
            this.startBufferManagement();
            this.updateSpeedStatus();
            
            console.log(`🎥 Video loaded: ${this.formatTime(this.video.duration)} duration`);
            if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
                console.log(`📐 Resolution: ${this.video.videoWidth}x${this.video.videoHeight}`);
                this.showResolutionNotification();
            }
        });
        
        this.video.addEventListener('canplay', () => {
            this.updateLoadingProgress(80);
            this.showLoading('Almost ready...');
            this.playOverlay.classList.remove('hidden');
        });
        
        this.video.addEventListener('canplaythrough', () => {
            this.updateLoadingProgress(100);
            setTimeout(() => {
                this.hideLoading();
            }, 500);
        });
        
        this.video.addEventListener('waiting', () => {
            this.showLoading('Buffering...');
            this.startNetworkSlowCheck();
        });
        
        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');
            this.stopNetworkSlowCheck();
        });
        
        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            this.updateBuffer();
        });
        
        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            this.playOverlay.classList.remove('hidden');
        });
        
        // Time update
        this.video.addEventListener('timeupdate', () => {
            this.updateProgress();
            if (this.video.currentTime > this.maxWatchedPosition) {
                this.maxWatchedPosition = this.video.currentTime;
            }
        });
        
        // Buffer progress
        this.video.addEventListener('progress', () => {
            this.updateBuffer();
            this.updateLoadingFromProgress();
        });
        
        // Also update buffer on seeking
        this.video.addEventListener('seeked', () => {
            this.updateBuffer();
        });
        
        // Error handling
        this.video.addEventListener('error', (e) => this.handleError(e));
        
        // Volume change
        this.video.addEventListener('volumechange', () => this.updateVolumeUI());
        
        // Track loading progress
        this.video.addEventListener('progress', () => {
            this.updateLoadingFromProgress();
        });
    }
    
    loadVideo() {
        let url = this.urlInput.value.trim();
        if (!url) {
            this.urlInput.focus();
            this.showUrlInputError('Please enter a video URL');
            return;
        }
        
        // Clean up any existing instances
        this.cleanupStreamInstances();
        
        this.originalUrl = url;
        this.currentUrl = url;
        this.hideError();
        this.showPlayerSection();
        this.showLoading('Preparing stream...');
        
        // Reset tracking
        this.resetNetworkTracking();
        
        // Check if HLS stream
        if (url.includes('.m3u8')) {
            this.loadHLS(url);
        } else if (url.includes('.mpd')) {
            this.loadDASH(url);
        } else {
            // Direct video URL
            const useProxy = this.useProxyCheckbox && this.useProxyCheckbox.checked;
            if (useProxy) {
                this.loadWithNetlifyProxy(url);
            } else {
                this.loadDirectVideo(url);
            }
        }
        
        // Update URL params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('url', encodeURIComponent(url));
        window.history.replaceState({}, '', newUrl);
    }
    
    cleanupStreamInstances() {
        if (this.hlsInstance) {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
        }
        if (this.dashInstance) {
            this.dashInstance.destroy();
            this.dashInstance = null;
        }
    }
    
    loadWithNetlifyProxy(url) {
        console.log('🔄 Using Netlify Functions Proxy');
        
        // Construct proxy URL
        const proxyUrl = `${this.netlifyProxyUrl}?url=${encodeURIComponent(url)}`;
        this.currentUrl = proxyUrl;
        
        // Reset video element
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        // Configure for streaming
        this.video.preload = 'auto';
        this.video.crossOrigin = 'anonymous';
        
        // Show proxy indicator
        this.showProxyIndicator();
        
        // Set the source and load
        this.video.src = proxyUrl;
        this.video.load();
        
        // Add timeout for stuck loading
        this.loadTimeout = setTimeout(() => {
            if (this.video.readyState < 2) {
                console.warn('Proxy loading is taking too long...');
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries}`);
                    this.loadWithNetlifyProxy(url);
                }
            }
        }, 15000);
    }
    
    showProxyIndicator() {
        const existing = document.querySelector('.proxy-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'proxy-indicator';
        indicator.innerHTML = `
            <i class="fas fa-cloud"></i>
            <span>Using Netlify Functions Proxy</span>
        `;
        
        indicator.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 8px 16px;
            background: rgba(0, 102, 255, 0.9);
            color: white;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8rem;
            z-index: 15;
            animation: slideInLeft 0.3s ease;
        `;
        
        this.playerContainer.appendChild(indicator);
    }
    
    async loadDirectVideo(url) {
        console.log('🔗 Loading direct video URL');
        
        // Reset video element
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        // Configure for streaming
        this.video.preload = 'auto';
        
        // Check if it's a Google URL
        const isGoogleUrl = url.includes('googleusercontent.com') || 
                           url.includes('googlevideo.com') ||
                           url.includes('google.com');
        
        if (isGoogleUrl) {
            console.log('⚠️ Detected Google video URL - may expire after a few hours');
            this.video.removeAttribute('crossorigin');
        } else {
            this.video.crossOrigin = 'anonymous';
        }
        
        // Check if server supports Range requests
        if (!this.rangeRequestChecked) {
            await this.checkRangeRequestSupport(url);
        }
        
        // Set the source and load
        this.video.src = url;
        this.video.load();
        
        // Add timeout for stuck loading
        this.loadTimeout = setTimeout(() => {
            if (this.video.readyState < 2) {
                console.warn('Video loading is taking too long...');
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries}`);
                    this.loadDirectVideo(url);
                }
            }
        }, 10000);
    }
    
    async checkRangeRequestSupport(url) {
        this.rangeRequestChecked = true;
        
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'cors',
                headers: {
                    'Range': 'bytes=0-1'
                }
            });
            
            const acceptRanges = response.headers.get('Accept-Ranges');
            const contentLength = response.headers.get('Content-Length');
            const contentRange = response.headers.get('Content-Range');
            
            this.supportsRangeRequests = acceptRanges === 'bytes' || contentRange !== null;
            
            if (this.supportsRangeRequests) {
                console.log(`✅ Server supports Range requests (byte-seeking enabled)`);
                if (contentLength) {
                    const sizeMB = (parseInt(contentLength) / 1024 / 1024).toFixed(1);
                    console.log(`📦 File size: ${sizeMB} MB`);
                }
            } else {
                console.warn(`⚠️ Server doesn't support Range requests - seeking may require re-download`);
                this.showRangeWarning();
            }
        } catch (error) {
            console.warn('Could not check Range request support:', error.message);
            this.supportsRangeRequests = true;
        }
    }
    
    showRangeWarning() {
        const warning = document.createElement('div');
        warning.className = 'range-warning';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>This video may not support seeking to unbuffered positions</span>
        `;
        
        warning.style.cssText = `
            position: absolute;
            top: 70px;
            right: 20px;
            padding: 10px 16px;
            background: rgba(255, 165, 0, 0.9);
            color: #000;
            border-radius: var(--radius-md);
            font-size: 0.85rem;
            z-index: 20;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 4s forwards;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        this.playerContainer.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }
    
    showResolutionNotification() {
        const resolution = document.createElement('div');
        resolution.className = 'resolution-notification';
        resolution.innerHTML = `
            <i class="fas fa-expand-alt"></i>
            <span>${this.video.videoWidth}×${this.video.videoHeight}</span>
        `;
        
        resolution.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            z-index: 15;
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            animation: fadeInOut 3s ease;
        `;
        
        this.playerContainer.appendChild(resolution);
    }
    
    loadHLS(url) {
        console.log('📡 Loading HLS stream');
        
        // Check if native HLS is supported (Safari)
        if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = url;
            this.video.load();
        } else if (typeof Hls !== 'undefined') {
            // Use hls.js for other browsers
            this.hlsInstance = new Hls({
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxBufferSize: 60 * 1000 * 1000,
                maxBufferHole: 0.5,
                enableWorker: true,
            });
            
            this.hlsInstance.loadSource(url);
            this.hlsInstance.attachMedia(this.video);
            
            this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                this.updateLoadingProgress(50);
                console.log('✅ HLS manifest parsed');
            });
            
            this.hlsInstance.on(Hls.Events.BUFFER_CREATED, () => {
                this.updateLoadingProgress(70);
            });
            
            this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            this.showError('HLS network error. Check stream URL.');
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            this.showError('HLS media error. Codec may not be supported.');
                            break;
                        default:
                            this.showError('HLS stream error: ' + data.type);
                    }
                }
            });
        } else {
            this.showError('HLS playback not supported. Please use Safari or add hls.js library.');
        }
    }
    
    loadDASH(url) {
        console.log('📡 Loading DASH stream');
        
        if (typeof dashjs !== 'undefined') {
            this.dashInstance = dashjs.MediaPlayer().create();
            this.dashInstance.initialize(this.video, url, false);
            this.dashInstance.updateSettings({
                streaming: {
                    buffer: {
                        fastSwitchEnabled: true,
                        bufferTimeAtTopQuality: 30,
                        bufferTimeAtTopQualityLongForm: 60,
                    }
                }
            });
            
            this.dashInstance.on('error', (e) => {
                console.error('DASH error:', e);
                this.showError('DASH stream error. Check stream URL.');
            });
        } else {
            this.showError('DASH playback requires dash.js library.');
        }
    }
    
    togglePlay() {
        if (this.video.paused) {
            this.video.play().catch(e => {
                console.error('Play error:', e);
                this.showError('Unable to play video: ' + e.message);
            });
        } else {
            this.video.pause();
        }
    }
    
    skip(seconds) {
        const newTime = this.video.currentTime + seconds;
        this.seekToTime(newTime);
        this.showSeekIndicator(seconds);
    }
    
    showSeekIndicator(seconds) {
        let indicator = document.querySelector(`.seek-indicator.${seconds < 0 ? 'left' : 'right'}`);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = `seek-indicator ${seconds < 0 ? 'left' : 'right'}`;
            this.playerContainer.appendChild(indicator);
        }
        
        indicator.textContent = `${seconds > 0 ? '+' : ''}${seconds}s`;
        indicator.classList.remove('active');
        void indicator.offsetWidth;
        indicator.classList.add('active');
    }
    
    seek(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        this.seekToTime(clampedPos * this.video.duration);
    }
    
    seekToTime(targetTime) {
        if (!this.video.duration) return;
        
        const isBuffered = this.isTimeBuffered(targetTime);
        
        if (!isBuffered) {
            this.showLoading('Seeking...');
            this.startNetworkSlowCheck();
            
            const timeStr = this.formatTime(targetTime);
            
            if (this.supportsRangeRequests === false) {
                console.warn(`⚠️ Seeking to ${timeStr} - server may not support Range requests`);
            } else {
                console.log(`🎯 Seeking to ${timeStr}`);
            }
        }
        
        this.video.currentTime = Math.max(0, Math.min(targetTime, this.video.duration));
    }
    
    isTimeBuffered(time) {
        for (let i = 0; i < this.video.buffered.length; i++) {
            if (time >= this.video.buffered.start(i) && time <= this.video.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }
    
    seekToPercent(percent) {
        if (!this.video.duration) return;
        const targetTime = (percent / 100) * this.video.duration;
        this.seekToTime(targetTime);
    }
    
    showTimeInput() {
        this.timeDisplay.style.display = 'none';
        this.timeInputWrapper.style.display = 'flex';
        this.timeInput.value = '';
        this.timeInput.placeholder = this.formatTime(this.video.currentTime);
        this.timeInput.focus();
    }
    
    hideTimeInput() {
        this.timeInputWrapper.style.display = 'none';
        this.timeDisplay.style.display = '';
    }
    
    jumpToInputTime() {
        const input = this.timeInput.value.trim();
        if (!input) {
            this.hideTimeInput();
            return;
        }
        
        const seconds = this.parseTimeInput(input);
        if (seconds !== null && seconds >= 0 && seconds <= this.video.duration) {
            this.seekToTime(seconds);
            this.hideTimeInput();
        } else {
            this.timeInput.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                this.timeInput.style.animation = '';
            }, 300);
        }
    }
    
    parseTimeInput(input) {
        input = input.toLowerCase().trim();
        
        if (input.includes(':')) {
            const parts = input.split(':').map(p => parseInt(p) || 0);
            if (parts.length === 2) {
                return parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        }
        
        let totalSeconds = 0;
        const hourMatch = input.match(/(\d+)\s*h/);
        const minMatch = input.match(/(\d+)\s*m/);
        const secMatch = input.match(/(\d+)\s*s/);
        
        if (hourMatch || minMatch || secMatch) {
            if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
            if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
            if (secMatch) totalSeconds += parseInt(secMatch[1]);
            return totalSeconds;
        }
        
        const num = parseInt(input);
        if (!isNaN(num)) {
            return num;
        }
        
        return null;
    }
    
    updateTooltip(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        const time = clampedPos * this.video.duration;
        
        this.progressTooltip.textContent = this.formatTime(time);
        this.progressTooltip.style.left = `${clampedPos * 100}%`;
    }
    
    updateProgress() {
        if (!this.video.duration) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressPlayed.style.width = `${progress}%`;
        this.progressThumb.style.left = `${progress}%`;
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    }
    
    updateBuffer() {
        if (!this.video.duration || this.video.buffered.length === 0) return;
        
        const duration = this.video.duration;
        const currentTime = this.video.currentTime;
        const now = Date.now();
        
        if (currentTime > this.maxWatchedPosition) {
            this.maxWatchedPosition = currentTime;
        }
        
        this.bufferRanges = [];
        for (let i = 0; i < this.video.buffered.length; i++) {
            this.bufferRanges.push({
                start: this.video.buffered.start(i),
                end: this.video.buffered.end(i)
            });
        }
        
        let currentBufferEnd = currentTime;
        let currentBufferStart = currentTime;
        for (const range of this.bufferRanges) {
            if (currentTime >= range.start && currentTime <= range.end) {
                currentBufferEnd = range.end;
                currentBufferStart = range.start;
                break;
            }
        }
        
        const bufferAhead = currentBufferEnd - currentTime;
        
        let totalBuffered = 0;
        for (const range of this.bufferRanges) {
            totalBuffered += range.end - range.start;
        }
        
        const bufferStartPercent = (currentBufferStart / duration) * 100;
        const bufferEndPercent = (currentBufferEnd / duration) * 100;
        
        this.progressBuffer.style.left = `${bufferStartPercent}%`;
        this.progressBuffer.style.width = `${bufferEndPercent - bufferStartPercent}%`;
        
        const aheadSeconds = Math.round(bufferAhead);
        this.bufferPercent.textContent = `${aheadSeconds}s ahead`;
        
        this.calculateNetworkSpeed(totalBuffered, now);
    }
    
    calculateNetworkSpeed(totalBuffered, now) {
        if (this.lastBufferTime === 0) {
            this.lastBufferTime = now;
            this.lastBufferedAmount = totalBuffered;
            return;
        }
        
        const timeDelta = (now - this.lastBufferTime) / 1000;
        const bufferDelta = totalBuffered - this.lastBufferedAmount;
        
        if (timeDelta > 0.3) {
            const estimatedBitrate = 5000000;
            const bytesDownloaded = bufferDelta * (estimatedBitrate / 8);
            const speedBps = bytesDownloaded / timeDelta;
            
            if (bufferDelta > 0.1) {
                this.networkSpeedSamples.push(speedBps);
                if (this.networkSpeedSamples.length > this.maxSpeedSamples) {
                    this.networkSpeedSamples.shift();
                }
                
                const avgSpeed = this.networkSpeedSamples.reduce((a, b) => a + b, 0) / this.networkSpeedSamples.length;
                this.displayNetworkSpeed(avgSpeed);
                
                // Check for slow network
                this.checkNetworkSpeed(avgSpeed);
            } else if (timeDelta > 2) {
                const isFullyBuffered = totalBuffered >= this.video.duration - 1;
                if (isFullyBuffered) {
                    this.networkSpeed.textContent = 'Complete';
                    this.networkSpeed.style.color = 'var(--accent-primary)';
                    this.stopNetworkSlowCheck();
                } else {
                    this.networkSpeed.textContent = 'Waiting...';
                    this.networkSpeed.style.color = 'var(--text-tertiary)';
                    this.startNetworkSlowCheck();
                }
            }
            
            this.lastBufferTime = now;
            this.lastBufferedAmount = totalBuffered;
        }
    }
    
    displayNetworkSpeed(bytesPerSecond) {
        this.networkSpeed.style.color = '';
        
        if (bytesPerSecond >= 1000000) {
            this.networkSpeed.textContent = `${(bytesPerSecond / 1000000).toFixed(1)} MB/s`;
        } else if (bytesPerSecond >= 1000) {
            this.networkSpeed.textContent = `${(bytesPerSecond / 1000).toFixed(0)} KB/s`;
        } else if (bytesPerSecond > 0) {
            this.networkSpeed.textContent = `${Math.round(bytesPerSecond)} B/s`;
        }
    }
    
    checkNetworkSpeed(speedBps) {
        const now = Date.now();
        
        if (speedBps < this.slowSpeedThreshold) {
            if (!this.isNetworkSlow) {
                if (this.slowStartTime === 0) {
                    this.slowStartTime = now;
                } else if (now - this.slowStartTime > this.slowDurationThreshold) {
                    this.isNetworkSlow = true;
                    this.showNetworkSlowIndicator(speedBps);
                }
            } else {
                this.updateNetworkSlowProgress();
            }
        } else {
            if (this.isNetworkSlow) {
                this.isNetworkSlow = false;
                this.slowStartTime = 0;
                this.hideNetworkSlowIndicator();
            }
        }
    }
    
    startNetworkSlowCheck() {
        if (this.networkSlowCheckInterval) {
            clearInterval(this.networkSlowCheckInterval);
        }
        
        this.networkSlowCheckInterval = setInterval(() => {
            if (this.video.readyState < 3) {
                this.showNetworkSlowIndicator(0);
            }
        }, 1000);
    }
    
    stopNetworkSlowCheck() {
        if (this.networkSlowCheckInterval) {
            clearInterval(this.networkSlowCheckInterval);
            this.networkSlowCheckInterval = null;
        }
        this.hideNetworkSlowIndicator();
    }
    
    showNetworkSlowIndicator(speedBps = 0) {
        this.networkSlowIndicator.classList.add('active');
        
        // Update progress based on speed
        let progress = 0;
        if (speedBps > 0) {
            progress = Math.min(100, (speedBps / this.slowSpeedThreshold) * 100);
        } else {
            // Pulsing animation for 0 speed
            progress = 30 + Math.sin(Date.now() / 500) * 20;
        }
        
        this.slowProgressFill.style.width = `${progress}%`;
    }
    
    updateNetworkSlowProgress() {
        if (this.networkSlowIndicator.classList.contains('active')) {
            const progress = 30 + Math.sin(Date.now() / 500) * 20;
            this.slowProgressFill.style.width = `${progress}%`;
        }
    }
    
    hideNetworkSlowIndicator() {
        this.networkSlowIndicator.classList.remove('active');
    }
    
    updateSpeedStatus() {
        if (!this.video.duration) return;
        
        let totalBuffered = 0;
        for (let i = 0; i < this.video.buffered.length; i++) {
            totalBuffered += this.video.buffered.end(i) - this.video.buffered.start(i);
        }
        
        const isFullyBuffered = totalBuffered >= this.video.duration - 1;
        const bufferPercent = Math.round((totalBuffered / this.video.duration) * 100);
        
        if (isFullyBuffered) {
            this.networkSpeed.textContent = 'Complete';
            this.networkSpeed.style.color = 'var(--accent-primary)';
            this.bufferIndicator.classList.remove('active');
        } else if (this.networkSpeedSamples.length === 0) {
            this.networkSpeed.textContent = `${bufferPercent}% loaded`;
            this.networkSpeed.style.color = '';
        }
    }
    
    startBufferManagement() {
        if (this.bufferCheckInterval) {
            clearInterval(this.bufferCheckInterval);
        }
        
        this.bufferCheckInterval = setInterval(() => {
            this.manageBuffer();
        }, 500);
    }
    
    stopBufferManagement() {
        if (this.bufferCheckInterval) {
            clearInterval(this.bufferCheckInterval);
            this.bufferCheckInterval = null;
        }
    }
    
    startNetworkSpeedMonitoring() {
        this.lastSpeedCheckTime = Date.now();
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
    }
    
    resetNetworkTracking() {
        this.lastBufferTime = 0;
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
        this.slowStartTime = 0;
        this.isNetworkSlow = false;
        this.hideNetworkSlowIndicator();
    }
    
    manageBuffer() {
        if (!this.video.duration || !this.video.src) return;
        
        const currentTime = this.video.currentTime;
        const duration = this.video.duration;
        
        const requiredHistoryBuffer = this.maxWatchedPosition * this.historyBufferRatio;
        
        let bufferAhead = 0;
        let bufferBehind = 0;
        let totalBuffered = 0;
        
        for (let i = 0; i <this.video.buffered.length; i++) {
            const start = this.video.buffered.start(i);
            const end = this.video.buffered.end(i);
            totalBuffered += end - start;
            
            if (currentTime >= start && currentTime <= end) {
                bufferAhead = end - currentTime;
                bufferBehind = currentTime - start;
            }
        }
        
        const isFullyBuffered = totalBuffered >= duration - 0.5;
        const needsMoreBuffer = bufferAhead < this.targetBufferAhead && !isFullyBuffered;
        
        if (this.video.paused && needsMoreBuffer && !this.loadingOverlay.classList.contains('active')) {
            this.bufferIndicator.classList.add('active');
            this.encourageBuffering();
        } else {
            this.bufferIndicator.classList.remove('active');
        }
        
        this.updateBufferHealth(bufferAhead, bufferBehind, requiredHistoryBuffer);
        this.updateSpeedStatus();
    }
    
    encourageBuffering() {
        if (this.video.preload !== 'auto') {
            this.video.preload = 'auto';
        }
        
        if (this.video.buffered.length > 0) {
            const lastBufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            console.debug(`Buffer: ${lastBufferedEnd.toFixed(1)}s / ${this.video.duration.toFixed(1)}s`);
        }
    }
    
    updateBufferHealth(ahead, behind, requiredHistory) {
        const bufferStat = document.getElementById('bufferStat');
        
        if (ahead >= 30) {
            bufferStat.classList.remove('warning', 'critical');
            bufferStat.classList.add('healthy');
        } else if (ahead >= 10) {
            bufferStat.classList.remove('healthy', 'critical');
            bufferStat.classList.add('warning');
        } else {
            bufferStat.classList.remove('healthy', 'warning');
            bufferStat.classList.add('critical');
        }
    }
    
    updateLoadingProgress(percent) {
        this.loadProgress = percent;
        this.loadingProgressFill.style.width = `${percent}%`;
    }
    
    updateLoadingFromProgress() {
        if (this.video.buffered.length > 0) {
            const lastBufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            const duration = this.video.duration || 1;
            const progress = (lastBufferedEnd / duration) * 100;
            this.updateLoadingProgress(Math.min(95, progress));
        }
    }
    
    toggleMute() {
        if (this.video.muted) {
            this.video.muted = false;
            this.video.volume = this.lastVolume || 1;
        } else {
            this.lastVolume = this.video.volume;
            this.video.muted = true;
        }
    }
    
    setVolume(value) {
        this.video.volume = value;
        this.video.muted = value == 0;
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const volume = this.video.muted ? 0 : this.video.volume;
        const container = this.muteBtn.closest('.volume-container');
        
        this.volumeSlider.value = volume;
        this.volumeFill.style.width = `${volume * 100}%`;
        
        container.classList.remove('low', 'muted');
        if (volume === 0 || this.video.muted) {
            container.classList.add('muted');
        } else if (volume < 0.5) {
            container.classList.add('low');
        }
    }
    
    setPlaybackSpeed(speed) {
        try {
            this.video.playbackRate = speed;
            this.speedValue.textContent = `${speed}x`;
            
            document.querySelectorAll('.speed-option').forEach(option => {
                option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
            });
            
            this.speedMenu.classList.remove('active');
            this.showSpeedNotification(speed);
        } catch (error) {
            console.warn(`Playback rate ${speed}x not supported:`, error.message);
            this.showSpeedWarning(speed);
        }
    }
    
    showSpeedNotification(speed) {
        const notification = document.createElement('div');
        notification.className = 'speed-notification';
        notification.textContent = `Speed: ${speed}x`;
        
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: var(--radius-md);
            font-family: 'JetBrains Mono', monospace;
            font-size: 1rem;
            z-index: 18;
            animation: fadeInOut 2s ease;
            pointer-events: none;
        `;
        
        this.playerContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    showSpeedWarning(speed) {
        const warning = document.createElement('div');
        warning.className = 'speed-warning';
        warning.innerHTML = `⚠️ ${speed}x not supported. Browser limit: 0.0625x - 16x`;
        
        this.playerContainer.appendChild(warning);
        
        setTimeout(() => {
            warning.classList.add('fade-out');
            setTimeout(() => warning.remove(), 300);
        }, 2500);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (this.playerContainer.requestFullscreen) {
                this.playerContainer.requestFullscreen();
            } else if (this.playerContainer.webkitRequestFullscreen) {
                this.playerContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }
    
    onFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this.playerContainer.classList.toggle('fullscreen', this.isFullscreen);
    }
    
    async togglePiP() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await this.video.requestPictureInPicture();
            }
        } catch (e) {
            console.error('PiP error:', e);
        }
    }
    
    showControls() {
        clearTimeout(this.controlsTimeout);
        clearTimeout(this.cursorTimeout);
        
        this.playerContainer.classList.add('show-controls');
        this.playerContainer.classList.remove('hide-cursor');
        
        if (this.isPlaying) {
            this.controlsTimeout = setTimeout(() => {
                this.playerContainer.classList.remove('show-controls');
            }, 3000);
            
            if (this.isFullscreen) {
                this.cursorTimeout = setTimeout(() => {
                    this.playerContainer.classList.add('hide-cursor');
                }, 3000);
            }
        }
    }
    
    hideControls() {
        if (this.isPlaying) {
            this.playerContainer.classList.remove('show-controls');
        }
    }
    
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        switch (key) {
            case ' ':
            case 'k':
                e.preventDefault();
                if (this.playerSection.classList.contains('active')) {
                    this.togglePlay();
                }
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'p':
                e.preventDefault();
                this.togglePiP();
                break;
            case 'arrowleft':
            case 'j':
                e.preventDefault();
                this.skip(-10);
                break;
            case 'arrowright':
            case 'l':
                e.preventDefault();
                this.skip(10);
                break;
            case 'arrowup':
                e.preventDefault();
                this.setVolume(Math.min(1, this.video.volume + 0.1));
                break;
            case 'arrowdown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.video.volume - 0.1));
                break;
            case '?':
                e.preventDefault();
                this.shortcutsModal.classList.toggle('active');
                break;
            case 't':
                // Theme toggle is handled in theme.js
                break;
            case 'escape':
                this.shortcutsModal.classList.remove('active');
                break;
            default:
                if (key >= '0' && key <= '9') {
                    e.preventDefault();
                    const percent = parseInt(key) * 10;
                    this.seekToPercent(percent);
                }
        }
    }
    
    showLoading(message = 'Loading...') {
        this.loadingText.textContent = message;
        this.loadingOverlay.classList.add('active');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
        this.stopNetworkSlowCheck();
    }
    
    showError(message = 'Unable to load video') {
        this.hideLoading();
        this.errorText.textContent = message;
        this.errorOverlay.classList.add('active');
    }
    
    hideError() {
        this.errorOverlay.classList.remove('active');
    }
    
    showUrlInputError(message) {
        // Create error notification
        const error = document.createElement('div');
        error.className = 'url-input-error';
        error.textContent = message;
        
        error.style.cssText = `
            position: absolute;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: var(--error);
            color: white;
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
            z-index: 10;
            animation: slideUp 0.3s ease;
        `;
        
        this.urlInput.parentElement.appendChild(error);
        
        setTimeout(() => {
            error.remove();
        }, 3000);
    }
    
    handleError(e) {
        const error = this.video.error;
        let message = 'Unable to load video';
        
        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    message = 'Video playback aborted';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    message = 'Network error - check your connection';
                    this.showNetworkSlowIndicator();
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    message = 'Video format not supported by browser';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    if (this.video.hasAttribute('crossorigin') && !this.triedWithoutCors) {
                        this.triedWithoutCors = true;
                        console.log('Retrying without CORS...');
                        this.video.removeAttribute('crossorigin');
                        this.video.load();
                        return;
                    }
                    if (!this.video.hasAttribute('crossorigin') && !this.triedWithCors) {
                        this.triedWithCors = true;
                        console.log('Retrying with CORS anonymous...');
                        this.video.setAttribute('crossorigin', 'anonymous');
                        this.video.load();
                        return;
                    }
                    
                    const useProxy = this.useProxyCheckbox && this.useProxyCheckbox.checked;
                    if (!useProxy && this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        console.log(`Trying with Netlify Functions proxy (retry ${this.retryCount}/${this.maxRetries})`);
                        this.useProxyCheckbox.checked = true;
                        this.saveProxyPreference(true);
                        this.loadWithNetlifyProxy(this.originalUrl);
                        return;
                    }
                    
                    message = 'Video cannot be played.\n\n• URL may be expired or invalid\n• Server may block external access\n• Format may not be supported';
                    break;
            }
        }
        
        this.showError(message);
    }
    
    showPlayerSection() {
        this.urlSection.classList.add('hidden');
        this.playerSection.classList.add('active');
        this.playerContainer.focus();
    }
    
    showUrlSection() {
        this.urlSection.classList.remove('hidden');
        this.playerSection.classList.remove('active');
        
        // Cleanup
        this.cleanupStreamInstances();
        this.stopBufferManagement();
        this.stopNetworkSlowCheck();
        this.resetNetworkTracking();
        
        // Reset video
        this.video.pause();
        this.video.src = '';
        this.video.load();
        
        // Reset UI
        this.hideLoading();
        this.hideError();
        this.progressPlayed.style.width = '0%';
        this.progressBuffer.style.width = '0%';
        this.progressBuffer.style.left = '0%';
        this.progressThumb.style.left = '0%';
        this.currentTimeEl.textContent = '0:00';
        this.durationEl.textContent = '0:00';
        this.bufferPercent.textContent = '0%';
        this.networkSpeed.textContent = '—';
        
        // Remove buffer health classes
        const bufferStat = document.getElementById('bufferStat');
        bufferStat.classList.remove('healthy', 'warning', 'critical');
        
        // Hide buffer indicator
        this.bufferIndicator.classList.remove('active');
        
        // Remove indicators
        const proxyIndicator = document.querySelector('.proxy-indicator');
        if (proxyIndicator) proxyIndicator.remove();
        
        // Clear URL params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('url');
        window.history.replaceState({}, '', newUrl);
        
        this.urlInput.focus();
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    
    saveProxyPreference(useProxy) {
        localStorage.setItem('iro-stream-use-proxy', useProxy);
    }
    
    loadProxyPreference() {
        const saved = localStorage.getItem('iro-stream-use-proxy');
        if (saved !== null) {
            this.useProxyCheckbox.checked = saved === 'true';
        }
    }
    
    updatePlayerForTheme(theme) {
        // Update any theme-specific player elements
        console.log(`Theme changed to: ${theme}`);
        // Player automatically adapts via CSS variables
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.iroStream = new IroStreamPlayer();
});

// Add animation styles
if (!document.querySelector('style[data-player-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-player-animations', '');
    style.textContent = `
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
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
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}