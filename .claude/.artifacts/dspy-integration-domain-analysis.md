# dspy-integration Domain Analysis

## Error Count Summary
- **Total errors**: 261
- **TS2339 (Property missing)**: 1 error (0.4%)
- **TS2345/TS2554 (Implementation)**: 45 errors (17%)
- **Other types**: ~215 errors (82%)

## Domain Classification: **SKIP - Implementation Heavy**

### Error Breakdown

**Implementation Errors (82%)**:
- TS2420: Class incorrectly implements interface (4 errors)
- TS2693: Type used as value (2 errors)
- TS2322: Type assignment mismatches (~50 errors)
- TS2740: Missing properties from complex types (~50 errors)
- TS7006: Implicit 'any' parameters (~30 errors)
- TS7053: Implicit 'any' index access (~40 errors)
- TS2532: Possibly 'undefined' (~20 errors)
- TS2551: Enum member case mismatches (~15 errors)

**Property Errors (0.4%)**:
- TS2339: 1 error only (`sourceId` missing from AgentMessage)

### Sample Errors Analysis

**1. Interface Implementation Errors (TS2420)**
```typescript
// 4 signature classes incorrectly implement DSPySignature:
- DroneToPrincessSignature
- PrincessToDroneSignature
- PrincessToQueenSignature
- QueenToPrincessSignature
```
**Fix Required**: Implement missing interface methods - NOT property additions

**2. Enum Case Mismatches (TS2551)**
```typescript
// Code uses: MemoryState.SEMANTIC
// Enum defines: MemoryState.semantic
```
**Fix Required**: Standardize enum casing - NOT property additions

**3. Type vs Value Confusion (TS2693)**
```typescript
new FeedbackLoop()  // FeedbackLoop is interface, not class
```
**Fix Required**: Create implementations - NOT property additions

**4. Implicit 'any' Violations (TS7006, TS7053)**
```typescript
// 70+ errors from missing type annotations
Parameter 'e' implicitly has an 'any' type
Element implicitly has an 'any' type
```
**Fix Required**: Add type annotations - NOT property additions

**5. Complex Type Mismatches (TS2740)**
```typescript
// Missing 6 required properties:
Type '{ ... }' is missing: originalMessage, semanticHash,
relevanceScore, enhancedContext, ...
```
**Fix Required**: Provide all required properties - NOT simple additions

### ROI Analysis

**IF we attempted execution**:
- **Property additions**: 1 error fixable (~5 minutes)
- **Implementation fixes**: 260 errors requiring:
  - Interface implementations
  - Enum standardization
  - Class creation for interfaces
  - Type annotation additions
  - Complex object property completions

**Estimated time**: 15-20 hours
**ROI**: ~13-17 errors/hour (BELOW 30-40/h target)

### Comparison with compliance Domain

**compliance (93 errors)**:
- 58 fixable with property additions (62%)
- 35 requiring implementation fixes (38%)
- Mixed type-heavy/implementation domain

**dspy-integration (261 errors)**:
- 1 fixable with property additions (0.4%)
- 260 requiring implementation fixes (99.6%)
- PURE implementation domain

### Strategic Decision: **SKIP**

**Reasons**:
1. **0.4% type-heavy** - Not worth sampling effort
2. **Implementation-heavy** - Requires class creation, interface implementation
3. **Low ROI** - 13-17 errors/hour vs 30-40/h target
4. **High complexity** - 70+ implicit 'any' violations alone

**Defer to**: Implementation epic AFTER type foundation complete

### Recommended Action

**SKIP dspy-integration domain entirely**

**Move on to**: Sample next type-heavy candidate:
- risk-dashboard (95 errors) - Already suspected facade-heavy
- Look for domains with TS2339 > 50% split

### Domain Pattern Recognition

**Type-Heavy Pattern** (✅ Execute):
- TS2339 errors > 50%
- Simple property additions
- Enum member additions
- Interface property completions

**Implementation-Heavy Pattern** (❌ Skip):
- TS2420: Interface implementation errors
- TS2693: Type/value confusion
- TS7006/TS7053: Implicit 'any' violations
- TS2740: Complex missing properties (5+ at once)

**dspy-integration fits SKIP pattern perfectly**

## Next Steps

1. ✅ Skip dspy-integration (261 errors) - Implementation epic
2. Sample risk-dashboard (95 errors) - Expect facade-heavy
3. Find remaining type-heavy domains with better splits
4. Execute only domains with >50% TS2339 property errors

## Lessons Learned

**Sampling is critical**:
- Don't assume domain type from name
- dspy-integration sounds "type-heavy" but is 99.6% implementation
- 5-minute sample saves 15-20 hours wasted effort

**Error type distribution predicts ROI**:
- TS2339 > 50% → Good ROI (30-40 errors/hour)
- TS2420/TS2693/TS7006 dominant → Poor ROI (<20 errors/hour)
- compliance was borderline (62% type-heavy)
- dspy-integration is clear skip (0.4% type-heavy)
