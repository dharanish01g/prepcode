---
title: Even or Odd
difficulty: Easy
topic: Basics
---

Read an integer `n` and print `Even` if it's even, otherwise `Odd`.

**Example 1**

```text
Input:  4
Output: Even
```

**Example 2**

```text
Input:  7
Output: Odd
```

**Example 3**

```text
Input:  -3
Output: Odd
```

**Constraints:** `-10⁹ ≤ n ≤ 10⁹`

## Explanation

A number is even when dividing it by 2 leaves no remainder. Check `n % 2 == 0`.

This works for negative numbers too, as long as you compare the remainder with 0. Checking `n % 2 == 1` for odd fails for `-3`, because in many languages `-3 % 2` is `-1`.
