import * as monacoDefault from "monaco-editor";

type Monaco = typeof monacoDefault;

export interface SqlCompletionItemDef {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  detail?: string;
  documentation?: string;
  snippet?: string;
  category?: "keyword" | "function" | "type" | "table" | "column" | "snippet";
}

// --- SQL Keywords ----------------------------------------------------------------------

export const SQL_KEYWORDS = [
  // Querying & Clauses
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "LIMIT",
  "OFFSET",
  "DISTINCT",
  "ALL",
  "AS",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "CROSS JOIN",
  "ON",
  "USING",
  "UNION",
  "UNION ALL",
  "INTERSECT",
  "EXCEPT",
  "WITH",
  "RECURSIVE",
  "WINDOW",
  "OVER",
  "PARTITION BY",
  // Conditional & Predicates
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "AND",
  "OR",
  "NOT",
  "IN",
  "NOT IN",
  "BETWEEN",
  "NOT BETWEEN",
  "LIKE",
  "NOT LIKE",
  "ILIKE",
  "IS NULL",
  "IS NOT NULL",
  "EXISTS",
  "NOT EXISTS",
  "ASC",
  "DESC",
  "NULLS FIRST",
  "NULLS LAST",
  // DML
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "MERGE",
  // DDL & Constraints
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "CREATE VIEW",
  "DROP VIEW",
  "CREATE INDEX",
  "DROP INDEX",
  "CREATE DATABASE",
  "DROP DATABASE",
  "TRUNCATE TABLE",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "REFERENCES",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "AUTO_INCREMENT",
  "CASCADE",
  "RESTRICT",
  "ON DELETE",
  "ON UPDATE",
  "ADD COLUMN",
  "DROP COLUMN",
  // Transaction & Session
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "USE",
  "EXPLAIN",
  "DESCRIBE",
  "SHOW TABLES",
  "SHOW DATABASES",
];

// --- SQL Data Types --------------------------------------------------------------------

export const SQL_DATA_TYPES: { name: string; doc: string }[] = [
  { name: "INT", doc: "Standard 32-bit signed integer (-2,147,483,648 to 2,147,483,647)." },
  { name: "INTEGER", doc: "Synonym for INT." },
  {
    name: "BIGINT",
    doc: "64-bit integer (-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807).",
  },
  { name: "SMALLINT", doc: "16-bit signed integer (-32,768 to 32,767)." },
  { name: "TINYINT", doc: "8-bit signed integer (-128 to 127)." },
  { name: "DECIMAL", doc: "Exact fixed-point decimal number (DECIMAL(precision, scale))." },
  { name: "NUMERIC", doc: "Synonym for DECIMAL." },
  { name: "FLOAT", doc: "Single-precision floating-point number." },
  { name: "DOUBLE", doc: "Double-precision floating-point number." },
  { name: "REAL", doc: "Floating point data type." },
  { name: "VARCHAR", doc: "Variable-length character string (VARCHAR(length))." },
  { name: "CHAR", doc: "Fixed-length character string (CHAR(length))." },
  { name: "TEXT", doc: "Variable-length text string with large capacity." },
  { name: "BOOLEAN", doc: "Logical boolean (TRUE or FALSE)." },
  { name: "BOOL", doc: "Synonym for BOOLEAN." },
  { name: "DATE", doc: "Date value formatted as 'YYYY-MM-DD'." },
  { name: "TIME", doc: "Time value formatted as 'HH:MM:SS'." },
  { name: "TIMESTAMP", doc: "Date and time with timezone support ('YYYY-MM-DD HH:MM:SS')." },
  { name: "DATETIME", doc: "Date and time without timezone ('YYYY-MM-DD HH:MM:SS')." },
  { name: "JSON", doc: "Structured JavaScript Object Notation text data." },
  { name: "BLOB", doc: "Binary Large Object for storing raw binary data." },
  { name: "UUID", doc: "Universally Unique Identifier 128-bit value." },
  { name: "SERIAL", doc: "Auto-incrementing 32-bit integer (PostgreSQL)." },
  { name: "BIGSERIAL", doc: "Auto-incrementing 64-bit integer (PostgreSQL)." },
];

// --- Built-in SQL Functions ------------------------------------------------------------

export const SQL_FUNCTIONS: SqlCompletionItemDef[] = [
  // Aggregate Functions
  {
    label: "COUNT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "COUNT(expression | *) -> INT",
    documentation: "Returns the number of rows that match specified criteria.",
    snippet: "COUNT(${1:*})",
  },
  {
    label: "SUM",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SUM(expression) -> NUMERIC",
    documentation: "Calculates the total sum of a numeric column.",
    snippet: "SUM(${1:column})",
  },
  {
    label: "AVG",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "AVG(expression) -> NUMERIC",
    documentation: "Calculates the average value of a numeric column.",
    snippet: "AVG(${1:column})",
  },
  {
    label: "MIN",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "MIN(expression) -> ANY",
    documentation: "Returns the smallest value in the selected column.",
    snippet: "MIN(${1:column})",
  },
  {
    label: "MAX",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "MAX(expression) -> ANY",
    documentation: "Returns the largest value in the selected column.",
    snippet: "MAX(${1:column})",
  },
  {
    label: "GROUP_CONCAT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "GROUP_CONCAT([DISTINCT] expr [ORDER BY ...] [SEPARATOR sep]) -> VARCHAR",
    documentation:
      "Concatenates non-null values from a group into a string with a separator (MySQL/SQLite).",
    snippet: "GROUP_CONCAT(${1:column} SEPARATOR '${2:, }')",
  },
  {
    label: "STRING_AGG",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "STRING_AGG(expression, delimiter) -> VARCHAR",
    documentation:
      "Concatenates input values into a string separated by delimiter (PostgreSQL/SQL Server).",
    snippet: "STRING_AGG(${1:column}, '${2:, }')",
  },

  // Window Functions
  {
    label: "ROW_NUMBER",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ROW_NUMBER() OVER ([PARTITION BY col] ORDER BY col) -> INT",
    documentation:
      "Assigns a unique sequential integer to each row starting from 1 within a window partition.",
    snippet: "ROW_NUMBER() OVER (PARTITION BY ${1:col} ORDER BY ${2:col})",
  },
  {
    label: "RANK",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "RANK() OVER ([PARTITION BY col] ORDER BY col) -> INT",
    documentation: "Assigns a rank to each row with gaps for ties within window partition.",
    snippet: "RANK() OVER (PARTITION BY ${1:col} ORDER BY ${2:col})",
  },
  {
    label: "DENSE_RANK",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DENSE_RANK() OVER ([PARTITION BY col] ORDER BY col) -> INT",
    documentation: "Assigns a rank to each row without gaps for ties within window partition.",
    snippet: "DENSE_RANK() OVER (PARTITION BY ${1:col} ORDER BY ${2:col})",
  },
  {
    label: "NTILE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "NTILE(buckets) OVER ([PARTITION BY col] ORDER BY col) -> INT",
    documentation: "Divides ordered rows in partition into a specified number of ranked groups.",
    snippet: "NTILE(${1:buckets}) OVER (ORDER BY ${2:col})",
  },
  {
    label: "LEAD",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LEAD(column, [offset = 1], [default]) OVER ([PARTITION BY col] ORDER BY col)",
    documentation: "Accesses data from a subsequent row in the partition without a self-join.",
    snippet: "LEAD(${1:column}, ${2:1}) OVER (ORDER BY ${3:col})",
  },
  {
    label: "LAG",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LAG(column, [offset = 1], [default]) OVER ([PARTITION BY col] ORDER BY col)",
    documentation: "Accesses data from a previous row in the partition without a self-join.",
    snippet: "LAG(${1:column}, ${2:1}) OVER (ORDER BY ${3:col})",
  },
  {
    label: "FIRST_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "FIRST_VALUE(column) OVER ([PARTITION BY col] ORDER BY col)",
    documentation: "Returns the first value in an ordered partition of rows.",
    snippet: "FIRST_VALUE(${1:column}) OVER (PARTITION BY ${2:col} ORDER BY ${3:col})",
  },
  {
    label: "LAST_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LAST_VALUE(column) OVER ([PARTITION BY col] ORDER BY col ROWS BETWEEN ...)",
    documentation: "Returns the last value in an ordered partition of rows.",
    snippet: "LAST_VALUE(${1:column}) OVER (PARTITION BY ${2:col} ORDER BY ${3:col})",
  },

  // String Functions
  {
    label: "CONCAT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CONCAT(str1, str2, ...) -> VARCHAR",
    documentation: "Concatenates two or more strings together.",
    snippet: "CONCAT(${1:str1}, ${2:str2})",
  },
  {
    label: "CONCAT_WS",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CONCAT_WS(separator, str1, str2, ...) -> VARCHAR",
    documentation: "Concatenates strings with a specified separator.",
    snippet: "CONCAT_WS('${1:, }', ${2:str1}, ${3:str2})",
  },
  {
    label: "SUBSTRING",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SUBSTRING(str, pos, [len]) -> VARCHAR",
    documentation: "Extracts a substring starting at pos for len characters (1-indexed).",
    snippet: "SUBSTRING(${1:str}, ${2:pos}, ${3:len})",
  },
  {
    label: "SUBSTR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SUBSTR(str, pos, [len]) -> VARCHAR",
    documentation: "Synonym for SUBSTRING.",
    snippet: "SUBSTR(${1:str}, ${2:pos}, ${3:len})",
  },
  {
    label: "LENGTH",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LENGTH(str) -> INT",
    documentation: "Returns the length of a string in bytes/characters.",
    snippet: "LENGTH(${1:str})",
  },
  {
    label: "CHAR_LENGTH",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CHAR_LENGTH(str) -> INT",
    documentation: "Returns the number of characters in a string.",
    snippet: "CHAR_LENGTH(${1:str})",
  },
  {
    label: "UPPER",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "UPPER(str) -> VARCHAR",
    documentation: "Converts a string to uppercase.",
    snippet: "UPPER(${1:str})",
  },
  {
    label: "LOWER",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LOWER(str) -> VARCHAR",
    documentation: "Converts a string to lowercase.",
    snippet: "LOWER(${1:str})",
  },
  {
    label: "TRIM",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "TRIM(str) -> VARCHAR",
    documentation: "Removes leading and trailing whitespace characters.",
    snippet: "TRIM(${1:str})",
  },
  {
    label: "LTRIM",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LTRIM(str) -> VARCHAR",
    documentation: "Removes leading whitespace from a string.",
    snippet: "LTRIM(${1:str})",
  },
  {
    label: "RTRIM",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "RTRIM(str) -> VARCHAR",
    documentation: "Removes trailing whitespace from a string.",
    snippet: "RTRIM(${1:str})",
  },
  {
    label: "REPLACE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "REPLACE(str, from_str, to_str) -> VARCHAR",
    documentation: "Replaces all occurrences of from_str with to_str.",
    snippet: "REPLACE(${1:str}, ${2:from_str}, ${3:to_str})",
  },
  {
    label: "LEFT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LEFT(str, len) -> VARCHAR",
    documentation: "Extracts a given number of characters from the left side of a string.",
    snippet: "LEFT(${1:str}, ${2:len})",
  },
  {
    label: "RIGHT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "RIGHT(str, len) -> VARCHAR",
    documentation: "Extracts a given number of characters from the right side of a string.",
    snippet: "RIGHT(${1:str}, ${2:len})",
  },
  {
    label: "LPAD",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LPAD(str, len, pad_str) -> VARCHAR",
    documentation: "Left-pads a string with pad_str to total length len.",
    snippet: "LPAD(${1:str}, ${2:len}, '${3:0}')",
  },
  {
    label: "RPAD",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "RPAD(str, len, pad_str) -> VARCHAR",
    documentation: "Right-pads a string with pad_str to total length len.",
    snippet: "RPAD(${1:str}, ${2:len}, '${3:0}')",
  },

  // Math & Numeric Functions
  {
    label: "ROUND",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ROUND(number, [decimals = 0]) -> NUMERIC",
    documentation: "Rounds a number to a specified number of decimal places.",
    snippet: "ROUND(${1:number}, ${2:2})",
  },
  {
    label: "CEIL",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CEIL(number) -> INT",
    documentation: "Returns the smallest integer value greater than or equal to number.",
    snippet: "CEIL(${1:number})",
  },
  {
    label: "FLOOR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "FLOOR(number) -> INT",
    documentation: "Returns the largest integer value less than or equal to number.",
    snippet: "FLOOR(${1:number})",
  },
  {
    label: "ABS",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ABS(number) -> NUMERIC",
    documentation: "Returns the absolute value of a number.",
    snippet: "ABS(${1:number})",
  },
  {
    label: "MOD",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "MOD(n, m) -> INT",
    documentation: "Returns remainder of division of n by m.",
    snippet: "MOD(${1:n}, ${2:m})",
  },
  {
    label: "POWER",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "POWER(base, exp) -> NUMERIC",
    documentation: "Returns base raised to the power of exp.",
    snippet: "POWER(${1:base}, ${2:exp})",
  },
  {
    label: "SQRT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SQRT(number) -> NUMERIC",
    documentation: "Returns square root of a non-negative number.",
    snippet: "SQRT(${1:number})",
  },

  // Date & Time Functions
  {
    label: "NOW",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "NOW() -> TIMESTAMP",
    documentation: "Returns the current date and time.",
    snippet: "NOW()",
  },
  {
    label: "CURRENT_DATE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CURRENT_DATE -> DATE",
    documentation: "Returns current date.",
    snippet: "CURRENT_DATE",
  },
  {
    label: "CURRENT_TIME",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CURRENT_TIME -> TIME",
    documentation: "Returns current time.",
    snippet: "CURRENT_TIME",
  },
  {
    label: "CURRENT_TIMESTAMP",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CURRENT_TIMESTAMP -> TIMESTAMP",
    documentation: "Returns current timestamp.",
    snippet: "CURRENT_TIMESTAMP",
  },
  {
    label: "DATEDIFF",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DATEDIFF(date1, date2) -> INT",
    documentation: "Returns the difference in days between two date values.",
    snippet: "DATEDIFF(${1:date1}, ${2:date2})",
  },
  {
    label: "DATE_ADD",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DATE_ADD(date, INTERVAL expr unit) -> DATE/TIMESTAMP",
    documentation: "Adds a time/date interval to a date.",
    snippet: "DATE_ADD(${1:date}, INTERVAL ${2:1} ${3:DAY})",
  },
  {
    label: "DATE_SUB",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DATE_SUB(date, INTERVAL expr unit) -> DATE/TIMESTAMP",
    documentation: "Subtracts a time/date interval from a date.",
    snippet: "DATE_SUB(${1:date}, INTERVAL ${2:1} ${3:DAY})",
  },
  {
    label: "EXTRACT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "EXTRACT(unit FROM date) -> INT",
    documentation: "Extracts a single part (YEAR, MONTH, DAY, HOUR) from a date/time.",
    snippet: "EXTRACT(${1:YEAR} FROM ${2:date})",
  },
  {
    label: "DATE_FORMAT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DATE_FORMAT(date, format) -> VARCHAR",
    documentation: "Formats date value according to format string.",
    snippet: "DATE_FORMAT(${1:date}, '${2:%Y-%m-%d}')",
  },

  // Null & Conditional Functions
  {
    label: "COALESCE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "COALESCE(val1, val2, ...) -> ANY",
    documentation: "Returns the first non-null value in a list of expressions.",
    snippet: "COALESCE(${1:val1}, ${2:val2})",
  },
  {
    label: "IFNULL",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "IFNULL(expression, default_value) -> ANY",
    documentation: "Returns default_value if expression is NULL (MySQL/SQLite).",
    snippet: "IFNULL(${1:expression}, ${2:default_value})",
  },
  {
    label: "NULLIF",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "NULLIF(expr1, expr2) -> ANY",
    documentation: "Returns NULL if expr1 equals expr2, otherwise returns expr1.",
    snippet: "NULLIF(${1:expr1}, ${2:expr2})",
  },
  {
    label: "CAST",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CAST(expression AS target_type) -> target_type",
    documentation: "Converts an expression of one data type to another.",
    snippet: "CAST(${1:expression} AS ${2:INT})",
  },
  {
    label: "INSTR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "INSTR(string, substring) -> INT",
    documentation:
      "Returns the position of the first occurrence of substring in string (1-indexed).",
    snippet: "INSTR(${1:string}, ${2:substring})",
  },
  {
    label: "REVERSE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "REVERSE(string) -> VARCHAR",
    documentation: "Reverses a string and returns the result.",
    snippet: "REVERSE(${1:string})",
  },
  {
    label: "REPEAT",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "REPEAT(string, count) -> VARCHAR",
    documentation: "Repeats a string a specified number of times.",
    snippet: "REPEAT(${1:string}, ${2:count})",
  },
  {
    label: "GREATEST",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "GREATEST(val1, val2, ...) -> ANY",
    documentation: "Returns the largest value among all supplied arguments.",
    snippet: "GREATEST(${1:val1}, ${2:val2})",
  },
  {
    label: "LEAST",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LEAST(val1, val2, ...) -> ANY",
    documentation: "Returns the smallest value among all supplied arguments.",
    snippet: "LEAST(${1:val1}, ${2:val2})",
  },
  {
    label: "SIGN",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SIGN(number) -> INT",
    documentation:
      "Returns -1, 0, or 1 depending on whether number is negative, zero, or positive.",
    snippet: "SIGN(${1:number})",
  },
  {
    label: "TRUNCATE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "TRUNCATE(number, decimals) -> NUMERIC",
    documentation: "Truncates number to specified decimal places without rounding.",
    snippet: "TRUNCATE(${1:number}, ${2:0})",
  },
  {
    label: "EXP",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "EXP(number) -> NUMERIC",
    documentation: "Returns e raised to the power of number.",
    snippet: "EXP(${1:number})",
  },
  {
    label: "LN",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LN(number) -> NUMERIC",
    documentation: "Returns the natural logarithm of number.",
    snippet: "LN(${1:number})",
  },
  {
    label: "LOG",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "LOG(base, number) -> NUMERIC",
    documentation: "Returns the logarithm of number to specified base.",
    snippet: "LOG(${1:10}, ${2:number})",
  },
  {
    label: "YEAR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "YEAR(date) -> INT",
    documentation: "Returns the four-digit year for a given date value.",
    snippet: "YEAR(${1:date})",
  },
  {
    label: "MONTH",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "MONTH(date) -> INT",
    documentation: "Returns the month (1 to 12) for a given date value.",
    snippet: "MONTH(${1:date})",
  },
  {
    label: "DAY",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DAY(date) -> INT",
    documentation: "Returns the day of the month (1 to 31) for a given date value.",
    snippet: "DAY(${1:date})",
  },
  {
    label: "HOUR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "HOUR(time) -> INT",
    documentation: "Returns the hour portion (0 to 23) of a time/datetime value.",
    snippet: "HOUR(${1:time})",
  },
  {
    label: "MINUTE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "MINUTE(time) -> INT",
    documentation: "Returns the minute portion (0 to 59) of a time/datetime value.",
    snippet: "MINUTE(${1:time})",
  },
  {
    label: "SECOND",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "SECOND(time) -> INT",
    documentation: "Returns the second portion (0 to 59) of a time/datetime value.",
    snippet: "SECOND(${1:time})",
  },
  {
    label: "DATE_TRUNC",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "DATE_TRUNC(unit, timestamp) -> TIMESTAMP",
    documentation:
      "Truncates timestamp to specified precision e.g. 'day', 'month', 'year' (PostgreSQL).",
    snippet: "DATE_TRUNC('${1:month}', ${2:timestamp})",
  },
  {
    label: "TO_CHAR",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "TO_CHAR(value, format) -> VARCHAR",
    documentation:
      "Converts timestamp, date, or number to string according to format (PostgreSQL/Oracle).",
    snippet: "TO_CHAR(${1:value}, '${2:YYYY-MM-DD}')",
  },
  {
    label: "TO_DATE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "TO_DATE(string, format) -> DATE",
    documentation: "Converts formatted string to date (PostgreSQL/Oracle).",
    snippet: "TO_DATE(${1:string}, '${2:YYYY-MM-DD}')",
  },
  {
    label: "CUME_DIST",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "CUME_DIST() OVER ([PARTITION BY col] ORDER BY col) -> NUMERIC",
    documentation:
      "Calculates the cumulative distribution of a value in a partition (0 < value <= 1).",
    snippet: "CUME_DIST() OVER (ORDER BY ${1:col})",
  },
  {
    label: "PERCENT_RANK",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "PERCENT_RANK() OVER ([PARTITION BY col] ORDER BY col) -> NUMERIC",
    documentation: "Calculates the relative rank of row within partition (0 to 1).",
    snippet: "PERCENT_RANK() OVER (ORDER BY ${1:col})",
  },
  {
    label: "NTH_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "NTH_VALUE(expression, n) OVER ([PARTITION BY col] ORDER BY col)",
    documentation: "Returns value of expression evaluated at the nth row of window frame.",
    snippet: "NTH_VALUE(${1:expression}, ${2:2}) OVER (ORDER BY ${3:col})",
  },
];

// --- SQL Snippets ----------------------------------------------------------------------

export const SQL_SNIPPETS = [
  {
    label: "select",
    insertText: "SELECT ${1:*}\nFROM ${2:table_name};",
    detail: "SELECT * FROM ...",
    documentation: "Basic SELECT query statement.",
  },
  {
    label: "selectwhere",
    insertText: "SELECT ${1:*}\nFROM ${2:table_name}\nWHERE ${3:condition};",
    detail: "SELECT * FROM ... WHERE ...",
    documentation: "SELECT statement with WHERE filter clause.",
  },
  {
    label: "insert",
    insertText: "INSERT INTO ${1:table_name} (${2:columns})\nVALUES (${3:values});",
    detail: "INSERT INTO ... VALUES (...)",
    documentation: "Insert rows into a table.",
  },
  {
    label: "update",
    insertText: "UPDATE ${1:table_name}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};",
    detail: "UPDATE ... SET ... WHERE ...",
    documentation: "Update existing rows in a table.",
  },
  {
    label: "delete",
    insertText: "DELETE FROM ${1:table_name}\nWHERE ${2:condition};",
    detail: "DELETE FROM ... WHERE ...",
    documentation: "Delete rows from a table.",
  },
  {
    label: "createtable",
    insertText:
      "CREATE TABLE ${1:table_name} (\n    ${2:id} INT PRIMARY KEY,\n    ${3:name} VARCHAR(100) NOT NULL,\n    ${4:created_at} TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);",
    detail: "CREATE TABLE ... (...)",
    documentation: "Create table statement with standard columns.",
  },
  {
    label: "join",
    insertText:
      "SELECT ${1:a.*}, ${2:b.*}\nFROM ${3:table1} AS ${4:a}\nINNER JOIN ${5:table2} AS ${6:b} ON ${4:a}.${7:id} = ${6:b}.${7:id};",
    detail: "INNER JOIN table ON ...",
    documentation: "INNER JOIN two tables on matching column.",
  },
  {
    label: "leftjoin",
    insertText:
      "SELECT ${1:a.*}, ${2:b.*}\nFROM ${3:table1} AS ${4:a}\nLEFT JOIN ${5:table2} AS ${6:b} ON ${4:a}.${7:id} = ${6:b}.${7:id};",
    detail: "LEFT JOIN table ON ...",
    documentation: "LEFT JOIN two tables on matching column.",
  },
  {
    label: "groupby",
    insertText:
      "SELECT ${1:category}, COUNT(*) AS total_count\nFROM ${2:table_name}\nGROUP BY ${1:category}\nHAVING COUNT(*) > ${3:1};",
    detail: "GROUP BY ... HAVING ...",
    documentation: "Aggregate group by and having query.",
  },
  {
    label: "cte",
    insertText:
      "WITH ${1:cte_name} AS (\n    SELECT ${2:*}\n    FROM ${3:table_name}\n    WHERE ${4:condition}\n)\nSELECT *\nFROM ${1:cte_name};",
    detail: "WITH cte AS (...) SELECT ...",
    documentation: "Common Table Expression (CTE) query.",
  },
  {
    label: "window",
    insertText:
      "SELECT ${1:col},\n       ROW_NUMBER() OVER (PARTITION BY ${2:partition_col} ORDER BY ${3:order_col}) AS row_num\nFROM ${4:table_name};",
    detail: "ROW_NUMBER() OVER (...) ...",
    documentation: "Window function with partition and order by.",
  },
  {
    label: "case",
    insertText: "CASE\n    WHEN ${1:condition} THEN ${2:result}\n    ELSE ${3:default_val}\nEND",
    detail: "CASE WHEN ... THEN ... ELSE ... END",
    documentation: "Conditional CASE statement expression.",
  },
];

// --- Comment & String Shielding --------------------------------------------------------

/**
 * Strips single-line comments (-- ... and # ...) while respecting string literals.
 */
export function stripSqlComment(line: string): string {
  let inString: string | null = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inString !== null) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inString) {
        // In standard SQL, escaped quotes are doubled: ''
        if (i + 1 < line.length && line[i + 1] === inString) {
          i++;
          continue;
        }
        inString = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inString = ch;
      continue;
    }

    // Check single-line comment --
    if (ch === "-" && i + 1 < line.length && line[i + 1] === "-") {
      return line.slice(0, i);
    }
    // Check single-line comment # (MySQL specific)
    if (ch === "#") {
      return line.slice(0, i);
    }
  }

  return line;
}

/**
 * Strips comments and strings from multi-line code for clean syntax and symbol parsing,
 * preserving line numbers and whitespace offsets without regex collision bugs.
 */
export function stripSqlCommentsAndStrings(code: string): string {
  let result = "";
  let inQuote: string | null = null;
  let inBlockComment = false;
  let inLineComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && i + 1 < code.length && code[i + 1] === "/") {
        inBlockComment = false;
        result += "  ";
        i++;
      } else {
        result += ch === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (inQuote !== null) {
      if (ch === "\\" && i + 1 < code.length) {
        result += "  ";
        i++;
        continue;
      }
      if (ch === inQuote) {
        if (i + 1 < code.length && code[i + 1] === inQuote) {
          result += "  ";
          i++;
          continue;
        }
        inQuote = null;
        result += " ";
        continue;
      }
      result += ch === "\n" ? "\n" : " ";
      continue;
    }

    // Check comment start
    if ((ch === "-" && i + 1 < code.length && code[i + 1] === "-") || ch === "#") {
      inLineComment = true;
      result += "  ";
      if (ch === "-") i++;
      continue;
    }

    if (ch === "/" && i + 1 < code.length && code[i + 1] === "*") {
      inBlockComment = true;
      result += "  ";
      i++;
      continue;
    }

    // Check string literal start (in SQL, string literals are single-quoted '...')
    if (ch === "'") {
      inQuote = ch;
      result += " ";
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Checks whether the cursor position is inside a SQL comment or string literal.
 */
export function getSqlContextAtPosition(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.IPosition,
): { inComment: boolean; inString: boolean } {
  const startLine = Math.max(1, position.lineNumber - 50);
  const precedingText = model.getValueInRange({
    startLineNumber: startLine,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  let inQuote: string | null = null;
  let inBlockComment = false;
  let inLineComment = false;

  for (let i = 0; i < precedingText.length; i++) {
    const ch = precedingText[i];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && i + 1 < precedingText.length && precedingText[i + 1] === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inQuote !== null) {
      if (ch === "\\" && i + 1 < precedingText.length) {
        i++;
        continue;
      }
      if (ch === inQuote) {
        if (i + 1 < precedingText.length && precedingText[i + 1] === inQuote) {
          i++;
          continue;
        }
        inQuote = null;
      }
      continue;
    }

    if (
      (ch === "-" && i + 1 < precedingText.length && precedingText[i + 1] === "-") ||
      ch === "#"
    ) {
      inLineComment = true;
      continue;
    }

    if (ch === "/" && i + 1 < precedingText.length && precedingText[i + 1] === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inQuote = ch;
      continue;
    }
  }

  return {
    inComment: inLineComment || inBlockComment,
    inString: inQuote !== null,
  };
}

export function isInsideSqlComment(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.IPosition,
): boolean {
  return getSqlContextAtPosition(model, position).inComment;
}

export function isInsideSqlCommentOrString(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.IPosition,
): boolean {
  const ctx = getSqlContextAtPosition(model, position);
  return ctx.inComment || ctx.inString;
}

// --- Document Schema & Table / Column Extraction ---------------------------------------

export interface SqlColumnDef {
  name: string;
  type: string;
  isPrimary?: boolean;
}

export interface SqlTableDef {
  name: string;
  columns: SqlColumnDef[];
  line: number;
}

/**
 * Parses `CREATE TABLE` and CTE statements in the document to discover
 * tables and their defined columns with balanced parenthesis matching.
 */
export function parseSqlDocumentTables(
  model: monacoDefault.editor.ITextModel,
): Map<string, SqlTableDef> {
  const fullText = model.getValue();
  const cleaned = stripSqlCommentsAndStrings(fullText);
  const tables = new Map<string, SqlTableDef>();

  // 1. CREATE TABLE / CREATE TEMPORARY TABLE / CREATE TABLE IF NOT EXISTS
  const createTableRegex =
    /\bCREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|")?(?:[a-zA-Z_]\w*\.)?([a-zA-Z_]\w*)(?:`|")?\s*\(/gi;

  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(cleaned)) !== null) {
    const rawTableName = match[1];
    const tableName = rawTableName.toLowerCase();
    const parenStart = match.index + match[0].length - 1;

    // Balance parentheses to extract the exact table body
    let depth = 0;
    let parenEnd = -1;
    for (let i = parenStart; i < cleaned.length; i++) {
      if (cleaned[i] === "(") {
        depth++;
      } else if (cleaned[i] === ")") {
        depth--;
        if (depth === 0) {
          parenEnd = i;
          break;
        }
      }
    }

    if (parenEnd === -1) continue;
    createTableRegex.lastIndex = parenEnd + 1;

    const body = cleaned.slice(parenStart + 1, parenEnd);
    const columns: SqlColumnDef[] = [];
    const colEntries = splitTopLevelCommas(body);

    // Track table-level primary keys, e.g. PRIMARY KEY (col1, col2)
    const tablePrimaryKeys = new Set<string>();

    for (const entry of colEntries) {
      const trimmed = entry.trim();
      if (!trimmed) continue;

      const pkMatch = trimmed.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkCols = pkMatch[1]
          .split(",")
          .map((c) => c.trim().replace(/[`"]/g, "").toLowerCase());
        for (const pk of pkCols) tablePrimaryKeys.add(pk);
        continue;
      }

      // Skip constraints
      if (/^(?:FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK|KEY|INDEX)\b/i.test(trimmed)) {
        continue;
      }

      // Column pattern: `colName` TYPE [CONSTRAINTS]
      const colMatch = trimmed.match(
        /^(?:`|")?([a-zA-Z_]\w*)(?:`|")?\s+([a-zA-Z_]\w*(?:\s*\([^)]*\))?)/,
      );
      if (colMatch) {
        const cName = colMatch[1];
        const cType = colMatch[2].toUpperCase();
        const isPrimary = /\bPRIMARY\s+KEY\b/i.test(trimmed);

        if (
          !SQL_KEYWORD_SET.has(cName.toUpperCase()) &&
          !SQL_CLAUSE_KEYWORDS.has(cName.toUpperCase())
        ) {
          columns.push({
            name: cName,
            type: cType,
            isPrimary,
          });
        }
      }
    }

    // Apply table-level primary keys
    if (tablePrimaryKeys.size > 0) {
      for (const col of columns) {
        if (tablePrimaryKeys.has(col.name.toLowerCase())) {
          col.isPrimary = true;
        }
      }
    }

    tables.set(tableName, {
      name: rawTableName,
      columns,
      line: model.getPositionAt ? model.getPositionAt(match.index).lineNumber : 1,
    });
  }

  // 2. CTEs: WITH [RECURSIVE] cte_name AS (...)
  const cteRegex = /\bWITH\s+(?:RECURSIVE\s+)?(?:`|")?([a-zA-Z_]\w*)(?:`|")?\s+AS\s*\(/gi;
  let cteMatch: RegExpExecArray | null;
  while ((cteMatch = cteRegex.exec(cleaned)) !== null) {
    const cteName = cteMatch[1];
    if (!tables.has(cteName.toLowerCase()) && !SQL_KEYWORD_SET.has(cteName.toUpperCase())) {
      tables.set(cteName.toLowerCase(), {
        name: cteName,
        columns: [],
        line: model.getPositionAt ? model.getPositionAt(cteMatch.index).lineNumber : 1,
      });
    }
  }

  return tables;
}

export const SQL_CLAUSE_KEYWORDS = new Set([
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "CROSS",
  "OUTER",
  "NATURAL",
  "ON",
  "USING",
  "GROUP",
  "ORDER",
  "BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "FETCH",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "WINDOW",
  "PARTITION",
  "SET",
  "VALUES",
  "SELECT",
  "RETURNING",
  "QUALIFY",
  "AND",
  "OR",
  "NOT",
  "AS",
  "IN",
  "IS",
  "FOR",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "FROM",
  "TABLE",
  "VIEW",
  "INTO",
]);

/**
 * Extracts table aliases defined in the active query around cursor line.
 * e.g. `FROM students s JOIN marks m ON ...` -> { s: "students", m: "marks" }
 */
export function extractSqlAliases(queryText: string): Map<string, string> {
  const aliases = new Map<string, string>();
  const cleaned = stripSqlCommentsAndStrings(queryText);

  // 1. Match FROM and JOIN clauses: FROM table [AS] alias or JOIN table [AS] alias
  const fromJoinRegex =
    /\b(?:FROM|(?:(?:LEFT|RIGHT|FULL|INNER|CROSS|NATURAL)(?:\s+OUTER)?\s+)?JOIN)\s+(?:`|")?(?:[a-zA-Z_]\w*\.)?([a-zA-Z_]\w*)(?:`|")?(?:\s+(?:AS\s+)?(?:`|")?([a-zA-Z_]\w*)(?:`|")?)?/gi;

  let match: RegExpExecArray | null;
  while ((match = fromJoinRegex.exec(cleaned)) !== null) {
    const table = match[1];
    const alias = match[2];

    if (
      alias &&
      !SQL_KEYWORD_SET.has(alias.toUpperCase()) &&
      !SQL_CLAUSE_KEYWORDS.has(alias.toUpperCase())
    ) {
      aliases.set(alias.toLowerCase(), table.toLowerCase());
    }
  }

  // 2. Comma-separated tables in FROM clause: FROM table1 t1, table2 t2
  const fromClauseRegex =
    /\bFROM\s+([^;]+?)(?:\b(?:WHERE|GROUP|ORDER|HAVING|LIMIT|WINDOW|UNION)\b|;|\)|$)/gi;
  let fromMatch: RegExpExecArray | null;
  while ((fromMatch = fromClauseRegex.exec(cleaned)) !== null) {
    const fromBody = fromMatch[1];
    const tableItems = splitTopLevelCommas(fromBody);
    for (const item of tableItems) {
      const itemTrimmed = item.trim();
      const m = itemTrimmed.match(
        /^(?:`|")?(?:[a-zA-Z_]\w*\.)?([a-zA-Z_]\w*)(?:`|")?(?:\s+(?:AS\s+)?(?:`|")?([a-zA-Z_]\w*)(?:`|")?)?$/i,
      );
      if (m && m[2]) {
        const t = m[1];
        const a = m[2];
        if (!SQL_KEYWORD_SET.has(a.toUpperCase()) && !SQL_CLAUSE_KEYWORDS.has(a.toUpperCase())) {
          aliases.set(a.toLowerCase(), t.toLowerCase());
        }
      }
    }
  }

  return aliases;
}

function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(") {
      parenDepth++;
      current += ch;
    } else if (ch === ")") {
      if (parenDepth > 0) parenDepth--;
      current += ch;
    } else if (ch === "," && parenDepth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    parts.push(current);
  }
  return parts;
}

export const SQL_KEYWORD_SET = new Set(SQL_KEYWORDS.map((k) => k.toUpperCase()));
export const SQL_FUNCTION_SET = new Set(SQL_FUNCTIONS.map((f) => f.label.toUpperCase()));

// Control keywords followed by parentheses that must NOT trigger fake signatures
export const NON_FUNCTION_CALL_KEYWORDS = new Set([
  "VALUES",
  "IN",
  "NOT IN",
  "EXISTS",
  "NOT EXISTS",
  "CREATE TABLE",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "KEY",
  "INDEX",
  "UNIQUE",
  "CHECK",
  "PARTITION BY",
  "ORDER BY",
  "GROUP BY",
  "BY",
  "TABLE",
  "VIEW",
  "SELECT",
  "FROM",
  "WHERE",
  "SET",
  "AS",
  "ON",
  "HAVING",
  "LIKE",
  "BETWEEN",
  "AND",
  "OR",
  "NOT",
  "ALL",
  "ANY",
  "SOME",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "WITH",
  "JOIN",
  "OVER",
  "LIMIT",
  "OFFSET",
  "INTO",
]);

// --- Helpers --------------------------------------------------------------------------

export function deduplicateSuggestions(
  items: monacoDefault.languages.CompletionItem[],
): monacoDefault.languages.CompletionItem[] {
  const seen = new Set<string>();
  const unique: monacoDefault.languages.CompletionItem[] = [];

  for (const item of items) {
    const insertKey =
      typeof item.insertText === "string" ? item.insertText : JSON.stringify(item.insertText);
    const key = `${item.label.toString().toUpperCase()}|${item.kind ?? ""}|${insertKey}|${item.detail ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}
// --- Monaco Registration ---------------------------------------------------------------

const registeredMonacoInstances = new WeakSet<object>();

/**
 * Registers offline autocomplete suggestions, SQL standard functions,
 * table/alias column member completions, hover tooltips, and signature help for SQL in Monaco.
 */
export function registerSqlCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (registeredMonacoInstances.has(m)) return;
  registeredMonacoInstances.add(m);

  const SQL_LANGUAGES = ["sql", "mysql", "pgsql"];

  for (const lang of SQL_LANGUAGES) {
    // 1. Completion Provider
    m.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: [".", " "],
      provideCompletionItems(model, position) {
        if (isInsideSqlCommentOrString(model, position)) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range: monacoDefault.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeWord = lineContent.slice(0, word.startColumn - 1);
        const textBeforeWordTrimmed = textBeforeWord.trimEnd();

        // Check if typing after a dot `.` (e.g. `u.`, `students.`, `table.`)
        if (textBeforeWordTrimmed.endsWith(".")) {
          // If preceded by a numeric literal (e.g. 5. or 10.5. or 10 .), do not suggest columns.
          // Preceding character must NOT be an identifier word character (e.g. t0. or table1. must not match).
          if (/(?:^|[^\w])\d+(?:\.\d+)?\s*\.$/.test(textBeforeWordTrimmed)) {
            return { suggestions: [] };
          }

          const dotPrefix = textBeforeWordTrimmed.slice(0, -1).trim();
          const targetMatch = dotPrefix.match(/(?:`|")?([a-zA-Z_]\w*)(?:`|")?$/);
          if (!targetMatch) return { suggestions: [] };

          const target = targetMatch[1].toLowerCase();
          const docTables = parseSqlDocumentTables(model);

          // Check if target is an alias in the document
          const fullDoc = model.getValue();
          const aliases = extractSqlAliases(fullDoc);
          const resolvedTableName = aliases.get(target) ?? target;

          const tableDef = docTables.get(resolvedTableName);
          if (tableDef) {
            const colSuggestions: monacoDefault.languages.CompletionItem[] = tableDef.columns.map(
              (c) => ({
                label: c.name,
                kind: m.languages.CompletionItemKind.Field,
                insertText: c.name,
                detail: `${c.type} (${tableDef.name}.${c.name})`,
                documentation: c.isPrimary ? "PRIMARY KEY column" : `Column of ${tableDef.name}`,
                range,
                sortText: `0_${c.name}`,
              }),
            );

            return {
              suggestions: deduplicateSuggestions(colSuggestions),
            };
          }

          // If unknown table or alias, do not suggest misleading items
          return { suggestions: [] };
        }

        // Context trigger: check if user is typing immediately after FROM, JOIN, INTO, UPDATE, TABLE
        const isTableContext = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+([a-zA-Z0-9_]*)$/i.test(
          textBeforeWord,
        );

        const docTables = parseSqlDocumentTables(model);
        const tableSuggestions: monacoDefault.languages.CompletionItem[] = [];
        const columnSuggestions: monacoDefault.languages.CompletionItem[] = [];

        for (const [, tbl] of docTables) {
          tableSuggestions.push({
            label: tbl.name,
            kind: m.languages.CompletionItemKind.Class,
            insertText: tbl.name,
            detail: `table ${tbl.name} (${tbl.columns.length} columns)`,
            range,
            sortText: isTableContext ? `0_${tbl.name}` : `1_${tbl.name}`,
          });

          if (!isTableContext) {
            for (const c of tbl.columns) {
              columnSuggestions.push({
                label: c.name,
                kind: m.languages.CompletionItemKind.Field,
                insertText: c.name,
                detail: `${c.type} (${tbl.name}.${c.name})`,
                range,
                sortText: `1_${c.name}`,
              });
            }
          }
        }

        if (isTableContext) {
          return {
            suggestions: deduplicateSuggestions(tableSuggestions),
          };
        }

        // Standard SQL keyword suggestions
        const keywordSuggestions: monacoDefault.languages.CompletionItem[] = SQL_KEYWORDS.map(
          (kw) => ({
            label: kw,
            kind: m.languages.CompletionItemKind.Keyword,
            insertText: kw,
            detail: `keyword ${kw}`,
            range,
            sortText: `2_${kw}`,
          }),
        );

        // SQL Data Types
        const typeSuggestions: monacoDefault.languages.CompletionItem[] = SQL_DATA_TYPES.map(
          (t) => ({
            label: t.name,
            kind: m.languages.CompletionItemKind.TypeParameter,
            insertText: t.name,
            detail: `type ${t.name}`,
            documentation: t.doc,
            range,
            sortText: `2_${t.name}`,
          }),
        );

        // SQL Functions
        const functionSuggestions: monacoDefault.languages.CompletionItem[] = SQL_FUNCTIONS.map(
          (fn) => ({
            label: fn.label,
            kind: fn.kind ?? m.languages.CompletionItemKind.Function,
            insertText: fn.snippet ?? fn.label,
            insertTextRules: fn.snippet
              ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            detail: fn.detail,
            documentation: fn.documentation,
            range,
            sortText: `1_${fn.label}`,
          }),
        );

        // SQL Snippets
        const snippetSuggestions: monacoDefault.languages.CompletionItem[] = SQL_SNIPPETS.map(
          (snip) => ({
            label: snip.label,
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: snip.insertText,
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: snip.detail,
            documentation: snip.documentation,
            range,
            sortText: `0_${snip.label}`,
          }),
        );

        return {
          suggestions: deduplicateSuggestions([
            ...snippetSuggestions,
            ...tableSuggestions,
            ...columnSuggestions,
            ...functionSuggestions,
            ...typeSuggestions,
            ...keywordSuggestions,
          ]),
        };
      },
    });

    // 2. Hover Provider
    m.languages.registerHoverProvider(lang, {
      provideHover(model, position) {
        if (isInsideSqlCommentOrString(model, position)) {
          return null;
        }

        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const lineContent = model.getLineContent(position.lineNumber);
        const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();
        const wordUpper = word.word.toUpperCase();

        // 1. Check if hovering over `alias.column` or `table.column`
        if (textBefore.endsWith(".")) {
          const targetMatch = textBefore
            .slice(0, -1)
            .trim()
            .match(/(?:`|")?([a-zA-Z_]\w*)(?:`|")?$/);
          if (targetMatch) {
            const target = targetMatch[1].toLowerCase();
            const fullDoc = model.getValue();
            const aliases = extractSqlAliases(fullDoc);
            const resolvedTable = aliases.get(target) ?? target;
            const docTables = parseSqlDocumentTables(model);
            const tbl = docTables.get(resolvedTable);
            if (tbl) {
              const col = tbl.columns.find((c) => c.name.toLowerCase() === word.word.toLowerCase());
              if (col) {
                return {
                  range: new m.Range(
                    position.lineNumber,
                    word.startColumn,
                    position.lineNumber,
                    word.endColumn,
                  ),
                  contents: [
                    { value: `\`\`\`sql\n${tbl.name}.${col.name}: ${col.type}\n\`\`\`` },
                    {
                      value: col.isPrimary
                        ? "*PRIMARY KEY column of table.*"
                        : `*Column of table ${tbl.name}.*`,
                    },
                  ],
                };
              }
            }
          }
        }

        // 2. Check document tables
        const docTables = parseSqlDocumentTables(model);
        const tbl = docTables.get(word.word.toLowerCase());
        if (tbl && !textBefore.endsWith(".")) {
          const colList = tbl.columns
            .map((c) => `  ${c.name} ${c.type}${c.isPrimary ? " PRIMARY KEY" : ""}`)
            .join("\n");
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`sql\nCREATE TABLE ${tbl.name} (\n${colList}\n);\n\`\`\`` },
              { value: `*User-defined table declared on line ${tbl.line}.*` },
            ],
          };
        }

        // 3. Check SQL built-in functions
        const fnMatch = SQL_FUNCTIONS.find((fn) => fn.label.toUpperCase() === wordUpper);
        if (fnMatch && !textBefore.endsWith(".")) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`sql\n${fnMatch.detail ?? fnMatch.label}\n\`\`\`` },
              { value: fnMatch.documentation ?? "" },
            ],
          };
        }

        // 4. Check SQL data types
        const typeMatch = SQL_DATA_TYPES.find((t) => t.name.toUpperCase() === wordUpper);
        if (typeMatch && !textBefore.endsWith(".")) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`sql\ntype ${typeMatch.name}\n\`\`\`` },
              { value: typeMatch.doc },
            ],
          };
        }

        // 5. Check SQL keywords
        if (SQL_KEYWORD_SET.has(wordUpper) && !textBefore.endsWith(".")) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`sql\nkeyword ${wordUpper}\n\`\`\`` },
              { value: `Standard SQL statement keyword.` },
            ],
          };
        }

        // 6. Check user-defined table columns (unqualified)
        for (const [, tblDef] of docTables) {
          const col = tblDef.columns.find((c) => c.name.toLowerCase() === word.word.toLowerCase());
          if (col && !textBefore.endsWith(".")) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`sql\n${tblDef.name}.${col.name}: ${col.type}\n\`\`\`` },
                {
                  value: col.isPrimary
                    ? `*PRIMARY KEY column of table ${tblDef.name}.*`
                    : `*Column of table ${tblDef.name}.*`,
                },
              ],
            };
          }
        }

        return null;
      },
    });

    // 3. Signature Help Provider
    m.languages.registerSignatureHelpProvider(lang, {
      signatureHelpTriggerCharacters: ["(", ","],
      provideSignatureHelp(model, position) {
        if (isInsideSqlComment(model, position)) {
          return null;
        }

        const startLine = Math.max(1, position.lineNumber - 50);
        const textBefore = model.getValueInRange({
          startLineNumber: startLine,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Parse from left to right tracking quotes, parens, and comments
        const blockStack: { char: string; openIdx: number; argCount: number }[] = [];
        let inQuote: string | null = null;
        let inBlockComment = false;

        for (let i = 0; i < textBefore.length; i++) {
          const ch = textBefore[i];

          if (inBlockComment) {
            if (ch === "*" && i + 1 < textBefore.length && textBefore[i + 1] === "/") {
              inBlockComment = false;
              i++;
            }
            continue;
          }

          if (inQuote !== null) {
            if (ch === "\\" && i + 1 < textBefore.length) {
              i++;
              continue;
            }
            if (ch === inQuote) {
              if (i + 1 < textBefore.length && textBefore[i + 1] === inQuote) {
                i++;
                continue;
              }
              inQuote = null;
            }
            continue;
          }

          if (ch === "'" || ch === '"' || ch === "`") {
            inQuote = ch;
            continue;
          }

          if (
            (ch === "-" && i + 1 < textBefore.length && textBefore[i + 1] === "-") ||
            ch === "#"
          ) {
            while (i < textBefore.length && textBefore[i] !== "\n") {
              i++;
            }
            continue;
          }

          if (ch === "/" && i + 1 < textBefore.length && textBefore[i + 1] === "*") {
            inBlockComment = true;
            i++;
            continue;
          }

          if (ch === "(") {
            blockStack.push({ char: "(", openIdx: i, argCount: 0 });
          } else if (ch === ")") {
            if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
              blockStack.pop();
            }
          } else if (ch === ",") {
            if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
              blockStack[blockStack.length - 1].argCount++;
            }
          }
        }

        if (blockStack.length === 0) return null;
        const top = blockStack[blockStack.length - 1];
        if (top.char !== "(") return null;

        // Extract call expression preceding '('
        const callPrefix = textBefore.slice(0, top.openIdx).trimEnd();
        const callMatch = callPrefix.match(/(?:^|[^\w.:])([a-zA-Z_]\w*)$/);
        if (!callMatch) return null;

        const fnName = callMatch[1].toUpperCase();

        // Safe keyword suppression: VALUES, IN, EXISTS, CREATE TABLE, etc. must never produce fake signatures
        if (NON_FUNCTION_CALL_KEYWORDS.has(fnName)) {
          return null;
        }

        const fnFound = SQL_FUNCTIONS.find((f) => f.label.toUpperCase() === fnName);
        if (fnFound && fnFound.detail) {
          const parenMatch = fnFound.detail.match(/\(([^)]*)\)/);
          const paramsRaw = parenMatch ? parenMatch[1].trim() : "";
          const paramList = paramsRaw ? paramsRaw.split(",").map((p) => p.trim()) : [];

          return {
            value: {
              signatures: [
                {
                  label: fnFound.detail,
                  documentation: fnFound.documentation,
                  parameters: paramList.map((p) => ({ label: p })),
                },
              ],
              activeSignature: 0,
              activeParameter: Math.min(top.argCount, Math.max(0, paramList.length - 1)),
            },
            dispose: () => {},
          };
        }

        return null;
      },
    });
  }
}
