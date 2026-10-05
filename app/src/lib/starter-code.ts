/**
 * What the editor starts with for a practice question, by language extension.
 * Just enough to compile and run, with a comment where the code goes. No
 * unused imports: Go refuses to compile with one.
 */
const STARTER_CODE: Record<string, string> = {
  py: `# Write your code here
`,
  js: `// Write your code here
`,
  c: `#include <stdio.h>

int main() {
    // Write your code here

    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here

    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your code here

    }
}
`,
  go: `package main

func main() {
	// Write your code here

}
`,
};

/** The starter code for a language, or just the comment for one without its own. */
export function starterCode(extension: string) {
  return STARTER_CODE[extension] ?? "Write your code here\n";
}
