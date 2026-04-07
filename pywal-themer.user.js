// ==UserScript==
// @name         Pywal Themer
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Theme websites with pywal colors - smart semantic mapping
// @author       pywal-themer
// @match        https://*.youtube.com/*
// @match        https://github.com/*
// @match        https://*.reddit.com/*
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const SERVER_URL = 'http://127.0.0.1:7890/colors';
    const POLL_INTERVAL = 5000;
    const STORAGE_KEY = 'pywal_themer_hash';

    let lastHash = '';
    let styleElement = null;
    let pollTimer = null;
    let currentColors = null;

    function luminance(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    function isLight(hex) {
        return luminance(hex) > 0.5;
    }

    function adjustColor(hex, amount) {
        if (!hex || hex.length < 7) return '#1a1a2e';
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, Math.max(0, r + amount));
        g = Math.min(255, Math.max(0, g + amount));
        b = Math.min(255, Math.max(0, b + amount));
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    function getDefaultColors() {
        return ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#f5f5f5', '#aaaaaa', '#333333', '#222222'];
    }

    function mapPywalToSemantic(colors) {
        colors = colors || getDefaultColors();
        const isDark = colors[0] && !isLight(colors[0]);
        
        if (isDark) {
            return {
                base: colors[0] || '#1a1a2e',
                mantle: colors[1] || '#16213e',
                crust: colors[2] || '#0f3460',
                surface0: colors[7] || '#222222',
                surface1: adjustColor(colors[0] || '#1a1a2e', 15),
                surface2: adjustColor(colors[0] || '#1a1a2e', 30),
                overlay0: adjustColor(colors[0] || '#1a1a2e', 45),
                overlay1: adjustColor(colors[0] || '#1a1a2e', 60),
                subtext0: colors[5] || '#aaaaaa',
                subtext1: adjustColor(colors[5] || '#aaaaaa', 20),
                text: colors[4] || '#f5f5f5',
                accent: colors[3] || '#e94560',
                accentHover: adjustColor(colors[3] || '#e94560', 20),
                border: adjustColor(colors[0] || '#1a1a2e', 25),
            };
        } else {
            return {
                base: colors[0] || '#f5f5f5',
                mantle: adjustColor(colors[0] || '#f5f5f5', -10),
                crust: adjustColor(colors[0] || '#f5f5f5', -20),
                surface0: adjustColor(colors[0] || '#f5f5f5', 10),
                surface1: adjustColor(colors[0] || '#f5f5f5', 20),
                surface2: adjustColor(colors[0] || '#f5f5f5', 30),
                overlay0: adjustColor(colors[0] || '#f5f5f5', 40),
                overlay1: adjustColor(colors[0] || '#f5f5f5', 50),
                subtext0: colors[5] || '#666666',
                subtext1: adjustColor(colors[5] || '#666666', -20),
                text: colors[4] || '#1a1a2e',
                accent: colors[3] || '#e94560',
                accentHover: adjustColor(colors[3] || '#e94560', -15),
                border: adjustColor(colors[0] || '#f5f5f5', -15),
            };
        }
    }

    function getYouTubeCSS(s) {
        return `
            :root {
                --yt-spec-base-background: ${s.base} !important;
                --yt-spec-raised-background: ${s.base} !important;
                --yt-spec-menu-background: ${s.mantle} !important;
                --yt-spec-inverted-background: ${s.text} !important;
                --yt-spec-additive-background: ${s.surface0} !important;
                --yt-spec-outline: ${s.border} !important;
                --yt-spec-shadow: ${s.crust} !important;
                --yt-spec-text-primary: ${s.text} !important;
                --yt-spec-text-secondary: ${s.subtext0} !important;
                --yt-spec-text-disabled: ${s.subtext1} !important;
                --yt-spec-text-primary-inverse: ${s.crust} !important;
                --yt-spec-call-to-action: ${s.accent} !important;
                --yt-spec-call-to-action-inverse: ${s.accent} !important;
                --yt-spec-suggested-action: ${s.accent}33 !important;
                --yt-spec-icon-active-other: ${s.text} !important;
                --yt-spec-button-chip-background-hover: ${s.surface1} !important;
                --yt-spec-touch-response: ${s.surface0} !important;
                --yt-spec-touch-response-inverse: ${s.accent} !important;
                --yt-spec-brand-icon-active: ${s.accent} !important;
                --yt-spec-brand-button-background: ${s.accent} !important;
                --yt-spec-brand-link-text: ${s.accent} !important;
                --yt-spec-wordmark-text: ${s.text} !important;
                --yt-spec-error-indicator: #ff4444 !important;
                --yt-spec-themed-blue: ${s.accent} !important;
                --yt-spec-themed-green: #4ade80 !important;
                --yt-spec-ad-indicator: #fbbf24 !important;
                --yt-spec-themed-overlay-background: ${s.crust}cc !important;
                --yt-spec-commerce-badge-background: #4ade80 !important;
                --yt-spec-static-brand-red: ${s.accent} !important;
                --yt-spec-static-brand-white: ${s.text} !important;
                --yt-spec-static-brand-black: ${s.base} !important;
                --yt-spec-static-clear-color: transparent !important;
                --yt-spec-static-clear-black: transparent !important;
                --yt-spec-static-ad-yellow: #fbbf24 !important;
                --yt-spec-static-grey: ${s.subtext0} !important;
                --yt-spec-static-overlay-background-solid: ${s.crust} !important;
                --yt-spec-static-overlay-background-heavy: ${s.surface0} !important;
                --yt-spec-static-overlay-background-medium: ${s.crust}80 !important;
                --yt-spec-static-overlay-background-medium-light: ${s.crust}4d !important;
                --yt-spec-static-overlay-background-light: ${s.crust}1a !important;
                --yt-spec-static-overlay-text-primary: ${s.text} !important;
                --yt-spec-static-overlay-text-secondary: ${s.subtext0} !important;
                --yt-spec-static-overlay-text-disabled: ${s.subtext1} !important;
                --yt-spec-static-overlay-call-to-action: ${s.accent} !important;
                --yt-spec-static-overlay-icon-active-other: ${s.text} !important;
                --yt-spec-static-overlay-icon-inactive: ${s.surface1} !important;
                --yt-spec-static-overlay-icon-disabled: ${s.surface2} !important;
                --yt-spec-static-overlay-button-primary: ${s.accent} !important;
                --yt-spec-static-overlay-button-secondary: ${s.surface0} !important;
                --yt-spec-static-overlay-touch-response: ${s.overlay1} !important;
                --yt-spec-static-overlay-touch-response-inverse: ${s.surface1} !important;
                --yt-spec-static-overlay-background-brand: ${s.accent} !important;
                --yt-spec-assistive-feed-themed-gradient-1: ${s.subtext0} !important;
                --yt-spec-assistive-feed-themed-gradient-2: ${s.accent} !important;
                --yt-spec-assistive-feed-themed-gradient-3: #ff4444 !important;
                --yt-spec-brand-background-solid: ${s.base} !important;
                --yt-spec-brand-background-primary: ${s.base} !important;
                --yt-spec-brand-background-secondary: ${s.mantle} !important;
                --yt-spec-general-background-a: ${s.base} !important;
                --yt-spec-general-background-b: ${s.base} !important;
                --yt-spec-general-background-c: ${s.crust} !important;
                --yt-spec-error-background: ${s.base} !important;
                --yt-spec-10-percent-layer: ${s.surface0} !important;
                --yt-spec-snackbar-background: ${s.mantle} !important;
                --yt-spec-snackbar-background-updated: ${s.mantle} !important;
                --yt-spec-badge-chip-background: ${s.surface1} !important;
                --yt-spec-verified-badge-background: ${s.overlay0} !important;
                --yt-spec-call-to-action-fadeoutd: ${s.accent}4d !important;
                --yt-spec-call-to-action-alpha-30: ${s.accent}4d !important;
                --yt-spec-themed-blue-alpha-30: ${s.accent}4d !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
            
            ytd-app, html, body {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            ytd-masthead#masthead, #masthead {
                background: ${s.mantle} !important;
            }
            
            #video-title, #video-title-link {
                color: ${s.text} !important;
            }
            
            #channel-name {
                color: ${s.subtext0} !important;
            }
            
            ytd-thumbnail-overlay-time-status-renderer {
                background: ${s.crust} !important;
                color: ${s.text} !important;
            }
            
            ytd-button-renderer yt-button-shape button {
                background: ${s.accent} !important;
                color: ${s.crust} !important;
            }
            
            ytd-searchbox {
                background: ${s.surface0} !important;
            }
            
            ytd-searchbox input {
                color: ${s.text} !important;
            }
            
            ytd-rich-item-renderer {
                background: ${s.surface0} !important;
            }
        `;
    }

    function getGitHubCSS(s) {
        return `
            :root {
                --color-canvas-default: ${s.base} !important;
                --color-canvas-subtle: ${s.mantle} !important;
                --color-canvas-overlay: ${s.mantle} !important;
                --color-canvas-inset: ${s.crust} !important;
                --color-fg-default: ${s.text} !important;
                --color-fg-muted: ${s.subtext0} !important;
                --color-fg-subtle: ${s.subtext1} !important;
                --color-fg-on-emphasis: ${s.text} !important;
                --color-fg-white: ${s.text} !important;
                --color-fg-done: ${s.subtext0} !important;
                --color-fg-closed: ${s.subtext0} !important;
                --color-fg-open: ${s.accent} !important;
                --color-fg-attention: #eab308 !important;
                --color-fg-severe: #f97316 !important;
                --color-fg-danger: #ef4444 !important;
                --color-fg-sponsors: #ec4899 !important;
                --color-fg-accent: ${s.accent} !important;
                --color-border-default: ${s.border} !important;
                --color-border-muted: ${s.surface0} !important;
                --color-border-subtle: ${s.surface0} !important;
                --color-border-accent-emphasis: ${s.accent} !important;
                --color-neutral-emphasis: ${s.accent} !important;
                --color-neutral-muted: ${s.surface1} !important;
                --color-neutral-subtle: ${s.surface0} !important;
                --color-accent-fg: ${s.accent} !important;
                --color-accent-muted: ${s.accent}66 !important;
                --color-accent-subtle: ${s.accent}1a !important;
                --color-accent-emphasis: ${s.accent} !important;
                --color-success-fg: #4ade80 !important;
                --color-attention-fg: #eab308 !important;
                --color-severe-fg: #f97316 !important;
                --color-danger-fg: #ef4444 !important;
                --color-done-fg: #a855f7 !important;
                --color-sponsors-fg: #ec4899 !important;
                --color-btn-text: ${s.text} !important;
                --color-btn-bg: ${s.surface0} !important;
                --color-btn-border: ${s.border} !important;
                --color-btn-hover-bg: ${s.surface1} !important;
                --color-btn-hover-border: ${s.border} !important;
                --color-btn-active-bg: ${s.surface2} !important;
                --color-btn-active-border: ${s.border} !important;
                --color-btn-selected-bg: ${s.surface2} !important;
                --color-btn-primary-text: ${s.crust} !important;
                --color-btn-primary-bg: ${s.accent} !important;
                --color-btn-primary-border: ${s.accent} !important;
                --color-btn-primary-hover-bg: ${s.accentHover} !important;
                --color-btn-primary-hover-border: ${s.accentHover} !important;
                --color-header-text: ${s.text} !important;
                --color-header-bg: ${s.mantle} !important;
                --color-header-logo: ${s.text} !important;
                --color-markdown-code-bg: ${s.crust} !important;
                --color-markdown-table-border: ${s.border} !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
            
            body, .app-content {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            header.header {
                background: ${s.mantle} !important;
                border-color: ${s.border} !important;
            }
            
            .header-nav-link {
                color: ${s.text} !important;
            }
            
            .repo-list-item, .Box-row {
                background: ${s.surface0} !important;
                border-color: ${s.border} !important;
            }
            
            .repo-title a {
                color: ${s.accent} !important;
            }
            
            .text-gray-dark, .color-fg-default {
                color: ${s.text} !important;
            }
            
            .color-fg-muted {
                color: ${s.subtext0} !important;
            }
            
            .btn-primary {
                background: ${s.accent} !important;
                color: ${s.crust} !important;
            }
            
            input, textarea {
                background: ${s.surface0} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }
        `;
    }

    function getRedditCSS(s) {
        return `
            :root {
                --color-tone-1: ${s.text} !important;
                --color-tone-2: ${s.subtext0} !important;
                --color-tone-3: ${s.subtext1} !important;
                --color-tone-4: ${s.overlay0} !important;
                --color-tone-5: ${s.overlay1} !important;
                --color-tone-6: ${s.surface2} !important;
                --color-tone-7: ${s.base} !important;
                --color-tone-8: ${s.mantle} !important;
                --color-primary: ${s.accent} !important;
                --color-primary-hover: ${s.accentHover} !important;
                --color-upvote: ${s.accent} !important;
                --color-downvote: #7c3aed !important;
            }
            
            body {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            #header {
                background: ${s.mantle} !important;
            }
            
            .thing, .link, .post {
                background: ${s.surface0} !important;
            }
            
            .title, .title a {
                color: ${s.accent} !important;
            }
            
            .tagline {
                color: ${s.subtext0} !important;
            }
            
            .md, .usertext {
                color: ${s.text} !important;
            }
            
            shreddit-post, shreddit-comment {
                --color-tone-1: ${s.text} !important;
                --color-tone-7: ${s.base} !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder {
                color: ${s.subtext0} !important;
            }
        `;
    }

    function getXCSS(s) {
        return `
            :root {
                --theme-color: ${s.accent};
                --theme-bg-dim: ${s.base}99;
                --theme-popup: ${s.mantle}cc;
            }
            
            body {
                background-color: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            [data-testid="primaryColumn"],
            header[role="banner"],
            [data-testid="cellInnerDiv"] {
                background: transparent !important;
            }
            
            [data-testid="tweet"] {
                background: ${s.surface0} !important;
            }
            
            [data-testid="tweetText"] {
                color: ${s.text} !important;
            }
            
            button[style*="rgb(29, 155, 240)"],
            [aria-label="Post"] {
                background: ${s.accent} !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input {
                background: ${s.surface0} !important;
                color: ${s.text} !important;
            }
            
            [data-testid="placeholder"] {
                color: ${s.subtext0} !important;
            }
        `;
    }

    function getCurrentPageCSS(colors) {
        const s = mapPywalToSemantic(colors);
        const hostname = window.location.hostname;
        
        if (hostname.includes('youtube.com')) {
            return getYouTubeCSS(s);
        } else if (hostname.includes('github.com')) {
            return getGitHubCSS(s);
        } else if (hostname.includes('reddit.com')) {
            return getRedditCSS(s);
        } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
            return getXCSS(s);
        }
        
        return '';
    }

    function applyStyles(colors) {
        colors = colors || getDefaultColors();
        const css = getCurrentPageCSS(colors);
        
        if (!css) return;
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'pywal-themer-style';
            styleElement.type = 'text/css';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = css;
    }

    async function fetchColors() {
        try {
            const response = await fetch(SERVER_URL, { 
                signal: AbortSignal.timeout(3000),
                mode: 'cors'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.colors && data.colors.length > 0) {
                    currentColors = data.colors;
                    const currentHash = data.hash || data.colors[0];
                    
                    if (currentHash !== lastHash) {
                        lastHash = currentHash;
                        try {
                            localStorage.setItem(STORAGE_KEY, lastHash);
                        } catch(e) {}
                        applyStyles(currentColors);
                    }
                }
            }
        } catch (e) {
            // Server not reachable - keep using current colors or defaults
            if (currentColors) {
                applyStyles(currentColors);
            } else {
                applyStyles(getDefaultColors());
            }
        }
    }

    function init() {
        // Try localStorage for last known hash
        try {
            lastHash = localStorage.getItem(STORAGE_KEY) || '';
        } catch(e) {}
        
        // Apply default styles immediately to avoid flash
        applyStyles(getDefaultColors());
        
        // Then try to fetch fresh colors
        fetchColors();
        
        // Poll for updates
        pollTimer = setInterval(fetchColors, POLL_INTERVAL);
    }

    function cleanup() {
        if (pollTimer) {
            clearInterval(pollTimer);
        }
    }

    window.addEventListener('beforeunload', cleanup);
    init();

})();