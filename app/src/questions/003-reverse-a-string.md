---
title: Reverse a String
difficulty: Easy
topic: Strings
---

**SwiftParcel**, a courier company in Chennai, prints a tracking code on every parcel it ships. To make the codes harder to guess, the warehouse system stores each one **reversed**, so `PKG2048` is saved as `8402GKP`.

Last week, a software update broke the scanner app at the delivery hubs. Delivery agents can now only read the stored, reversed code, and customers calling the help desk can't match it with the code on their receipt. Hundreds of parcels are waiting at the hub while agents read codes out backwards by hand, and mistakes are sending parcels to the wrong addresses.

You've been asked to write the small fix the scanner app will use until the update is rolled back. Read a code `s` as it's stored and print it reversed, so agents and customers see the original tracking code. Every character, including letters and digits, must stay exactly as it is; only the order changes.

**Example 1**

```text
Input:  8402GKP
Output: PKG2048
```

**Example 2**

```text
Input:  5100XPS
Output: SPX0015
```

**Example 3**

```text
Input:  A
Output: A
```

A one-character code reads the same both ways.

**Constraints:** `1 ≤ length of s ≤ 1000`. The code has only letters and digits, with no spaces.

## Explanation

Walk from the last character to the first and build a new string.

Most languages have a shortcut too, like slicing with `s[::-1]` in Python, but try the loop first.
