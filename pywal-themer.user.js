// ==UserScript==
// @name         Pywal Themer
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Theme websites with pywal colors - smart semantic mapping
// @author       pywal-themer
// @match        https://*.youtube.com/*
// @match        https://github.com/*
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
                --yt-spec-menu-background: ${s.base} !important;
                --yt-spec-inverted-background: ${s.text} !important;
                --yt-spec-additive-background: ${s.base} !important;
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
                --yt-spec-brand-background-secondary: ${s.base} !important;
                --yt-spec-general-background-a: ${s.base} !important;
                --yt-spec-general-background-b: ${s.base} !important;
                --yt-spec-general-background-c: ${s.base} !important;
                --yt-spec-error-background: ${s.base} !important;
                --yt-spec-10-percent-layer: ${s.surface0} !important;
                --yt-spec-snackbar-background: ${s.base} !important;
                --yt-spec-snackbar-background-updated: ${s.base} !important;
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
                background: ${s.base} !important;
            }

            ytd-mini-guide-renderer,
            ytd-guide-renderer,
            tp-yt-app-drawer,
            #guide-content {
                background: ${s.base} !important;
                color: ${s.text} !important;
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
                background: ${s.surface1} !important;
                color: ${s.text} !important;
                border: 1px solid ${s.border} !important;
                box-shadow: none !important;
            }

            ytd-button-renderer yt-button-shape button:hover {
                background: ${s.surface0} !important;
            }
            
            ytd-searchbox {
                background: ${s.base} !important;
                border: 1px solid ${s.border} !important;
                box-shadow: none !important;
            }
            
            ytd-searchbox input {
                color: ${s.text} !important;
                background: transparent !important;
            }

            /* Topbar icon buttons (mic/create/notifications) - keep flat like sidebar */
            #voice-search-button button,
            ytd-topbar-menu-button-renderer tp-yt-paper-icon-button,
            ytd-notification-topbar-button-renderer tp-yt-paper-icon-button,
            ytd-masthead yt-icon-button,
            tp-yt-paper-icon-button,
            yt-icon-button {
                background: transparent !important;
                box-shadow: none !important;
                color: ${s.text} !important;
                fill: ${s.text} !important;
            }

            /* + Create button (signed-in) */
            ytd-masthead #create-button,
            ytd-masthead #create-button button,
            ytd-masthead #create-button a,
            ytd-masthead ytd-button-renderer#button,
            ytd-masthead ytd-button-renderer button,
            ytd-masthead yt-button-shape button {
                background: transparent !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            ytd-masthead #create-button:hover,
            ytd-masthead #create-button button:hover,
            ytd-masthead #create-button a:hover,
            ytd-masthead ytd-button-renderer#button:hover,
            ytd-masthead ytd-button-renderer button:hover,
            ytd-masthead yt-button-shape button:hover {
                background: ${s.surface1} !important;
            }

            #voice-search-button button:hover,
            ytd-topbar-menu-button-renderer tp-yt-paper-icon-button:hover,
            ytd-notification-topbar-button-renderer tp-yt-paper-icon-button:hover,
            ytd-masthead yt-icon-button:hover,
            tp-yt-paper-icon-button:hover,
            yt-icon-button:hover {
                background: ${s.surface1} !important;
            }
            
            ytd-rich-item-renderer,
            ytd-rich-grid-media,
            ytd-video-renderer,
            ytd-compact-video-renderer,
            ytd-grid-video-renderer,
            ytd-rich-section-renderer {
                background: ${s.base} !important;
                box-shadow: none !important;
                border: 0 !important;
            }

            ytd-rich-grid-renderer,
            #contents.ytd-rich-grid-renderer {
                background: ${s.base} !important;
            }

            /* Watch page: action buttons (like/share/save/etc) */
            #top-level-buttons-computed yt-button-shape button,
            ytd-menu-renderer yt-button-shape button,
            ytd-segmented-like-dislike-button-renderer yt-button-shape button {
                background: ${s.surface1} !important;
                color: ${s.text} !important;
                border: 1px solid ${s.border} !important;
                box-shadow: none !important;
            }

            #top-level-buttons-computed yt-button-shape button:hover,
            ytd-menu-renderer yt-button-shape button:hover,
            ytd-segmented-like-dislike-button-renderer yt-button-shape button:hover {
                background: ${s.surface0} !important;
            }

            /* Category chips row */
            yt-chip-cloud-chip-renderer,
            yt-chip-cloud-chip-renderer yt-chip-cloud-chip-renderer,
            yt-chip-cloud-chip-renderer #chip-container,
            yt-chip-cloud-chip-renderer tp-yt-paper-button {
                background: ${s.surface1} !important;
                color: ${s.text} !important;
                border: 1px solid ${s.border} !important;
                box-shadow: none !important;
            }

            yt-chip-cloud-chip-renderer[chip-style="STYLE_DEFAULT"] {
                background: ${s.surface1} !important;
            }

            yt-chip-cloud-chip-renderer[aria-selected="true"],
            yt-chip-cloud-chip-renderer[selected] {
                background: ${s.surface0} !important;
            }
        `;
    }

    function getGitHubCSS(s) {
        return `
            :root {
                --color-canvas-default: ${s.base} !important;
                --color-canvas-subtle: ${s.base} !important;
                --color-canvas-overlay: ${s.base} !important;
                --color-canvas-inset: ${s.base} !important;
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
                --color-neutral-emphasis: ${s.surface2} !important;
                --color-neutral-muted: ${s.surface1} !important;
                --color-neutral-subtle: ${s.surface1} !important;
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
                --color-btn-bg: ${s.base} !important;
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
                --color-header-bg: ${s.base} !important;
                --color-header-logo: ${s.text} !important;
                --color-markdown-code-bg: ${s.crust} !important;
                --color-markdown-table-border: ${s.border} !important;

                /* New Primer tokens used on github.com/home and new nav */
                --bgColor-default: ${s.base} !important;
                --bgColor-muted: ${s.base} !important;
                --bgColor-inset: ${s.base} !important;
                --bgColor-emphasis: ${s.base} !important;
                --fgColor-default: ${s.text} !important;
                --fgColor-muted: ${s.subtext0} !important;
                --fgColor-onEmphasis: ${s.text} !important;
                --borderColor-default: ${s.border} !important;
                --borderColor-muted: ${s.border} !important;
                --button-default-bgColor-rest: ${s.base} !important;
                --button-default-fgColor-rest: ${s.text} !important;
                --button-default-borderColor-rest: ${s.border} !important;
                --button-default-bgColor-hover: ${s.surface1} !important;
                --button-primary-bgColor-rest: ${s.accent} !important;
                --button-primary-fgColor-rest: ${s.crust} !important;
                --button-primary-bgColor-hover: ${s.accentHover} !important;
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

            main, .application-main, .Layout, .Layout-main, .Layout-sidebar {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }
            
            header.header,
            header.Header,
            header.AppHeader,
            .AppHeader,
            [data-testid="navbar"] {
                background: ${s.base} !important;
                border-color: ${s.border} !important;
                color: ${s.text} !important;
            }
            
            .header-nav-link {
                color: ${s.text} !important;
            }
            
            .repo-list-item, .Box-row {
                background: ${s.base} !important;
                border-color: ${s.border} !important;
            }
            
            a, a:visited { color: ${s.text} !important; }
            a:hover { color: ${s.accent} !important; }
            .repo-title a { color: ${s.text} !important; }
            
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

            .btn, .Button, button, [role="button"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            .btn:hover, .Button:hover, button:hover, [role="button"]:hover {
                background: ${s.surface1} !important;
            }

            /* Left sidebar / overlays (mobile nav drawer, menus, popovers) */
            dialog,
            .Overlay,
            .Overlay-body,
            .Overlay-header,
            .Overlay-footer,
            .Overlay-backdrop,
            .Popover,
            .Popover-message,
            .SelectMenu,
            .SelectMenu-modal,
            .SelectMenu-list,
            .ActionList,
            .ActionListWrap,
            .ActionListContent,
            .ActionListItem,
            .ActionList-item {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            .ActionListItem:hover,
            .ActionList-item:hover {
                background: ${s.surface1} !important;
            }

            /* New "prc-" dialog/sidebar components */
            [class*="prc-Dialog-Dialog"],
            [class*="prc-Dialog-DialogOverflowWrapper"],
            [class*="prc-ScrollableRegion-ScrollableRegion"],
            [class*="prc-Stack-Stack"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            [class*="prc-ActionList-ActionList"],
            [class*="prc-ActionList-ActionListItem"],
            [class*="prc-ActionList-ActionListContent"],
            [class*="prc-ActionList-GroupHeading"],
            [class*="prc-ActionList-ItemLabel"],
            [class*="prc-NavList-GroupHeading"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }

            [class*="prc-ActionList-ActionListItem"][data-active="true"],
            [class*="prc-ActionList-ActionListItem"][aria-current="page"] {
                background: ${s.surface1} !important;
            }

            [class*="prc-ActionList-ActionListItem"]:hover,
            [class*="prc-ActionList-ActionListContent"]:hover {
                background: ${s.surface1} !important;
            }

            [class*="prc-Link-Link"] {
                color: ${s.text} !important;
            }

            [class*="prc-Link-Link"]:hover {
                color: ${s.accent} !important;
            }

            [data-component="IconButton"] {
                background: transparent !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            [data-component="IconButton"]:hover {
                background: ${s.surface1} !important;
            }
            
            input, textarea {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }

            /* Home/Dashboard cards + sidebars (best-effort) */
            .Box,
            .Box-header,
            .Box-row,
            .dashboard-sidebar,
            .dashboard-main-content,
            .feed-item-content,
            [data-testid="dashboard-feed"],
            [data-testid="dashboard"] {
                background: ${s.base} !important;
                border-color: ${s.border} !important;
                color: ${s.text} !important;
            }

            nav,
            .UnderlineNav,
            .UnderlineNav-body,
            .UnderlineNav-item,
            .TabNav,
            .tabnav {
                background: ${s.base} !important;
                border-color: ${s.border} !important;
                color: ${s.text} !important;
            }

            .UnderlineNav-item.selected,
            .UnderlineNav-item[aria-current="page"] {
                color: ${s.text} !important;
                border-bottom-color: ${s.accent} !important;
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
            [data-testid="sidebarColumn"],
            header[role="banner"],
            div[role="navigation"],
            [data-testid="cellInnerDiv"] {
                background: ${s.base} !important;
            }

            /* Top "For you / Following" tabs */
            a[role="tab"],
            div[role="tablist"] {
                background: ${s.base} !important;
                color: ${s.subtext0} !important;
                border-color: ${s.border} !important;
            }

            a[role="tab"][aria-selected="true"] {
                color: ${s.text} !important;
            }

            a[role="tab"][aria-selected="true"] > div > div {
                border-bottom-color: ${s.accent} !important;
            }
            
            [data-testid="tweet"],
            article {
                background: ${s.base} !important;
                border-color: ${s.border} !important;
            }

            /* Composer / typing area */
            [data-testid="tweetTextarea_0"],
            [data-testid="tweetTextarea_0"] div[role="textbox"],
            div[role="textbox"][data-testid^="tweetTextarea_"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
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
            
            input,
            textarea {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }

            [data-testid="placeholder"] {
                color: ${s.subtext0} !important;
            }

            /* Search box */
            form[role="search"],
            [data-testid="SearchBox_Search_Input"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }

            [data-testid="SearchBox_Search_Input"] {
                border: 1px solid ${s.border} !important;
            }

            [data-testid="SearchBox_Search_Input"]::placeholder {
                color: ${s.subtext0} !important;
            }

            form[role="search"] svg,
            [data-testid="SearchBox_Search_Input"] ~ div svg,
            [data-testid="SearchBox_Search_Input"] + div svg,
            form[role="search"] [aria-hidden="true"] svg,
            form[role="search"] svg[viewBox="0 0 24 24"] {
                color: ${s.subtext0} !important;
                fill: ${s.subtext0} !important;
            }

            form[role="search"] svg path {
                fill: currentColor !important;
            }

            form[role="search"] svg * {
                fill: currentColor !important;
                stroke: currentColor !important;
            }

            /* Right-side widget cards (Premium/News/Trends/Who to follow) */
            [data-testid="sidebarColumn"] section,
            [data-testid="sidebarColumn"] aside,
            [data-testid="sidebarColumn"] [style*="background-color: rgb(0, 0, 0)"],
            [data-testid="sidebarColumn"] [style*="background-color: rgba(0, 0, 0"],
            [aria-label="Timeline: Trending now"],
            [aria-label="Timeline: Who to follow"],
            [aria-label="Timeline: Subscribe to Premium"],
            [aria-label="Timeline: Today’s News"],
            [aria-label="Timeline: Today's News"],
            [aria-label="Timeline: What’s happening"],
            [aria-label="Timeline: What's happening"] {
                background-color: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }

            /* Force any nested AMOLED-black containers inside columns back to theme base */
            [data-testid="primaryColumn"] [style*="background-color: rgb(0, 0, 0)"],
            [data-testid="primaryColumn"] [style*="background-color: rgba(0, 0, 0"],
            [data-testid="sidebarColumn"] [style*="background-color: rgb(0, 0, 0)"],
            [data-testid="sidebarColumn"] [style*="background-color: rgba(0, 0, 0"],
            [data-testid="news_sidebar"],
            [data-testid="news_sidebar"] [style*="background-color: rgb(0, 0, 0)"],
            [data-testid="news_sidebar"] [style*="background-color: rgba(0, 0, 0"] {
                background-color: ${s.base} !important;
                border-color: ${s.border} !important;
            }

            [data-testid="news_sidebar"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
            }

            [data-testid="news_sidebar"] [role="link"],
            [data-testid="news_sidebar"] [role="link"] > div,
            [data-testid^="news_sidebar_article_"],
            [data-testid^="news_sidebar_article_"] > div {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
            }

            [data-testid="news_sidebar"] .r-kemksi {
                background-color: ${s.base} !important;
            }

            /* X uses class-based black layers in multiple places */
            [data-testid="primaryColumn"] .r-kemksi,
            [data-testid="sidebarColumn"] .r-kemksi,
            [data-testid="primaryColumn"] .r-oszu61,
            [data-testid="sidebarColumn"] .r-oszu61 {
                background-color: ${s.base} !important;
            }

            /* Sidebar cards (Premium etc) sometimes render as role="region" blocks */
            [data-testid="sidebarColumn"] section,
            [data-testid="sidebarColumn"] section[role="region"],
            [data-testid="sidebarColumn"] div[role="region"] {
                background: ${s.base} !important;
                color: ${s.text} !important;
                border-color: ${s.border} !important;
                box-shadow: none !important;
            }

            /* ScrollSnap overlay arrow buttons (inline bg) */
            [data-testid^="ScrollSnap-"] button[style*="background-color: rgba(15, 20, 25"],
            [data-testid^="ScrollSnap-"] button[style*="background-color: rgb(15, 20, 25"] {
                background-color: ${s.base} !important;
                border-color: ${s.border} !important;
            }

            a[role="link"][href],
            a[href] {
                color: ${s.text} !important;
            }

            a[role="link"][href]:hover,
            a[href]:hover {
                color: ${s.accent} !important;
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
            const parent = document.head || document.documentElement;
            if (parent) parent.appendChild(styleElement);
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
                    
                    // Always apply at least once per page load; otherwise a reload can get stuck
                    // with default styles when the hash is unchanged.
                    if (currentHash !== lastHash || !styleElement) {
                        lastHash = currentHash;
                        try {
                            localStorage.setItem(STORAGE_KEY, lastHash);
                        } catch(e) {}
                    }
                    applyStyles(currentColors);
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
