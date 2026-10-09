---
title: Leap Year
difficulty: Easy
topic: Basics
category: basics
method: isLeapYear
params: year int
returns: bool
---

**EventNest**, an event-booking app in Bengaluru, lets couples book anniversary venues years in advance. Last month a couple tried to book their wedding anniversary for **29 February 2100**, and the app happily confirmed it. The trouble is that 2100 has no 29 February: the date doesn't exist.

The calendar module was written to treat every year divisible by 4 as a leap year. That's almost right, but the real rule has two exceptions. A year divisible by **100** is not a leap year, unless it's also divisible by **400**. So 2000 was a leap year, but 1900 wasn't, and 2100 won't be.

Venues are now refusing bookings the app shouldn't have accepted. Write the check the calendar will use: given a `year`, return `true` if it's a leap year, otherwise `false`.

**Example 1**

```text
Input:  year = 2024
Output: true
```

**Example 2**

```text
Input:  year = 1900
Output: false
```

**Example 3**

```text
Input:  year = 2000
Output: true
```

2000 is divisible by 100, but also by 400, so it's a leap year.

**Constraints:** `1 ≤ year ≤ 9999`

## Explanation

Check the most specific rule first: divisible by 400 is a leap year; otherwise divisible by 100 is not; otherwise divisible by 4 is.

In one condition: `(year % 4 == 0 && year % 100 != 0) || year % 400 == 0`.
