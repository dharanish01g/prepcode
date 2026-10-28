//! What students do on Practice MCQs: each submit and each hint opened.
//!
//! An event is saved on this computer first, so nothing is lost offline or if
//! the app closes, then sent to the backend as the signed-in student, with
//! the same id: sending one twice keeps it once. A guest's are never
//! sent, and go with the guest's files.

use std::time::{SystemTime, UNIX_EPOCH};

use serde::Deserialize;
use tauri::{AppHandle, Manager, State};

use crate::auth::{self, AccessToken, CurrentUser, GUEST_PREFIX};
use crate::backend::{self, Backend, BackendError, McqEventRecord};
use crate::db::Db;

/// Held while sending, so two sends never post the same events at once.
#[derive(Default)]
pub struct McqSender(tokio::sync::Mutex<()>);

/// How many events go in one request.
const BATCH: i64 = 100;

#[derive(Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
enum Kind {
    Submit,
    Hint,
}

/// An event as the MCQ screen reports it.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McqEvent {
    /// The question's id in the backend.
    question_id: String,
    /// Its slug, to count what's solved without asking the backend.
    question: String,
    kind: Kind,
    /// A submit's option, and whether it was the right one.
    option_id: Option<String>,
    correct: Option<bool>,
    /// A hint's place in the question's hints, from 0.
    hint_index: Option<u8>,
}

fn is_uuid(text: &str) -> bool {
    text.len() == 36
        && text.char_indices().all(|(i, c)| {
            if [8, 13, 18, 23].contains(&i) {
                c == '-'
            } else {
                c.is_ascii_hexdigit()
            }
        })
}

/// A random (version 4) uuid.
fn new_id() -> Result<String, String> {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).map_err(|e| format!("Could not record the answer: {e}"))?;
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    Ok(format!("{}-{}-{}-{}-{}", &hex[0..8], &hex[8..12], &hex[12..16], &hex[16..20], &hex[20..]))
}

fn is_student(user: &str) -> bool {
    !user.starts_with(GUEST_PREFIX)
}

/// Saves an event, then (for a student) sends what's waiting, in the background.
#[tauri::command]
pub fn record_mcq_event(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    event: McqEvent,
) -> Result<(), String> {
    let user = current.get()?;
    let submit = event.kind == Kind::Submit;
    let valid = is_uuid(&event.question_id)
        && !event.question.is_empty()
        && if submit {
            event.option_id.as_deref().is_some_and(is_uuid)
                && event.correct.is_some()
                && event.hint_index.is_none()
        } else {
            event.option_id.is_none() && event.correct.is_none() && event.hint_index.is_some_and(|i| i < 4)
        };
    if !valid {
        return Err("Could not record the answer: it's malformed.".into());
    }
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64;
    db.with(|conn| {
        conn.execute(
            "INSERT INTO mcq_events (id, user_id, question_id, question, kind, option_id, correct, hint_index, at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                new_id()?,
                user,
                event.question_id,
                event.question,
                if submit { "submit" } else { "hint" },
                event.option_id,
                event.correct,
                event.hint_index,
                now
            ],
        )
        .map(|_| ())
        .map_err(|e| format!("Could not record the answer: {e}"))
    })?;
    if is_student(&user) {
        tauri::async_runtime::spawn(async move {
            if let Err(e) = send_waiting(&app, &user).await {
                log::info!("MCQ answers wait to be sent: {e}");
            }
        });
    }
    Ok(())
}

/// Sends the signed-in student's waiting events, e.g. on opening the app.
#[tauri::command]
pub async fn send_mcq_events(app: AppHandle, current: State<'_, CurrentUser>) -> Result<(), String> {
    let user = current.get()?;
    if !is_student(&user) {
        return Ok(());
    }
    send_waiting(&app, &user).await
}

/// Up to `BATCH` of a student's events not yet sent, oldest first.
fn waiting(db: &Db, user: &str) -> Result<Vec<McqEventRecord>, String> {
    let err = |e: rusqlite::Error| format!("Could not read the MCQ answers: {e}");
    db.with(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id, question_id, kind, option_id, hint_index,
                        strftime('%Y-%m-%dT%H:%M:%fZ', at / 1000.0, 'unixepoch')
                 FROM mcq_events WHERE user_id = ?1 AND sent_at IS NULL ORDER BY at LIMIT ?2",
            )
            .map_err(err)?;
        let rows = stmt
            .query_map(rusqlite::params![user, BATCH], |row| {
                Ok(McqEventRecord {
                    id: row.get(0)?,
                    question_id: row.get(1)?,
                    kind: row.get(2)?,
                    option_id: row.get(3)?,
                    hint_index: row.get(4)?,
                    at: row.get(5)?,
                })
            })
            .map_err(err)?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(err)
    })
}

fn mark_sent(db: &Db, ids: &[String]) -> Result<(), String> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64;
    db.with(|conn| {
        let tx = conn.transaction().map_err(|e| e.to_string())?;
        for id in ids {
            tx.execute("UPDATE mcq_events SET sent_at = ?1 WHERE id = ?2", rusqlite::params![now, id])
                .map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())
    })
    .map_err(|e| format!("Could not record the sent MCQ answers: {e}"))
}

/// Sends a student's waiting events in batches until none are left. Stops at
/// the first error worth retrying (offline, signed out), leaving the rest for
/// next time. Events the backend refuses for good (e.g. the question was made
/// private meanwhile) are marked sent, so they aren't retried forever.
async fn send_waiting(app: &AppHandle, user: &str) -> Result<(), String> {
    let sender = app.state::<McqSender>();
    let _sending = sender.0.lock().await;
    let db = app.state::<Db>();
    loop {
        // Signed out (or into another account) meanwhile: leave them for this student's next sign-in.
        if app.state::<CurrentUser>().get().ok().as_deref() != Some(user) {
            return Ok(());
        }
        let events = waiting(&db, user)?;
        if events.is_empty() {
            return Ok(());
        }
        let token = auth::access_token(&db, &app.state::<AccessToken>()).await?;
        let ids: Vec<String> = events.iter().map(|event| event.id.clone()).collect();
        match backend::get().add_mcq_events(&token, &events).await {
            Ok(()) => mark_sent(&db, &ids)?,
            // One bad event refuses the whole batch: send them one by one to keep the rest.
            Err(BackendError::Rejected(_)) => {
                for event in &events {
                    match backend::get().add_mcq_events(&token, std::slice::from_ref(event)).await {
                        Ok(()) => {}
                        Err(BackendError::Rejected(reason)) => {
                            log::warn!("An MCQ answer was refused, so it won't be sent: {reason}")
                        }
                        Err(e) => return Err(e.message()),
                    }
                    mark_sent(&db, std::slice::from_ref(&event.id))?;
                }
            }
            Err(e) => return Err(e.message()),
        }
    }
}

/// The MCQs the student has answered right, by slug: those recorded here, and
/// for a student those in the backend too (e.g. from another computer). Offline,
/// just those recorded here.
#[tauri::command]
pub async fn list_mcq_solved(
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    access: State<'_, AccessToken>,
) -> Result<Vec<String>, String> {
    let user = current.get()?;
    let err = |e: rusqlite::Error| format!("Could not read your solved questions: {e}");
    let mut solved = db.with(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT DISTINCT question FROM mcq_events
                 WHERE user_id = ?1 AND kind = 'submit' AND correct = 1",
            )
            .map_err(err)?;
        let rows = stmt.query_map([&user], |row| row.get(0)).map_err(err)?;
        rows.collect::<rusqlite::Result<Vec<String>>>().map_err(err)
    })?;
    if is_student(&user) {
        let remote = match auth::access_token(&db, &access).await {
            Ok(token) => backend::get().mcq_solved(&token).await.map_err(|e| e.message()),
            Err(e) => Err(e),
        };
        match remote {
            Ok(slugs) => solved.extend(slugs),
            Err(e) => log::info!("Showing only this computer's MCQ answers: {e}"),
        }
    }
    solved.sort();
    solved.dedup();
    Ok(solved)
}

/// Forgets guests' events, with their files (see `auth::delete_guest_files`).
pub fn delete_guest_events(db: &Db) {
    let deleted = db.with(|conn| {
        conn.execute("DELETE FROM mcq_events WHERE user_id LIKE ?1", [format!("{GUEST_PREFIX}%")])
            .map_err(|e| e.to_string())
    });
    if let Err(e) = deleted {
        log::warn!("Could not delete guests' MCQ answers: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_are_uuids() {
        let id = new_id().unwrap();
        assert!(is_uuid(&id));
        assert_eq!(&id[14..15], "4");
        assert_ne!(id, new_id().unwrap());
        assert!(!is_uuid("not-a-uuid"));
        assert!(!is_uuid("7102a98c-7bcc-4648-a5e4-5448bd4fb86z"));
    }
}
