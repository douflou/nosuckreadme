// Main entry point for my-rust-cli
// TODO: add proper error handling

use clap::Parser;

#[derive(Parser)]
struct Args {
    /// Input file
    #[arg(short, long)]
    input: String,
}

fn main() {
    let args = Args::parse();
    println!("Processing: {}", args.input);
}
