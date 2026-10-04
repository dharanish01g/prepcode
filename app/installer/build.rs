//! Takes the update endpoint and signing key from the app's tauri.conf.json,
//! so the installer trusts exactly what the in-app updater trusts.

use std::path::Path;

fn main() {
    let conf_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../src-tauri/tauri.conf.json");
    println!("cargo:rerun-if-changed={}", conf_path.display());
    let conf: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&conf_path).expect("read tauri.conf.json"))
            .expect("parse tauri.conf.json");
    let updater = &conf["plugins"]["updater"];
    let endpoint = updater["endpoints"][0].as_str().expect("plugins.updater.endpoints[0]");
    let pubkey = updater["pubkey"].as_str().expect("plugins.updater.pubkey");
    println!("cargo:rustc-env=PREPCODE_UPDATE_ENDPOINT={endpoint}");
    println!("cargo:rustc-env=PREPCODE_UPDATE_PUBKEY={pubkey}");

    // The icon, and a manifest for modern controls (the progress dialog) that
    // also says no admin rights are needed: Windows would otherwise guess a
    // file named "setup" needs them.
    println!("cargo:rerun-if-changed=installer.rc");
    println!("cargo:rerun-if-changed=installer.manifest");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        if cfg!(windows) {
            embed_resource::compile("installer.rc", embed_resource::NONE).manifest_required().unwrap();
        } else {
            // Checking the Windows build from another OS: no resource compiler here.
            println!("cargo:warning=Skipping the icon and manifest: build on Windows to include them.");
        }
    }
}
