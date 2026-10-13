import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgram,
  encodeInput,
  RESULT_MARKER,
  splitOutput,
  starterCode,
  type Signature,
} from "./drivers.ts";

const sumSignature: Signature = {
  method: "twoSum",
  params: [
    { name: "nums", type: "int[]" },
    { name: "target", type: "int" },
  ],
  returns: "int[]",
};

const boolSignature: Signature = {
  method: "isPalindrome",
  params: [{ name: "s", type: "string" }],
  returns: "bool",
};

test("encodeInput encodes scalars and arrays correctly", () => {
  const encoded = encodeInput(sumSignature, [[2, 7, 11, 15], 9]);
  assert.equal(encoded, "4\n2 7 11 15\n9\n");

  const stringListSig: Signature = {
    method: "findWords",
    params: [{ name: "words", type: "string[]" }],
    returns: "string[]",
  };
  const encodedStrings = encodeInput(stringListSig, [["apple", "banana"]]);
  assert.equal(encodedStrings, "2\napple\nbanana\n");
});

test("splitOutput separates printed text from return value", () => {
  const stdout = `Debug line 1\nDebug line 2\n\n${RESULT_MARKER}\n[0,1]\n`;
  const result = splitOutput(stdout);
  assert.equal(result.printed, "Debug line 1\nDebug line 2\n");
  assert.equal(result.returned, "[0,1]");
});

test("splitOutput handles Windows CRLF line endings", () => {
  const stdout = `Windows log\r\n\r\n${RESULT_MARKER}\r\n"success"\r\n`;
  const result = splitOutput(stdout);
  assert.equal(result.printed, "Windows log\n");
  assert.equal(result.returned, '"success"');
});

test("splitOutput handles output when code printed nothing before marker", () => {
  const stdout = `${RESULT_MARKER}\n42\n`;
  const result = splitOutput(stdout);
  assert.equal(result.printed, "");
  assert.equal(result.returned, "42");
});

test("splitOutput returns null returned value when marker is missing", () => {
  const stdout = "Traceback (most recent call last):\nZeroDivisionError: division by zero\n";
  const result = splitOutput(stdout);
  assert.equal(result.printed, stdout);
  assert.equal(result.returned, null);
});

test("starterCode generates polymorphic templates for all supported languages", () => {
  const py = starterCode(sumSignature, "py");
  assert.ok(py.includes("class Solution:"));
  assert.ok(py.includes("def twoSum(self, nums: list[int], target: int) -> list[int]:"));

  const js = starterCode(sumSignature, "js");
  assert.ok(js.includes("class Solution"));
  assert.ok(js.includes("twoSum(nums, target)"));

  const java = starterCode(sumSignature, "java");
  assert.ok(java.includes("public int[] twoSum(int[] nums, int target)"));

  const cs = starterCode(sumSignature, "cs");
  assert.ok(cs.includes("public int[] TwoSum(int[] nums, int target)"));

  const cpp = starterCode(sumSignature, "cpp");
  assert.ok(cpp.includes("vector<int> twoSum(vector<int>& nums, int target)"));

  const c = starterCode(sumSignature, "c");
  assert.ok(c.includes("int* twoSum(int* nums, int numsSize, int target, int* returnSize)"));

  const go = starterCode(sumSignature, "go");
  assert.ok(go.includes("func twoSum(nums []int, target int) []int"));
});

test("buildProgram adds appropriate harness and maintains line tracking", () => {
  // Python harness
  const pyCode =
    "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        return True\n";
  const pyProg = buildProgram(boolSignature, "py", pyCode, "solution.py");
  assert.ok(pyProg.startsWith(pyCode));
  assert.ok(pyProg.includes(RESULT_MARKER));

  // C++ harness with #line 1
  const cppCode = "class Solution { public: bool isPalindrome(string s) { return true; } };";
  const cppProg = buildProgram(boolSignature, "cpp", cppCode, "solution.cpp");
  assert.ok(cppProg.includes("#line 1\n" + cppCode));
  assert.ok(cppProg.includes(RESULT_MARKER));

  // Go harness with package main
  const goCode = "func isPalindrome(s string) bool { return true }";
  const goProg = buildProgram(boolSignature, "go", goCode, "solution.go");
  assert.ok(goProg.includes("package main"));
  assert.ok(goProg.includes("//line solution.go:1\n" + goCode));
  assert.ok(goProg.includes(RESULT_MARKER));

  // Unsupported extension throws
  assert.throws(() => buildProgram(boolSignature, "xyz", "code", "solution.xyz"), {
    message: "Questions can't be solved in .xyz yet.",
  });
});
