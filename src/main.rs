use std::path::PathBuf;
use std::sync::Arc;

use hyper::body::Incoming;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

#[derive(Clone, Serialize, Deserialize)]
pub struct PywalColors {
    pub colors: Vec<String>,
    pub wallpaper: Option<String>,
    pub hash: String,
}

impl Default for PywalColors {
    fn default() -> Self {
        Self {
            colors: vec!["#1a1a2e".to_string(); 16],
            wallpaper: None,
            hash: String::new(),
        }
    }
}

fn get_cache_path() -> PathBuf {
    dirs::home_dir()
        .map(|p| p.join(".cache").join("wal").join("colors"))
        .unwrap_or_else(|| PathBuf::from("/tmp/wal/colors"))
}

fn parse_pywal_colors(content: &str) -> PywalColors {
    let lines: Vec<&str> = content.lines().collect();
    let mut colors: Vec<String> = Vec::new();

    // Pywal format: first line is hash (#hash), then 16 hex colors
    // Sometimes hash is omitted
    let mut hash = String::new();
    let mut start_idx = 0;
    
    // Check if first line looks like a hash (#hash...)
    if let Some(first) = lines.first() {
        if first.trim().starts_with('#') && first.len() > 7 {
            // Looks like hash followed by colors on same line or next lines
            if first.len() > 8 {
                // Hash is on its own line like "#abc123"
                hash = first.trim().to_string();
                start_idx = 1;
            }
        }
    }

    for line in lines.iter().skip(start_idx).take(16) {
        let trimmed = line.trim();
        if trimmed.starts_with('#') && trimmed.len() >= 7 {
            colors.push(trimmed[..7].to_string());
        }
    }

    while colors.len() < 16 {
        colors.push("#1a1a2e".to_string());
    }

    // Try to find wallpaper (path starts with /)
    let wallpaper = lines
        .iter()
        .find(|l| l.trim().starts_with('/'))
        .map(|s| s.trim().to_string());

    // If no hash found, use first color as hash
    if hash.is_empty() && !colors.is_empty() {
        hash = colors[0].clone();
    }

    PywalColors {
        colors,
        wallpaper,
        hash,
    }
}

async fn load_colors(path: &PathBuf) -> PywalColors {
    match std::fs::read_to_string(path) {
        Ok(content) => parse_pywal_colors(&content),
        Err(_) => PywalColors::default(),
    }
}

async fn colors_handler(state: Arc<Mutex<PywalColors>>) -> Result<Response<String>, hyper::Error> {
    let colors = state.lock().await;
    let json = serde_json::to_string(&*colors).unwrap_or_default();
    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "no-cache")
        .body(json)
        .unwrap())
}

async fn handle(req: Request<Incoming>, state: Arc<Mutex<PywalColors>>) -> Result<Response<String>, hyper::Error> {
    let path = req.uri().path();
    
    match path {
        "/colors" | "/colors/" => colors_handler(state).await,
        "/health" => Ok(Response::new("ok".to_string())),
        _ => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body("Not found".to_string())
            .unwrap()),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    log::info!("Pywal Cache Server starting...");

    let cache_path = get_cache_path();
    log::info!("Watching: {:?}", cache_path);

    let colors = load_colors(&cache_path).await;
    let colors = Arc::new(Mutex::new(colors));

    let colors_clone = Arc::clone(&colors);
    let cache_path_clone = cache_path.clone();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                if event.kind.is_modify() {
                    let path = cache_path_clone.clone();
                    let colors = Arc::clone(&colors_clone);
                    tokio::spawn(async move {
                        let new_colors = load_colors(&path).await;
                        let mut c = colors.lock().await;
                        *c = new_colors;
                        log::info!("Colors updated");
                    });
                }
            }
        },
        Config::default(),
    )?;

    watcher.watch(&cache_path, RecursiveMode::NonRecursive)?;

    let addr = "127.0.0.1:7890";
    let listener = tokio::net::TcpListener::bind(addr).await?;
    log::info!("Server running at http://{}", addr);

    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let state = Arc::clone(&colors);

        tokio::task::spawn(async move {
            let service = service_fn(move |req| handle(req, Arc::clone(&state)));
            if let Err(e) = http1::Builder::new().serve_connection(io, service).await {
                log::warn!("Connection error: {}", e);
            }
        });
    }
}