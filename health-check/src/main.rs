use std::error::Error;

use chrono::NaiveDateTime;
use clap::Parser;
use serde_json::Value;

use region::region_name;

mod region;

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
    let regions = vec!["en-gb", "en-us"];
    let brackets = vec!["shuffle"];
    let mut combinations: Vec<(&str, &str)> = vec![];
    for region in regions.iter() {
        for bracket in brackets.iter() {
            combinations.push((region, bracket));
        }
    }
    println!("Combinations: {:?}", combinations);
    for (region, bracket) in combinations.iter() {
        let date = last_updated(region, bracket).await?;
        let now = chrono::Utc::now().naive_utc();
        let diff = (now - date).num_minutes();
        println!("Last updated: {} minutes ago", diff);
        if diff > no_update_limit_minutes {
            println!("{} diff > {} limit", diff, no_update_limit_minutes);
            let region_name = region_name(region);
            send_tg_notification(format!("No updates for `{} hours` and `{} minutes` in {} {} on pvpq\\.net: [{} activity in {}](https://pvpq.net/{}/activity/{})",
                                         diff / 60, diff % 60, region_name, bracket, region_name, bracket, region, bracket).as_str(), &chat_id, &token).await?;
        } else {
            println!("Everything is fine, not sending any notifications");
        }
    }
    Ok(())
}

async fn send_tg_notification(
    text: &str,
    chat_id: &str,
    token: &str,
) -> Result<(), Box<dyn Error>> {
    let text_url_encoded = urlencoding::encode(text).to_string();
    let url = format!(
        "https://api.telegram.org/bot{}/sendMessage?chat_id={}&parse_mode=MarkdownV2&text={}",
        token, chat_id, text_url_encoded
    );
    let resp = reqwest::get(url).await?;
    println!("Telegram sendMessages Response status: {:?}", resp.status());
    if resp.status().is_success() {
        Ok(())
    } else {
        println!("Error sending notification {:?}", resp.text().await?);
        Err("Error sending notification".into())
    }
}

async fn last_updated(region: &str, bracket: &str) -> Result<NaiveDateTime, Box<dyn Error>> {
    let url = format!(
        "https://pvpq.net/api/{}/activity/{}?page=1",
        region, bracket
    );
    let resp = reqwest::get(url).await?.text().await?;

    // Debug: print the response to see what we're getting
    println!("Response from {}: {}", url, resp);

    let parsed = serde_json::from_str::<Value>(&resp)?;
    let timestamp = parsed["timestamp"]
        .as_i64()
        .ok_or("timestamp field not found or not an integer")?;
    let date =
        chrono::NaiveDateTime::from_timestamp_millis(timestamp).ok_or("invalid timestamp")?;
    Ok(date)
}
