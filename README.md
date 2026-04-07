# pywal-themer

Syncs pywal colors to websites via a local HTTP server + Tampermonkey userscript.

## Components

1. **pywal-cache-server** - Rust server that reads `~/.cache/wal/colors` and serves JSON at `localhost:7890/colors`
2. **pywal-themer.user.js** - Tampermonkey userscript that polls for colors and applies them to websites

## Build & Run

```bash
cd pywal-themer
cargo build --release
./target/release/pywal-cache-server
```

## Userscript

Install `pywal-themer.user.js` in Tampermonkey. It themes YouTube, GitHub, and X (x.com/twitter.com).

## Requirements

- pywal running (generates colors in `~/.cache/wal/colors`)
