---
title: Factorial
difficulty: Easy
topic: Loops
category: basics
method: factorial
params: n int
returns: long
---

**Shubh Vivah Planners**, a wedding-planning company in Jaipur, lets families try out seating plans for the head table before the big day. Families love to ask the same question: "In how many different orders could our guests sit?"

For `n` guests in a row, the first seat can go to any of the `n` guests, the second to any of the `n - 1` left, and so on, down to the last seat. That's `n × (n - 1) × … × 1`, called `n` factorial and written `n!`. With no guests there's exactly one arrangement: the empty one, so `0!` is 1.

The planners currently work this out on a calculator during client meetings. Write the method the app will use: given `n`, return `n!`.

**Example 1**

```text
Input:  n = 3
Output: 6
```

**Example 2**

```text
Input:  n = 5
Output: 120
```

**Example 3**

```text
Input:  n = 0
Output: 1
```

**Constraints:** `0 ≤ n ≤ 20`

## Explanation

Start with `result = 1` and multiply it by every number from 1 to `n`. Starting at 1, not 0, is what makes `0!` come out as 1.

`20!` is about 2.4 × 10¹⁸, far bigger than an `int` can hold, which is why the method returns a `long`.
