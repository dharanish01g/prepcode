import { invoke } from "@tauri-apps/api/core";
import type { Difficulty, QuestionSummary } from "@/lib/questions";

/**
 * SQL practice questions. The questions here are dummy data, run on the
 * student's own server. Later they come from the database, and move into
 * Practice.
 */

/** A column of a question's table, e.g. `id INT`. */
export type SqlColumn = {
  name: string;
  /** As the student would write it, e.g. "VARCHAR(50)". */
  type: string;
  primaryKey?: boolean;
};

/** A table the question's database has. Each test case fills it with its own rows. */
export type SqlTable = {
  name: string;
  columns: SqlColumn[];
};

/** Rows of a table or a result; null is SQL NULL. */
export type SqlRow = (string | null)[];

/** Rows, as a query returns them. */
export type SqlRows = {
  columns: string[];
  rows: SqlRow[];
};

/** What a run gives back: rows, or the error that stopped it. */
export type SqlRun =
  ({ kind: "rows" } & SqlRows) | { kind: "error"; line: number; message: string };

/**
 * The question's tables filled with some rows, and what the query should
 * return on them. The student's query runs once per case, on a fresh
 * database each time.
 */
export type SqlTestCase = {
  /** Examples are shown and checked by Run; hidden ones only by Submit, and never shown. */
  visibility: "example" | "hidden";
  /** Each table's rows, by table name, in the order they're inserted. */
  rows: Record<string, SqlRow[]>;
  expected: SqlRows;
};

/**
 * A SQL question: its tables, and the test cases the student's query must
 * pass. The first example is the one the question shows.
 */
export type SqlQuestion = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  /** Markdown: the case study. */
  description: string;
  tables: SqlTable[];
  /** The rows must come back in the expected order (the question asks for ORDER BY). */
  ordered: boolean;
  cases: SqlTestCase[];
  /** Preview only: a right answer, which the editor starts with so it can be tried. */
  answer: string;
};

/**
 * The query editor's text before the student writes anything. In preview,
 * the question's answer, so it can be tried.
 */
export function sqlStarter(question: SqlQuestion) {
  return `-- Write your query below.\n\n${question.answer}\n`;
}

const students: SqlTable = {
  name: "students",
  columns: [
    { name: "id", type: "INT", primaryKey: true },
    { name: "name", type: "VARCHAR(50)" },
    { name: "department", type: "VARCHAR(10)" },
    { name: "year", type: "INT" },
  ],
};

const marks: SqlTable = {
  name: "marks",
  columns: [
    { name: "student_id", type: "INT" },
    { name: "subject", type: "VARCHAR(20)" },
    { name: "score", type: "INT" },
  ],
};

const placements: SqlTable = {
  name: "placements",
  columns: [
    { name: "student_id", type: "INT", primaryKey: true },
    { name: "company", type: "VARCHAR(30)" },
    { name: "package_lpa", type: "DECIMAL(4,1)" },
  ],
};

// The rows most examples start from.
const someStudents: SqlRow[] = [
  ["1", "Aarav Kumar", "CSE", "3"],
  ["2", "Diya Sharma", "ECE", "3"],
  ["3", "Karthik Raja", "CSE", "3"],
  ["4", "Meera Iyer", "MECH", "2"],
  ["5", "Rohan Das", "ECE", "2"],
  ["6", "Sneha Reddy", "CSE", "2"],
  ["7", "Vikram Singh", "CIVIL", "3"],
  ["8", "Priya Nair", "MECH", "3"],
];
const someMarks: SqlRow[] = [
  ["1", "Maths", "92"],
  ["2", "Maths", "78"],
  ["3", "Maths", "85"],
  ["4", "Maths", "64"],
  ["5", "Maths", "88"],
  ["6", "Maths", "81"],
  ["7", "Maths", "55"],
  ["8", "Maths", "80"],
  ["1", "Physics", "70"],
  ["3", "Physics", "90"],
];

function testCase(
  visibility: SqlTestCase["visibility"],
  rows: SqlTestCase["rows"],
  expected: SqlRows,
): SqlTestCase {
  return { visibility, rows, expected };
}

const toppers = (rows: SqlRow[]): SqlRows => ({ columns: ["name", "score"], rows });
const headcount = (rows: SqlRow[]): SqlRows => ({ columns: ["department", "students"], rows });
const unplaced = (rows: SqlRow[]): SqlRows => ({ columns: ["id", "name", "department"], rows });
const average = (value: string | null): SqlRows => ({ columns: ["average"], rows: [[value]] });

export const SQL_QUESTIONS: SqlQuestion[] = [
  {
    slug: "maths-toppers",
    title: "Maths Toppers",
    difficulty: "Easy",
    topic: "Joins",
    description:
      "Sri Venkateswara Engineering College gives a merit certificate to every student who scores **above 80** in Maths. The exam cell keeps students in `students` and every subject's score in `marks`.\n\nWrite a query that lists each student who gets the certificate: their `name` and Maths `score`, highest score first, and students with the same score by name. A score of exactly 80 doesn't count.",
    tables: [students, marks],
    answer:
      "SELECT s.name, m.score\nFROM students s\nJOIN marks m ON m.student_id = s.id\nWHERE m.subject = 'Maths' AND m.score > 80\nORDER BY m.score DESC, s.name;",
    ordered: true,
    cases: [
      testCase(
        "example",
        { students: someStudents, marks: someMarks },
        toppers([
          ["Aarav Kumar", "92"],
          ["Rohan Das", "88"],
          ["Karthik Raja", "85"],
          ["Sneha Reddy", "81"],
        ]),
      ),
      // Exactly 80 doesn't count.
      testCase(
        "example",
        {
          students: [
            ["1", "Anu Joseph", "CSE", "2"],
            ["2", "Bala Murugan", "ECE", "2"],
            ["3", "Charu Mehta", "IT", "2"],
          ],
          marks: [
            ["1", "Maths", "80"],
            ["2", "Maths", "95"],
            ["3", "Maths", "79"],
          ],
        },
        toppers([["Bala Murugan", "95"]]),
      ),
      // A high score in another subject doesn't count.
      testCase(
        "example",
        {
          students: [
            ["1", "Deepak Rao", "MECH", "3"],
            ["2", "Esha Gupta", "CSE", "3"],
          ],
          marks: [
            ["1", "Physics", "98"],
            ["1", "Maths", "60"],
            ["2", "Maths", "83"],
          ],
        },
        toppers([["Esha Gupta", "83"]]),
      ),
      // Ties go by name.
      testCase(
        "hidden",
        {
          students: [
            ["1", "Hari Prasad", "CSE", "1"],
            ["2", "Gita Menon", "ECE", "1"],
            ["3", "Farhan Ali", "IT", "1"],
          ],
          marks: [
            ["1", "Maths", "85"],
            ["2", "Maths", "90"],
            ["3", "Maths", "90"],
          ],
        },
        toppers([
          ["Farhan Ali", "90"],
          ["Gita Menon", "90"],
          ["Hari Prasad", "85"],
        ]),
      ),
      // Nobody above 80.
      testCase(
        "hidden",
        { students: [["1", "Isha Kapoor", "CSE", "4"]], marks: [["1", "Maths", "70"]] },
        toppers([]),
      ),
    ],
  },
  {
    slug: "department-headcount",
    title: "Department Headcount",
    difficulty: "Easy",
    topic: "GROUP BY",
    description:
      "The placement cell is booking halls for the pre-placement talks, one per department. To pick the right size, they need to know how many students each department has, across every year.\n\nWrite a query that returns each `department` and its number of students as `students`. Rows can be in any order.",
    tables: [students],
    answer: "SELECT department, COUNT(*) AS students\nFROM students\nGROUP BY department;",
    ordered: false,
    cases: [
      {
        visibility: "example",
        rows: { students: someStudents },
        expected: headcount([
          ["CSE", "3"],
          ["ECE", "2"],
          ["MECH", "2"],
          ["CIVIL", "1"],
        ]),
      },
      testCase(
        "example",
        {
          students: [
            ["1", "Arjun Pillai", "CSE", "3"],
            ["2", "Bhavna Shah", "CSE", "3"],
            ["3", "Chitra Bose", "IT", "3"],
          ],
        },
        headcount([
          ["IT", "1"],
          ["CSE", "2"],
        ]),
      ),
      {
        visibility: "hidden",
        rows: {
          students: [
            ["1", "Dev Malhotra", "ECE", "1"],
            ["2", "Ezhil Arasan", "ECE", "2"],
            ["3", "Farah Khan", "EEE", "1"],
          ],
        },
        expected: headcount([
          ["ECE", "2"],
          ["EEE", "1"],
        ]),
      },
    ],
  },
  {
    slug: "unplaced-students",
    title: "Students Still Unplaced",
    difficulty: "Medium",
    topic: "LEFT JOIN",
    description:
      "Placement season is halfway through. The training officer wants to call every student who hasn't got an offer yet, to sign them up for the next mock interview round. Offers are recorded in `placements`, one row per placed student.\n\nWrite a query that returns the `id`, `name` and `department` of every student with no row in `placements`, ordered by `id`.",
    tables: [students, placements],
    answer:
      "SELECT s.id, s.name, s.department\nFROM students s\nLEFT JOIN placements p ON p.student_id = s.id\nWHERE p.student_id IS NULL\nORDER BY s.id;",
    ordered: true,
    cases: [
      testCase(
        "example",
        {
          students: someStudents,
          placements: [
            ["1", "Zoho", "6.5"],
            ["3", "TCS", "3.6"],
            ["5", "Infosys", "4.0"],
            ["8", "Freshworks", "8.0"],
          ],
        },
        unplaced([
          ["2", "Diya Sharma", "ECE"],
          ["4", "Meera Iyer", "MECH"],
          ["6", "Sneha Reddy", "CSE"],
          ["7", "Vikram Singh", "CIVIL"],
        ]),
      ),
      // Everyone placed.
      testCase(
        "example",
        {
          students: [
            ["1", "Arun Varma", "CSE", "4"],
            ["2", "Banu Priya", "IT", "4"],
          ],
          placements: [
            ["1", "Zoho", "6.5"],
            ["2", "TCS", "3.6"],
          ],
        },
        unplaced([]),
      ),
      {
        visibility: "hidden",
        rows: {
          students: [
            ["5", "Kavya Rao", "IT", "4"],
            ["2", "Lokesh Kumar", "CSE", "4"],
            ["9", "Mani Selvan", "ECE", "4"],
            ["4", "Nila Devi", "EEE", "4"],
          ],
          placements: [["9", "Wipro", "3.5"]],
        },
        expected: unplaced([
          ["2", "Lokesh Kumar", "CSE"],
          ["4", "Nila Devi", "EEE"],
          ["5", "Kavya Rao", "IT"],
        ]),
      },
    ],
  },
  {
    slug: "average-maths-score",
    title: "Average Maths Score",
    difficulty: "Easy",
    topic: "Aggregates",
    description:
      "The Head of Mathematics reports the class average to the principal after every internal test. Scores for every subject are in `marks`.\n\nWrite a query that returns the average Maths score as `average`, rounded to 2 decimal places.",
    tables: [marks],
    answer: "SELECT ROUND(AVG(score), 2) AS average\nFROM marks\nWHERE subject = 'Maths';",
    ordered: false,
    cases: [
      {
        visibility: "example",
        rows: { marks: someMarks },
        expected: average("77.88"),
      },
      {
        visibility: "example",
        rows: {
          marks: [
            ["1", "Physics", "99"],
            ["2", "Maths", "70"],
          ],
        },
        expected: average("70.00"),
      },
      {
        visibility: "hidden",
        rows: {
          marks: [
            ["1", "Maths", "90"],
            ["2", "Maths", "85"],
            ["3", "Maths", "80"],
          ],
        },
        expected: average("85.00"),
      },
    ],
  },
];

export const SQL_QUESTION_SUMMARIES: QuestionSummary[] = SQL_QUESTIONS.map(
  ({ slug, title, difficulty, topic }) => ({ slug, title, difficulty, topic, locked: false }),
);

/**
 * Runs the query on each of `cases`, in order, on the student's own server
 * for `extension` (e.g. "mysql.sql"), started if it isn't running. Rejects
 * with a user-facing message if it couldn't check at all.
 */
export function checkSqlPractice(
  extension: string,
  question: SqlQuestion,
  cases: SqlTestCase[],
  query: string,
) {
  return invoke<SqlRun[]>("check_sql_practice", {
    extension,
    question: { tables: question.tables, cases: cases.map(({ rows }) => ({ rows })) },
    query,
  });
}

/** How a test case's result compares with its expected one. */
export type SqlVerdict = {
  passed: boolean;
  /** Why it failed, e.g. "Your result has 3 rows; 4 were expected." */
  reason: string;
  /** Rows of the student's result that don't match, by index. */
  wrongRows: ReadonlySet<number>;
  /** Expected rows the student's result is missing, by index. */
  missingRows: ReadonlySet<number>;
};

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Compares the student's rows with the expected ones. Column names don't
 * count, so an alias never fails an answer; row order counts only when the
 * question asks for it.
 */
export function compareRows(actual: SqlRows, expected: SqlRows, ordered: boolean): SqlVerdict {
  const none = new Set<number>();
  if (actual.columns.length !== expected.columns.length) {
    return {
      passed: false,
      reason: `Your result has ${plural(actual.columns.length, "column")}; ${expected.columns.length} were expected.`,
      wrongRows: none,
      missingRows: none,
    };
  }
  const key = (row: (string | null)[]) => JSON.stringify(row);
  const wrongRows = new Set<number>();
  const missingRows = new Set<number>();
  if (ordered) {
    const longest = Math.max(actual.rows.length, expected.rows.length);
    for (let i = 0; i < longest; i++) {
      const a = actual.rows[i];
      const e = expected.rows[i];
      if (a && e && key(a) === key(e)) continue;
      if (a) wrongRows.add(i);
      if (e) missingRows.add(i);
    }
  } else {
    // Each expected row matches one of the student's, whatever their order.
    const unmatched = new Map<string, number[]>();
    expected.rows.forEach((row, i) => {
      const list = unmatched.get(key(row)) ?? [];
      list.push(i);
      unmatched.set(key(row), list);
    });
    actual.rows.forEach((row, i) => {
      const list = unmatched.get(key(row));
      if (list?.length) list.shift();
      else wrongRows.add(i);
    });
    for (const list of unmatched.values()) for (const i of list) missingRows.add(i);
  }
  const passed = wrongRows.size === 0 && missingRows.size === 0;
  let reason = "";
  if (!passed) {
    if (actual.rows.length !== expected.rows.length) {
      reason = `Your result has ${plural(actual.rows.length, "row")}; ${expected.rows.length} were expected.`;
    } else if (ordered && sameRowsAnyOrder(actual, expected)) {
      reason = "The rows are right, but not in the order the question asks for.";
    } else {
      reason = `${plural(wrongRows.size, "row")} of your result ${wrongRows.size === 1 ? "doesn't" : "don't"} match.`;
    }
  }
  return { passed, reason, wrongRows, missingRows };
}

function sameRowsAnyOrder(actual: SqlRows, expected: SqlRows) {
  return compareRows(actual, expected, false).passed;
}
