use std::{error::Error};

use chrono::{NaiveDateTime};
use serde_json::Value;

use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    chat_id: String,

    #[arg(short, long)]
    token: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    let chat_id = args.chat_id;
    let token = args.token;
    let no_update_limit_minutes = 3 * 60 + 30;
    let date = last_updated().await?;
    let now = chrono::Utc::now().naive_utc();
    let diff = (now - date).num_minutes();
    println!("Last updated: {} minutes ago", diff);
    if diff > no_update_limit_minutes {
        println!("{} diff > {} limit", diff, no_update_limit_minutes);
        send_tg_notification(format!("No updates for `{} hours` and `{} minutes` in EU shuffles: [EU activity in shuffle](https://pvpq.net/eu/activity/shuffle)", diff / 60, diff % 60).as_str(), &chat_id, &token).await?; 
    } else {
        println!("Everything is fine, not sending any notifications");
        send_tg_notification(format!("No updates for `{} hours` and `{} minutes` in EU shuffles: [EU activity in shuffle](https://pvpq.net/eu/activity/shuffle)", diff / 60, diff % 60).as_str(), &chat_id, &token).await?; 
    }
    Ok(())
}

async fn send_tg_notification(text: &str, chat_id: &str, token: &str) -> Result<(), Box<dyn Error>> {
    let textUrlEncoded = urlencoding::encode(text).to_string();
    let url = format!("https://api.telegram.org/bot{}/sendMessage?chat_id={}&parse_mode=MarkdownV2&text={}", token, chat_id, textUrlEncoded);
    let resp = reqwest::get(url).await?;
    println!("Telegram sendMessages Response status: {:?}", resp.status());
    if resp.status().is_success() {
        Ok(())
    } else {
        Err("Error sending notification".into())
    }
}

async fn last_updated() -> Result<NaiveDateTime, Box<dyn Error>> {
    let resp = reqwest::get("https://pvpq.net/api/en-gb/activity/shuffle?page=1")
        .await?
        .text()
        .await?;
    let parsed = serde_json::from_str::<Value>(&resp);
    let timestamp = parsed.unwrap()["timestamp"].as_i64().unwrap();
    let date = chrono::NaiveDateTime::from_timestamp_millis(timestamp).unwrap();
    Ok(date)
}