//! Finds, downloads and verifies the latest prepcode installer, the same way
//! the in-app updater does (same latest.json, same signing key).

use std::io::Read;

use minisign_verify::{PublicKey, Signature};
use serde::Deserialize;

const ENDPOINT: &str = env!("PREPCODE_UPDATE_ENDPOINT");
const PUBKEY: &str = env!("PREPCODE_UPDATE_PUBKEY");

/// The per-user NSIS installer: it installs without admin rights.
const PLATFORM: &str = "windows-x86_64-nsis";

const OFFLINE: &str = "Couldn't reach GitHub. Check your internet connection and try again.";

#[derive(Deserialize)]
struct LatestJson {
    version: String,
    platforms: std::collections::HashMap<String, Platform>,
}

#[derive(Deserialize)]
struct Platform {
    url: String,
    signature: String,
}

pub struct Release {
    pub version: String,
    url: String,
    signature: String,
}

impl Release {
    /// What to call the downloaded installer, e.g. prepcode_0.0.13_x64-setup.exe.
    pub fn file_name(&self) -> String {
        self.url.rsplit('/').next().unwrap_or("prepcode-setup.exe").to_string()
    }
}

pub fn agent() -> ureq::Agent {
    use ureq::tls::{TlsConfig, TlsProvider};
    ureq::Agent::config_builder()
        .tls_config(TlsConfig::builder().provider(TlsProvider::NativeTls).build())
        .build()
        .into()
}

/// The newest published release.
pub fn latest(agent: &ureq::Agent) -> Result<Release, String> {
    let json: LatestJson = agent
        .get(ENDPOINT)
        .call()
        .map_err(|_| OFFLINE.to_string())?
        .body_mut()
        .read_json()
        .map_err(|e| format!("The release information couldn't be read: {e}"))?;
    let platform = json
        .platforms
        .get(PLATFORM)
        .ok_or("The latest release has no Windows installer yet. Try again later.")?;
    Ok(Release { version: json.version, url: platform.url.clone(), signature: platform.signature.clone() })
}

/// Downloads the installer. `progress(done, total)` returns false to cancel;
/// `total` is 0 when the size is unknown.
pub fn download(
    agent: &ureq::Agent,
    release: &Release,
    mut progress: impl FnMut(u64, u64) -> bool,
) -> Result<Vec<u8>, String> {
    let mut response = agent.get(&release.url).call().map_err(|_| OFFLINE.to_string())?;
    let total = response.body().content_length().unwrap_or(0);
    let mut reader = response.body_mut().as_reader();
    let mut data = Vec::with_capacity(total as usize);
    let mut chunk = [0u8; 64 * 1024];
    loop {
        let n = reader.read(&mut chunk).map_err(|_| OFFLINE.to_string())?;
        if n == 0 {
            break;
        }
        data.extend_from_slice(&chunk[..n]);
        if !progress(data.len() as u64, total) {
            return Err("Cancelled.".into());
        }
    }
    Ok(data)
}

/// Checks the download was signed with prepcode's release key, for the version
/// latest.json announced (which itself isn't signed).
pub fn verify(data: &[u8], release: &Release) -> Result<(), String> {
    const TAMPERED: &str = "The download didn't pass prepcode's security check, so it wasn't installed.";
    let key = PublicKey::decode(&decode_base64(PUBKEY).ok_or(TAMPERED)?).map_err(|_| TAMPERED)?;
    let signature =
        Signature::decode(&decode_base64(&release.signature).ok_or(TAMPERED)?).map_err(|_| TAMPERED)?;
    key.verify(data, &signature, true).map_err(|_| TAMPERED)?;
    // Only trusted now that the signature (which covers it) checked out.
    let signed_version = signature
        .trusted_comment()
        .split('\t')
        .find_map(|field| field.strip_prefix("version:"))
        .ok_or(TAMPERED)?;
    let same = match (
        semver::Version::parse(signed_version.trim_start_matches('v')),
        semver::Version::parse(release.version.trim_start_matches('v')),
    ) {
        (Ok(signed), Ok(announced)) => signed == announced,
        _ => signed_version == release.version,
    };
    if same {
        Ok(())
    } else {
        Err(TAMPERED.into())
    }
}

/// Tauri base64-encodes minisign's text formats.
fn decode_base64(input: &str) -> Option<String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD.decode(input.trim()).ok()?;
    String::from_utf8(bytes).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Real network check against the published release. Run with:
    /// cargo test -- --ignored
    #[test]
    #[ignore]
    fn latest_release_downloads_and_verifies() {
        let agent = agent();
        let release = latest(&agent).expect("latest.json");
        let mut data = download(&agent, &release, |_, _| true).expect("download");
        verify(&data, &release).expect("signature");
        data[0] ^= 1;
        assert!(verify(&data, &release).is_err(), "a changed file must fail");
    }
}
