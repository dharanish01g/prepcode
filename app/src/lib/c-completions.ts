import * as monacoDefault from "monaco-editor";
import {
  type CompletionItemDef,
  deduplicateSuggestions,
  toCompletionItems,
} from "./completion-utils.ts";

type Monaco = typeof monacoDefault;

export type { CompletionItemDef };

// --- Standard C Headers ----------------------------------------------------------------

export interface CHeaderDef {
  name: string;
  detail: string;
  documentation: string;
}

export const C_STANDARD_HEADERS: CHeaderDef[] = [
  {
    name: "stdio.h",
    detail: "<stdio.h> - Standard Input and Output",
    documentation:
      "Core C input/output library providing printf, scanf, fopen, fclose, fread, fwrite, fgets, fputs, and standard streams (stdin, stdout, stderr).",
  },
  {
    name: "stdlib.h",
    detail: "<stdlib.h> - Standard General Utilities",
    documentation:
      "Memory management (malloc, calloc, realloc, free), program termination (exit, abort), random numbers (rand, srand), search/sort (qsort, bsearch), and conversions (atoi, strtol).",
  },
  {
    name: "string.h",
    detail: "<string.h> - String & Memory Manipulation",
    documentation:
      "Null-terminated C-string operations (strlen, strcpy, strcmp, strcat, strstr, strtok) and raw memory operations (memset, memcpy, memmove, memcmp).",
  },
  {
    name: "math.h",
    detail: "<math.h> - Mathematical Functions",
    documentation:
      "Common mathematical computations including sqrt, pow, fabs, ceil, floor, round, fmax, fmin, sin, cos, tan, log, exp, and fmod.",
  },
  {
    name: "stdbool.h",
    detail: "<stdbool.h> - Boolean Type and Values",
    documentation:
      "Defines the bool type (expanding to _Bool) and the macros true (1) and false (0).",
  },
  {
    name: "stdint.h",
    detail: "<stdint.h> - Fixed-Width Integer Types",
    documentation:
      "Defines exact-width integer types such as int8_t, int16_t, int32_t, int64_t, uint8_t, uint16_t, uint32_t, uint64_t, size_t, and their corresponding limits.",
  },
  {
    name: "limits.h",
    detail: "<limits.h> - Integer Type Limits",
    documentation:
      "Defines constants for maximum and minimum values of fundamental integer types: INT_MAX, INT_MIN, LONG_MAX, LLONG_MAX, CHAR_BIT, etc.",
  },
  {
    name: "float.h",
    detail: "<float.h> - Floating-Point Limits",
    documentation:
      "Defines implementation-dependent characteristics and limits of floating-point types: FLT_MIN, FLT_MAX, DBL_MIN, DBL_MAX, DBL_EPSILON.",
  },
  {
    name: "ctype.h",
    detail: "<ctype.h> - Character Handling Functions",
    documentation:
      "Functions for character testing and classification: isalpha, isdigit, isalnum, isspace, isupper, islower, toupper, tolower.",
  },
  {
    name: "assert.h",
    detail: "<assert.h> - Diagnostics Macro",
    documentation:
      "Defines the assert macro for debugging and verifying runtime invariants. Disabled if NDEBUG is defined.",
  },
  {
    name: "time.h",
    detail: "<time.h> - Date and Time Handling",
    documentation:
      "Time manipulation functions and types: time, clock, difftime, mktime, localtime, time_t, clock_t, and CLOCKS_PER_SEC.",
  },
  {
    name: "stddef.h",
    detail: "<stddef.h> - Standard Type Definitions",
    documentation: "Common types and macros: NULL, size_t, ptrdiff_t, offsetof, and wchar_t.",
  },
  {
    name: "errno.h",
    detail: "<errno.h> - System Error Numbers",
    documentation:
      "Defines errno and integer macros for reporting error conditions (e.g., EDOM, ERANGE).",
  },
  {
    name: "stdarg.h",
    detail: "<stdarg.h> - Variable Arguments",
    documentation:
      "Macros for handling variadic functions: va_list, va_start, va_arg, va_end, va_copy.",
  },
];

// --- Standard C Library Functions ------------------------------------------------------

export const STDIO_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "printf",
    detail: "int printf(const char *format, ...)",
    documentation:
      "Prints formatted output to standard output (stdout).\n\nFormat specifiers:\n- %d, %i: signed decimal integer\n- %u: unsigned decimal integer\n- %f: floating point decimal\n- %s: null-terminated string\n- %c: character\n- %p: pointer address\n- %lld: long long int\n- %lf: double",
    snippet: 'printf("${1:%d}\\n", ${2:val});',
  },
  {
    label: "scanf",
    detail: "int scanf(const char *format, ...)",
    documentation:
      "Reads formatted data from standard input (stdin). Remember to pass pointer addresses (e.g. &val).",
    snippet: 'scanf("${1:%d}", &${2:val});',
  },
  {
    label: "sprintf",
    detail: "int sprintf(char *str, const char *format, ...)",
    documentation:
      "Writes formatted data to string buffer str. Note: Consider snprintf to prevent buffer overflows.",
    snippet: 'sprintf(${1:buffer}, "${2:%s}", ${3:val});',
  },
  {
    label: "snprintf",
    detail: "int snprintf(char *str, size_t size, const char *format, ...)",
    documentation:
      "Writes at most size characters (including terminating null) formatted output into buffer str.",
    snippet: 'snprintf(${1:buffer}, sizeof(${1:buffer}), "${2:%s}", ${3:val});',
  },
  {
    label: "fprintf",
    detail: "int fprintf(FILE *stream, const char *format, ...)",
    documentation: "Writes formatted output to specified output stream (e.g., stderr, file).",
    snippet: 'fprintf(${1:stderr}, "${2:%s}\\n", ${3:msg});',
  },
  {
    label: "fscanf",
    detail: "int fscanf(FILE *stream, const char *format, ...)",
    documentation: "Reads formatted input from the specified stream.",
    snippet: 'fscanf(${1:file}, "${2:%d}", &${3:val});',
  },
  {
    label: "sscanf",
    detail: "int sscanf(const char *str, const char *format, ...)",
    documentation: "Reads formatted data from a null-terminated C string.",
    snippet: 'sscanf(${1:str}, "${2:%d}", &${3:val});',
  },
  {
    label: "puts",
    detail: "int puts(const char *str)",
    documentation:
      "Writes a string to stdout, appending a trailing newline character automatically.",
    snippet: "puts(${1:str});",
  },
  {
    label: "getchar",
    detail: "int getchar(void)",
    documentation:
      "Reads the next available character from stdin (returned as unsigned char cast to int, or EOF).",
    snippet: "getchar()",
  },
  {
    label: "putchar",
    detail: "int putchar(int c)",
    documentation: "Writes a single character to standard output.",
    snippet: "putchar(${1:c});",
  },
  {
    label: "fopen",
    detail: "FILE* fopen(const char *filename, const char *mode)",
    documentation:
      'Opens file by filename with mode ("r", "w", "a", "r+", "w+", "a+", "rb", "wb"). Returns FILE pointer, or NULL on error.',
    snippet: 'fopen(${1:"filename.txt"}, ${2:"r"})',
  },
  {
    label: "fclose",
    detail: "int fclose(FILE *stream)",
    documentation: "Flushes stream and closes the associated file.",
    snippet: "fclose(${1:fp});",
  },
  {
    label: "fread",
    detail: "size_t fread(void *ptr, size_t size, size_t count, FILE *stream)",
    documentation: "Reads count elements of size bytes each from stream into memory block ptr.",
    snippet: "fread(${1:ptr}, ${2:size}, ${3:count}, ${4:stream});",
  },
  {
    label: "fwrite",
    detail: "size_t fwrite(const void *ptr, size_t size, size_t count, FILE *stream)",
    documentation: "Writes count elements of size bytes each from memory block ptr to stream.",
    snippet: "fwrite(${1:ptr}, ${2:size}, ${3:count}, ${4:stream});",
  },
  {
    label: "fseek",
    detail: "int fseek(FILE *stream, long offset, int whence)",
    documentation:
      "Sets the file position indicator for stream. whence can be SEEK_SET, SEEK_CUR, or SEEK_END.",
    snippet: "fseek(${1:stream}, ${2:offset}, ${3:SEEK_SET});",
  },
  {
    label: "ftell",
    detail: "long ftell(FILE *stream)",
    documentation: "Returns current file position indicator for stream.",
    snippet: "ftell(${1:stream})",
  },
  {
    label: "rewind",
    detail: "void rewind(FILE *stream)",
    documentation:
      "Sets the file position indicator to the beginning of stream and clears error/EOF flags.",
    snippet: "rewind(${1:stream});",
  },
  {
    label: "fgets",
    detail: "char* fgets(char *str, int num, FILE *stream)",
    documentation: "Reads at most num - 1 characters from stream and stores them into str.",
    snippet: "fgets(${1:buffer}, sizeof(${1:buffer}), ${2:stdin});",
  },
  {
    label: "fputs",
    detail: "int fputs(const char *str, FILE *stream)",
    documentation: "Writes string str to stream (does not append newline).",
    snippet: "fputs(${1:str}, ${2:stdout});",
  },
  {
    label: "feof",
    detail: "int feof(FILE *stream)",
    documentation: "Tests the end-of-file indicator for the given stream.",
    snippet: "feof(${1:stream})",
  },
  {
    label: "ferror",
    detail: "int ferror(FILE *stream)",
    documentation: "Tests the error indicator for the given stream.",
    snippet: "ferror(${1:stream})",
  },
  {
    label: "perror",
    detail: "void perror(const char *str)",
    documentation:
      "Prints an error message to stderr corresponding to current errno preceded by str.",
    snippet: 'perror(${1:"Error"});',
  },
  {
    label: "fflush",
    detail: "int fflush(FILE *stream)",
    documentation: "Flushes the output buffer of stream (e.g. fflush(stdout)).",
    snippet: "fflush(${1:stdout});",
  },
  {
    label: "setvbuf",
    detail: "int setvbuf(FILE *stream, char *buffer, int mode, size_t size)",
    documentation: "Specifies stream buffering mode (_IONBF, _IOLBF, _IOFBF) and buffer size.",
    snippet: "setvbuf(${1:stdout}, NULL, _IONBF, 0);",
  },
  {
    label: "remove",
    detail: "int remove(const char *filename)",
    documentation: "Deletes the file whose name is specified by filename.",
    snippet: "remove(${1:filename});",
  },
  {
    label: "rename",
    detail: "int rename(const char *oldname, const char *newname)",
    documentation: "Changes the name of the file or directory oldname to newname.",
    snippet: "rename(${1:oldname}, ${2:newname});",
  },
];

export const STDLIB_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "malloc",
    detail: "void* malloc(size_t size)",
    documentation:
      "Allocates size bytes of uninitialized storage in heap memory. Returns pointer or NULL on failure.",
    snippet: "(${1:int*})malloc(${2:sizeof(int) * n});",
  },
  {
    label: "calloc",
    detail: "void* calloc(size_t num, size_t size)",
    documentation:
      "Allocates memory for an array of num elements of size bytes each and initializes all bits to zero.",
    snippet: "(${1:int*})calloc(${2:n}, sizeof(${3:int}));",
  },
  {
    label: "realloc",
    detail: "void* realloc(void *ptr, size_t size)",
    documentation: "Reallocates previously allocated heap memory block ptr to new size bytes.",
    snippet: "realloc(${1:ptr}, ${2:new_size});",
  },
  {
    label: "free",
    detail: "void free(void *ptr)",
    documentation:
      "Deallocates memory previously allocated by malloc, calloc, or realloc. Safe with NULL.",
    snippet: "free(${1:ptr});",
  },
  {
    label: "abort",
    detail: "void abort(void)",
    documentation: "Aborts the current process producing abnormal termination.",
    snippet: "abort();",
  },
  {
    label: "exit",
    detail: "void exit(int status)",
    documentation:
      "Terminates the calling process with exit status (EXIT_SUCCESS or EXIT_FAILURE).",
    snippet: "exit(${1:0});",
  },
  {
    label: "atexit",
    detail: "int atexit(void (*func)(void))",
    documentation: "Registers a function to be called on normal program termination.",
    snippet: "atexit(${1:cleanup});",
  },
  {
    label: "atoi",
    detail: "int atoi(const char *str)",
    documentation: "Parses C string str interpreting its content as an integer.",
    snippet: "atoi(${1:str})",
  },
  {
    label: "atol",
    detail: "long atol(const char *str)",
    documentation: "Parses C string str interpreting its content as a long integer.",
    snippet: "atol(${1:str})",
  },
  {
    label: "atoll",
    detail: "long long atoll(const char *str)",
    documentation: "Parses C string str interpreting its content as a long long integer.",
    snippet: "atoll(${1:str})",
  },
  {
    label: "atof",
    detail: "double atof(const char *str)",
    documentation:
      "Parses C string str interpreting its content as a double floating-point number.",
    snippet: "atof(${1:str})",
  },
  {
    label: "strtol",
    detail: "long strtol(const char *str, char **endptr, int base)",
    documentation:
      "Converts a string to a long integer with error checking and custom radix base (0 or 2..36).",
    snippet: "strtol(${1:str}, ${2:NULL}, ${3:10})",
  },
  {
    label: "strtoul",
    detail: "unsigned long strtoul(const char *str, char **endptr, int base)",
    documentation: "Converts a string to an unsigned long integer.",
    snippet: "strtoul(${1:str}, ${2:NULL}, ${3:10})",
  },
  {
    label: "strtoll",
    detail: "long long strtoll(const char *str, char **endptr, int base)",
    documentation: "Converts a string to a long long integer.",
    snippet: "strtoll(${1:str}, ${2:NULL}, ${3:10})",
  },
  {
    label: "strtoull",
    detail: "unsigned long long strtoull(const char *str, char **endptr, int base)",
    documentation: "Converts a string to an unsigned long long integer.",
    snippet: "strtoull(${1:str}, ${2:NULL}, ${3:10})",
  },
  {
    label: "strtod",
    detail: "double strtod(const char *str, char **endptr)",
    documentation: "Converts a string to a double floating point number.",
    snippet: "strtod(${1:str}, ${2:NULL})",
  },
  {
    label: "rand",
    detail: "int rand(void)",
    documentation: "Returns a pseudo-random integral number in the range [0, RAND_MAX].",
    snippet: "rand()",
  },
  {
    label: "srand",
    detail: "void srand(unsigned int seed)",
    documentation: "Seeds the pseudo-random number generator with seed.",
    snippet: "srand(${1:(unsigned int)time(NULL)});",
  },
  {
    label: "qsort",
    detail:
      "void qsort(void *base, size_t num, size_t size, int (*compar)(const void*, const void*))",
    documentation:
      "Sorts an array of num elements of size bytes pointed to by base using comparison function compar.",
    snippet: "qsort(${1:arr}, ${2:n}, sizeof(${3:*arr}), ${4:cmp});",
  },
  {
    label: "bsearch",
    detail:
      "void* bsearch(const void *key, const void *base, size_t num, size_t size, int (*compar)(const void*, const void*))",
    documentation: "Binary search in a sorted array for an element matching key.",
    snippet: "bsearch(&${1:key}, ${2:arr}, ${3:n}, sizeof(${4:*arr}), ${5:cmp})",
  },
  {
    label: "abs",
    detail: "int abs(int n)",
    documentation: "Returns the absolute value of integer n.",
    snippet: "abs(${1:n})",
  },
  {
    label: "labs",
    detail: "long labs(long n)",
    documentation: "Returns the absolute value of long integer n.",
    snippet: "labs(${1:n})",
  },
  {
    label: "llabs",
    detail: "long long llabs(long long n)",
    documentation: "Returns the absolute value of long long integer n.",
    snippet: "llabs(${1:n})",
  },
  {
    label: "system",
    detail: "int system(const char *command)",
    documentation: "Passes the command string to the host environment command processor.",
    snippet: 'system(${1:"ls"});',
  },
  {
    label: "getenv",
    detail: "char* getenv(const char *name)",
    documentation: "Returns pointer to environment string or NULL if not found.",
    snippet: 'getenv("${1:PATH}")',
  },
];

export const STRING_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "strlen",
    detail: "size_t strlen(const char *str)",
    documentation:
      "Returns the length of C string str up to, but not including, the terminating null character.",
    snippet: "strlen(${1:str})",
  },
  {
    label: "strcpy",
    detail: "char* strcpy(char *dest, const char *src)",
    documentation: "Copies C string src including terminating null character to dest.",
    snippet: "strcpy(${1:dest}, ${2:src});",
  },
  {
    label: "strncpy",
    detail: "char* strncpy(char *dest, const char *src, size_t n)",
    documentation:
      "Copies at most n characters from src to dest. May not null-terminate if src length >= n.",
    snippet: "strncpy(${1:dest}, ${2:src}, ${3:n});",
  },
  {
    label: "strcat",
    detail: "char* strcat(char *dest, const char *src)",
    documentation: "Appends copy of C string src to destination string dest.",
    snippet: "strcat(${1:dest}, ${2:src});",
  },
  {
    label: "strncat",
    detail: "char* strncat(char *dest, const char *src, size_t n)",
    documentation: "Appends at most n characters from src to dest, followed by null character.",
    snippet: "strncat(${1:dest}, ${2:src}, ${3:n});",
  },
  {
    label: "strcmp",
    detail: "int strcmp(const char *s1, const char *s2)",
    documentation:
      "Compares two null-terminated strings lexicographically. Returns 0 if equal, <0 if s1 < s2, >0 if s1 > s2.",
    snippet: "strcmp(${1:s1}, ${2:s2})",
  },
  {
    label: "strncmp",
    detail: "int strncmp(const char *s1, const char *s2, size_t n)",
    documentation: "Compares up to n characters of two strings lexicographically.",
    snippet: "strncmp(${1:s1}, ${2:s2}, ${3:n})",
  },
  {
    label: "strchr",
    detail: "char* strchr(const char *str, int ch)",
    documentation:
      "Returns pointer to first occurrence of character ch in str, or NULL if not found.",
    snippet: "strchr(${1:str}, ${2:ch})",
  },
  {
    label: "strrchr",
    detail: "char* strrchr(const char *str, int ch)",
    documentation:
      "Returns pointer to last occurrence of character ch in str, or NULL if not found.",
    snippet: "strrchr(${1:str}, ${2:ch})",
  },
  {
    label: "strstr",
    detail: "char* strstr(const char *haystack, const char *needle)",
    documentation:
      "Finds first occurrence of substring needle in haystack. Returns pointer or NULL.",
    snippet: "strstr(${1:haystack}, ${2:needle})",
  },
  {
    label: "strtok",
    detail: "char* strtok(char *str, const char *delim)",
    documentation: "Splits string str into tokens using delimiter characters in delim.",
    snippet: 'strtok(${1:str}, "${2: ,}");',
  },
  {
    label: "strdup",
    detail: "char* strdup(const char *str)",
    documentation:
      "Duplicates string str in dynamically allocated memory (must be freed with free()).",
    snippet: "strdup(${1:str})",
  },
  {
    label: "memset",
    detail: "void* memset(void *ptr, int value, size_t num)",
    documentation:
      "Fills the first num bytes of the memory area pointed to by ptr with the constant byte value.",
    snippet: "memset(${1:ptr}, ${2:0}, sizeof(${1:ptr}));",
  },
  {
    label: "memcpy",
    detail: "void* memcpy(void *dest, const void *src, size_t count)",
    documentation:
      "Copies count bytes from memory area src to dest. Areas must not overlap (use memmove otherwise).",
    snippet: "memcpy(${1:dest}, ${2:src}, ${3:count});",
  },
  {
    label: "memmove",
    detail: "void* memmove(void *dest, const void *src, size_t count)",
    documentation:
      "Copies count bytes from src to dest. Safely handles overlapping memory regions.",
    snippet: "memmove(${1:dest}, ${2:src}, ${3:count});",
  },
  {
    label: "memcmp",
    detail: "int memcmp(const void *ptr1, const void *ptr2, size_t num)",
    documentation: "Compares first num bytes of memory areas ptr1 and ptr2.",
    snippet: "memcmp(${1:ptr1}, ${2:ptr2}, ${3:num})",
  },
  {
    label: "memchr",
    detail: "void* memchr(const void *ptr, int value, size_t num)",
    documentation:
      "Searches the first num bytes of memory area ptr for the first occurrence of value.",
    snippet: "memchr(${1:ptr}, ${2:val}, ${3:num})",
  },
  {
    label: "strerror",
    detail: "char* strerror(int errnum)",
    documentation: "Returns textual description corresponding to error number errnum.",
    snippet: "strerror(${1:errno})",
  },
];

export const MATH_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "sqrt",
    detail: "double sqrt(double x)",
    documentation: "Computes square root of x.",
    snippet: "sqrt(${1:x})",
  },
  {
    label: "cbrt",
    detail: "double cbrt(double x)",
    documentation: "Computes cubic root of x.",
    snippet: "cbrt(${1:x})",
  },
  {
    label: "pow",
    detail: "double pow(double base, double exponent)",
    documentation: "Computes base raised to the power exponent.",
    snippet: "pow(${1:base}, ${2:exp})",
  },
  {
    label: "fabs",
    detail: "double fabs(double x)",
    documentation: "Computes absolute value of floating point number x.",
    snippet: "fabs(${1:x})",
  },
  {
    label: "ceil",
    detail: "double ceil(double x)",
    documentation: "Rounds x upwards to the nearest integer value.",
    snippet: "ceil(${1:x})",
  },
  {
    label: "floor",
    detail: "double floor(double x)",
    documentation: "Rounds x downwards to the nearest integer value.",
    snippet: "floor(${1:x})",
  },
  {
    label: "round",
    detail: "double round(double x)",
    documentation: "Rounds x to nearest integer value.",
    snippet: "round(${1:x})",
  },
  {
    label: "trunc",
    detail: "double trunc(double x)",
    documentation: "Truncates x towards zero.",
    snippet: "trunc(${1:x})",
  },
  {
    label: "fmax",
    detail: "double fmax(double x, double y)",
    documentation: "Returns the larger of two floating point values.",
    snippet: "fmax(${1:x}, ${2:y})",
  },
  {
    label: "fmin",
    detail: "double fmin(double x, double y)",
    documentation: "Returns the smaller of two floating point values.",
    snippet: "fmin(${1:x}, ${2:y})",
  },
  {
    label: "sin",
    detail: "double sin(double angle)",
    documentation: "Computes sine of angle (in radians).",
    snippet: "sin(${1:x})",
  },
  {
    label: "cos",
    detail: "double cos(double angle)",
    documentation: "Computes cosine of angle (in radians).",
    snippet: "cos(${1:x})",
  },
  {
    label: "tan",
    detail: "double tan(double angle)",
    documentation: "Computes tangent of angle (in radians).",
    snippet: "tan(${1:x})",
  },
  {
    label: "asin",
    detail: "double asin(double x)",
    documentation: "Computes arc sine in radians.",
    snippet: "asin(${1:x})",
  },
  {
    label: "acos",
    detail: "double acos(double x)",
    documentation: "Computes arc cosine in radians.",
    snippet: "acos(${1:x})",
  },
  {
    label: "atan",
    detail: "double atan(double x)",
    documentation: "Computes arc tangent in radians.",
    snippet: "atan(${1:x})",
  },
  {
    label: "atan2",
    detail: "double atan2(double y, double x)",
    documentation: "Computes arc tangent of y/x using signs to determine quadrant.",
    snippet: "atan2(${1:y}, ${2:x})",
  },
  {
    label: "log",
    detail: "double log(double x)",
    documentation: "Computes natural (base e) logarithm of x.",
    snippet: "log(${1:x})",
  },
  {
    label: "log2",
    detail: "double log2(double x)",
    documentation: "Computes binary (base 2) logarithm of x.",
    snippet: "log2(${1:x})",
  },
  {
    label: "log10",
    detail: "double log10(double x)",
    documentation: "Computes common (base 10) logarithm of x.",
    snippet: "log10(${1:x})",
  },
  {
    label: "exp",
    detail: "double exp(double x)",
    documentation: "Computes e raised to the power x.",
    snippet: "exp(${1:x})",
  },
  {
    label: "fmod",
    detail: "double fmod(double numer, double denom)",
    documentation: "Computes floating-point remainder of numer / denom.",
    snippet: "fmod(${1:x}, ${2:y})",
  },
  {
    label: "hypot",
    detail: "double hypot(double x, double y)",
    documentation: "Computes hypotenuse sqrt(x*x + y*y) avoiding intermediate overflow.",
    snippet: "hypot(${1:x}, ${2:y})",
  },
];

export const CTYPE_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "isalpha",
    detail: "int isalpha(int c)",
    documentation: "Checks if character c is an alphabetic letter (a-z or A-Z).",
    snippet: "isalpha(${1:c})",
  },
  {
    label: "isdigit",
    detail: "int isdigit(int c)",
    documentation: "Checks if character c is a decimal digit (0-9).",
    snippet: "isdigit(${1:c})",
  },
  {
    label: "isalnum",
    detail: "int isalnum(int c)",
    documentation: "Checks if character c is alphanumeric (letter or digit).",
    snippet: "isalnum(${1:c})",
  },
  {
    label: "isspace",
    detail: "int isspace(int c)",
    documentation: "Checks if character c is whitespace (space, tab, newline, return).",
    snippet: "isspace(${1:c})",
  },
  {
    label: "isupper",
    detail: "int isupper(int c)",
    documentation: "Checks if character c is uppercase letter.",
    snippet: "isupper(${1:c})",
  },
  {
    label: "islower",
    detail: "int islower(int c)",
    documentation: "Checks if character c is lowercase letter.",
    snippet: "islower(${1:c})",
  },
  {
    label: "ispunct",
    detail: "int ispunct(int c)",
    documentation: "Checks if character c is a punctuation mark.",
    snippet: "ispunct(${1:c})",
  },
  {
    label: "toupper",
    detail: "int toupper(int c)",
    documentation: "Converts character c to uppercase if possible.",
    snippet: "toupper(${1:c})",
  },
  {
    label: "tolower",
    detail: "int tolower(int c)",
    documentation: "Converts character c to lowercase if possible.",
    snippet: "tolower(${1:c})",
  },
];

export const TIME_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "time",
    detail: "time_t time(time_t *timer)",
    documentation: "Returns the current calendar time as time_t object.",
    snippet: "time(${1:NULL})",
  },
  {
    label: "clock",
    detail: "clock_t clock(void)",
    documentation: "Returns processor clock time used since an implementation-defined start point.",
    snippet: "clock()",
  },
  {
    label: "difftime",
    detail: "double difftime(time_t time1, time_t time0)",
    documentation: "Calculates difference in seconds between two calendar times.",
    snippet: "difftime(${1:end}, ${2:start})",
  },
];

export const ASSERT_FUNCTION: CompletionItemDef = {
  label: "assert",
  detail: "void assert(scalar expression)",
  documentation:
    "Evaluates expression. If false (0), writes diagnostic message to stderr and calls abort(). Disabled if NDEBUG is defined.",
  snippet: "assert(${1:condition});",
};

export const ALL_STD_FUNCTIONS: CompletionItemDef[] = [
  ...STDIO_FUNCTIONS,
  ...STDLIB_FUNCTIONS,
  ...STRING_FUNCTIONS,
  ...MATH_FUNCTIONS,
  ...CTYPE_FUNCTIONS,
  ...TIME_FUNCTIONS,
  ASSERT_FUNCTION,
];

// --- Standard C Constants & Macros -----------------------------------------------------

export const C_CONSTANTS: CompletionItemDef[] = [
  {
    label: "NULL",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "((void*)0)",
    documentation: "Null pointer constant.",
    snippet: "NULL",
  },
  {
    label: "EOF",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "EOF (-1)",
    documentation: "End-of-file indicator returned by I/O functions on failure or EOF.",
    snippet: "EOF",
  },
  {
    label: "EXIT_SUCCESS",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "EXIT_SUCCESS (0)",
    documentation: "Successful process termination status value for exit().",
    snippet: "EXIT_SUCCESS",
  },
  {
    label: "EXIT_FAILURE",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "EXIT_FAILURE (1)",
    documentation: "Unsuccessful process termination status value for exit().",
    snippet: "EXIT_FAILURE",
  },
  {
    label: "RAND_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "RAND_MAX",
    documentation: "Maximum value returned by the rand() function (at least 32767).",
    snippet: "RAND_MAX",
  },
  {
    label: "INT_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "INT_MAX (+2147483647)",
    documentation: "Maximum value for an object of type int (standard 32-bit: 2^31 - 1).",
    snippet: "INT_MAX",
  },
  {
    label: "INT_MIN",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "INT_MIN (-2147483648)",
    documentation: "Minimum value for an object of type int (standard 32-bit: -2^31).",
    snippet: "INT_MIN",
  },
  {
    label: "UINT_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "UINT_MAX (4294967295U)",
    documentation: "Maximum value for an object of type unsigned int (standard 32-bit: 2^32 - 1).",
    snippet: "UINT_MAX",
  },
  {
    label: "LONG_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "LONG_MAX",
    documentation: "Maximum value for an object of type long.",
    snippet: "LONG_MAX",
  },
  {
    label: "LONG_MIN",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "LONG_MIN",
    documentation: "Minimum value for an object of type long.",
    snippet: "LONG_MIN",
  },
  {
    label: "LLONG_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "LLONG_MAX (+9223372036854775807LL)",
    documentation: "Maximum value for an object of type long long (64-bit: 2^63 - 1).",
    snippet: "LLONG_MAX",
  },
  {
    label: "LLONG_MIN",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "LLONG_MIN (-9223372036854775808LL)",
    documentation: "Minimum value for an object of type long long (64-bit: -2^63).",
    snippet: "LLONG_MIN",
  },
  {
    label: "SIZE_MAX",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "SIZE_MAX",
    documentation: "Maximum value of size_t.",
    snippet: "SIZE_MAX",
  },
  {
    label: "true",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "true (1)",
    documentation: "Boolean true constant from <stdbool.h>.",
    snippet: "true",
  },
  {
    label: "false",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "false (0)",
    documentation: "Boolean false constant from <stdbool.h>.",
    snippet: "false",
  },
  {
    label: "SEEK_SET",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "SEEK_SET",
    documentation: "Seek relative to beginning of file.",
    snippet: "SEEK_SET",
  },
  {
    label: "SEEK_CUR",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "SEEK_CUR",
    documentation: "Seek relative to current file position.",
    snippet: "SEEK_CUR",
  },
  {
    label: "SEEK_END",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "SEEK_END",
    documentation: "Seek relative to end of file.",
    snippet: "SEEK_END",
  },
  {
    label: "CLOCKS_PER_SEC",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    detail: "CLOCKS_PER_SEC",
    documentation: "Number of clock ticks per second returned by clock().",
    snippet: "CLOCKS_PER_SEC",
  },
  {
    label: "stdin",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "FILE* stdin",
    documentation: "Standard input stream.",
    snippet: "stdin",
  },
  {
    label: "stdout",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "FILE* stdout",
    documentation: "Standard output stream.",
    snippet: "stdout",
  },
  {
    label: "stderr",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "FILE* stderr",
    documentation: "Standard error stream.",
    snippet: "stderr",
  },
];

// --- Standard C Types ------------------------------------------------------------------

export interface CTypeDef {
  name: string;
  detail: string;
  documentation: string;
}

export const C_STANDARD_TYPES: CTypeDef[] = [
  {
    name: "int",
    detail: "int - Basic signed integer type",
    documentation:
      "Signed integer type of at least 16 bits (typically 32 bits on modern platforms).",
  },
  {
    name: "char",
    detail: "char - Smallest addressable unit",
    documentation:
      "Character type capable of containing one character of basic execution set (1 byte).",
  },
  {
    name: "float",
    detail: "float - Single-precision floating point",
    documentation: "Single precision floating point value (typically IEEE 754 32-bit).",
  },
  {
    name: "double",
    detail: "double - Double-precision floating point",
    documentation: "Double precision floating point value (typically IEEE 754 64-bit).",
  },
  {
    name: "void",
    detail: "void - Empty / Incomplete type",
    documentation: "Indicates no value or a generic raw pointer type (void*).",
  },
  {
    name: "bool",
    detail: "bool - Boolean type (<stdbool.h>)",
    documentation: "Boolean type holding either true or false.",
  },
  {
    name: "size_t",
    detail: "size_t - Unsigned size integer",
    documentation: "Unsigned integer type returned by sizeof operator and used for array indexing.",
  },
  {
    name: "ssize_t",
    detail: "ssize_t - Signed size integer",
    documentation: "Signed size type used for byte counts or -1 error indicators.",
  },
  {
    name: "ptrdiff_t",
    detail: "ptrdiff_t - Pointer difference integer",
    documentation: "Signed integer type representing difference between two pointers.",
  },
  {
    name: "int8_t",
    detail: "int8_t - Exact 8-bit signed integer",
    documentation: "Fixed-width 8-bit signed integer type from <stdint.h>.",
  },
  {
    name: "int16_t",
    detail: "int16_t - Exact 16-bit signed integer",
    documentation: "Fixed-width 16-bit signed integer type from <stdint.h>.",
  },
  {
    name: "int32_t",
    detail: "int32_t - Exact 32-bit signed integer",
    documentation: "Fixed-width 32-bit signed integer type from <stdint.h>.",
  },
  {
    name: "int64_t",
    detail: "int64_t - Exact 64-bit signed integer",
    documentation: "Fixed-width 64-bit signed integer type from <stdint.h>.",
  },
  {
    name: "uint8_t",
    detail: "uint8_t - Exact 8-bit unsigned integer",
    documentation: "Fixed-width 8-bit unsigned integer type from <stdint.h>.",
  },
  {
    name: "uint16_t",
    detail: "uint16_t - Exact 16-bit unsigned integer",
    documentation: "Fixed-width 16-bit unsigned integer type from <stdint.h>.",
  },
  {
    name: "uint32_t",
    detail: "uint32_t - Exact 32-bit unsigned integer",
    documentation: "Fixed-width 32-bit unsigned integer type from <stdint.h>.",
  },
  {
    name: "uint64_t",
    detail: "uint64_t - Exact 64-bit unsigned integer",
    documentation: "Fixed-width 64-bit unsigned integer type from <stdint.h>.",
  },
  {
    name: "intptr_t",
    detail: "intptr_t - Signed integer large enough to hold a pointer",
    documentation: "Signed integer type capable of holding a pointer without truncation.",
  },
  {
    name: "uintptr_t",
    detail: "uintptr_t - Unsigned integer large enough to hold a pointer",
    documentation: "Unsigned integer type capable of holding a pointer without truncation.",
  },
  {
    name: "FILE",
    detail: "FILE - File stream control structure",
    documentation:
      "Opaque object type containing information needed to control a file stream (<stdio.h>).",
  },
  {
    name: "time_t",
    detail: "time_t - Calendar time representation",
    documentation: "Arithmetic type capable of representing calendar times (<time.h>).",
  },
  {
    name: "clock_t",
    detail: "clock_t - Processor clock tick counter",
    documentation: "Type returned by clock() representing processor execution time.",
  },
];

// --- C Keywords ------------------------------------------------------------------------

export const C_KEYWORDS: string[] = [
  "auto",
  "break",
  "case",
  "char",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "float",
  "for",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "register",
  "restrict",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "typedef",
  "union",
  "unsigned",
  "void",
  "volatile",
  "while",
  "_Bool",
  "_Complex",
  "_Imaginary",
  "_Static_assert",
];

export const C_KEYWORD_SET = new Set(C_KEYWORDS);

// --- Standard Struct Member Definitions (DSA / LeetCode) -------------------------------

export const LISTNODE_MEMBERS: CompletionItemDef[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int val",
    documentation: "Value stored in this linked list node.",
    snippet: "val",
  },
  {
    label: "next",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct ListNode *next",
    documentation: "Pointer to the next linked list node.",
    snippet: "next",
  },
];

export const TREENODE_MEMBERS: CompletionItemDef[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int val",
    documentation: "Value stored in this binary tree node.",
    snippet: "val",
  },
  {
    label: "left",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct TreeNode *left",
    documentation: "Pointer to the left child binary tree node.",
    snippet: "left",
  },
  {
    label: "right",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct TreeNode *right",
    documentation: "Pointer to the right child binary tree node.",
    snippet: "right",
  },
];

export const NODE_MEMBERS: CompletionItemDef[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int val",
    documentation: "Value stored in this node.",
    snippet: "val",
  },
  {
    label: "next",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct Node *next",
    documentation: "Pointer to the next node.",
    snippet: "next",
  },
  {
    label: "prev",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct Node *prev",
    documentation: "Pointer to the previous node.",
    snippet: "prev",
  },
  {
    label: "left",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct Node *left",
    documentation: "Pointer to the left child node.",
    snippet: "left",
  },
  {
    label: "right",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct Node *right",
    documentation: "Pointer to the right child node.",
    snippet: "right",
  },
  {
    label: "random",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "struct Node *random",
    documentation: "Pointer to a random node.",
    snippet: "random",
  },
];

export const POINT_MEMBERS: CompletionItemDef[] = [
  {
    label: "x",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int x",
    documentation: "X coordinate.",
    snippet: "x",
  },
  {
    label: "y",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int y",
    documentation: "Y coordinate.",
    snippet: "y",
  },
];

export const PAIR_MEMBERS: CompletionItemDef[] = [
  {
    label: "first",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int first",
    documentation: "First element of pair.",
    snippet: "first",
  },
  {
    label: "second",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int second",
    documentation: "Second element of pair.",
    snippet: "second",
  },
  {
    label: "key",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int key",
    documentation: "Key of pair.",
    snippet: "key",
  },
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int val",
    documentation: "Value of pair.",
    snippet: "val",
  },
];

// --- C Snippets ------------------------------------------------------------------------

export interface CSnippetDef {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
}

export const C_SNIPPETS: CSnippetDef[] = [
  {
    label: "main",
    insertText: "int main(int argc, char *argv[]) {\n    ${1}\n    return 0;\n}",
    detail: "int main(int argc, char *argv[]) { ... }",
    documentation: "Standard C main function boilerplate.",
  },
  {
    label: "for",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}",
    detail: "for (int i = 0; i < n; i++) { ... }",
    documentation: "Standard C for-loop iteration.",
  },
  {
    label: "while",
    insertText: "while (${1:condition}) {\n    ${2}\n}",
    detail: "while (condition) { ... }",
    documentation: "Standard while-loop.",
  },
  {
    label: "do-while",
    insertText: "do {\n    ${2}\n} while (${1:condition});",
    detail: "do { ... } while (condition);",
    documentation: "Do-while loop.",
  },
  {
    label: "struct",
    insertText: "struct ${1:Name} {\n    ${2:/* fields */}\n};",
    detail: "struct Name { ... };",
    documentation: "C struct definition.",
  },
  {
    label: "typedef struct",
    insertText: "typedef struct ${1:Name} {\n    ${2}\n} ${1:Name};",
    detail: "typedef struct Name { ... } Name;",
    documentation: "C typedef struct definition.",
  },
  {
    label: "qsort_cmp",
    insertText:
      "int ${1:cmp}(const void *a, const void *b) {\n    return (*(const int*)a - *(const int*)b);\n}",
    detail: "int cmp(const void *a, const void *b) { ... }",
    documentation: "Standard integer comparator function for qsort and bsearch.",
  },
  {
    label: "swap",
    insertText: "void swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}",
    detail: "void swap(int *a, int *b) { ... }",
    documentation: "Integer pointer swap helper.",
  },
  {
    label: "bsearch_loop",
    insertText:
      "int low = 0, high = ${1:n} - 1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (${2:arr}[mid] == ${3:target}) {\n        ${4:return mid;}\n    } else if (${2:arr}[mid] < ${3:target}) {\n        low = mid + 1;\n    } else {\n        high = mid - 1;\n    }\n}",
    detail: "int low = 0, high = n - 1; while (low <= high) { ... }",
    documentation: "Binary search standard loop implementation in C.",
  },
];

// --- Comment & String Shielding --------------------------------------------------------

/**
 * Masks C comments (// and /*...*\/) with spaces, and string/char literals too when
 * `maskStrings` is set. Newlines are kept so line numbers and columns stay the same.
 */
function maskC(code: string, maskStrings: boolean): string {
  let inString: string | null = null;
  let inBlockComment = false;
  let inLineComment = false;
  let isEscaped = false;
  const chars = code.split("");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = i + 1 < chars.length ? chars[i + 1] : "";

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        chars[i] = " ";
        chars[i + 1] = " ";
        inBlockComment = false;
        i++;
      } else if (ch !== "\n") {
        chars[i] = " ";
      }
      continue;
    }

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      } else {
        chars[i] = " ";
      }
      continue;
    }

    if (inString !== null) {
      if (ch === inString && !isEscaped) {
        if (maskStrings) chars[i] = " ";
        inString = null;
      } else if (ch === "\\" && !isEscaped) {
        if (maskStrings) chars[i] = " ";
        isEscaped = true;
        continue;
      } else if (maskStrings && ch !== "\n") {
        chars[i] = " ";
      }
      isEscaped = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      if (maskStrings) chars[i] = " ";
      continue;
    }

    if (ch === "/" && next === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === "/" && next === "/") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inLineComment = true;
      i++;
      continue;
    }
  }

  return chars.join("");
}

/**
 * Masks C comments (// and /*...*\/) with spaces to preserve line lengths and offsets.
 */
export function maskCComments(code: string): string {
  return maskC(code, false);
}

/**
 * Masks both comments and string/char literals with spaces to prevent punctuation
 * inside comments/strings from corrupting parsers.
 */
export function maskCCommentsAndStrings(code: string): string {
  return maskC(code, true);
}

/**
 * Strips comments from a single line.
 */
export function stripCComment(line: string): string {
  return maskCComments(line);
}

/**
 * Whether the end of `prefix` (the document text up to the cursor) is inside a
 * comment, string, or char literal.
 */
export function isInCCommentOrString(prefix: string): boolean {
  // A sentinel character only survives masking when it sits in plain code.
  return maskCCommentsAndStrings(`${prefix}x`).endsWith(" ");
}

/**
 * The document's lines with comments masked. Masking the whole text (not one line at a
 * time) is what keeps the inside of multi-line block comments out of the parsers.
 */
export function getMaskedCLines(model: monacoDefault.editor.ITextModel): string[] {
  return maskCComments(model.getValue()).split("\n");
}

// --- Function Headers ------------------------------------------------------------------

/** Keywords that may appear in a function's return type or specifiers. */
const C_DECL_SPECIFIERS = new Set([
  "auto",
  "char",
  "const",
  "double",
  "enum",
  "extern",
  "float",
  "inline",
  "int",
  "long",
  "register",
  "restrict",
  "short",
  "signed",
  "static",
  "struct",
  "union",
  "unsigned",
  "void",
  "volatile",
  "_Bool",
]);

/** Index of the ')' matching the '(' at `openIdx`, or -1 if it is not on this text. */
function findMatchingParen(text: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Splits a parameter list on top-level commas, so `int (*cmp)(int, int)` stays whole. */
function splitCParams(inner: string): string[] {
  const params: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      params.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  params.push(inner.slice(start).trim());
  const list = params.filter(Boolean);
  return list.length === 1 && list[0] === "void" ? [] : list;
}

/** Parameters of a signature such as "void qsort(void *base, ..., int (*compar)(...))". */
export function parseCSignatureParams(signature: string): string[] {
  const open = signature.indexOf("(");
  if (open < 0) return [];
  const close = findMatchingParen(signature, open);
  return splitCParams(signature.slice(open + 1, close < 0 ? undefined : close));
}

export interface CFunctionHeader {
  name: string;
  /** e.g. "int add(int a, int b)" */
  signature: string;
  params: string[];
  /** true for a prototype ending in ';', false for a definition */
  isPrototype: boolean;
}

/**
 * Parses a comment-masked line that declares or defines a function, e.g.
 * `int add(int a, int b) {` or `struct Node *make(int v);`. Returns null for calls
 * (`printf("x");`, `return fact(n - 1);`), control statements (`} else if (x) {`) and
 * anything else that is not a function header.
 */
export function parseCFunctionHeader(line: string): CFunctionHeader | null {
  const m = line.match(/^\s*((?:[a-zA-Z_]\w*[\s*]+)+)([a-zA-Z_]\w*)\s*\(/);
  if (!m) return null;
  const name = m[2];
  if (C_KEYWORD_SET.has(name)) return null;
  // Every word before the name must be part of a type: a type name or a specifier.
  const typeWords = m[1].match(/[a-zA-Z_]\w*/g) ?? [];
  if (typeWords.some((w) => C_KEYWORD_SET.has(w) && !C_DECL_SPECIFIERS.has(w))) return null;

  const open = m[0].length - 1;
  const close = findMatchingParen(line, open);
  if (close < 0) return null;
  const rest = line.slice(close + 1).trim();
  if (rest !== "" && rest !== ";" && !rest.startsWith("{")) return null;

  return {
    name,
    signature: line.slice(0, close + 1).trim(),
    params: splitCParams(line.slice(open + 1, close)),
    isPrototype: rest === ";",
  };
}

// --- Scopes & Scope Analysis -----------------------------------------------------------

export interface CScopes {
  owner: number[];
  visible: Set<number>;
  activeFuncLine: number;
}

/**
 * Computes function boundary scopes in C.
 * Isolates local variables so void foo(...) { int a; } does not leak into void bar(...) or global scope.
 */
export function computeCScopes(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): CScopes {
  const lineCount = model.getLineCount();
  const fullText = model.getValue();
  const cleaned = maskCCommentsAndStrings(fullText);
  const cleanedLines = cleaned.split("\n");

  const owner: number[] = new Array(lineCount + 2).fill(0);
  const funcStack: { line: number; baseDepth: number }[] = [];
  let braceDepth = 0;
  let candidateFuncLine = 0;
  let cursorOwner = 0;

  for (let ln = 1; ln <= lineCount; ln++) {
    const rawLine = cleanedLines[ln - 1] ?? "";

    // Only a function definition header opens a scope, e.g. int solve(int a, int b) {
    // Control statements such as `} else if (x) {` stay inside the enclosing function.
    const header = parseCFunctionHeader(rawLine);
    if (header && !header.isPrototype) {
      candidateFuncLine = ln;
    }

    const opens = (rawLine.match(/\{/g) || []).length;
    const closes = (rawLine.match(/\}/g) || []).length;

    if (opens > 0 && candidateFuncLine > 0) {
      funcStack.push({
        line: candidateFuncLine,
        baseDepth: braceDepth,
      });
      candidateFuncLine = 0;
    }

    const currentOwner = funcStack.length > 0 ? funcStack[funcStack.length - 1].line : 0;
    owner[ln] = currentOwner;
    if (ln === cursorLine) {
      cursorOwner = currentOwner;
    }

    braceDepth += opens - closes;

    while (funcStack.length > 0 && braceDepth <= funcStack[funcStack.length - 1].baseDepth) {
      funcStack.pop();
    }
  }

  const visible = new Set<number>([0]);
  if (cursorOwner !== 0) {
    visible.add(cursorOwner);
  }

  return { owner, visible, activeFuncLine: cursorOwner };
}

export function isLineVisible(scopes: CScopes, ln: number): boolean {
  const o = scopes.owner[ln] ?? 0;
  return scopes.visible.has(o);
}

// --- Struct Extraction -----------------------------------------------------------------

export interface CStructField {
  name: string;
  type: string;
  detail: string;
  documentation: string;
}

export interface CStructDef {
  name: string;
  line: number;
  fields: CStructField[];
}

/**
 * Parses user-defined struct definitions in the C document.
 * Matches:
 *   struct Name { int x; char y; };
 *   typedef struct Name { ... } Name;
 *   typedef struct { int x; } Name;
 */
export function extractCStructs(model: monacoDefault.editor.ITextModel): Map<string, CStructDef> {
  const result = new Map<string, CStructDef>();
  const lineCount = model.getLineCount();
  const lines = getMaskedCLines(model);

  let inStruct = false;
  let opened = false;
  let structName = "";
  let structStartLine = 0;
  let currentFields: CStructField[] = [];
  let braceDepth = 0;

  for (let ln = 1; ln <= lineCount; ln++) {
    const line = lines[ln - 1] ?? "";

    // 1. Single-line struct: struct Point { int x; int y; }; or typedef struct { int x; } Point;
    const singleMatch = line.match(
      /\b(?:typedef\s+)?struct\s+([a-zA-Z_]\w*)?\s*\{([^}]+)\}\s*([a-zA-Z_]\w*)?\s*;/,
    );
    if (singleMatch) {
      const sName = singleMatch[1] || singleMatch[3] || "";
      const body = singleMatch[2];
      const sFields: CStructField[] = [];
      const fieldMatches = body.matchAll(
        /\b((?:struct\s+[a-zA-Z_]\w*|[a-zA-Z_]\w*)\s*(?:\*+)?)\s*([a-zA-Z_]\w*)\s*(?:\[[^\]]*\])?\s*;/g,
      );
      for (const fm of fieldMatches) {
        const fType = fm[1].trim();
        const fName = fm[2].trim();
        if (!C_KEYWORD_SET.has(fName) && !sFields.some((f) => f.name === fName)) {
          sFields.push({
            name: fName,
            type: fType,
            detail: `${fType} ${fName}`,
            documentation: `Field of struct ${sName || "definition"} (line ${ln})`,
          });
        }
      }
      if (sName) {
        result.set(sName, { name: sName, line: ln, fields: sFields });
      }
      if (singleMatch[3] && singleMatch[3] !== sName) {
        result.set(singleMatch[3], { name: singleMatch[3], line: ln, fields: sFields });
      }
      continue;
    }

    // 2. Multi-line struct start: `struct Student {`, `typedef struct Book {`, or a bare
    // `struct Student` with the brace on the next line. The line must be only that, so
    // `void show(struct Student s) {` or `struct Student s;` are not struct definitions.
    if (!inStruct) {
      const match = line.match(/^\s*(?:typedef\s+)?struct(?:\s+([a-zA-Z_]\w*))?\s*(\{.*)?$/);
      if (match) {
        inStruct = true;
        opened = false;
        structName = match[1] ?? "";
        structStartLine = ln;
        currentFields = [];
        braceDepth = 0;
      }
    }

    if (inStruct) {
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;

      if (!opened) {
        if (opens === 0) {
          // Anything other than blank lines between `struct Name` and its `{` means it
          // was not a definition after all.
          if (ln !== structStartLine && line.trim() !== "") {
            inStruct = false;
            structName = "";
          }
          continue;
        }
        opened = true;
      }

      braceDepth += opens - closes;

      // Extract field declaration inside struct only before any closing '}'
      const contentToScan = line.includes("}") ? line.slice(0, line.indexOf("}")) : line;
      if (contentToScan.trim()) {
        const fieldMatches = contentToScan.matchAll(
          /\b((?:struct\s+[a-zA-Z_]\w*|[a-zA-Z_]\w*)\s*(?:\*+)?)\s*([a-zA-Z_]\w*)\s*(?:\[[^\]]*\])?\s*;/g,
        );
        for (const fm of fieldMatches) {
          const fType = fm[1].trim();
          const fName = fm[2].trim();
          if (!C_KEYWORD_SET.has(fName) && !currentFields.some((f) => f.name === fName)) {
            currentFields.push({
              name: fName,
              type: fType,
              detail: `${fType} ${fName}`,
              documentation: `Field of struct ${structName || "definition"} (line ${ln})`,
            });
          }
        }
      }

      if (braceDepth <= 0) {
        // Struct closed. Look for typedef alias name e.g. } Book;
        const closeMatch = line.match(/\}\s*([a-zA-Z_]\w*)\s*;/);
        if (closeMatch && closeMatch[1]) {
          const alias = closeMatch[1];
          result.set(alias, {
            name: alias,
            line: structStartLine,
            fields: [...currentFields],
          });
        }
        if (structName) {
          result.set(structName, {
            name: structName,
            line: structStartLine,
            fields: [...currentFields],
          });
        }
        inStruct = false;
        structName = "";
      }
    }
  }

  return result;
}

// --- Type Inference for Dereferencing (. and ->) ---------------------------------------

export type InferredCType =
  "ListNode" | "TreeNode" | "Node" | "Point" | "Pair" | "primitive" | "unknown" | string; // User-defined struct name

export const C_PRIMITIVE_TYPES = new Set([
  "int",
  "long",
  "long long",
  "double",
  "float",
  "char",
  "bool",
  "_Bool",
  "short",
  "unsigned",
  "unsigned int",
  "unsigned long",
  "unsigned long long",
  "unsigned short",
  "unsigned char",
  "signed",
  "signed char",
  "size_t",
  "ssize_t",
  "ptrdiff_t",
  "int8_t",
  "int16_t",
  "int32_t",
  "int64_t",
  "uint8_t",
  "uint16_t",
  "uint32_t",
  "uint64_t",
  "intptr_t",
  "uintptr_t",
  "void",
]);

/**
 * Parses an array subscript expression (e.g. "matrix[row[0]][col[0]]" or "arr[i + 1]")
 * and returns the base variable name and total subscript depth.
 */
export function parseSubscriptExpression(
  expr: string,
): { baseVar: string; subDepth: number } | null {
  const m = expr.match(/^([a-zA-Z_]\w*)\s*\[/);
  if (!m) return null;
  const baseVar = m[1];
  let depth = 0;
  let subDepth = 0;
  for (let i = baseVar.length; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "[") {
      if (depth === 0) subDepth++;
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth < 0) return null;
    } else if (depth === 0 && !/\s/.test(ch)) {
      return null;
    }
  }
  if (depth !== 0 || subDepth === 0) return null;
  return { baseVar, subDepth };
}

/**
 * Returns the expression right before a '.' or '->' operator, e.g. "p" from
 * "int y = p", "arr[i]" from "sum += arr[i]", or "head->next" from "x = head->next".
 */
export function trailingCExpression(text: string): string {
  let i = text.length;
  let depth = 0;
  while (i > 0) {
    const ch = text[i - 1];
    if (ch === "]" || ch === ")") {
      depth++;
    } else if (ch === "[" || ch === "(") {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0) {
      if (ch === ">" && text[i - 2] === "-") {
        i -= 2;
        continue;
      }
      if (!/[\w.]/.test(ch)) break;
    }
    i--;
  }
  return text.slice(i).trim();
}

/** Maps a declared type name to the type the member-access completions understand. */
function classifyCTypeName(typeName: string): InferredCType {
  const t = typeName
    .replace(/^struct\s+/, "")
    .replace(/\*/g, "")
    .trim();
  if (C_PRIMITIVE_TYPES.has(t)) return "primitive";
  if (!t || C_KEYWORD_SET.has(t)) return "unknown";
  return t; // ListNode, TreeNode, Node, Point, Pair, or a user-defined struct
}

/** Infers a variable's type from its declaration above the cursor. */
function inferCVariableType(
  lines: string[],
  scopes: CScopes,
  fromLine: number,
  varName: string,
): InferredCType {
  // Scan backwards from position for declaration
  for (let ln = fromLine; ln >= 1; ln--) {
    if (!isLineVisible(scopes, ln)) continue;
    const line = (lines[ln - 1] ?? "").trim();
    if (!line) continue;

    // 1. Primitive declaration: int x; or float y = 1.0; or int a = 1, b = 2;
    const primMatch = line.match(
      new RegExp(
        `\\b(int|long|double|float|char|bool|_Bool|short|unsigned|signed|size_t|ssize_t|ptrdiff_t|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|intptr_t|uintptr_t|void)\\b\\s*(?:(?:\\*+\\s*)?[a-zA-Z_]\\w*(?:\\s*=\\s*[^,;]+)?\\s*,\\s*)*(?:\\*+\\s*)?\\b${varName}\\b`,
      ),
    );
    if (primMatch) {
      return "primitive";
    }

    // 2. Struct pointer declaration: struct ListNode *head = NULL, *cur; or Book *b;
    // The type and the name must be separated by whitespace or '*', so `tmp` does not
    // read as type `tm` followed by variable `p`.
    const structMatch = line.match(
      new RegExp(
        `\\b(?:struct\\s+)?([a-zA-Z_]\\w*)(?:\\s*\\*+\\s*|\\s+)(?:(?:\\*+\\s*)?[a-zA-Z_]\\w*(?:\\s*=\\s*[^,;]+)?\\s*,\\s*)*(?:\\*+\\s*)?\\b${varName}\\b`,
      ),
    );
    if (structMatch) {
      const sType = classifyCTypeName(structMatch[1]);
      if (sType !== "unknown" && sType !== "primitive") return sType;
    }

    // 3. Struct value declaration: struct Point p; or Point p1 = {0}, p2;
    const structValMatch = line.match(
      new RegExp(
        `\\b(?:struct\\s+)?([a-zA-Z_]\\w*)\\s+(?:[a-zA-Z_]\\w*(?:\\s*=\\s*[^,;]+)?\\s*,\\s*)*\\b${varName}\\b`,
      ),
    );
    if (structValMatch) {
      const sType = classifyCTypeName(structValMatch[1]);
      if (sType !== "unknown" && sType !== "primitive") return sType;
    }
  }

  // Name heuristic fallbacks (if untyped or inferred from context)
  if (/^(?:head|curr|cur|prev|next|node|tail|fast|slow)\d*$/i.test(varName)) {
    return "ListNode";
  }
  if (/^(?:root|tree|leaf)\d*$/i.test(varName)) {
    return "TreeNode";
  }
  if (/^(?:pt|point)\d*$/i.test(varName)) {
    return "Point";
  }
  return "unknown";
}

/**
 * Infers the type of an expression preceding '.' or '->' in C.
 */
export function inferCType(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  textBeforeWord: string,
  operatorKind: "." | "->",
): InferredCType {
  const before = textBeforeWord.slice(0, -operatorKind.length).trimEnd();

  // Literal string or char: "hello". or 'a'. -> primitive
  if (before.endsWith('"') || before.endsWith("'")) {
    return "primitive";
  }

  let expr = trailingCExpression(before);
  if (!expr) return "unknown";

  // Numeric literal: 5. or 3.14. -> primitive
  if (/^\d/.test(expr)) {
    return "primitive";
  }

  // (*p). is the same as p->
  const derefMatch = expr.match(/^\(\s*\*\s*([a-zA-Z_]\w*)\s*\)$/);
  if (derefMatch) {
    expr = derefMatch[1];
  }

  // Recursive pointer / struct chaining:
  // e.g. head->next-> or head->next->next-> or root->left->right->
  if (operatorKind === "->" && /(?:->|\.)(?:next|prev)$/.test(expr)) {
    return "ListNode";
  }
  if (operatorKind === "->" && /(?:->|\.)(?:left|right)$/.test(expr)) {
    return "TreeNode";
  }
  if (operatorKind === "->" && /(?:->|\.)random$/.test(expr)) {
    return "Node";
  }

  const lines = getMaskedCLines(model);

  // Multi-bracket subscript / array indexing: arr[0]. or matrix[0][0]. or matrix[row[0]][col[0]].
  const subParsed = parseSubscriptExpression(expr);
  if (subParsed) {
    const { baseVar, subDepth } = subParsed;
    const scopes = computeCScopes(model, position.lineNumber);

    for (let ln = position.lineNumber; ln >= 1; ln--) {
      if (!isLineVisible(scopes, ln)) continue;
      const line = (lines[ln - 1] ?? "").trim();
      if (!line) continue;

      // Match array declaration e.g. int arr[10]; or struct ListNode nodes[10];
      const arrDecl = line.match(
        new RegExp(
          `\\b((?:struct\\s+[a-zA-Z_]\\w*|[a-zA-Z_]\\w*))\\s*(\\*+)?\\s+${baseVar}\\s*((?:\\[[^\\]]*\\])+)`,
        ),
      );
      if (arrDecl) {
        const declaredDim = (arrDecl[3].match(/\[/g) || []).length;
        if (subDepth === declaredDim) {
          // e.g. int arr[10]; arr[0] is primitive int, struct ListNode nodes[10]; is ListNode
          const elemType = classifyCTypeName(arrDecl[1]);
          return elemType === "unknown" ? "primitive" : elemType;
        }
        return "primitive";
      }
    }
  }

  // Direct variable access or a member chain: head-> or s.addr. or p->pos.
  const chain = expr.match(/^([a-zA-Z_]\w*)((?:\s*(?:->|\.)\s*[a-zA-Z_]\w*)*)$/);
  if (chain) {
    const scopes = computeCScopes(model, position.lineNumber);
    let current = inferCVariableType(lines, scopes, position.lineNumber, chain[1]);
    const members = chain[2].match(/[a-zA-Z_]\w*/g) ?? [];
    if (members.length > 0) {
      const structs = extractCStructs(model);
      for (const member of members) {
        const field = structs.get(current)?.fields.find((f) => f.name === member);
        if (!field) return "unknown";
        current = classifyCTypeName(field.type);
      }
    }
    return current;
  }

  return "unknown";
}

// --- Document Variable & Function Extraction -------------------------------------------

export interface CDocSymbol {
  name: string;
  kind: monacoDefault.languages.CompletionItemKind;
  detail: string;
  documentation?: string;
  line: number;
}

/** Splits a parameter such as "const char *s" or "int (*cmp)(int, int)" into type and name. */
function parseCParam(param: string): { type: string; name: string } | null {
  const funcPtr = param.match(/\(\s*\*\s*([a-zA-Z_]\w*)\s*\)/);
  if (funcPtr) return { type: param.replace(funcPtr[1], "").trim(), name: funcPtr[1] };
  const m = param.match(/^(.*?)\b([a-zA-Z_]\w*)\s*(?:\[[^\]]*\]\s*)*$/);
  if (!m || !m[1].trim()) return null;
  return { type: m[1].replace(/\s+\*/g, "*").trim(), name: m[2] };
}

/**
 * Extracts visible document symbols (functions and variables) at cursor line,
 * honoring C scope boundaries so locals do not leak across functions.
 */
export function extractCDocSymbols(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): CDocSymbol[] {
  const lineCount = model.getLineCount();
  const scopes = computeCScopes(model, cursorLine);
  const lines = getMaskedCLines(model);
  const symbols: CDocSymbol[] = [];
  const seen = new Set<string>();

  for (let ln = 1; ln <= lineCount; ln++) {
    const masked = (lines[ln - 1] ?? "").trim();
    if (!masked || masked.startsWith("#")) continue;

    // Check function definition / declaration (calls such as printf(...); are not headers)
    const header = parseCFunctionHeader(masked);
    if (header) {
      const fName = header.name;
      if (!seen.has(fName)) {
        seen.add(fName);
        symbols.push({
          name: fName,
          kind: monacoDefault.languages.CompletionItemKind.Function,
          detail: header.signature,
          documentation: `User-defined function (line ${ln})`,
          line: ln,
        });
      }

      // If this is the active function enclosing cursorLine, extract its parameters
      if (ln === scopes.activeFuncLine) {
        for (const rawParam of header.params) {
          const param = parseCParam(rawParam.replace(/^const\s+/, ""));
          if (!param) continue;
          const { type: pType, name: pName } = param;
          if (!seen.has(pName) && !C_KEYWORD_SET.has(pName)) {
            seen.add(pName);
            symbols.push({
              name: pName,
              kind: monacoDefault.languages.CompletionItemKind.Variable,
              detail: `${pType} ${pName} (parameter)`,
              documentation: `Function parameter (line ${ln})`,
              line: ln,
            });
          }
        }
      }
    }

    // Check enum declaration
    const enumMatch = masked.match(/\benum\s+([a-zA-Z_]\w*)?\s*\{([^}]+)\}/);
    if (enumMatch) {
      const enumBody = enumMatch[2];
      const items = enumBody.split(",");
      for (const rawItem of items) {
        const item = rawItem.split("=")[0].trim();
        if (item && !seen.has(item) && !C_KEYWORD_SET.has(item)) {
          seen.add(item);
          symbols.push({
            name: item,
            kind: monacoDefault.languages.CompletionItemKind.EnumMember,
            detail: `enum constant`,
            documentation: `Enumeration constant (line ${ln})`,
            line: ln,
          });
        }
      }
    }

    // Check variable declaration if line is visible in current scope
    if (isLineVisible(scopes, ln)) {
      // Identifier hygiene: negative lookbehind (?:^|[^.->]) so member names are not captured
      const varDeclMatches = masked.matchAll(
        /(?:^|[^.->])\b((?:const\s+)?(?:struct\s+[a-zA-Z_]\w*|[a-zA-Z_]\w*))\s*(\*+)?\s+([^;]+);/g,
      );
      for (const vm of varDeclMatches) {
        const baseType = vm[1].trim();
        if (
          C_KEYWORD_SET.has(baseType) &&
          baseType !== "int" &&
          baseType !== "char" &&
          baseType !== "float" &&
          baseType !== "double" &&
          baseType !== "void" &&
          baseType !== "long" &&
          baseType !== "short" &&
          baseType !== "unsigned" &&
          baseType !== "signed" &&
          baseType !== "struct"
        ) {
          continue;
        }

        const varGroup = vm[3];
        const individualVars = varGroup.split(",");
        for (const rawV of individualVars) {
          const namePart = rawV.split("=")[0].replace(/\*+/g, "").trim();
          const matchName = namePart.match(/([a-zA-Z_]\w*)$/);
          const cleanVar = matchName ? matchName[1] : "";
          if (
            cleanVar &&
            !seen.has(cleanVar) &&
            !C_KEYWORD_SET.has(cleanVar) &&
            !/^\d/.test(cleanVar)
          ) {
            seen.add(cleanVar);
            symbols.push({
              name: cleanVar,
              kind: monacoDefault.languages.CompletionItemKind.Variable,
              detail: `${baseType} ${cleanVar}`,
              documentation: `Variable declared at line ${ln}`,
              line: ln,
            });
          }
        }
      }
    }
  }

  return symbols;
}

// --- Registration ----------------------------------------------------------------------

export function registerCCompletions(monacoInstance?: Monaco) {
  const m = monacoInstance ?? monacoDefault;

  // 1. Completion Provider
  m.languages.registerCompletionItemProvider("c", {
    // '<' and '"' are only for #include; '>' is only for '->'.
    triggerCharacters: [".", ">", "<", '"', "#"],
    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, position.column - 1);
      const word = model.getWordUntilPosition(position);
      const textBeforeWord = textBefore.slice(0, textBefore.length - word.word.length);

      const defaultRange: monacoDefault.IRange = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      // --- Preprocessor #include <...> directive ---
      if (/#include\s*<([^>]*)$/.test(textBefore)) {
        const headerItems: monacoDefault.languages.CompletionItem[] = C_STANDARD_HEADERS.map(
          (hdr) => ({
            label: hdr.name,
            kind: m.languages.CompletionItemKind.Module,
            insertText: hdr.name,
            detail: hdr.detail,
            documentation: hdr.documentation,
            range: defaultRange,
          }),
        );
        return { suggestions: headerItems };
      }

      // --- Preprocessor #include "..." directive ---
      if (/#include\s*"([^"]*)$/.test(textBefore)) {
        return { suggestions: [] };
      }

      // --- Preprocessor # directive ---
      if (/^\s*#\w*$/.test(textBefore)) {
        const directiveItems: monacoDefault.languages.CompletionItem[] = [
          {
            label: "#include <...>",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "include <${1:stdio.h}>",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#include <header.h>",
            documentation: "Includes a standard library header.",
            range: defaultRange,
          },
          {
            label: '#include "..."',
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: 'include "${1:header.h}"',
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: '#include "header.h"',
            documentation: "Includes a user or local header file.",
            range: defaultRange,
          },
          {
            label: "#define",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "define ${1:NAME} ${2:VALUE}",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#define NAME VALUE",
            documentation: "Defines a preprocessor macro or constant.",
            range: defaultRange,
          },
          {
            label: "#ifdef",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "ifdef ${1:MACRO}\n${2}\n#endif",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#ifdef ... #endif",
            documentation: "Conditional compilation if macro is defined.",
            range: defaultRange,
          },
          {
            label: "#ifndef",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "ifndef ${1:MACRO}\n#define ${1:MACRO}\n\n${2}\n\n#endif",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#ifndef ... #define ... #endif",
            documentation: "Include guard template.",
            range: defaultRange,
          },
          {
            label: "#endif",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "endif",
            detail: "#endif",
            documentation: "Ends a conditional preprocessor directive block.",
            range: defaultRange,
          },
          {
            label: "#if",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "if ${1:CONDITION}\n${2}\n#endif",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#if CONDITION ... #endif",
            documentation: "Conditional preprocessor block.",
            range: defaultRange,
          },
          {
            label: "#else",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "else",
            detail: "#else",
            documentation: "Alternative branch of conditional preprocessor block.",
            range: defaultRange,
          },
          {
            label: "#elif",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "elif ${1:CONDITION}",
            insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "#elif CONDITION",
            documentation: "Else-if preprocessor branch.",
            range: defaultRange,
          },
          {
            label: "#pragma once",
            kind: m.languages.CompletionItemKind.Snippet,
            insertText: "pragma once",
            detail: "#pragma once",
            documentation: "Header guard directive.",
            range: defaultRange,
          },
        ];
        return { suggestions: directiveItems };
      }

      // --- Nothing to suggest inside comments, strings, or char literals ---
      const docPrefix = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      if (isInCCommentOrString(docPrefix)) {
        return { suggestions: [] };
      }

      // --- Member Access: '.' or '->' ---
      const arrowMatch = textBeforeWord.endsWith("->");
      const dotMatch = textBeforeWord.endsWith(".");

      if (dotMatch || arrowMatch) {
        const opKind = arrowMatch ? "->" : ".";

        const inferred = inferCType(model, position, textBeforeWord, opKind);

        // Crucial Rule: Primitives CANNOT be dereferenced in C.
        if (inferred === "primitive") {
          return { suggestions: [] };
        }

        if (inferred === "ListNode") {
          return { suggestions: toCompletionItems(LISTNODE_MEMBERS, defaultRange) };
        }
        if (inferred === "TreeNode") {
          return { suggestions: toCompletionItems(TREENODE_MEMBERS, defaultRange) };
        }
        if (inferred === "Node") {
          return { suggestions: toCompletionItems(NODE_MEMBERS, defaultRange) };
        }
        if (inferred === "Point") {
          return { suggestions: toCompletionItems(POINT_MEMBERS, defaultRange) };
        }
        if (inferred === "Pair") {
          return { suggestions: toCompletionItems(PAIR_MEMBERS, defaultRange) };
        }

        // Check user-defined structs in document
        const userStructs = extractCStructs(model);
        if (userStructs.has(inferred)) {
          const sDef = userStructs.get(inferred)!;
          const sItems: monacoDefault.languages.CompletionItem[] = sDef.fields.map((f) => ({
            label: f.name,
            kind: m.languages.CompletionItemKind.Field,
            insertText: f.name,
            detail: f.detail,
            documentation: f.documentation,
            range: defaultRange,
          }));
          return { suggestions: sItems };
        }

        // If an unknown variable in C, offer DSA struct fields as fallback, but NEVER global functions or keywords.
        // Calls like foo(). and other expressions get nothing rather than a guess.
        const memberExpr = trailingCExpression(textBeforeWord.slice(0, -opKind.length).trimEnd());
        if (
          inferred === "unknown" &&
          /^[a-zA-Z_]\w*(?:\s*(?:->|\.)\s*[a-zA-Z_]\w*)*$/.test(memberExpr)
        ) {
          const fallbackMembers = deduplicateSuggestions([
            ...toCompletionItems(LISTNODE_MEMBERS, defaultRange),
            ...toCompletionItems(TREENODE_MEMBERS, defaultRange),
          ]);
          return { suggestions: fallbackMembers };
        }

        return { suggestions: [] };
      }

      // A trigger character with nothing to complete (`a > b`, a lone `<`, `"` or `#`)
      if (/[<>"#]$/.test(textBefore)) {
        return { suggestions: [] };
      }

      // --- General Context Completions (Keywords, Functions, Types, Snippets, Local Symbols) ---

      const suggestions: monacoDefault.languages.CompletionItem[] = [];

      // 1. Standard C Functions
      for (const fn of ALL_STD_FUNCTIONS) {
        suggestions.push({
          label: fn.label,
          kind: m.languages.CompletionItemKind.Function,
          insertText: fn.snippet ?? fn.label,
          insertTextRules: fn.snippet
            ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          detail: fn.detail,
          documentation: fn.documentation,
          range: defaultRange,
        });
      }

      // 2. Standard C Constants & Macros
      for (const c of C_CONSTANTS) {
        suggestions.push({
          label: c.label,
          kind: c.kind ?? m.languages.CompletionItemKind.Constant,
          insertText: c.snippet ?? c.label,
          detail: c.detail,
          documentation: c.documentation,
          range: defaultRange,
        });
      }

      // 3. Standard C Types
      for (const t of C_STANDARD_TYPES) {
        suggestions.push({
          label: t.name,
          kind: m.languages.CompletionItemKind.Class,
          insertText: t.name,
          detail: t.detail,
          documentation: t.documentation,
          range: defaultRange,
        });
      }

      // 4. C Keywords
      for (const kw of C_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: m.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: `keyword ${kw}`,
          range: defaultRange,
        });
      }

      // 5. Snippets
      for (const snip of C_SNIPPETS) {
        // Context awareness: if user already typed 'int main', avoid 'int int main'
        let insertText = snip.insertText;
        if (snip.label === "main" && /\bint\s+main$/i.test(textBefore.trim())) {
          insertText = "(int argc, char *argv[]) {\n    ${1}\n    return 0;\n}";
        }
        suggestions.push({
          label: snip.label,
          kind: m.languages.CompletionItemKind.Snippet,
          insertText,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: snip.detail,
          documentation: snip.documentation,
          range: defaultRange,
        });
      }

      // 6. User-defined Structs
      const docStructs = extractCStructs(model);
      for (const [name, sDef] of docStructs.entries()) {
        suggestions.push({
          label: name,
          kind: m.languages.CompletionItemKind.Struct,
          insertText: name,
          detail: `struct ${name}`,
          documentation: `User-defined struct declared at line ${sDef.line}`,
          range: defaultRange,
        });
      }

      // 7. Visible Document Symbols (Functions, Variables, Parameters)
      const docSymbols = extractCDocSymbols(model, position.lineNumber);
      for (const sym of docSymbols) {
        suggestions.push({
          label: sym.name,
          kind: sym.kind,
          insertText: sym.name,
          detail: sym.detail,
          documentation: sym.documentation,
          range: defaultRange,
        });
      }

      return { suggestions: deduplicateSuggestions(suggestions) };
    },
  });

  // 2. Hover Provider
  m.languages.registerHoverProvider("c", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const name = word.word;

      // Check standard library functions
      const fn = ALL_STD_FUNCTIONS.find((f) => f.label === name);
      if (fn && fn.detail) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [{ value: `\`\`\`c\n${fn.detail}\n\`\`\`` }, { value: fn.documentation ?? "" }],
        };
      }

      // Check standard constants
      const c = C_CONSTANTS.find((item) => item.label === name);
      if (c && c.detail) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            {
              value: `\`\`\`c\n#define ${c.detail.startsWith(c.label) ? c.detail : `${c.label} ${c.detail}`}\n\`\`\``,
            },
            { value: c.documentation ?? "" },
          ],
        };
      }

      // Check standard types
      const t = C_STANDARD_TYPES.find((item) => item.name === name);
      if (t) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [{ value: `\`\`\`c\ntypedef ${t.name}\n\`\`\`` }, { value: t.documentation }],
        };
      }

      // Check C keywords
      if (C_KEYWORD_SET.has(name)) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`c\nkeyword ${name}\n\`\`\`` },
            { value: `C standard language keyword.` },
          ],
        };
      }

      // Check user-defined structs
      const docStructs = extractCStructs(model);
      if (docStructs.has(name)) {
        const sDef = docStructs.get(name)!;
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`c\nstruct ${name}\n\`\`\`` },
            { value: `User-defined struct defined at line ${sDef.line}` },
          ],
        };
      }

      // Check visible document symbols (functions and variables)
      const docSymbols = extractCDocSymbols(model, position.lineNumber);
      const sym = docSymbols.find((s) => s.name === name);
      if (sym) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`c\n${sym.detail}\n\`\`\`` },
            { value: sym.documentation ?? "" },
          ],
        };
      }

      return null;
    },
  });

  // 3. Signature Help Provider
  m.languages.registerSignatureHelpProvider("c", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      const startLine = Math.max(1, position.lineNumber - 50);
      const docPrefix = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Mask comments so parens or quotes inside them do not corrupt parameter parsing.
      // Mask from the top of the file so a block comment opened above startLine is known.
      const cleanedText = maskCComments(docPrefix)
        .split("\n")
        .slice(startLine - 1)
        .join("\n");

      // Track block stacks for parentheses and brackets
      const blockStack: { char: string; openIdx: number; argCount: number }[] = [];
      let inQuote: string | null = null;
      let isEscaped = false;

      for (let i = 0; i < cleanedText.length; i++) {
        const ch = cleanedText[i];

        if (inQuote !== null) {
          if (ch === inQuote && !isEscaped) {
            inQuote = null;
          } else if (ch === "\\" && !isEscaped) {
            isEscaped = true;
            continue;
          }
          isEscaped = false;
          continue;
        }

        if (ch === '"' || ch === "'") {
          inQuote = ch;
          continue;
        }

        if (ch === "(") {
          blockStack.push({ char: "(", openIdx: i, argCount: 0 });
        } else if (ch === ")") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
            blockStack.pop();
          }
        } else if (ch === "[") {
          blockStack.push({ char: "[", openIdx: i, argCount: 0 });
        } else if (ch === "]") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "[") {
            blockStack.pop();
          }
        } else if (ch === "{") {
          blockStack.push({ char: "{", openIdx: i, argCount: 0 });
        } else if (ch === "}") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "{") {
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

      // Extract function call prefix immediately preceding '('
      const callPrefix = cleanedText.slice(0, top.openIdx).trimEnd();
      const callMatch = callPrefix.match(/(?:^|[^\w])([a-zA-Z_]\w*)$/);
      if (!callMatch) return null;

      const funcName = callMatch[1];

      // Never provide false signatures for language keywords (if, while, for, switch, etc.)
      if (
        funcName === "if" ||
        funcName === "while" ||
        funcName === "for" ||
        funcName === "switch" ||
        funcName === "return" ||
        funcName === "sizeof"
      ) {
        return null;
      }

      // Check standard C library functions
      let found: CompletionItemDef | undefined = ALL_STD_FUNCTIONS.find(
        (f) => f.label === funcName,
      );

      // If not in standard functions, check document-defined functions (headers only, not calls)
      if (!found) {
        const lines = getMaskedCLines(model);
        for (let ln = 1; ln <= lines.length; ln++) {
          const header = parseCFunctionHeader(lines[ln - 1]);
          if (header && header.name === funcName) {
            found = {
              label: funcName,
              detail: header.signature,
              documentation: `User-defined function (line ${ln})`,
            };
            break;
          }
        }
      }

      if (found && found.detail) {
        // Split on top-level commas so function-pointer parameters (qsort, atexit) stay whole
        const paramList = parseCSignatureParams(found.detail);

        return {
          value: {
            signatures: [
              {
                label: found.detail,
                documentation: found.documentation,
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
