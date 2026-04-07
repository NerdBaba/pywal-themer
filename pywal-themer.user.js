// ==UserScript==
// @name         Pywal Themer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Theme websites with pywal colors
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

    function getCSSVariables(colors) {
        const vars = [];
        for (let i = 0; i < 16; i++) {
            vars.push(`--pywal-${i}: ${colors[i] || '#1a1a2e'};`);
        }
        return vars.join('\n');
    }

    function getYouTubeCSS(colors) {
        return `
            :root { ${getCSSVariables(colors)} }
            ytd-app, html, body {
                background: ${colors[0]} !important;
            }
            ytd-masthead#masthead, #masthead {
                background: ${colors[1]} !important;
            }
            ytd-guide-section-renderer, ytd-guide-entry-renderer {
                background: ${colors[0]} !important;
            }
            #video-title, #video-title-link, ytd-video-meta-block a {
                color: ${colors[4]} !important;
            }
            #channel-name, ytd-channel-name {
                color: ${colors[5]} !important;
            }
            ytd-thumbnail-overlay-time-status-renderer {
                background: ${colors[2]} !important;
                color: ${colors[4]} !important;
            }
            ytd-button-renderer yt-button-shape button, ytd-button-renderer a {
                background: ${colors[3]} !important;
                color: ${colors[4]} !important;
            }
            ytd-searchbox, yt-searchbox {
                background: ${colors[1]} !important;
            }
            ytd-searchbox input, yt-searchbox input {
                color: ${colors[4]} !important;
            }
            ytd-rich-item-renderer, ytd-grid-video-renderer {
                background: ${colors[7]} !important;
            }
            .ytp-chrome-bottom, .ytp-chrome-top {
                background: ${colors[1]} !important;
            }
            #comments, ytd-comments {
                color: ${colors[4]} !important;
            }
        `;
    }

    function getGitHubCSS(colors) {
        return `
            :root { ${getCSSVariables(colors)} }
            body, .app-content, .application-main {
                background: ${colors[0]} !important;
                color: ${colors[4]} !important;
            }
            header.header {
                background: ${colors[1]} !important;
                border-color: ${colors[6]} !important;
            }
            .header-nav-link, .HeaderMenu-link {
                color: ${colors[4]} !important;
            }
            .repo-list-item, .Box-row {
                background: ${colors[7]} !important;
                border-color: ${colors[6]} !important;
            }
            .repo-title a, .repo-title-link {
                color: ${colors[3]} !important;
            }
            .repo-description {
                color: ${colors[5]} !important;
            }
            .text-gray-dark, .color-fg-default {
                color: ${colors[4]} !important;
            }
            .color-fg-muted {
                color: ${colors[5]} !important;
            }
            .btn, .btn-primary {
                background: ${colors[2]} !important;
                color: ${colors[4]} !important;
                border-color: ${colors[6]} !important;
            }
            input, textarea, .form-control {
                background: ${colors[7]} !important;
                color: ${colors[4]} !important;
                border-color: ${colors[6]} !important;
            }
            .markdown-body {
                color: ${colors[4]} !important;
            }
            .markdown-body a {
                color: ${colors[3]} !important;
            }
            .highlight, pre, code {
                background: ${colors[1]} !important;
            }
            .BorderGrid, .BorderGrid--blue {
                border-color: ${colors[6]} !important;
            }
            .DiscussionCard {
                background: ${colors[7]} !important;
            }
            .TimelineItem-item {
                background: ${colors[7]} !important;
            }
        `;
    }

    function getRedditCSS(colors) {
        return `
            :root { ${getCSSVariables(colors)} }
            body, #header {
                background: ${colors[0]} !important;
                color: ${colors[4]} !important;
            }
            #header, #sr-header-area {
                background: ${colors[1]} !important;
            }
            .pagename a, .reddit-logo {
                color: ${colors[4]} !important;
            }
            .tabmenu li a {
                background: ${colors[7]} !important;
                color: ${colors[4]} !important;
            }
            .thing, .link, .post {
                background: ${colors[7]} !important;
                border-color: ${colors[6]} !important;
            }
            .title, .title a {
                color: ${colors[3]} !important;
            }
            .tagline, .tagline a {
                color: ${colors[5]} !important;
            }
            .md, .usertext {
                color: ${colors[4]} !important;
            }
            .md a {
                color: ${colors[3]} !important;
            }
            .side, .sidebox {
                background: ${colors[7]} !important;
            }
            .sidebox, .titlebox {
                background: ${colors[7]} !important;
            }
            .spacer {
                background: ${colors[0]} !important;
            }
            input, textarea {
                background: ${colors[7]} !important;
                color: ${colors[4]} !important;
                border-color: ${colors[6]} !important;
            }
            button, .btn {
                background: ${colors[2]} !important;
                color: ${colors[4]} !important;
            }
            /* Reddit Modern (sh.reddit.com) */
            shreddit-post, shreddit-comment {
                --color-tone-1: ${colors[4]} !important;
                --color-tone-2: ${colors[5]} !important;
                --color-tone-7: ${colors[0]} !important;
                --color-tone-8: ${colors[7]} !important;
            }
        `;
    }

    function getXCSS(colors) {
        return `
            :root { ${getCSSVariables(colors)} }
            body {
                background: ${colors[0]} !important;
                color: ${colors[4]} !important;
            }
            [data-testid="cellInnerDiv"] {
                background: ${colors[0]} !important;
            }
            header[role="banner"] {
                background: ${colors[1]} !important;
                border-color: ${colors[6]} !important;
            }
            [data-testid="primaryColumn"] {
                background: ${colors[0]} !important;
            }
            [data-testid="sidebarColumn"] {
                background: ${colors[7]} !important;
            }
            [data-testid="tweet"] {
                background: ${colors[7]} !important;
                border-color: ${colors[6]} !important;
            }
            [data-testid="tweetText"], [data-testid="tweetText"] span {
                color: ${colors[4]} !important;
            }
            [data-testid="cellInnerDiv"] [data-testid="tweet"] div[role="group"] + div span,
            [data-testid="tweet"] time {
                color: ${colors[5]} !important;
            }
            a {
                color: ${colors[3]} !important;
            }
            input {
                background: ${colors[7]} !important;
                color: ${colors[4]} !important;
            }
            [data-testid="placeholder"] {
                color: ${colors[5]} !important;
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