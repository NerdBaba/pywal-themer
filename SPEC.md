# Pywal Themer - Design Specification

## Project Overview
- **Project name:** pywal-themer
- **Type:** System utility (local HTTP server + userscript)
- **Core functionality:** Syncs pywal colors to websites via a lightweight HTTP server + Tampermonkey userscript
- **Target users:** Linux/macOS users with pywal/pywalfox running

## Architecture

### Components
1. **pywal-cache-server** - Rust HTTP server that reads pywal cache and serves JSON
2. **pywal-themer.user.js** - Tampermonkey userscript that fetches colors and applies them

### Data Flow
```
pywal (daemon) → writes to ~/.cache/wal/colors → server reads → serves JSON → userscript polls → applies CSS to sites
```

## Server Specification

### Technology
- **Language:** Rust (minimal, performant, ~1MB binary)
- **Server:** Hyper (async, fast)

### Functionality
- Reads pywal color file from `~/.cache/wal/colors`
- Serves `/colors` endpoint returning JSON
- Polls file for changes (or uses notify crate)
- Runs on `localhost:7890`

### Endpoints
- `GET /colors` - Returns current colors as JSON

### JSON Response Format
```json
{
  "colors": ["#1a1a2e", "#16213e", ...],
  "wallpaper": "/path/to/wallpaper",
  "colorschemes": { "dark": {...}, "light": {...} }
}
```

## Userscript Specification

### Metadata
```javascript
// @name         Pywal Themer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Theme websites with pywal colors
// @match        https://*.youtube.com/*
// @match        https://*.github.com/*
// @match        https://*.reddit.com/*
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-end
```

### Functionality
1. Poll `localhost:7890/colors` every 5 seconds
2. When colors change, inject CSS
3. Store last hash to detect changes

### CSS Variables
```css
:root {
  --pywal-0: #1a1a2e;  /* background */
  --pywal-1: #16213e;  /* background alt */
  --pywal-2: #0f3460;  /* accent */
  --pywal-3: #e94560;  /* highlight */
  --pywal-4: #f5f5f5;  /* text */
  --pywal-5: #aaaaaa;  /* text secondary */
  --pywal-6: #333333;  /* borders */
  --pywal-7: #222222;  /* card bg */
  --pywal-8: #444444;  /* hover */
  --pywal-9: #555555;  /* button */
}
```

### YouTube Theming
- Background: `ytd-app`, `ytd-page-manager`
- Nav: `ytd-masthead#masthead`
- Sidebar: `ytd-guide-section-renderer`
- Text: `#video-title`, `#channel-name`
- Search: `yt-searchbox`

### GitHub Theming
- Background: `.app-content`, `body`
- Header: `header.header`
- Cards: `.repo-list-item`, `.Box-row`
- Text: `.text-gray-dark`, `.color-fg-default`
- Buttons: `.btn`, `.btn-primary`

### Reddit Theming
- Background: `body`, `#header`
- Posts: `.shreddit-post`, `[data-testid="post-card"]`
- Text: `.md`, `.tagline`
- Sidebar: `.side`

### X.com Theming
- Background: `body`, `[data-testid="cellInnerDiv"]`
- Header: `header[role="banner"]`
- Tweets: `[data-testid="tweet"]`
- Text: use `data-testid` selectors

## Acceptance Criteria
1. Server starts in <100ms, uses <5MB RAM
2. Userscript loads on all 4 sites
3. Colors update within 5 seconds of pywal change
4. No memory leaks in userscript (cleanup on navigation)
5. Graceful handling when server is down