use vybekiit_dedup::detect;
use vybekiit_dedup::index;
use vybekiit_dedup::output;

use clap::Parser;
use std::path::PathBuf;
use std::process;

/// Deduplication gate for VybeKiit — detects duplicate exports before they land.
#[derive(Parser, Debug)]
#[command(name = "vybekiit-dedup", version, about)]
struct Cli {
    /// Natural language description of what's being created (for name/keyword matching)
    #[arg(long)]
    intent: Option<String>,

    /// File path being created/modified (for structural + path matching)
    #[arg(long)]
    target: Option<PathBuf>,

    /// Directory to scan against (default: current workspace member from cwd)
    #[arg(long)]
    scope: Option<PathBuf>,

    /// Max results to return (default: 3)
    #[arg(long, default_value_t = 3)]
    limit: usize,

    /// Pagination offset
    #[arg(long, default_value_t = 0)]
    offset: usize,

    /// Rebuild the index
    #[arg(long)]
    index: bool,

    /// Machine-readable JSON output (default when non-TTY)
    #[arg(long)]
    json: bool,
}

fn main() {
    let cli = Cli::parse();

    // Determine scope — default to cwd
    let scope = cli.scope.unwrap_or_else(|| {
        std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
    });

    // Index-only mode
    if cli.index {
        match index::rebuild_index(&scope) {
            Ok(count) => {
                let result = output::IndexResult { indexed: count };
                output::print_result(&serde_json::to_value(&result).unwrap(), cli.json);
                process::exit(0);
            }
            Err(e) => {
                eprintln!("error: failed to rebuild index: {e}");
                process::exit(1);
            }
        }
    }

    // Must have --intent or --target
    if cli.intent.is_none() && cli.target.is_none() {
        eprintln!("error: provide --intent or --target (or both)");
        process::exit(1);
    }

    // Ensure index is fresh
    let idx = match index::load_or_rebuild(&scope) {
        Ok(idx) => idx,
        Err(e) => {
            eprintln!("error: failed to load index: {e}");
            process::exit(1);
        }
    };

    // Run detection
    let matches = detect::run(
        &idx,
        cli.intent.as_deref(),
        cli.target.as_deref(),
        &scope,
    );

    // Apply pagination
    let total = matches.len();
    let page: Vec<_> = matches.into_iter().skip(cli.offset).take(cli.limit).collect();

    // Output
    let result = if page.is_empty() {
        output::DedupResult::Clear {
            checked: idx.exports.len(),
        }
    } else {
        output::DedupResult::Blocked {
            total,
            showing: page.len(),
            matches: page,
        }
    };

    let exit_code = match &result {
        output::DedupResult::Clear { .. } => 0,
        output::DedupResult::Blocked { .. } => 1,
    };

    output::print_result(
        &serde_json::to_value(&result).unwrap(),
        cli.json || !atty::is(atty::Stream::Stdout),
    );
    process::exit(exit_code);
}
