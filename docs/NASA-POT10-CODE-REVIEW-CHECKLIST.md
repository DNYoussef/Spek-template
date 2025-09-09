# NASA Power of Ten Code Review Checklist

## Overview

This checklist ensures systematic validation of NASA JPL Power of Ten rules compliance during code reviews. Use this for Python analyzer codebases targeting ≥90% defense industry compliance standards.

**Review Focus Areas:**
- ✅ **Critical Rules**: 1, 2, 3 (Must pass 100%)
- ⚠️ **High Priority Rules**: 4, 5, 7 (Target ≥90%)  
- 📊 **Medium Priority Rules**: 6, 8, 9, 10 (Target ≥75%)

---

## Rule 1: Simple Control Flow ✅ CRITICAL

**Objective**: Eliminate complex control flow constructs

### Checklist Items:

- [ ] **No goto statements** (N/A in Python)
- [ ] **No recursion** - All recursive functions converted to iterative
  - [ ] Check for direct recursion: `function_name()` calls within same function
  - [ ] Check for indirect recursion: Function A → Function B → Function A
  - [ ] Verify iterative alternatives use explicit stacks/queues
- [ ] **No setjmp/longjmp** (N/A in Python)
- [ ] **Simple loop constructs only**
  - [ ] Only `for` and `while` loops used
  - [ ] No complex nested control structures
  - [ ] Break/continue used judiciously with clear logic

### Code Review Questions:
1. Are there any functions that call themselves directly or indirectly?
2. Can any remaining recursion be converted to iterative solutions?
3. Are control flow paths clear and predictable?

### Example Violations:
```python
# BAD: Direct recursion
def traverse_tree(node):
    if node.left:
        traverse_tree(node.left)  # VIOLATION
        
# GOOD: Iterative with explicit stack
def traverse_tree(node):
    stack = [node]
    while stack:
        current = stack.pop()
        if current.left:
            stack.append(current.left)
```

---

## Rule 2: Bounded Loops ✅ CRITICAL

**Objective**: All loops must have statically determinable upper bounds

### Checklist Items:

- [ ] **All loops have explicit bounds**
  - [ ] `for` loops use `range()` with fixed limits or bounded iterables
  - [ ] `while` loops have clear termination conditions
  - [ ] No `while True:` without explicit break bounds
- [ ] **Loop bounds are constants or calculated from constants**
  - [ ] Avoid user input determining loop counts
  - [ ] Use `MAX_ITERATIONS` constants for safety
- [ ] **Nested loops have compound bounds checking**
  - [ ] Total iterations calculable: `O(m*n)` where m,n are bounded
- [ ] **Iterator safety for large datasets**
  - [ ] File system traversal limited by depth/count
  - [ ] AST walking limited by node count/depth

### Code Review Questions:
1. Can each loop's maximum iteration count be determined at compile time?
2. Are there safeguards against infinite loops?
3. Do nested loops have reasonable total iteration bounds?

### Example Patterns:
```python
# GOOD: Explicit bounds
MAX_ITERATIONS = 1000
for i in range(min(len(items), MAX_ITERATIONS)):
    process(items[i])

# GOOD: Bounded while loop
iteration_count = 0
MAX_RETRIES = 5
while condition and iteration_count < MAX_RETRIES:
    iteration_count += 1
    attempt_operation()

# BAD: Unbounded loop
while True:  # VIOLATION - no explicit bound
    if some_condition:
        break
```

---

## Rule 3: Heap Memory Management ✅ CRITICAL

**Objective**: Avoid dynamic memory allocation after initialization

### Checklist Items:

- [ ] **No explicit malloc/calloc/realloc calls** (Limited Python relevance)
- [ ] **Minimize dynamic object creation in loops**
  - [ ] Pre-allocate collections where possible
  - [ ] Reuse objects instead of creating new ones
- [ ] **Resource management patterns**
  - [ ] Use context managers (`with` statements) for resource handling
  - [ ] Proper cleanup in exception paths
- [ ] **Memory-conscious data structures**
  - [ ] Prefer generators over lists for large datasets
  - [ ] Use `__slots__` for frequently instantiated classes

### Code Review Questions:
1. Are large data structures pre-allocated?
2. Is memory cleanup handled properly in error cases?
3. Are there memory leaks from unclosed resources?

### Example Patterns:
```python
# GOOD: Pre-allocated with bounds
class BoundedAnalyzer:
    def __init__(self, max_items=1000):
        self.violations = [None] * max_items  # Pre-allocated
        self.count = 0
    
    def add_violation(self, violation):
        if self.count < len(self.violations):
            self.violations[self.count] = violation
            self.count += 1
```

---

## Rule 4: Function Size ⚠️ HIGH PRIORITY

**Objective**: Functions should fit on a single printed page (≤60 lines)

### Checklist Items:

- [ ] **All functions ≤60 lines**
  - [ ] Count from `def` to end of function body
  - [ ] Include docstrings and comments in count
  - [ ] Exclude blank lines from count
- [ ] **Large functions decomposed**
  - [ ] Extract Method refactoring applied
  - [ ] Related functionality grouped into helper methods
  - [ ] Private methods used for complex operations
- [ ] **Class size management**
  - [ ] No single class >500 lines
  - [ ] Consider Strategy/Command patterns for large classes
  - [ ] Use composition over inheritance

### Code Review Questions:
1. Can any function be broken into smaller, focused functions?
2. Is each function doing only one thing well?
3. Are function names descriptive of their single responsibility?

### Refactoring Strategy:
```python
# BAD: 80-line function
def analyze_file(self, file_path):
    # 80 lines of mixed logic - VIOLATION
    
# GOOD: Decomposed into focused functions  
def analyze_file(self, file_path):
    self._validate_input(file_path)
    tree = self._parse_file(file_path)
    elements = self._collect_elements(tree)
    return self._run_analysis(elements)
    
def _validate_input(self, file_path):
    # 15 lines - focused validation
    
def _parse_file(self, file_path):
    # 20 lines - focused parsing
```

---

## Rule 5: Assertion Density ⚠️ HIGH PRIORITY

**Objective**: Minimum 2 assertions per function (defensive programming)

### Checklist Items:

- [ ] **Precondition assertions**
  - [ ] Parameter validation (`assert param is not None`)
  - [ ] Type checking (`assert isinstance(param, expected_type)`)
  - [ ] Range validation (`assert 0 <= value <= max_value`)
- [ ] **Postcondition assertions**
  - [ ] Return value validation
  - [ ] State consistency checks
  - [ ] Resource cleanup verification
- [ ] **Invariant assertions**
  - [ ] Class invariants maintained
  - [ ] Data structure consistency
  - [ ] Business rule enforcement
- [ ] **Error handling assertions**
  - [ ] Expected error conditions checked
  - [ ] Resource limits enforced

### Code Review Questions:
1. Does each function validate its inputs?
2. Are return values within expected ranges?
3. Are error conditions properly checked?

### Example Patterns:
```python
def analyze_violations(self, violations):
    # Preconditions
    assert violations is not None, "Violations list cannot be None"
    assert isinstance(violations, list), "Violations must be a list"
    assert len(violations) < 10000, "Too many violations for analysis"
    
    # Main logic
    results = self._process_violations(violations)
    
    # Postconditions  
    assert results is not None, "Results cannot be None"
    assert len(results) <= len(violations), "Results cannot exceed input"
    return results
```

---

## Rule 6: Variable Scope 📊 MEDIUM PRIORITY

**Objective**: Declare objects at smallest possible scope

### Checklist Items:

- [ ] **Minimize global variables**
  - [ ] No more than 20 global variables per module
  - [ ] Use module-level constants instead of globals
  - [ ] Encapsulate related globals in classes
- [ ] **Local variable scope**
  - [ ] Variables declared close to first use
  - [ ] Loop variables not used outside loops
  - [ ] Temporary variables have minimal lifetime
- [ ] **Function parameter efficiency**
  - [ ] Pass necessary data only
  - [ ] Use dependency injection over global access

### Code Review Questions:
1. Can any global variables be made module-level or class-level?
2. Are variables declared at appropriate scope levels?
3. Is data passed explicitly rather than accessed globally?

---

## Rule 7: Return Value Checking ⚠️ HIGH PRIORITY

**Objective**: Check return values of all non-void functions

### Checklist Items:

- [ ] **Function call return values checked**
  - [ ] No ignored return values unless explicitly documented
  - [ ] Error codes/status checked immediately
  - [ ] `None` returns handled appropriately
- [ ] **Exception handling**
  - [ ] Try-except blocks for fallible operations
  - [ ] Specific exception types caught
  - [ ] Proper cleanup in exception handlers
- [ ] **Resource management**
  - [ ] File operations checked for success
  - [ ] Network operations have error handling
  - [ ] Database operations validate results

### Code Review Questions:
1. Are all function return values used or explicitly ignored?
2. Is error handling comprehensive for fallible operations?
3. Are resources properly cleaned up on errors?

### Example Patterns:
```python
# GOOD: Check return values
result = risky_operation()
if result is None:
    handle_error()
    return

# GOOD: Explicit ignore with comment
_ = logging_function()  # Return value intentionally ignored

# BAD: Ignored return value
risky_operation()  # VIOLATION - return value not checked
```

---

## Rules 8-10: Language-Specific 📊 MEDIUM PRIORITY

### Rule 8: Preprocessor Usage (Limited Python Application)
- [ ] Minimal use of complex decorators
- [ ] No code generation through `exec()`
- [ ] Clear metaprogramming with documentation

### Rule 9: Pointer Indirection (Limited Python Application)  
- [ ] Minimize complex object reference chains
- [ ] Avoid deep attribute access (`obj.attr.attr.attr`)
- [ ] Clear ownership semantics for mutable objects

### Rule 10: Compiler Warnings
- [ ] All lint warnings addressed before merge
- [ ] Type hints complete and accurate
- [ ] No deprecated API usage
- [ ] Static analysis tools pass cleanly

---

## Compliance Scoring

### Target Thresholds:
- **Defense Industry Standard**: ≥90% overall compliance
- **Critical Rules (1,2,3)**: 100% compliance required
- **High Priority Rules (4,5,7)**: ≥90% compliance target
- **Medium Priority Rules (6,8,9,10)**: ≥75% compliance target

### Review Sign-off:

**Reviewer**: _________________________ **Date**: _____________

**Compliance Assessment**:
- [ ] Critical rules: 100% compliant
- [ ] High priority rules: ≥90% compliant  
- [ ] Medium priority rules: ≥75% compliant
- [ ] Overall NASA POT10 score: ≥90%

**Notes**:
_________________________________
_________________________________
_________________________________

**Approved for merge**: [ ] Yes [ ] No [ ] Conditional

---

## Quick Reference

### Most Common Violations:
1. **Large functions** (Rule 4) - Break into smaller methods
2. **Unbounded loops** (Rule 2) - Add MAX_ITERATIONS constants
3. **Missing assertions** (Rule 5) - Add parameter validation
4. **Unchecked returns** (Rule 7) - Validate all function results
5. **Recursion** (Rule 1) - Convert to iterative with explicit stacks

### Automated Checks:
```bash
# Run before review
pylint --rcfile=.pylintrc-nasa *.py
mypy --strict *.py  
bandit -r .
python -m analyzer.nasa_engine.nasa_analyzer --compliance-check
```

### Emergency Checklist (5-minute review):
- [ ] Any function >60 lines?
- [ ] Any `while True:` without bounds?
- [ ] Any function without assertions?
- [ ] Any unchecked function calls?
- [ ] Any direct recursion?