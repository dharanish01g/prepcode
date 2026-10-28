//! What the Practice and Jobs screens show, read from the backend. No sign-in
//! is needed, so guests can practise too.

use crate::backend::{self, Backend, Job, Mcq, Question, QuestionSummary, Section};

/// Every section with its categories, in display order.
#[tauri::command]
pub async fn list_practice_sections() -> Result<Vec<Section>, String> {
    backend::get().practice_sections().await.map_err(|e| e.message())
}

/// A coding category's questions, in order; private ones come locked.
#[tauri::command]
pub async fn list_category_questions(category: String) -> Result<Vec<QuestionSummary>, String> {
    backend::get().category_questions(&category).await.map_err(|e| e.message())
}

/// A question with its examples, or None if it isn't open (unpublished since
/// the list loaded, or private).
#[tauri::command]
pub async fn get_question(slug: String) -> Result<Option<Question>, String> {
    backend::get().question(&slug).await.map_err(|e| e.message())
}

/// An MCQ category's questions, in order, with their options and hints.
#[tauri::command]
pub async fn list_category_mcqs(category: String) -> Result<Vec<Mcq>, String> {
    backend::get().category_mcqs(&category).await.map_err(|e| e.message())
}

/// Published jobs still open on `today`, the student's date (YYYY-MM-DD),
/// newest first.
#[tauri::command]
pub async fn list_jobs(today: String) -> Result<Vec<Job>, String> {
    if !is_date(&today) {
        return Err(format!("Invalid date: {today}"));
    }
    backend::get().jobs(&today).await.map_err(|e| e.message())
}

/// `YYYY-MM-DD`, digits only, so it can go into a filter as it is.
fn is_date(text: &str) -> bool {
    let bytes = text.as_bytes();
    bytes.len() == 10
        && bytes
            .iter()
            .enumerate()
            .all(|(i, b)| if i == 4 || i == 7 { *b == b'-' } else { b.is_ascii_digit() })
}

#[cfg(test)]
mod tests {
    use super::is_date;

    #[test]
    fn checks_dates() {
        assert!(is_date("2026-10-28"));
        for bad in ["", "2026-1-28", "2026/10/28", "2026-10-28)", "28-10-2026", "2026-10-2a"] {
            assert!(!is_date(bad), "{bad}");
        }
    }
}
