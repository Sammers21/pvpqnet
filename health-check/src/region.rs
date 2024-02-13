pub(crate) fn region_name(region: &str) -> String {
    match region {
        "en-gb" => "EU",
        "en-us" => "US",
        _ => "Unknown",
    }.to_string()
}
