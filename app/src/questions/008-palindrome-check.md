---
title: Palindrome Check
difficulty: Easy
topic: Strings
category: basics
method: isPalindrome
params: word string
returns: bool
---

**WordWise**, a children's puzzle magazine, runs a daily puzzle in its app called _Mirror Words_. Kids are shown a word and must decide whether it's a **palindrome**: a word that reads the same from left to right as from right to left, like _level_ or _racecar_.

Each puzzle is checked by the editors before it's published, but last week a word that wasn't a palindrome slipped through marked as one. Dozens of parents wrote in when their children's right answers were marked wrong.

The editors want the app to check every word itself. Given a `word` in lowercase letters, return `true` if it's a palindrome, otherwise `false`.

**Example 1**

```text
Input:  word = "racecar"
Output: true
```

**Example 2**

```text
Input:  word = "prepcode"
Output: false
```

**Example 3**

```text
Input:  word = "a"
Output: true
```

A single letter reads the same both ways.

**Constraints:** `1 ≤ length of word ≤ 1000`, lowercase letters only.

## Explanation

Compare the first letter with the last, the second with the second last, and so on, moving inwards. Stop at the first mismatch.

You only need to check up to the middle, so it takes half as many comparisons as there are letters.
