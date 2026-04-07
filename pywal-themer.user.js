// ==UserScript==
// @name         Pywal Themer
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Theme websites with pywal colors - smart semantic mapping
// @author       pywal-themer
// @match        https://*.youtube.com/*
// @match        https://github.com/*
// @match        https://*.reddit.com/*
// @match        https://x.com/*
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=localhost
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const SERVER_URL = 'http://127.0.0.1:7890/colors';
    const POLL_INTERVAL = 5000;
    const STORAGE_KEY = 'pywal_themer_hash';

    let lastHash = localStorage.getItem(STORAGE_KEY) || '';
    let styleElement = null;
    let pollTimer = null;

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
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, Math.max(0, r + amount));
        g = Math.min(255, Math.max(0, g + amount));
        b = Math.min(255, Math.max(0, b + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function mapPywalToSemantic(colors) {
        const isDark = !isLight(colors[0]);
        
        if (isDark) {
            return {
                base: colors[0],
                mantle: colors[1],
                crust: colors[2],
                surface0: colors[7],
                surface1: adjustColor(colors[0], 15),
                surface2: adjustColor(colors[0], 30),
                overlay0: adjustColor(colors[0], 45),
                overlay1: adjustColor(colors[0], 60),
                subtext0: colors[5],
                subtext1: adjustColor(colors[5], 20),
                text: colors[4],
                accent: colors[3],
                accentHover: adjustColor(colors[3], 20),
                border: adjustColor(colors[0], 25),
            };
        } else {
            return {
                base: colors[0],
                mantle: adjustColor(colors[0], -10),
                crust: adjustColor(colors[0], -20),
                surface0: adjustColor(colors[0], 10),
                surface1: adjustColor(colors[0], 20),
                surface2: adjustColor(colors[0], 30),
                overlay0: adjustColor(colors[0], 40),
                overlay1: adjustColor(colors[0], 50),
                subtext0: colors[5],
                subtext1: adjustColor(colors[5], -20),
                text: colors[4],
                accent: colors[3],
                accentHover: adjustColor(colors[3], -15),
                border: adjustColor(colors[0], -15),
            };
        }
    }

    function getYouTubeCSS(colors) {
        const s = mapPywalToSemantic(colors);
        
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
            
            html[dark], [dark] {
                color-scheme: dark;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input, textarea {
                color: ${s.text} !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
        `;
    }

    function getGitHubCSS(colors) {
        const s = mapPywalToSemantic(colors);
        
        return `
            :root {
                --color-canvas-default: ${s.base} !important;
                --color-canvas-subtle: ${s.mantle} !important;
                --color-canvas-overlay: ${s.mantle} !important;
                --color-canvas-inset: ${s.crust} !important;
                --color-canvas-default-transparent: ${s.base}00 !important;
                
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
                --color-border-on-emphasis: ${s.border} !important;
                
                --color-neutral-emphasis: ${s.accent} !important;
                --color-neutral-muted: ${s.surface1} !important;
                --color-neutral-subtle: ${s.surface0} !important;
                
                --color-accent-fg: ${s.accent} !important;
                --color-accent-muted: ${s.accent}66 !important;
                --color-accent-subtle: ${s.accent}1a !important;
                --color-accent-emphasis: ${s.accent} !important;
                
                --color-success-fg: #4ade80 !important;
                --color-success-muted: #4ade8040 !important;
                --color-success-subtle: #4ade801a !important;
                --color-success-emphasis: #4ade80 !important;
                
                --color-attention-fg: #eab308 !important;
                --color-attention-muted: #eab30840 !important;
                --color-attention-subtle: #eab3081a !important;
                --color-attention-emphasis: #eab308 !important;
                
                --color-severe-fg: #f97316 !important;
                --color-severe-muted: #f9731640 !important;
                --color-severe-subtle: #f973161a !important;
                --color-severe-emphasis: #f97316 !important;
                
                --color-danger-fg: #ef4444 !important;
                --color-danger-muted: #ef444440 !important;
                --color-danger-subtle: #ef44441a !important;
                --color-danger-emphasis: #ef4444 !important;
                
                --color-done-fg: #a855f7 !important;
                --color-done-muted: #a855f740 !important;
                --color-done-subtle: #a855f71a !important;
                --color-done-emphasis: #a855f7 !important;
                
                --color-sponsors-fg: #ec4899 !important;
                --color-sponsors-muted: #ec489940 !important;
                --color-sponsors-subtle: #ec48991a !important;
                --color-sponsors-emphasis: #ec4899 !important;
                
                --color-btn-text: ${s.text} !important;
                --color-btn-bg: ${s.surface0} !important;
                --color-btn-border: ${s.border} !important;
                --color-btn-shadow: ${s.crust} !important;
                --color-btn-hover-bg: ${s.surface1} !important;
                --color-btn-hover-border: ${s.border} !important;
                --color-btn-active-bg: ${s.surface2} !important;
                --color-btn-active-border: ${s.border} !important;
                --color-btn-selected-bg: ${s.surface2} !important;
                --color-btn-primary-text: ${s.crust} !important;
                --color-btn-primary-bg: ${s.accent} !important;
                --color-btn-primary-border: ${s.accent} !important;
                --color-btn-primary-shadow: ${s.crust} !important;
                --color-btn-primary-icon: ${s.crust} !important;
                --color-btn-primary-hover-bg: ${s.accentHover} !important;
                --color-btn-primary-hover-border: ${s.accentHover} !important;
                --color-btn-primary-selected-bg: ${s.accent} !important;
                --color-btn-primary-selected-shadow: ${s.crust} !important;
                --color-btn-primary-disabled-text: ${s.crust}80 !important;
                --color-btn-primary-disabled-bg: ${s.accent}80 !important;
                --color-btn-primary-disabled-border: ${s.accent}80 !important;
                --color-btn-primary-icon: ${s.crust} !important;
                --color-btn-primary-counter-bg: ${s.crust}33 !important;
                
                --color-header-text: ${s.text} !important;
                --color-header-bg: ${s.mantle} !important;
                --color-header-logo: ${s.text} !important;
                
                --color-markdown-code-bg: ${s.crust} !important;
                --color-markdown-table-border: ${s.border} !important;
                --color-markdown-table-tr-border: ${s.border} !important;
                
                --color-search-keyword-hl: ${s.accent}40 !important;
                
                --color-prettylights-syntax-comment: ${s.subtext1} !important;
                --color-prettylights-syntax-constant: ${s.accent} !important;
                --color-prettylights-syntax-entity: ${s.accent} !important;
                --color-prettylights-syntax-storage-modifier-import: ${s.text} !important;
                --color-prettylights-syntax-entity-tag: ${s.accent} !important;
                --color-prettylights-syntax-keyword: ${s.accent} !important;
                --color-prettylights-syntax-string: #4ade80 !important;
                --color-prettylights-syntax-variable: #f97316 !important;
                --color-prettylights-syntax-brackethighlighter-unmatched: #ef4444 !important;
                --color-prettylights-syntax-invalid-illegal-text: ${s.crust} !important;
                --color-prettylights-syntax-invalid-illegal-bg: #ef4444 !important;
                --color-prettylights-syntax-carriage-return-text: ${s.crust} !important;
                --color-prettylights-syntax-carriage-return-bg: #ef4444 !important;
                --color-prettylights-syntax-string-regexp: #4ade80 !important;
                --color-prettylights-syntax-markup-heading: ${s.accent} !important;
                --color-prettylights-syntax-markup-italic: ${s.text} !important;
                --color-prettylights-syntax-markup-bold: ${s.text} !important;
                --color-prettylights-syntax-markup-deleted-text: #ef4444 !important;
                --color-prettylights-syntax-markup-deleted-bg: #ef444420 !important;
                --color-prettylights-syntax-markup-inserted-text: #4ade80 !important;
                --color-prettylights-syntax-markup-inserted-bg: #4ade8020 !important;
                --color-prettylights-syntax-markup-changed-text: #f97316 !important;
                --color-prettylights-syntax-markup-changed-bg: #f9731620 !important;
                --color-prettylights-syntax-markup-ignored-text: ${s.subtext1} !important;
                --color-prettylights-syntax-markup-ignored-bg: ${s.accent}20 !important;
                --color-prettylights-syntax-meta-diff-range: ${s.accent} !important;
                --color-prettylights-syntax-brackethighlighter-angle: ${s.subtext0} !important;
                --color-prettylights-syntax-sublimelinter-gutter-mark: ${s.surface2} !important;
                --color-prettylights-syntax-constant-other-reference-link: #4ade80 !important;
            }
            
            html {
                color-scheme: ${isLight(s.base) ? 'light' : 'dark'};
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
        `;
    }

    function getRedditCSS(colors) {
        const s = mapPywalToSemantic(colors);
        
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
                --color-primary-visited: ${s.accent} !important;
                
                --color-neutral-background: ${s.base} !important;
                --color-neutral-background-hover: ${s.mantle} !important;
                --color-neutral-background-strong: ${s.surface0} !important;
                --color-neutral-background-weak: ${s.crust} !important;
                
                --color-neutral-content: ${s.text} !important;
                --color-neutral-content-weak: ${s.subtext0} !important;
                --color-neutral-content-strong: ${s.text} !important;
                --color-neutral-content-disabled: ${s.subtext1} !important;
                
                --color-neutral-border: ${s.border} !important;
                --color-neutral-border-weak: ${s.surface0} !important;
                
                --color-upvote: ${s.accent} !important;
                --color-upvote-hover: ${s.accentHover} !important;
                --color-downvote: #7c3aed !important;
                --color-downvote-hover: #6d28d9 !important;
                
                --color-positive: #4ade80 !important;
                --color-positive-hover: #22c55e !important;
                --color-negative: #ef4444 !important;
                --color-negative-hover: #dc2626 !important;
                --color-warning: #eab308 !important;
            }
            
            body {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
            
            shreddit-post, shreddit-comment {
                --color-tone-1: ${s.text} !important;
                --color-tone-2: ${s.subtext0} !important;
                --color-tone-3: ${s.subtext1} !important;
                --color-tone-7: ${s.base} !important;
                --color-tone-8: ${s.mantle} !important;
            }
        `;
    }

    function getXCSS(colors) {
        const s = mapPywalToSemantic(colors);
        
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
            [data-testid="sidebarColumn"],
            header[role="banner"],
            [data-testid="cellInnerDiv"],
            [aria-label="Trending"] > * > *,
            [aria-label="Home timeline"] > * > *,
            [aria-label="Search"] > * > *,
            .r-kemksi {
                background: transparent !important;
            }
            
            [data-testid="tweet"],
            div[role="dialog"],
            div[role="listbox"],
            div[role="radio"],
            [data-testid="Dropdown"],
            [data-testid="hoverCardParent"],
            [data-testid="DMDrawer"] > div {
                background: ${s.mantle} !important;
            }
            
            button[style*="rgb(29, 155, 240)"]:not(.css-146c3p1),
            [aria-label="Post"],
            [href="/messages/compose"],
            ::selection,
            .r-l5o3uw,
            .r-m5arl1,
            .r-hdaws3,
            .r-615f2u {
                background: ${s.accent} !important;
            }
            
            [style*="color: rgb(29, 155, 240)"],
            svg[aria-label="Verified account"],
            .r-1cvl2hr {
                color: ${s.accent} !important;
            }
            
            div[style*="text-overflow: unset; color: rgb(113, 118, 123)"] {
                color: ${s.subtext0} !important;
            }
            
            [data-testid="tweetText"],
            [data-testid="tweetText"] span {
                color: ${s.text} !important;
            }
            
            input {
                background: ${s.surface0} !important;
                color: ${s.text} !important;
            }
            
            [data-testid="placeholder"] {
                color: ${s.subtext0} !important;
            }
            
            ::selection {
                background-color: ${s.accent}4d !important;
            }
            
            input::placeholder, textarea::placeholder {
                color: ${s.subtext0} !important;
            }
        `;
    }

    function getCurrentPageCSS(colors) {
        const hostname = window.location.hostname;
        
        if (hostname.includes('youtube.com')) {
            return getYouTubeCSS(colors);
        } else if (hostname.includes('github.com')) {
            return getGitHubCSS(colors);
        } else if (hostname.includes('reddit.com')) {
            return getRedditCSS(colors);
        } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
            return getXCSS(colors);
        }
        
        return '';
    }

    function applyStyles(colors) {
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

    function fetchColors() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: SERVER_URL,
            timeout: 3000,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const currentHash = data.hash || data.colors?.[0] || '';
                        
                        if (currentHash !== lastHash && data.colors) {
                            lastHash = currentHash;
                            localStorage.setItem(STORAGE_KEY, lastHash);
                            applyStyles(data.colors);
                        }
                    } catch (e) {
                        console.error('Pywal Themer: JSON parse error', e);
                    }
                }
            },
            onerror: function() {
                console.warn('Pywal Themer: Server not reachable');
            },
            ontimeout: function() {
                console.warn('Pywal Themer: Request timeout');
            }
        });
    }

    function init() {
        fetchColors();
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