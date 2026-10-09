---
title: Sum of Two Numbers
difficulty: Easy
topic: Basics
method: sum
params: a int, b int
returns: int
---

Given two integers `a` and `b`, return their sum.

**Example 1**

```text
Input:  a = 3, b = 5
Output: 8
```

**Example 2**

```text
Input:  a = -4, b = 10
Output: 6
```

**Example 3**

```text
Input:  a = 0, b = 0
Output: 0
```

**Constraints:** `-1000 ≤ a, b ≤ 1000`

## Explanation

Add the two numbers and return the result.

With these limits the sum always fits in an `int`. For very large numbers you'd need a 64-bit type, like `long`, so the sum doesn't overflow.
