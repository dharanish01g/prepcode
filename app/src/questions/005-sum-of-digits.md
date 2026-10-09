---
title: Sum of Digits
difficulty: Easy
topic: Math
category: basics
method: sumOfDigits
params: n int
returns: int
---

**KisanPay** helps farmers in rural Tamil Nadu receive payments for their crops at the village cooperative. Before a payment goes out, the cooperative's clerk confirms the farmer's member number with a quick check: they add up all its digits and compare the total with the one printed on the farmer's card.

The clerks do this by hand, often for hundreds of farmers on market day. Mistakes in the addition hold up payments, and a long queue builds outside the cooperative while the clerk starts again from the first digit.

KisanPay wants the app to do the adding instead. Given a member number `n`, return the sum of its digits.

**Example 1**

```text
Input:  n = 1234
Output: 10
```

**Example 2**

```text
Input:  n = 90817
Output: 25
```

**Example 3**

```text
Input:  n = 0
Output: 0
```

A member number of 0 has a single digit, 0.

**Constraints:** `0 ≤ n ≤ 10⁹`

## Explanation

`n % 10` gives the last digit and `n / 10` (integer division) removes it. Add the last digit to a total and remove it, until `n` is 0.

Converting the number to a string and adding each character's value also works, but the arithmetic way is the one interviewers expect.
