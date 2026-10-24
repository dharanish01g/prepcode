import * as monacoDefault from "monaco-editor";
import {
  type CompletionItemDef,
  deduplicateSuggestions,
  toCompletionItems,
} from "./completion-utils.ts";

type Monaco = typeof monacoDefault;

// --- Standard Library Member Definitions -----------------------------------------------

export const STRING_MEMBERS: CompletionItemDef[] = [
  {
    label: "length",
    detail: "size_t string::length() const noexcept",
    documentation: "Returns the number of characters in the string.",
    snippet: "length()",
  },
  {
    label: "size",
    detail: "size_t string::size() const noexcept",
    documentation: "Returns the number of characters in the string (alias for length()).",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool string::empty() const noexcept",
    documentation: "Checks whether the string is empty.",
    snippet: "empty()",
  },
  {
    label: "substr",
    detail: "string string::substr(size_t pos = 0, size_t count = npos) const",
    documentation: "Returns a substring [pos, pos+count).",
    snippet: "substr(${1:pos}, ${2:count})",
  },
  {
    label: "find",
    detail: "size_t string::find(const string& str, size_t pos = 0) const noexcept",
    documentation:
      "Finds the first occurrence of str in the string. Returns string::npos if not found.",
    snippet: "find(${1:str})",
  },
  {
    label: "rfind",
    detail: "size_t string::rfind(const string& str, size_t pos = npos) const noexcept",
    documentation: "Finds the last occurrence of str in the string.",
    snippet: "rfind(${1:str})",
  },
  {
    label: "push_back",
    detail: "void string::push_back(char ch)",
    documentation: "Appends the character ch to the end of the string.",
    snippet: "push_back(${1:ch});",
  },
  {
    label: "pop_back",
    detail: "void string::pop_back()",
    documentation: "Erases the last character of the string.",
    snippet: "pop_back()",
  },
  {
    label: "append",
    detail: "string& string::append(const string& str)",
    documentation: "Appends characters to the string.",
    snippet: "append(${1:str})",
  },
  {
    label: "insert",
    detail: "string& string::insert(size_t index, const string& str)",
    documentation: "Inserts characters at position index.",
    snippet: "insert(${1:index}, ${2:str})",
  },
  {
    label: "erase",
    detail: "string& string::erase(size_t index = 0, size_t count = npos)",
    documentation: "Erases count characters starting at index.",
    snippet: "erase(${1:index}, ${2:count})",
  },
  {
    label: "replace",
    detail: "string& string::replace(size_t pos, size_t count, const string& str)",
    documentation: "Replaces the portion [pos, pos+count) with str.",
    snippet: "replace(${1:pos}, ${2:count}, ${3:str})",
  },
  {
    label: "clear",
    detail: "void string::clear() noexcept",
    documentation: "Clears the contents of the string.",
    snippet: "clear()",
  },
  {
    label: "at",
    detail: "char& string::at(size_t pos)",
    documentation: "Accesses specified character with bounds checking.",
    snippet: "at(${1:pos})",
  },
  {
    label: "front",
    detail: "char& string::front()",
    documentation: "Accesses the first character.",
    snippet: "front()",
  },
  {
    label: "back",
    detail: "char& string::back()",
    documentation: "Accesses the last character.",
    snippet: "back()",
  },
  {
    label: "c_str",
    detail: "const char* string::c_str() const noexcept",
    documentation: "Returns a pointer to a null-terminated character array with string contents.",
    snippet: "c_str()",
  },
  {
    label: "data",
    detail: "char* string::data() noexcept",
    documentation: "Returns a pointer to the underlying array serving as element storage.",
    snippet: "data()",
  },
  {
    label: "begin",
    detail: "iterator string::begin() noexcept",
    documentation: "Returns an iterator to the beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator string::end() noexcept",
    documentation: "Returns an iterator to the end.",
    snippet: "end()",
  },
];

export const VECTOR_MEMBERS: CompletionItemDef[] = [
  {
    label: "push_back",
    detail: "void vector<T>::push_back(const T& value)",
    documentation: "Adds an element to the end.",
    snippet: "push_back(${1:value});",
  },
  {
    label: "emplace_back",
    detail: "reference vector<T>::emplace_back(Args&&... args)",
    documentation: "Constructs an element in-place at the end.",
    snippet: "emplace_back(${1:args});",
  },
  {
    label: "pop_back",
    detail: "void vector<T>::pop_back()",
    documentation: "Removes the last element.",
    snippet: "pop_back();",
  },
  {
    label: "size",
    detail: "size_t vector<T>::size() const noexcept",
    documentation: "Returns the number of elements in the vector.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool vector<T>::empty() const noexcept",
    documentation: "Checks whether the vector is empty.",
    snippet: "empty()",
  },
  {
    label: "resize",
    detail: "void vector<T>::resize(size_t count, const T& value = T())",
    documentation: "Changes the number of elements stored.",
    snippet: "resize(${1:count})",
  },
  {
    label: "reserve",
    detail: "void vector<T>::reserve(size_t new_cap)",
    documentation: "Reserves storage capacity to avoid reallocations.",
    snippet: "reserve(${1:new_cap})",
  },
  {
    label: "capacity",
    detail: "size_t vector<T>::capacity() const noexcept",
    documentation:
      "Returns the number of elements that the vector has currently allocated space for.",
    snippet: "capacity()",
  },
  {
    label: "clear",
    detail: "void vector<T>::clear() noexcept",
    documentation: "Clears the contents.",
    snippet: "clear();",
  },
  {
    label: "at",
    detail: "reference vector<T>::at(size_t pos)",
    documentation: "Accesses specified element with bounds checking.",
    snippet: "at(${1:pos})",
  },
  {
    label: "front",
    detail: "reference vector<T>::front()",
    documentation: "Accesses the first element.",
    snippet: "front()",
  },
  {
    label: "back",
    detail: "reference vector<T>::back()",
    documentation: "Accesses the last element.",
    snippet: "back()",
  },
  {
    label: "data",
    detail: "T* vector<T>::data() noexcept",
    documentation: "Direct access to the underlying contiguous array.",
    snippet: "data()",
  },
  {
    label: "insert",
    detail: "iterator vector<T>::insert(const_iterator pos, const T& value)",
    documentation: "Inserts elements at specified position.",
    snippet: "insert(${1:pos}, ${2:value})",
  },
  {
    label: "erase",
    detail: "iterator vector<T>::erase(const_iterator pos)",
    documentation: "Erases elements at specified position or range.",
    snippet: "erase(${1:pos})",
  },
  {
    label: "begin",
    detail: "iterator vector<T>::begin() noexcept",
    documentation: "Returns an iterator to the beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator vector<T>::end() noexcept",
    documentation: "Returns an iterator to the end.",
    snippet: "end()",
  },
  {
    label: "rbegin",
    detail: "reverse_iterator vector<T>::rbegin() noexcept",
    documentation: "Returns a reverse iterator to the beginning of the reversed vector.",
    snippet: "rbegin()",
  },
  {
    label: "rend",
    detail: "reverse_iterator vector<T>::rend() noexcept",
    documentation: "Returns a reverse iterator to the end of the reversed vector.",
    snippet: "rend()",
  },
];

export const MAP_MEMBERS: CompletionItemDef[] = [
  {
    label: "insert",
    detail: "pair<iterator, bool> map<Key, T>::insert(const value_type& value)",
    documentation: "Inserts element or nodes into the map.",
    snippet: "insert({${1:key}, ${2:val}})",
  },
  {
    label: "emplace",
    detail: "pair<iterator, bool> map<Key, T>::emplace(Args&&... args)",
    documentation: "Constructs element in-place.",
    snippet: "emplace(${1:key}, ${2:val})",
  },
  {
    label: "count",
    detail: "size_t map<Key, T>::count(const Key& key) const",
    documentation: "Returns the number of elements matching key (0 or 1 for map).",
    snippet: "count(${1:key})",
  },
  {
    label: "find",
    detail: "iterator map<Key, T>::find(const Key& key)",
    documentation: "Finds element with specific key. Returns end() if not found.",
    snippet: "find(${1:key})",
  },
  {
    label: "contains",
    detail: "bool map<Key, T>::contains(const Key& key) const",
    documentation: "Checks if the container contains element with specific key (C++20).",
    snippet: "contains(${1:key})",
  },
  {
    label: "erase",
    detail: "size_t map<Key, T>::erase(const Key& key)",
    documentation: "Erases elements with specific key.",
    snippet: "erase(${1:key})",
  },
  {
    label: "size",
    detail: "size_t map<Key, T>::size() const noexcept",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool map<Key, T>::empty() const noexcept",
    documentation: "Checks whether the map is empty.",
    snippet: "empty()",
  },
  {
    label: "clear",
    detail: "void map<Key, T>::clear() noexcept",
    documentation: "Clears the contents of the map.",
    snippet: "clear()",
  },
  {
    label: "at",
    detail: "T& map<Key, T>::at(const Key& key)",
    documentation: "Accesses element with bounds checking; throws std::out_of_range if not found.",
    snippet: "at(${1:key})",
  },
  {
    label: "begin",
    detail: "iterator map<Key, T>::begin() noexcept",
    documentation: "Returns an iterator to the beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator map<Key, T>::end() noexcept",
    documentation: "Returns an iterator to the end.",
    snippet: "end()",
  },
];

export const SET_MEMBERS: CompletionItemDef[] = [
  {
    label: "insert",
    detail: "pair<iterator, bool> set<Key>::insert(const value_type& value)",
    documentation: "Inserts element into the set.",
    snippet: "insert(${1:value})",
  },
  {
    label: "emplace",
    detail: "pair<iterator, bool> set<Key>::emplace(Args&&... args)",
    documentation: "Constructs element in-place in the set.",
    snippet: "emplace(${1:value})",
  },
  {
    label: "count",
    detail: "size_t set<Key>::count(const Key& key) const",
    documentation: "Returns 1 if key is present, 0 otherwise.",
    snippet: "count(${1:key})",
  },
  {
    label: "find",
    detail: "iterator set<Key>::find(const Key& key)",
    documentation: "Finds element with specific key. Returns end() if not found.",
    snippet: "find(${1:key})",
  },
  {
    label: "contains",
    detail: "bool set<Key>::contains(const Key& key) const",
    documentation: "Checks if the container contains element with specific key (C++20).",
    snippet: "contains(${1:key})",
  },
  {
    label: "erase",
    detail: "size_t set<Key>::erase(const Key& key)",
    documentation: "Erases element with specific key.",
    snippet: "erase(${1:key})",
  },
  {
    label: "size",
    detail: "size_t set<Key>::size() const noexcept",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool set<Key>::empty() const noexcept",
    documentation: "Checks whether the set is empty.",
    snippet: "empty()",
  },
  {
    label: "clear",
    detail: "void set<Key>::clear() noexcept",
    documentation: "Clears the contents of the set.",
    snippet: "clear()",
  },
  {
    label: "begin",
    detail: "iterator set<Key>::begin() noexcept",
    documentation: "Returns an iterator to the beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator set<Key>::end() noexcept",
    documentation: "Returns an iterator to the end.",
    snippet: "end()",
  },
];

export const QUEUE_MEMBERS: CompletionItemDef[] = [
  {
    label: "push",
    detail: "void queue<T>::push(const T& value)",
    documentation: "Inserts element at the end of the queue.",
    snippet: "push(${1:value});",
  },
  {
    label: "emplace",
    detail: "decltype(auto) queue<T>::emplace(Args&&... args)",
    documentation: "Constructs element in-place at the end.",
    snippet: "emplace(${1:args});",
  },
  {
    label: "pop",
    detail: "void queue<T>::pop()",
    documentation: "Removes the front element of the queue.",
    snippet: "pop();",
  },
  {
    label: "front",
    detail: "reference queue<T>::front()",
    documentation: "Accesses the next element in the queue.",
    snippet: "front()",
  },
  {
    label: "back",
    detail: "reference queue<T>::back()",
    documentation: "Accesses the last element in the queue.",
    snippet: "back()",
  },
  {
    label: "size",
    detail: "size_t queue<T>::size() const",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool queue<T>::empty() const",
    documentation: "Checks whether the queue is empty.",
    snippet: "empty()",
  },
];

export const STACK_MEMBERS: CompletionItemDef[] = [
  {
    label: "push",
    detail: "void stack<T>::push(const T& value)",
    documentation: "Inserts element at the top of the stack.",
    snippet: "push(${1:value});",
  },
  {
    label: "emplace",
    detail: "decltype(auto) stack<T>::emplace(Args&&... args)",
    documentation: "Constructs element in-place at the top.",
    snippet: "emplace(${1:args});",
  },
  {
    label: "pop",
    detail: "void stack<T>::pop()",
    documentation: "Removes the top element.",
    snippet: "pop();",
  },
  {
    label: "top",
    detail: "reference stack<T>::top()",
    documentation: "Accesses the top element.",
    snippet: "top()",
  },
  {
    label: "size",
    detail: "size_t stack<T>::size() const",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool stack<T>::empty() const",
    documentation: "Checks whether the stack is empty.",
    snippet: "empty()",
  },
];

export const PRIORITY_QUEUE_MEMBERS: CompletionItemDef[] = [
  {
    label: "push",
    detail: "void priority_queue<T>::push(const T& value)",
    documentation: "Inserts element into the priority queue and sorts it.",
    snippet: "push(${1:value});",
  },
  {
    label: "emplace",
    detail: "void priority_queue<T>::emplace(Args&&... args)",
    documentation: "Constructs element in-place in the priority queue.",
    snippet: "emplace(${1:args});",
  },
  {
    label: "pop",
    detail: "void priority_queue<T>::pop()",
    documentation: "Removes the top (greatest by default) element.",
    snippet: "pop();",
  },
  {
    label: "top",
    detail: "const_reference priority_queue<T>::top() const",
    documentation: "Accesses the top element.",
    snippet: "top()",
  },
  {
    label: "size",
    detail: "size_t priority_queue<T>::size() const",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool priority_queue<T>::empty() const",
    documentation: "Checks whether the priority queue is empty.",
    snippet: "empty()",
  },
];

export const DEQUE_MEMBERS: CompletionItemDef[] = [
  {
    label: "push_back",
    detail: "void deque<T>::push_back(const T& value)",
    documentation: "Adds an element to the end.",
    snippet: "push_back(${1:value});",
  },
  {
    label: "push_front",
    detail: "void deque<T>::push_front(const T& value)",
    documentation: "Adds an element to the front.",
    snippet: "push_front(${1:value});",
  },
  {
    label: "pop_back",
    detail: "void deque<T>::pop_back()",
    documentation: "Removes the last element.",
    snippet: "pop_back();",
  },
  {
    label: "pop_front",
    detail: "void deque<T>::pop_front()",
    documentation: "Removes the first element.",
    snippet: "pop_front();",
  },
  {
    label: "front",
    detail: "reference deque<T>::front()",
    documentation: "Accesses the first element.",
    snippet: "front()",
  },
  {
    label: "back",
    detail: "reference deque<T>::back()",
    documentation: "Accesses the last element.",
    snippet: "back()",
  },
  {
    label: "size",
    detail: "size_t deque<T>::size() const noexcept",
    documentation: "Returns the number of elements.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool deque<T>::empty() const noexcept",
    documentation: "Checks whether the deque is empty.",
    snippet: "empty()",
  },
  {
    label: "clear",
    detail: "void deque<T>::clear() noexcept",
    documentation: "Clears the contents.",
    snippet: "clear();",
  },
  {
    label: "begin",
    detail: "iterator deque<T>::begin() noexcept",
    documentation: "Returns an iterator to the beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator deque<T>::end() noexcept",
    documentation: "Returns an iterator to the end.",
    snippet: "end()",
  },
];

export const PAIR_MEMBERS: CompletionItemDef[] = [
  {
    label: "first",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "T1 pair<T1, T2>::first",
    documentation: "The first element of the pair.",
    snippet: "first",
  },
  {
    label: "second",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "T2 pair<T1, T2>::second",
    documentation: "The second element of the pair.",
    snippet: "second",
  },
];

export const LISTNODE_MEMBERS: CompletionItemDef[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int ListNode::val",
    documentation: "The integer value stored in this list node.",
    snippet: "val",
  },
  {
    label: "next",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "ListNode* ListNode::next",
    documentation: "Pointer to the next list node in the linked list.",
    snippet: "next",
  },
];

export const TREENODE_MEMBERS: CompletionItemDef[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "int TreeNode::val",
    documentation: "The integer value stored in this binary tree node.",
    snippet: "val",
  },
  {
    label: "left",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "TreeNode* TreeNode::left",
    documentation: "Pointer to the left child node in the binary tree.",
    snippet: "left",
  },
  {
    label: "right",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "TreeNode* TreeNode::right",
    documentation: "Pointer to the right child node in the binary tree.",
    snippet: "right",
  },
];

export const COMMON_CONTAINER_MEMBERS: CompletionItemDef[] = [
  {
    label: "size",
    detail: "size_t size() const",
    documentation: "Returns container element count.",
    snippet: "size()",
  },
  {
    label: "empty",
    detail: "bool empty() const",
    documentation: "Checks whether container is empty.",
    snippet: "empty()",
  },
  {
    label: "clear",
    detail: "void clear()",
    documentation: "Clears container contents.",
    snippet: "clear()",
  },
  {
    label: "begin",
    detail: "iterator begin()",
    documentation: "Returns iterator to beginning.",
    snippet: "begin()",
  },
  {
    label: "end",
    detail: "iterator end()",
    documentation: "Returns iterator to end.",
    snippet: "end()",
  },
];

// --- std:: Scope Members ---------------------------------------------------------------

export const STD_MEMBERS: CompletionItemDef[] = [
  {
    label: "cout",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "std::ostream std::cout",
    documentation: "Standard output stream object.",
    snippet: 'cout << ${1} << "\\n";',
  },
  {
    label: "cin",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "std::istream std::cin",
    documentation: "Standard input stream object.",
    snippet: "cin >> ${1};",
  },
  {
    label: "cerr",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "std::ostream std::cerr",
    documentation: "Standard error output stream object.",
    snippet: 'cerr << ${1} << "\\n";',
  },
  {
    label: "endl",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "std::ostream& std::endl(std::ostream& os)",
    documentation: "Inserts a newline character into the output sequence os and flushes it.",
    snippet: "endl",
  },
  {
    label: "vector",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T> class std::vector",
    documentation: "Sequence container that encapsulates dynamic size arrays.",
    snippet: "vector<${1:int}> ${2:v};",
  },
  {
    label: "string",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "typedef basic_string<char> std::string",
    documentation: "Standard string class.",
    snippet: "string ${1:s};",
  },
  {
    label: "pair",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T1, class T2> struct std::pair",
    documentation:
      "Class template that provides a way to store two heterogeneous objects as a single unit.",
    snippet: "pair<${1:int}, ${2:int}> ${3:p};",
  },
  {
    label: "map",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class Key, class T> class std::map",
    documentation:
      "Sorted associative container of key-value pairs with unique keys (Red-Black Tree).",
    snippet: "map<${1:string}, ${2:int}> ${3:mp};",
  },
  {
    label: "unordered_map",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class Key, class T> class std::unordered_map",
    documentation:
      "Associative container of key-value pairs with unique keys (Hash Table, O(1) avg).",
    snippet: "unordered_map<${1:string}, ${2:int}> ${3:mp};",
  },
  {
    label: "set",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class Key> class std::set",
    documentation: "Sorted associative container of unique keys (Red-Black Tree).",
    snippet: "set<${1:int}> ${2:st};",
  },
  {
    label: "unordered_set",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class Key> class std::unordered_set",
    documentation: "Associative container of unique keys (Hash Table, O(1) avg).",
    snippet: "unordered_set<${1:int}> ${2:st};",
  },
  {
    label: "queue",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T> class std::queue",
    documentation: "FIFO queue container adaptor.",
    snippet: "queue<${1:int}> ${2:q};",
  },
  {
    label: "stack",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T> class std::stack",
    documentation: "LIFO stack container adaptor.",
    snippet: "stack<${1:int}> ${2:st};",
  },
  {
    label: "priority_queue",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T> class std::priority_queue",
    documentation:
      "Container adaptor that provides constant time lookup of the largest (by default) element.",
    snippet: "priority_queue<${1:int}> ${2:pq};",
  },
  {
    label: "deque",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "template<class T> class std::deque",
    documentation: "Double-ended queue sequence container.",
    snippet: "deque<${1:int}> ${2:dq};",
  },
  {
    label: "min",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "const T& std::min(const T& a, const T& b)",
    documentation: "Returns the smaller of given values.",
    snippet: "min(${1:a}, ${2:b})",
  },
  {
    label: "max",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "const T& std::max(const T& a, const T& b)",
    documentation: "Returns the greater of given values.",
    snippet: "max(${1:a}, ${2:b})",
  },
  {
    label: "sort",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "void std::sort(RandomIt first, RandomIt last)",
    documentation: "Sorts the elements in the range [first, last) in non-descending order.",
    snippet: "sort(${1:v}.begin(), ${1:v}.end());",
  },
  {
    label: "reverse",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "void std::reverse(BidirIt first, BidirIt last)",
    documentation: "Reverses the order of elements in the range [first, last).",
    snippet: "reverse(${1:v}.begin(), ${1:v}.end());",
  },
  {
    label: "swap",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "void std::swap(T& a, T& b) noexcept",
    documentation: "Exchanges the values of a and b.",
    snippet: "swap(${1:a}, ${2:b});",
  },
  {
    label: "binary_search",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "bool std::binary_search(ForwardIt first, ForwardIt last, const T& value)",
    documentation: "Checks if an element equivalent to value appears within range [first, last).",
    snippet: "binary_search(${1:v}.begin(), ${1:v}.end(), ${2:val})",
  },
  {
    label: "lower_bound",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ForwardIt std::lower_bound(ForwardIt first, ForwardIt last, const T& value)",
    documentation:
      "Returns iterator to the first element that is not less than (i.e. greater or equal to) value.",
    snippet: "lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})",
  },
  {
    label: "upper_bound",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ForwardIt std::upper_bound(ForwardIt first, ForwardIt last, const T& value)",
    documentation: "Returns iterator to the first element that is greater than value.",
    snippet: "upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})",
  },
  {
    label: "accumulate",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "T std::accumulate(InputIt first, InputIt last, T init)",
    documentation: "Computes the sum of given value init and the elements in range [first, last).",
    snippet: "accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0})",
  },
  {
    label: "fill",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "void std::fill(ForwardIt first, ForwardIt last, const T& value)",
    documentation: "Assigns given value to elements in the range [first, last).",
    snippet: "fill(${1:v}.begin(), ${1:v}.end(), ${2:val});",
  },
  {
    label: "to_string",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "string std::to_string(Numeric val)",
    documentation: "Converts numerical value to std::string.",
    snippet: "to_string(${1:val})",
  },
  {
    label: "stoi",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int std::stoi(const string& str, size_t* pos = 0, int base = 10)",
    documentation: "Converts string to signed integer.",
    snippet: "stoi(${1:str})",
  },
  {
    label: "stoll",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "long long std::stoll(const string& str, size_t* pos = 0, int base = 10)",
    documentation: "Converts string to signed long long.",
    snippet: "stoll(${1:str})",
  },
  {
    label: "make_pair",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "pair<V1, V2> std::make_pair(T1&& t, T2&& u)",
    documentation: "Creates a std::pair object, deducing target types from the types of arguments.",
    snippet: "make_pair(${1:a}, ${2:b})",
  },
  {
    label: "abs",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int std::abs(int n)",
    documentation: "Computes absolute value of an integral or floating-point number.",
    snippet: "abs(${1:x})",
  },
  {
    label: "sqrt",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "double std::sqrt(double num)",
    documentation: "Computes square root.",
    snippet: "sqrt(${1:x})",
  },
  {
    label: "pow",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "double std::pow(double base, double exp)",
    documentation: "Computes base raised to the power exp.",
    snippet: "pow(${1:base}, ${2:exp})",
  },
  {
    label: "gcd",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "M std::gcd(M m, N n)",
    documentation: "Computes the greatest common divisor of m and n (C++17).",
    snippet: "gcd(${1:a}, ${2:b})",
  },
  {
    label: "lcm",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "M std::lcm(M m, N n)",
    documentation: "Computes the least common multiple of m and n (C++17).",
    snippet: "lcm(${1:a}, ${2:b})",
  },
  {
    label: "clamp",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "const T& std::clamp(const T& v, const T& lo, const T& hi)",
    documentation: "Clamps v to range [lo, hi] (C++17).",
    snippet: "clamp(${1:v}, ${2:lo}, ${3:hi})",
  },
  {
    label: "min_element",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ForwardIt std::min_element(ForwardIt first, ForwardIt last)",
    documentation: "Finds the smallest element in the range [first, last).",
    snippet: "min_element(${1:v}.begin(), ${1:v}.end())",
  },
  {
    label: "max_element",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ForwardIt std::max_element(ForwardIt first, ForwardIt last)",
    documentation: "Finds the largest element in the range [first, last).",
    snippet: "max_element(${1:v}.begin(), ${1:v}.end())",
  },
  {
    label: "find",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "InputIt std::find(InputIt first, InputIt last, const T& value)",
    documentation: "Finds the first element in [first, last) equal to value.",
    snippet: "find(${1:v}.begin(), ${1:v}.end(), ${2:val})",
  },
  {
    label: "count",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail:
      "typename iterator_traits<InputIt>::difference_type std::count(InputIt first, InputIt last, const T& value)",
    documentation:
      "Returns the number of elements in [first, last) that satisfy an equality check with value.",
    snippet: "count(${1:v}.begin(), ${1:v}.end(), ${2:val})",
  },
  {
    label: "unique",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "ForwardIt std::unique(ForwardIt first, ForwardIt last)",
    documentation: "Removes all consecutive duplicate elements from range [first, last).",
    snippet: "unique(${1:v}.begin(), ${1:v}.end())",
  },
  {
    label: "next_permutation",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "bool std::next_permutation(BidirIt first, BidirIt last)",
    documentation:
      "Transforms range [first, last) into the next lexicographically greater permutation.",
    snippet: "next_permutation(${1:v}.begin(), ${1:v}.end())",
  },
  {
    label: "prev_permutation",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "bool std::prev_permutation(BidirIt first, BidirIt last)",
    documentation:
      "Transforms range [first, last) into the previous lexicographically greater permutation.",
    snippet: "prev_permutation(${1:v}.begin(), ${1:v}.end())",
  },
  {
    label: "iota",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "void std::iota(ForwardIt first, ForwardIt last, T value)",
    documentation:
      "Fills the range [first, last) with sequentially increasing values starting from value.",
    snippet: "iota(${1:v}.begin(), ${1:v}.end(), ${2:0})",
  },
  {
    label: "stod",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "double std::stod(const string& str, size_t* pos = 0)",
    documentation: "Converts string to floating point number (double).",
    snippet: "stod(${1:str})",
  },
  {
    label: "__builtin_popcount",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int __builtin_popcount(unsigned int x)",
    documentation: "Counts the number of 1-bits (set bits) in an integer.",
    snippet: "__builtin_popcount(${1:x})",
  },
  {
    label: "__builtin_popcountll",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int __builtin_popcountll(unsigned long long x)",
    documentation: "Counts the number of 1-bits (set bits) in a 64-bit integer.",
    snippet: "__builtin_popcountll(${1:x})",
  },
  {
    label: "__builtin_clz",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int __builtin_clz(unsigned int x)",
    documentation: "Counts the number of leading zeros in a 32-bit integer.",
    snippet: "__builtin_clz(${1:x})",
  },
  {
    label: "__builtin_ctz",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    detail: "int __builtin_ctz(unsigned int x)",
    documentation: "Counts the number of trailing zeros in a 32-bit integer.",
    snippet: "__builtin_ctz(${1:x})",
  },
];

export const CPP_KEYWORDS = [
  "int",
  "long",
  "double",
  "float",
  "char",
  "bool",
  "void",
  "auto",
  "const",
  "static",
  "class",
  "struct",
  "public",
  "private",
  "protected",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "default",
  "new",
  "delete",
  "nullptr",
  "true",
  "false",
  "sizeof",
  "typedef",
  "using",
  "namespace",
  "template",
  "typename",
  "virtual",
  "override",
  "constexpr",
  "explicit",
  "inline",
  "operator",
  "try",
  "catch",
  "throw",
  "unsigned",
  "signed",
  "short",
  "INT_MAX",
  "INT_MIN",
  "LLONG_MAX",
  "LLONG_MIN",
];

export const CPP_TYPES: { name: string; doc: string }[] = [
  { name: "string", doc: "std::string sequence of characters." },
  { name: "vector", doc: "std::vector dynamic array." },
  { name: "map", doc: "std::map ordered key-value dictionary." },
  { name: "unordered_map", doc: "std::unordered_map hash table key-value dictionary." },
  { name: "set", doc: "std::set ordered collection of unique keys." },
  { name: "unordered_set", doc: "std::unordered_set hash table of unique keys." },
  { name: "pair", doc: "std::pair storing two heterogeneous objects." },
  { name: "queue", doc: "std::queue FIFO container adaptor." },
  { name: "stack", doc: "std::stack LIFO container adaptor." },
  { name: "priority_queue", doc: "std::priority_queue heap container adaptor." },
  { name: "deque", doc: "std::deque double-ended queue." },
  { name: "ListNode", doc: "Singly-linked list node (int val, ListNode* next)." },
  { name: "TreeNode", doc: "Binary tree node (int val, TreeNode* left, TreeNode* right)." },
];

export const COMMON_HEADERS = [
  "iostream",
  "vector",
  "string",
  "algorithm",
  "cmath",
  "map",
  "set",
  "unordered_map",
  "unordered_set",
  "queue",
  "stack",
  "deque",
  "numeric",
  "climits",
  "sstream",
  "utility",
  "memory",
  "iomanip",
  "bitset",
  "tuple",
  "cctype",
  "cstring",
  "bits/stdc++.h",
];

export const SNIPPETS = [
  {
    label: "main",
    insertText: "int main() {\n    ${1}\n    return 0;\n}",
    detail: "int main() { ... }",
    documentation: "Standard C++ main function entry point.",
  },
  {
    label: "cout",
    insertText: 'std::cout << ${1} << "\\n";',
    detail: "std::cout << ... << '\\n';",
    documentation: "Print to standard output.",
  },
  {
    label: "cin",
    insertText: "std::cin >> ${1};",
    detail: "std::cin >> ...;",
    documentation: "Read from standard input.",
  },
  {
    label: "fori",
    insertText: "for (int i = 0; i < ${1:n}; i++) {\n    ${2}\n}",
    detail: "for (int i = 0; i < n; i++) { ... }",
    documentation: "Standard 0 to n index for-loop.",
  },
  {
    label: "forj",
    insertText: "for (int j = 0; j < ${1:m}; j++) {\n    ${2}\n}",
    detail: "for (int j = 0; j < m; j++) { ... }",
    documentation: "Nested 0 to m index for-loop.",
  },
  {
    label: "forr",
    insertText: "for (int i = ${1:n} - 1; i >= 0; i--) {\n    ${2}\n}",
    detail: "for (int i = n - 1; i >= 0; i--) { ... }",
    documentation: "Reverse index for-loop.",
  },
  {
    label: "foreach",
    insertText: "for (const auto& ${1:item} : ${2:collection}) {\n    ${3}\n}",
    detail: "for (const auto& item : collection) { ... }",
    documentation: "Range-based for loop over collection.",
  },
  {
    label: "while",
    insertText: "while (${1:condition}) {\n    ${2}\n}",
    detail: "while (condition) { ... }",
    documentation: "While loop.",
  },
  {
    label: "ifelse",
    insertText: "if (${1:condition}) {\n    ${2}\n} else {\n    ${3}\n}",
    detail: "if (...) { ... } else { ... }",
    documentation: "If-else conditional statement.",
  },
  {
    label: "class",
    insertText: "class ${1:Solution} {\npublic:\n    ${2}\n};",
    detail: "class Solution { ... };",
    documentation: "Class declaration with public section.",
  },
  {
    label: "struct",
    insertText: "struct ${1:Node} {\n    ${2}\n};",
    detail: "struct Node { ... };",
    documentation: "Struct declaration.",
  },
  {
    label: "fastio",
    insertText: "std::ios_base::sync_with_stdio(false);\nstd::cin.tie(NULL);",
    detail: "std::ios_base::sync_with_stdio(false); ...",
    documentation: "Fast I/O optimization for competitive programming.",
  },
  {
    label: "solution",
    insertText:
      "class Solution {\npublic:\n    ${1:int} ${2:solve}(${3}) {\n        ${4}\n    }\n};",
    detail: "class Solution { solve(...) }",
    documentation: "Interview problem solution class skeleton.",
  },
  {
    label: "minpq",
    insertText:
      "std::priority_queue<${1:int}, std::vector<${1:int}>, std::greater<${1:int}>> ${2:min_pq};",
    detail: "priority_queue<T, vector<T>, greater<T>> min_pq;",
    documentation: "Min-heap priority queue declaration.",
  },
  {
    label: "bsearch",
    insertText:
      "int low = 0, high = ${1:n} - 1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (${2:nums}[mid] == ${3:target}) {\n        ${4:return mid;}\n    } else if (${2:nums}[mid] < ${3:target}) {\n        low = mid + 1;\n    } else {\n        high = mid - 1;\n    }\n}",
    detail: "while (low <= high) { ... }",
    documentation: "Binary search standard loop template.",
  },
  {
    label: "bfs",
    insertText:
      "std::queue<${1:int}> q;\nq.push(${2:start});\nstd::vector<bool> visited(${3:n}, false);\nvisited[${2:start}] = true;\n\nwhile (!q.empty()) {\n    auto curr = q.front();\n    q.pop();\n    ${4}\n}",
    detail: "queue<int> q; while (!q.empty()) { ... }",
    documentation: "Breadth-First Search (BFS) graph traversal skeleton.",
  },
  {
    label: "dfs",
    insertText:
      "std::function<void(int)> dfs = [&](int u) {\n    visited[u] = true;\n    for (int v : ${1:adj}[u]) {\n        if (!visited[v]) {\n            dfs(v);\n        }\n    }\n};",
    detail: "auto dfs = [&](int u) { ... };",
    documentation: "Recursive Depth-First Search (DFS) lambda skeleton.",
  },
];

// --- Helpers --------------------------------------------------------------------------

/**
 * Strips C++ line comments (//) from a single line while respecting string and char literals.
 */
export function stripCppComment(line: string): string {
  let inString: string | null = null;
  let isEscaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inString !== null) {
      if (ch === inString && !isEscaped) {
        inString = null;
      } else if (ch === "\\" && !isEscaped) {
        isEscaped = true;
        continue;
      }
      isEscaped = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === "/" && i + 1 < line.length && line[i + 1] === "/") {
      return line.slice(0, i);
    }
  }
  return line;
}

/**
 * Strips comments and strings from multi-line code for symbol extraction.
 */
export function stripCppCommentsAndStrings(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ");
}

export const CPP_KEYWORD_SET = new Set(CPP_KEYWORDS);

/** Lines starting with these call or test something; they never declare a function. */
const NOT_A_DEFINITION =
  /^\s*(?:\}\s*)?(?:if|else|while|for|switch|catch|return|throw|delete|case|goto|do)\b/;

/** Words that can stand where a declaration's type would be, as in `return v;`. */
const STATEMENT_WORDS = new Set(["return", "else", "throw", "delete", "case", "goto", "new"]);

/**
 * `vector<int> dp(n + 1, 0);` inside a function body is a variable built with a
 * constructor, not a function prototype.
 */
function isConstructedVariable(line: string, insideFunction: boolean): boolean {
  return insideFunction && line.trim().endsWith(";");
}
export const CPP_TYPE_SET = new Set(CPP_TYPES.map((t) => t.name));

// --- Scopes & Scope Analysis -----------------------------------------------------------

export interface CppScopes {
  owner: number[];
  visible: Set<number>;
  activeFuncLine: number;
}

export function computeCppScopes(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): CppScopes {
  const lineCount = model.getLineCount();
  const fullText = model.getValue();
  const cleaned = stripCppCommentsAndStrings(fullText);
  const cleanedLines = cleaned.split("\n");

  const owner: number[] = new Array(lineCount + 2).fill(0);
  const funcStack: { line: number; baseDepth: number }[] = [];
  let braceDepth = 0;
  let candidateFuncLine = 0;
  let cursorOwner = 0;

  for (let ln = 1; ln <= lineCount; ln++) {
    const rawLine = cleanedLines[ln - 1] ?? "";

    const isFuncDef =
      /\b(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)?(?:<[^>]+>)?(?:\*|&)*)\s+([a-zA-Z_]\w*)\s*\([^;)]*\)\s*(?:const)?\s*\{?/.test(
        rawLine,
      ) && !NOT_A_DEFINITION.test(rawLine);

    if (isFuncDef && !rawLine.trim().endsWith(";")) {
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

export function isLineVisible(scopes: CppScopes, ln: number): boolean {
  const o = scopes.owner[ln] ?? 0;
  return scopes.visible.has(o);
}

export interface CppClassMember {
  name: string;
  kind: "method" | "field";
  detail: string;
  signature?: string;
  documentation?: string;
}

/**
 * Extracts methods and fields declared in the enclosing class/struct of cursorLine.
 */
export function extractEnclosingClassMembers(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): CppClassMember[] {
  const lineCount = model.getLineCount();
  const fullText = model.getValue();
  const cleaned = stripCppCommentsAndStrings(fullText);
  const cleanedLines = cleaned.split("\n");

  let classStartLine = -1;
  let classEndLine = -1;
  const classStack: { line: number; depth: number }[] = [];
  let braceDepth = 0;

  for (let ln = 1; ln <= lineCount; ln++) {
    const rawLine = cleanedLines[ln - 1] ?? "";
    const isClassDef =
      /\b(?:class|struct)\s+([a-zA-Z_]\w*)/.test(rawLine) && !rawLine.trim().endsWith(";");

    const opens = (rawLine.match(/\{/g) || []).length;
    const closes = (rawLine.match(/\}/g) || []).length;

    if (isClassDef) {
      classStack.push({ line: ln, depth: braceDepth });
    }

    braceDepth += opens - closes;

    if (ln === cursorLine && classStack.length > 0) {
      classStartLine = classStack[classStack.length - 1].line;
    }

    while (classStack.length > 0 && braceDepth <= classStack[classStack.length - 1].depth) {
      const popped = classStack.pop();
      if (popped && popped.line === classStartLine && classEndLine === -1 && ln >= cursorLine) {
        classEndLine = ln;
      }
    }
  }

  if (classStartLine === -1) {
    for (let ln = cursorLine; ln >= 1; ln--) {
      const rawLine = cleanedLines[ln - 1] ?? "";
      if (/\b(?:class|struct)\s+([a-zA-Z_]\w*)/.test(rawLine) && !rawLine.trim().endsWith(";")) {
        classStartLine = ln;
        classEndLine = lineCount;
        break;
      }
    }
  }

  if (classStartLine === -1) return [];
  if (classEndLine === -1) classEndLine = lineCount;

  const members: CppClassMember[] = [];
  const seen = new Set<string>();
  const scopes = computeCppScopes(model, cursorLine);

  for (let ln = classStartLine; ln <= classEndLine; ln++) {
    const rawLine = model.getLineContent(ln);
    const line = stripCppComment(rawLine).trim();
    if (!line) continue;

    // Check member method
    const methodMatch = line.match(
      /\b(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)?(?:<[^>]+>)?(?:\*|&)*)\s+([a-zA-Z_]\w*)\s*\(([^;)]*)\)\s*(?:const)?\s*\{?/,
    );
    if (
      methodMatch &&
      !NOT_A_DEFINITION.test(line) &&
      !CPP_KEYWORD_SET.has(methodMatch[1]) &&
      !isConstructedVariable(line, scopes.owner[ln] !== 0)
    ) {
      const mName = methodMatch[1];
      if (!seen.has(mName)) {
        seen.add(mName);
        members.push({
          name: mName,
          kind: "method",
          detail: methodMatch[0].replace(/\{$/, "").trim(),
          signature: methodMatch[0].replace(/\{$/, "").trim(),
          documentation: `Method declared in class (line ${ln})`,
        });
      }
    }

    // Check member field
    if (scopes.owner[ln] === 0 && ln > classStartLine) {
      const fieldMatch = line.match(
        /\b(?:const\s+)?([a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)?(?:<[^>]+>)?)(?:\s+|\s*(?:&|\*)\s*)([a-zA-Z_]\w*)\s*(?:=|;|,|\(|\{)/,
      );
      if (
        fieldMatch &&
        !methodMatch &&
        !line.startsWith("public:") &&
        !line.startsWith("private:") &&
        !line.startsWith("protected:")
      ) {
        const fName = fieldMatch[2];
        const fType = fieldMatch[1];
        if (
          !seen.has(fName) &&
          !CPP_KEYWORD_SET.has(fName) &&
          !CPP_TYPE_SET.has(fName) &&
          !line.startsWith("return") &&
          !line.startsWith("using")
        ) {
          seen.add(fName);
          members.push({
            name: fName,
            kind: "field",
            detail: `${fType} ${fName}`,
            documentation: `Field of current class (line ${ln})`,
          });
        }
      }
    }
  }

  return members;
}

// --- Type Inference --------------------------------------------------------------------

export type InferredCppType =
  | "string"
  | "vector"
  | "map"
  | "unordered_map"
  | "set"
  | "unordered_set"
  | "queue"
  | "stack"
  | "priority_queue"
  | "deque"
  | "pair"
  | "ListNode"
  | "TreeNode"
  | "primitive"
  | "array"
  | "unknown";

const PRIMITIVE_TYPES = new Set([
  "int",
  "long",
  "long long",
  "double",
  "float",
  "char",
  "bool",
  "short",
  "unsigned",
  "unsigned int",
  "unsigned long",
  "size_t",
  "int32_t",
  "int64_t",
  "uint32_t",
  "uint64_t",
]);

/**
 * Lightweight type inference for C++ expressions preceding '.' or '->'.
 * Scans backward within visible scope to determine variable type.
 */
export function inferCppType(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  textBeforeWord: string,
  operatorKind: "." | "->",
): InferredCppType {
  const expr = textBeforeWord.slice(0, -operatorKind.length).trim();
  if (!expr) return "unknown";

  // Literal string: "hello".
  if (
    operatorKind === "." &&
    ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'")))
  ) {
    return "string";
  }

  // Chained string methods: e.g. s.substr(1, 2).
  if (operatorKind === "." && /\.substr\s*\([^)]*\)$/.test(expr)) {
    return "string";
  }

  // Multi-bracket subscript / index access: words[0]., matrix[0]., matrix[0][0]., grid[i][j].
  const subMatch = expr.match(/^([a-zA-Z_]\w*)((?:\s*\[[^\]]*\])+)$/);
  if (subMatch) {
    const baseVar = subMatch[1];
    const brackets = subMatch[2];
    const subDepth = (brackets.match(/\[/g) || []).length;

    for (let ln = position.lineNumber; ln >= 1; ln--) {
      const line = stripCppComment(model.getLineContent(ln)).trim();
      if (!line) continue;

      // vector<vector<string>> baseVar
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?vector\\s*<\\s*(?:std::)?string\\s*>\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "vector";
        if (subDepth === 2) return "string";
        return "unknown";
      }

      // vector<vector<T>> baseVar (primitive like int, double, char, etc.)
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?vector\\s*<[^>]+>\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "vector";
        if (subDepth === 2) return "primitive";
        return "unknown";
      }

      // vector<string> baseVar
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?string\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "string";
        return "unknown";
      }

      // vector<pair<...>> baseVar
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?(?:pair|make_pair)\\s*<[^>]+>\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "pair";
        return "unknown";
      }

      // vector<ListNode*> baseVar
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*ListNode\\s*\\*\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "ListNode";
        return "unknown";
      }

      // vector<TreeNode*> baseVar
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*TreeNode\\s*\\*\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "TreeNode";
        return "unknown";
      }

      // vector<primitive> baseVar (e.g. vector<int> nums)
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:int|long|long long|double|float|char|bool|short|size_t)\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        if (subDepth === 1) return "primitive";
        return "unknown";
      }

      // string baseVar: indexing a string s[0] yields primitive char
      if (new RegExp(`\\b(?:std::)?string\\s+(?:&|\\*)?${baseVar}\\b`).test(line)) {
        if (subDepth === 1) return "primitive";
        return "unknown";
      }

      // Raw array: Type baseVar [N] or Type baseVar [N][M]
      const arrMatch = line.match(
        new RegExp(`\\b([a-zA-Z_]\\w*)\\s+${baseVar}\\s*((?:\\[[^\\]]*\\])+)`),
      );
      if (arrMatch) {
        const declaredDim = (arrMatch[2].match(/\[/g) || []).length;
        const elemType = arrMatch[1].replace(/^std::/, "").trim();
        if (subDepth === declaredDim) {
          if (elemType === "string") return "string";
          if (PRIMITIVE_TYPES.has(elemType)) return "primitive";
          if (elemType === "ListNode") return "ListNode";
          if (elemType === "TreeNode") return "TreeNode";
        } else if (subDepth < declaredDim) {
          return "array";
        }
        return "unknown";
      }
    }

    // Heuristics for common competitive programming array/vector names:
    if (/^(?:matrix|grid|board)\d*$/i.test(baseVar)) {
      if (subDepth === 1) return "vector";
      if (subDepth === 2) return "primitive";
    }
    if (/^(?:nums|arr|vals)\d*$/i.test(baseVar)) {
      if (subDepth === 1) return "primitive";
    }
    if (/^(?:words|strs|names)\d*$/i.test(baseVar)) {
      if (subDepth === 1) return "string";
    }

    return "unknown";
  }

  // Chained container element access: e.g. words.front()., words.back()., words.at(0).
  const frontBackMatch = expr.match(
    /^([a-zA-Z_]\w*)\.(?:at\s*\([^)]*\)|front\s*\(\s*\)|back\s*\(\s*\))$/,
  );
  if (frontBackMatch) {
    const baseVar = frontBackMatch[1];
    for (let ln = position.lineNumber; ln >= 1; ln--) {
      const line = stripCppComment(model.getLineContent(ln)).trim();
      if (!line) continue;

      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?string\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        return "string";
      }
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:int|long|long long|double|float|char|bool|short|size_t)\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        return "primitive";
      }
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?(?:pair|make_pair)\\s*<[^>]+>\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        return "pair";
      }
      if (
        new RegExp(
          `\\b(?:std::)?vector\\s*<\\s*(?:std::)?vector\\s*<[^>]+>\\s*>\\s*(?:&|\\*)?\\s*${baseVar}\\b`,
        ).test(line)
      ) {
        return "vector";
      }
    }
  }

  // Extract identifier immediately before operator
  const match = expr.match(/([a-zA-Z_]\w*)$/);
  if (!match) return "unknown";
  const varName = match[1];

  // Common competitive programming / interview naming heuristics:
  if (operatorKind === "->") {
    if (/^(?:head|curr|tail|prev|next|node|dummy)$/i.test(varName)) return "ListNode";
    if (/^(?:root|parent|child|left|right)$/i.test(varName)) return "TreeNode";
    if (/^(?:it|iter)$/i.test(varName)) return "pair";
  }

  // Scan backwards to find variable declaration
  const scopes = computeCppScopes(model, position.lineNumber);

  for (let ln = position.lineNumber; ln >= 1; ln--) {
    const rawLine = model.getLineContent(ln);
    const line = stripCppComment(rawLine).trim();
    if (!line) continue;

    // Check function parameters if active function header
    if (scopes.activeFuncLine > 0 && ln === scopes.activeFuncLine) {
      const paramRegex = new RegExp(
        `\\b(?:const\\s+)?([a-zA-Z_]\\w*(?:::[a-zA-Z_]\\w*)?(?:<[^>]+>)?)(?:\\s+|\\s*(?:&|\\*)\\s*)${varName}\\b`,
      );
      const pMatch = line.match(paramRegex);
      if (pMatch) {
        const rawType = pMatch[1].replace(/^std::/, "").trim();
        const baseType = rawType.replace(/<.*>$/, "").trim();
        if (baseType === "string") return "string";
        if (baseType === "vector") return "vector";
        if (baseType === "map") return "map";
        if (baseType === "unordered_map") return "unordered_map";
        if (baseType === "set") return "set";
        if (baseType === "unordered_set") return "unordered_set";
        if (baseType === "queue") return "queue";
        if (baseType === "stack") return "stack";
        if (baseType === "priority_queue") return "priority_queue";
        if (baseType === "deque") return "deque";
        if (baseType === "pair") return "pair";
        if (baseType === "ListNode") return "ListNode";
        if (baseType === "TreeNode") return "TreeNode";
        if (PRIMITIVE_TYPES.has(baseType)) return "primitive";
      }
    }

    // Check local / member declaration
    const declMatch = line.match(
      new RegExp(
        `\\b(?:const\\s+)?([a-zA-Z_]\\w*(?:::[a-zA-Z_]\\w*)?(?:<[^>]+>)?)(?:\\s+|\\s*(?:&|\\*)\\s*)${varName}\\s*(?:=|;|,|\\(|\\{)`,
      ),
    );
    if (declMatch) {
      const fullType = declMatch[1].replace(/^std::/, "").trim();
      const baseType = fullType.replace(/<.*>$/, "").trim();
      if (STATEMENT_WORDS.has(baseType)) continue;

      if (baseType === "string") return "string";
      if (baseType === "vector") return "vector";
      if (baseType === "map") return "map";
      if (baseType === "unordered_map") return "unordered_map";
      if (baseType === "set") return "set";
      if (baseType === "unordered_set") return "unordered_set";
      if (baseType === "queue") return "queue";
      if (baseType === "stack") return "stack";
      if (baseType === "priority_queue") return "priority_queue";
      if (baseType === "deque") return "deque";
      if (baseType === "pair") return "pair";
      if (baseType === "ListNode") return "ListNode";
      if (baseType === "TreeNode") return "TreeNode";
      if (PRIMITIVE_TYPES.has(baseType)) return "primitive";

      // Check auto with initializer
      if (baseType === "auto") {
        const eqIdx = line.indexOf("=");
        if (eqIdx !== -1) {
          const rhs = line.slice(eqIdx + 1).trim();
          if (rhs.startsWith('"') || rhs.startsWith("'")) return "string";
          if (/(?:^|\b)(?:std::)?vector\b/.test(rhs)) return "vector";
          if (/(?:^|\b)(?:std::)?string\b/.test(rhs)) return "string";
          if (/(?:^|\b)(?:std::)?map\b/.test(rhs)) return "map";
          if (/(?:^|\b)(?:std::)?unordered_map\b/.test(rhs)) return "unordered_map";
          if (/(?:^|\b)(?:std::)?set\b/.test(rhs)) return "set";
          if (/(?:^|\b)(?:std::)?unordered_set\b/.test(rhs)) return "unordered_set";
          if (/(?:^|\b)(?:std::)?(?:pair|make_pair)\b/.test(rhs)) return "pair";
          if (/^-?\d/.test(rhs) || /^(?:true|false)\b/.test(rhs)) return "primitive";
        }
      }
      break;
    }

    // Check raw array: int arr[10];
    const arrMatch = line.match(new RegExp(`\\b([a-zA-Z_]\\w*)\\s+${varName}\\s*\\[[^\\]]*\\]`));
    if (arrMatch) {
      return "array";
    }
  }

  return "unknown";
}

// --- Document Symbol Extraction --------------------------------------------------------

export function extractCppDocumentSymbols(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  range: monacoDefault.IRange,
  monaco: Monaco,
): monacoDefault.languages.CompletionItem[] {
  const lineCount = model.getLineCount();
  const currentWord = model.getWordUntilPosition(position).word;
  const currentLine = position.lineNumber;
  const scopes = computeCppScopes(model, currentLine);

  const seen = new Set<string>();
  const items: monacoDefault.languages.CompletionItem[] = [];

  for (let ln = 1; ln <= lineCount; ln++) {
    const rawLine = model.getLineContent(ln);
    const line = stripCppComment(rawLine).trim();
    if (!line) continue;

    // Skip preprocessor directives like #include or #define
    if (line.startsWith("#")) continue;

    // Check if line defines a class or struct (always visible)
    const classMatch = line.match(/\b(?:class|struct)\s+([a-zA-Z_]\w*)/);
    if (classMatch) {
      const name = classMatch[1];
      if (!seen.has(name) && name !== currentWord && !CPP_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: name,
          detail: `class ${name} (local)`,
          range,
          sortText: `0_${name}`,
        });
      }
    }

    // Check if line defines a function (always visible)
    const funcMatch = line.match(
      /\b(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)?(?:<[^>]+>)?(?:\*|&)*)\s+([a-zA-Z_]\w*)\s*\([^;)]*\)\s*(?:const)?\s*\{?/,
    );
    if (
      funcMatch &&
      !NOT_A_DEFINITION.test(line) &&
      !CPP_KEYWORD_SET.has(funcMatch[1]) &&
      !new RegExp(`\\bnew\\s+${funcMatch[1]}\\s*\\(`).test(line) &&
      !isConstructedVariable(line, scopes.owner[ln] !== 0)
    ) {
      const fName = funcMatch[1];
      if (!seen.has(fName) && fName !== currentWord) {
        seen.add(fName);
        items.push({
          label: fName,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${fName}(${ln === currentLine ? "" : "$0"})`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `function ${fName}()`,
          range,
          sortText: `0_${fName}`,
        });
      }

      // If this is the active enclosing function, extract its parameters
      if (scopes.activeFuncLine > 0 && ln === scopes.activeFuncLine) {
        const paramParenMatch = line.match(/\(([^)]*)\)/);
        if (paramParenMatch) {
          const rawParams = paramParenMatch[1].split(",");
          for (const rawP of rawParams) {
            const pTrim = rawP.trim();
            const pMatch = pTrim.match(/(?:&|\*)?\s*([a-zA-Z_]\w*)$/);
            if (pMatch) {
              const pName = pMatch[1];
              if (
                pName &&
                !seen.has(pName) &&
                pName !== currentWord &&
                !CPP_KEYWORD_SET.has(pName) &&
                !CPP_TYPE_SET.has(pName)
              ) {
                seen.add(pName);
                items.push({
                  label: pName,
                  kind: monaco.languages.CompletionItemKind.Variable,
                  insertText: pName,
                  detail: `parameter ${pName}`,
                  range,
                  sortText: `0_${pName}`,
                });
              }
            }
          }
        }
      }
    }

    // Check local variables: only visible if in scope
    if (isLineVisible(scopes, ln)) {
      // Variable declaration: `int count = 0;` or `vector<int> nums;` or `auto x = 5;` or `ListNode* node;`
      const varMatch = line.match(
        /\b(?:const\s+)?([a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)?(?:<[^>]+>)?)(?:\s+|\s*(?:&|\*)\s*)([a-zA-Z_]\w*)\s*(?:=|;|,|\(|\{)/,
      );
      if (varMatch) {
        const name = varMatch[2];
        if (
          !seen.has(name) &&
          name !== currentWord &&
          !CPP_KEYWORD_SET.has(name) &&
          !CPP_TYPE_SET.has(name) &&
          !line.startsWith("return") &&
          !line.startsWith("throw") &&
          !line.startsWith("using") &&
          !line.startsWith("typedef")
        ) {
          seen.add(name);
          const isLocal = scopes.owner[ln] !== 0;
          items.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: name,
            detail: `variable ${name} (${isLocal ? "local" : "global"})`,
            range,
            sortText: `0_${name}`,
          });
        }
      }

      // Range-for loop variable: `for (auto x : nums)` or `for (int num : nums)`
      const forMatch = line.match(/\bfor\s*\(\s*(?:const\s+)?auto(?:\s*&)?\s+([a-zA-Z_]\w*)\s*:/);
      if (forMatch) {
        const name = forMatch[1];
        if (
          !seen.has(name) &&
          name !== currentWord &&
          !CPP_KEYWORD_SET.has(name) &&
          !CPP_TYPE_SET.has(name)
        ) {
          seen.add(name);
          items.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: name,
            detail: `variable ${name} (loop)`,
            range,
            sortText: `0_${name}`,
          });
        }
      }

      // Structured binding: `auto [u, v] = ...` or `for (auto [k, v] : ...)`
      const structMatch = line.match(/\bauto(?:\s*&)?\s*\[([^\]]+)\]/);
      if (structMatch) {
        const bindings = structMatch[1].split(",");
        for (const b of bindings) {
          const bName = b.trim();
          if (
            bName &&
            !seen.has(bName) &&
            bName !== currentWord &&
            !CPP_KEYWORD_SET.has(bName) &&
            !CPP_TYPE_SET.has(bName)
          ) {
            seen.add(bName);
            items.push({
              label: bName,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: bName,
              detail: `variable ${bName} (structured binding)`,
              range,
              sortText: `0_${bName}`,
            });
          }
        }
      }
    }
  }

  // General identifier extraction from code only (excluding strings and comments)
  // Ensure tokens preceded by '.', '->', or '::' are skipped to prevent polluting
  // variable completions with method or namespace names.
  const fullText = model.getValue();
  const codeOnly = stripCppCommentsAndStrings(fullText);
  const codeLines = codeOnly.split("\n");

  for (let ln = 1; ln <= codeLines.length; ln++) {
    if (!isLineVisible(scopes, ln)) continue;

    const cleanLine = codeLines[ln - 1];
    let wMatch: RegExpExecArray | null;
    const lineWordRegex = /(?:^|[^\w.:>-])\b([a-zA-Z_]\w{1,})\b/g;

    while ((wMatch = lineWordRegex.exec(cleanLine)) !== null) {
      const word = wMatch[1];
      if (
        !seen.has(word) &&
        word !== currentWord &&
        !CPP_KEYWORD_SET.has(word) &&
        !CPP_TYPE_SET.has(word)
      ) {
        seen.add(word);
        items.push({
          label: word,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: word,
          detail: `identifier (in scope)`,
          range,
          sortText: `1_${word}`,
        });
      }
    }
  }

  return items;
}

// --- Monaco Registration ---------------------------------------------------------------

const registeredMonacoInstances = new WeakSet<object>();

/**
 * Registers offline autocomplete suggestions, standard library completions,
 * hover tooltips, and signature assistance for C++ in Monaco.
 */
export function registerCppCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (registeredMonacoInstances.has(m)) return;
  registeredMonacoInstances.add(m);

  // 1. Autocomplete & Suggestions Provider
  m.languages.registerCompletionItemProvider("cpp", {
    triggerCharacters: [".", ">", ":"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: monacoDefault.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeWord = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check if user is typing immediately after `std::` (scope resolution)
      if (/(?:^|[^\w:])std::$/.test(textBeforeWord)) {
        return {
          suggestions: deduplicateSuggestions(toCompletionItems(STD_MEMBERS, range)),
        };
      }

      // Check if user is typing immediately after a pointer operator `->`
      if (textBeforeWord.endsWith("->")) {
        // Handle this-> member access
        if (textBeforeWord.endsWith("this->")) {
          const classMembers = extractEnclosingClassMembers(model, position.lineNumber);
          const thisSuggestions: monacoDefault.languages.CompletionItem[] = [];

          for (const mItem of classMembers) {
            if (mItem.kind === "method") {
              thisSuggestions.push({
                label: mItem.name,
                kind: m.languages.CompletionItemKind.Method,
                insertText: `${mItem.name}()`,
                detail: mItem.detail,
                documentation: mItem.documentation,
                range,
                sortText: `0_${mItem.name}`,
              });
            } else {
              thisSuggestions.push({
                label: mItem.name,
                kind: m.languages.CompletionItemKind.Field,
                insertText: mItem.name,
                detail: `${mItem.detail} (field)`,
                documentation: mItem.documentation,
                range,
                sortText: `0_${mItem.name}`,
              });
            }
          }

          return {
            suggestions: deduplicateSuggestions(thisSuggestions),
          };
        }

        const inferred = inferCppType(model, position, textBeforeWord, "->");
        if (inferred === "ListNode") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(LISTNODE_MEMBERS, range)),
          };
        }
        if (inferred === "TreeNode") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(TREENODE_MEMBERS, range)),
          };
        }
        if (inferred === "pair") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(PAIR_MEMBERS, range)),
          };
        }
        if (inferred === "string") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(STRING_MEMBERS, range)),
          };
        }
        if (inferred === "vector") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(VECTOR_MEMBERS, range)),
          };
        }
        // Fallback for pointers: common nodes and container methods
        return {
          suggestions: deduplicateSuggestions(
            toCompletionItems(
              [
                ...LISTNODE_MEMBERS,
                ...TREENODE_MEMBERS,
                ...PAIR_MEMBERS,
                ...COMMON_CONTAINER_MEMBERS,
              ],
              range,
            ),
          ),
        };
      }

      // Check if user is typing immediately after a dot `.`
      if (textBeforeWord.endsWith(".")) {
        // Handle this. member access
        if (textBeforeWord.endsWith("this.")) {
          const classMembers = extractEnclosingClassMembers(model, position.lineNumber);
          const thisSuggestions: monacoDefault.languages.CompletionItem[] = [];

          for (const mItem of classMembers) {
            if (mItem.kind === "method") {
              thisSuggestions.push({
                label: mItem.name,
                kind: m.languages.CompletionItemKind.Method,
                insertText: `${mItem.name}()`,
                detail: mItem.detail,
                documentation: mItem.documentation,
                range,
                sortText: `0_${mItem.name}`,
              });
            } else {
              thisSuggestions.push({
                label: mItem.name,
                kind: m.languages.CompletionItemKind.Field,
                insertText: mItem.name,
                detail: `${mItem.detail} (field)`,
                documentation: mItem.documentation,
                range,
                sortText: `0_${mItem.name}`,
              });
            }
          }

          return {
            suggestions: deduplicateSuggestions(thisSuggestions),
          };
        }

        // If preceded by a numeric literal (e.g. 5. or 3.14.), do not suggest members
        if (/\b\d+\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        const inferred = inferCppType(model, position, textBeforeWord, ".");
        if (inferred === "string") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(STRING_MEMBERS, range)),
          };
        }
        if (inferred === "vector") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(VECTOR_MEMBERS, range)),
          };
        }
        if (inferred === "map" || inferred === "unordered_map") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(MAP_MEMBERS, range)),
          };
        }
        if (inferred === "set" || inferred === "unordered_set") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(SET_MEMBERS, range)),
          };
        }
        if (inferred === "queue") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(QUEUE_MEMBERS, range)),
          };
        }
        if (inferred === "stack") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(STACK_MEMBERS, range)),
          };
        }
        if (inferred === "priority_queue") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(PRIORITY_QUEUE_MEMBERS, range)),
          };
        }
        if (inferred === "deque") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(DEQUE_MEMBERS, range)),
          };
        }
        if (inferred === "pair") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(PAIR_MEMBERS, range)),
          };
        }
        if (inferred === "ListNode") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(LISTNODE_MEMBERS, range)),
          };
        }
        if (inferred === "TreeNode") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(TREENODE_MEMBERS, range)),
          };
        }
        if (inferred === "primitive" || inferred === "array") {
          return { suggestions: [] };
        }

        // Unknown container or object: offer standard container & string methods
        return {
          suggestions: deduplicateSuggestions(
            toCompletionItems(
              [...STRING_MEMBERS, ...VECTOR_MEMBERS, ...MAP_MEMBERS, ...SET_MEMBERS],
              range,
            ),
          ),
        };
      }

      // Check if user is typing `#include <` or `#include "` directive
      const textBeforeCursor = lineContent.slice(0, position.column - 1);
      const isIncludeDirective = /^\s*#\s*include(?:\s+([<"]?)([a-zA-Z0-9_/.]*)?)?$/i.test(
        textBeforeCursor,
      );
      if (isIncludeDirective) {
        const hasOpenAngle = /<\s*([a-zA-Z0-9_/.]*)?$/.test(textBeforeCursor);
        const hasOpenQuote = /"\s*([a-zA-Z0-9_/.]*)?$/.test(textBeforeCursor);
        return {
          suggestions: deduplicateSuggestions(
            COMMON_HEADERS.map((h) => ({
              label: h,
              kind: m.languages.CompletionItemKind.Module,
              insertText: hasOpenAngle ? `${h}>` : hasOpenQuote ? `${h}"` : `<${h}>`,
              detail: `header <${h}>`,
              range,
            })),
          ),
        };
      }

      // Check if user is typing `using namespace ` directive
      const isUsingNamespace = /^\s*using\s+namespace\s+([a-zA-Z_]\w*)?$/i.test(textBeforeCursor);
      if (isUsingNamespace) {
        return {
          suggestions: [
            {
              label: "std",
              kind: m.languages.CompletionItemKind.Module,
              insertText: "std;",
              detail: "using namespace std;",
              range,
            },
          ],
        };
      }

      // Suggest keywords, types, standard functions, snippets, and local symbols
      const keywordItems: monacoDefault.languages.CompletionItem[] = CPP_KEYWORDS.map((kw) => ({
        label: kw,
        kind: m.languages.CompletionItemKind.Keyword,
        insertText: kw,
        detail: `keyword ${kw}`,
        range,
      }));

      const typeItems: monacoDefault.languages.CompletionItem[] = CPP_TYPES.map((t) => ({
        label: t.name,
        kind: m.languages.CompletionItemKind.Class,
        insertText: t.name,
        detail: `type ${t.name}`,
        documentation: t.doc,
        range,
      }));

      const stdItems: monacoDefault.languages.CompletionItem[] = STD_MEMBERS.map((s) => ({
        label: s.label,
        kind: s.kind ?? m.languages.CompletionItemKind.Function,
        insertText: s.snippet ?? s.label,
        insertTextRules: s.snippet
          ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet
          : undefined,
        detail: s.detail,
        documentation: s.documentation,
        range,
      }));

      const snippetItems: monacoDefault.languages.CompletionItem[] = SNIPPETS.map((s) => ({
        label: s.label,
        kind: m.languages.CompletionItemKind.Snippet,
        insertText: s.insertText,
        insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: s.detail,
        documentation: s.documentation,
        range,
      }));

      const localSymbols = extractCppDocumentSymbols(model, position, range, m);

      return {
        suggestions: deduplicateSuggestions([
          ...localSymbols,
          ...snippetItems,
          ...typeItems,
          ...stdItems,
          ...keywordItems,
        ]),
      };
    },
  });

  // 2. Hover Provider: displays signature and docs on mouse hover
  m.languages.registerHoverProvider("cpp", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check std:: qualification
      if (/(?:^|[^\w:])std::$/.test(textBefore)) {
        const stdMatch = STD_MEMBERS.find((item) => item.label === word.word);
        if (stdMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`cpp\n${stdMatch.detail ?? stdMatch.label}\n\`\`\`` },
              { value: stdMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Check pointer or member access: `this->field`, `node->next` or `nums.size`
      if (textBefore.endsWith("this->") || textBefore.endsWith("this.")) {
        const classMembers = extractEnclosingClassMembers(model, position.lineNumber);
        const match = classMembers.find((item) => item.name === word.word);
        if (match) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`cpp\n${match.detail}\n\`\`\`` },
              {
                value:
                  match.kind === "field"
                    ? "*Field of current class.*"
                    : "*Method of current class.*",
              },
            ],
          };
        }
      }

      if (textBefore.endsWith("->")) {
        const inferred = inferCppType(model, position, textBefore, "->");
        let list: CompletionItemDef[] = COMMON_CONTAINER_MEMBERS;
        if (inferred === "ListNode") list = LISTNODE_MEMBERS;
        else if (inferred === "TreeNode") list = TREENODE_MEMBERS;
        else if (inferred === "vector") list = VECTOR_MEMBERS;
        else if (inferred === "string") list = STRING_MEMBERS;

        const match = list.find((item) => item.label === word.word);
        if (match) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`cpp\n${match.detail ?? match.label}\n\`\`\`` },
              { value: match.documentation ?? "" },
            ],
          };
        }
      }

      if (textBefore.endsWith(".")) {
        const inferred = inferCppType(model, position, textBefore, ".");
        let list: CompletionItemDef[] = COMMON_CONTAINER_MEMBERS;
        if (inferred === "string") list = STRING_MEMBERS;
        else if (inferred === "vector") list = VECTOR_MEMBERS;
        else if (inferred === "map" || inferred === "unordered_map") list = MAP_MEMBERS;
        else if (inferred === "set" || inferred === "unordered_set") list = SET_MEMBERS;
        else if (inferred === "queue") list = QUEUE_MEMBERS;
        else if (inferred === "stack") list = STACK_MEMBERS;
        else if (inferred === "priority_queue") list = PRIORITY_QUEUE_MEMBERS;
        else if (inferred === "deque") list = DEQUE_MEMBERS;
        else if (inferred === "pair") list = PAIR_MEMBERS;
        else if (inferred === "ListNode") list = LISTNODE_MEMBERS;
        else if (inferred === "TreeNode") list = TREENODE_MEMBERS;

        const match = list.find((item) => item.label === word.word);
        if (match) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`cpp\n${match.detail ?? match.label}\n\`\`\`` },
              { value: match.documentation ?? "" },
            ],
          };
        }
      }

      // Standalone hover: check standard types
      const typeMatch = CPP_TYPES.find((t) => t.name === word.word);
      if (typeMatch && !textBefore.endsWith(".") && !textBefore.endsWith("->")) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`cpp\ntype ${typeMatch.name}\n\`\`\`` },
            { value: typeMatch.doc },
          ],
        };
      }

      // Standalone hover: check std items (cout, cin, sort, min, etc.)
      const stdMatch = STD_MEMBERS.find((item) => item.label === word.word);
      if (stdMatch && !textBefore.endsWith(".") && !textBefore.endsWith("->")) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`cpp\n${stdMatch.detail ?? stdMatch.label}\n\`\`\`` },
            { value: stdMatch.documentation ?? "" },
          ],
        };
      }

      // Standalone hover: check user-defined function in document
      for (let ln = 1; ln <= model.getLineCount(); ln++) {
        const line = stripCppComment(model.getLineContent(ln)).trim();
        if (!line || line.startsWith("#")) continue;
        const funcRegex = new RegExp(
          `\\b([a-zA-Z_]\\w*(?:::[a-zA-Z_]\\w*)?(?:<[^>]+>)?(?:\\*|&)*\\s+${word.word}\\s*\\([^;)]*\\))`,
        );
        const fMatch = line.match(funcRegex);
        if (fMatch && !NOT_A_DEFINITION.test(line)) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`cpp\n${fMatch[1].trim()}\n\`\`\`` },
              { value: `User-defined function (line ${ln})` },
            ],
          };
        }
      }

      return null;
    },
  });

  // 3. Signature Help Provider: shows parameter hints for known calls
  m.languages.registerSignatureHelpProvider("cpp", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      const startLine = Math.max(1, position.lineNumber - 50);
      const textBefore = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Strip comments so parens or quotes inside comments don't corrupt the parser
      const strippedLines = textBefore.split("\n").map((l) => stripCppComment(l));
      const cleanedText = strippedLines.join("\n");

      // Parse from left to right tracking quotes, parens, brackets, braces, and templates
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
        } else if (ch === "<") {
          // Check if '<' starts template arguments (e.g. vector<int>)
          const textPrior = cleanedText.slice(0, i).trimEnd();
          const isPrecededByIdentifier = /[a-zA-Z_]\w*$/.test(textPrior);
          if (isPrecededByIdentifier) {
            let tempDepth = 1;
            let isValidTemplate = true;
            let closeIdx = -1;
            for (let j = i + 1; j < cleanedText.length; j++) {
              const cj = cleanedText[j];
              if (cj === "<") tempDepth++;
              else if (cj === ">") {
                tempDepth--;
                if (tempDepth === 0) {
                  closeIdx = j;
                  break;
                }
              } else if (/[a-zA-Z0-9_.,:*\s&]/.test(cj)) {
                continue;
              } else {
                isValidTemplate = false;
                break;
              }
            }
            if (isValidTemplate && closeIdx !== -1) {
              i = closeIdx;
              continue;
            }
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

      // Extract the call expression preceding '('
      const callPrefix = cleanedText.slice(0, top.openIdx).trimEnd();
      const callMatch = callPrefix.match(
        /(?:^|[^\w.:>-])((?:[a-zA-Z_]\w*(?:::|\.|->))*[a-zA-Z_]\w*)$/,
      );
      if (!callMatch) return null;

      const fullCall = callMatch[1];
      const parts = fullCall.split(/(?:::|\.|->)/);
      const methodName = parts[parts.length - 1];

      // Never provide made-up signatures for language control keywords
      if (
        methodName === "if" ||
        methodName === "while" ||
        methodName === "for" ||
        methodName === "switch" ||
        methodName === "catch"
      ) {
        return null;
      }

      // Check if call target is a known function or method
      let found: CompletionItemDef | undefined;

      // If method is called on this-> or this., check enclosing class methods
      if (fullCall.startsWith("this->") || fullCall.startsWith("this.")) {
        const classMembers = extractEnclosingClassMembers(model, position.lineNumber);
        const mFound = classMembers.find(
          (mItem) => mItem.kind === "method" && mItem.name === methodName,
        );
        if (mFound && mFound.detail) {
          found = {
            label: methodName,
            detail: mFound.detail,
            documentation: mFound.documentation,
          };
        }
      }

      if (!found) {
        found = STD_MEMBERS.find((item) => item.label === methodName);
      }
      if (!found) {
        const ALL_METHODS: CompletionItemDef[] = [
          ...STRING_MEMBERS,
          ...VECTOR_MEMBERS,
          ...MAP_MEMBERS,
          ...SET_MEMBERS,
          ...QUEUE_MEMBERS,
          ...STACK_MEMBERS,
          ...PRIORITY_QUEUE_MEMBERS,
          ...DEQUE_MEMBERS,
        ];
        found = ALL_METHODS.find((item) => item.label === methodName);
      }

      // If not in standard library or container methods, check document-defined functions
      if (!found) {
        for (let ln = 1; ln <= model.getLineCount(); ln++) {
          const rawLine = model.getLineContent(ln);
          const line = stripCppComment(rawLine).trim();
          if (!line || line.startsWith("#")) continue;
          const funcRegex = new RegExp(
            `\\b([a-zA-Z_]\\w*(?:::[a-zA-Z_]\\w*)?(?:<[^>]+>)?(?:\\*|&)*\\s+${methodName}\\s*\\(([^;)]*)\\))`,
          );
          const fMatch = line.match(funcRegex);
          if (fMatch && !NOT_A_DEFINITION.test(line)) {
            found = {
              label: methodName,
              detail: fMatch[1].trim(),
              documentation: `User-defined function (line ${ln})`,
            };
            break;
          }
        }
      }

      if (found && found.detail) {
        // Parse parameter names from detail, e.g. "min(const T& a, const T& b)"
        const parenMatch = found.detail.match(/\(([^)]*)\)/);
        const paramsRaw = parenMatch ? parenMatch[1].trim() : "";

        // Split on top-level commas outside generic templates
        const paramList: string[] = [];
        let currentP = "";
        let tDepth = 0;
        for (let k = 0; k < paramsRaw.length; k++) {
          const pk = paramsRaw[k];
          if (pk === "<") tDepth++;
          else if (pk === ">") tDepth--;

          if (pk === "," && tDepth === 0) {
            paramList.push(currentP.trim());
            currentP = "";
          } else {
            currentP += pk;
          }
        }
        if (currentP.trim()) paramList.push(currentP.trim());

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
