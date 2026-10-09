---
title: FizzBuzz
difficulty: Easy
topic: Loops
category: basics
method: fizzBuzz
params: n int
returns: string[]
---

At **Sunrise Public School** in Coimbatore, sports day ends with a counting game. Students stand in a circle and count up from 1, one number each, but with a twist: for a multiple of 3 they say **Fizz**, for a multiple of 5 they say **Buzz**, and for a multiple of both they say **FizzBuzz**. Anyone who slips up sits down.

The judges struggle to keep up once the count gets past 30, and arguments break out over who really made the mistake. The PE teacher wants a display board beside the circle that shows the right call for every number, so the judges can just read it.

Write the method behind the board: given `n`, return the calls for the numbers 1 to `n`, in order. A number that isn't a multiple of 3 or 5 is called as the number itself.

**Example 1**

```text
Input:  n = 5
Output: ["1","2","Fizz","4","Buzz"]
```

**Example 2**

```text
Input:  n = 15
Output: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]
```

**Example 3**

```text
Input:  n = 1
Output: ["1"]
```

**Constraints:** `1 ≤ n ≤ 1000`

## Explanation

Loop from 1 to `n`. Check divisibility by 15 first: a multiple of 15 is also a multiple of 3 and 5, so checking 3 first would give `Fizz` instead of `FizzBuzz`.
