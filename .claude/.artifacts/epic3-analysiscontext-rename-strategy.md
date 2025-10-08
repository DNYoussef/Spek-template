# Epic 3: AnalysisContext Type Consolidation - Rename Strategy

## Discovery Summary

### 5 Conflicting AnalysisContext Interfaces Found

1. **`src/analysis/core/types/AnalysisTypes.ts` (lines 59-77)** - **CANONICAL**
   - **Purpose**: General-purpose analysis context for all analyzer/validator components
   - **Properties**: `analysisId?`, `analysisType`, `sources`, `rules?`, `options?`, `scoreThreshold?`, `startTime?`, `metadata?`, `systemAnalysis?`, `riskAnalysis?`, `migrationPlan?`, `validationResults?`, `retryCount?`, `request?`, `dependencyAnalysis?`, `errors?`, `phaseTimings?`
   - **Usage**: Re-exported from `src/types/AnalysisTypes.ts`, imported by MigrationValidator
   - **Decision**: **KEEP AS-IS** (canonical location)

2. **`src/migration/planning/fsm/types/AnalysisTypes.ts` (lines 48-62)**
   - **Purpose**: Migration FSM-specific analysis context
   - **Properties**: `analysisId`, `request: ImpactAnalysisRequest`, `systemAnalysis?`, `gapAnalysis?`, `riskAnalysis?`, `dependencyAnalysis?`, `migrationPlan?`, `validationResults?`, `errors`, `retryCount`, `startTime`, `phaseTimings`, `metadata`
   - **Semantic Name**: Migration planning workflow context
   - **Decision**: **RENAME to `MigrationAnalysisContext`**

3. **`src/performance/analysis/fsm/PerformanceAnalysisStateMachine.ts` (lines 44-56)**
   - **Purpose**: Performance benchmarking analysis context
   - **Properties**: `results: BenchmarkResult[]`, `summary?`, `statistics?`, `patterns?`, `outliers?`, `correlations?`, `trends?`, `recommendations?`, `riskAssessment?`, `currentState`, `error?`
   - **Semantic Name**: Performance benchmarking context
   - **Decision**: **RENAME to `PerformanceAnalysisContext`**

4. **`src/migration/planning/types/config/modules/analysis/AnalysisTypes.ts` (lines 25-30)**
   - **Purpose**: Analysis configuration/settings context
   - **Properties**: `constraints`, `options`, `environment`, `stakeholders`
   - **Semantic Name**: Analysis configuration context
   - **Decision**: **RENAME to `AnalysisConfigurationContext`**

5. **`src/architecture/langgraph/state-machines/research/ResearchAnalysisEngine.ts` (lines 49-55)**
   - **Purpose**: Research operations analysis context
   - **Properties**: `domain`, `purpose`, `audience`, `constraints`, `preferences`
   - **Semantic Name**: Research workflow context
   - **Decision**: **RENAME to `ResearchAnalysisContext`**

## Incompatibility Analysis

**Key Finding**: These are **NOT duplicate types** - they are **incompatible interfaces** serving different domains:

- **Canonical** (`src/analysis/core/types`): Generic analysis with `analysisType` discriminator
- **Migration FSM** (`src/migration/planning/fsm/types`): Migration workflow with `ImpactAnalysisRequest`
- **Performance** (`src/performance/analysis/fsm`): Performance benchmarking with `BenchmarkResult[]`
- **Configuration** (`src/migration/planning/types/config`): Configuration settings
- **Research** (`src/architecture/langgraph/state-machines/research`): Research operations

**No structural overlap** - each has unique properties for its domain.

## Rename Execution Plan

### Phase 1: Renames (4 files)

1. **Migration FSM** (`src/migration/planning/fsm/types/AnalysisTypes.ts`)
   ```diff
   - export interface AnalysisContext {
   + export interface MigrationAnalysisContext {
   ```

2. **Performance** (`src/performance/analysis/fsm/PerformanceAnalysisStateMachine.ts`)
   ```diff
   - export interface AnalysisContext {
   + export interface PerformanceAnalysisContext {
   ```

3. **Configuration** (`src/migration/planning/types/config/modules/analysis/AnalysisTypes.ts`)
   ```diff
   - export interface AnalysisContext {
   + export interface AnalysisConfigurationContext {
   ```

4. **Research** (`src/architecture/langgraph/state-machines/research/ResearchAnalysisEngine.ts`)
   ```diff
   - export interface AnalysisContext {
   + export interface ResearchAnalysisContext {
   ```

### Phase 2: Update Dependent Usages

#### Migration FSM Dependencies
- `src/migration/planning/fsm/states/ValidationState.ts`: Update `AnalysisContext` imports
- `src/migration/planning/fsm/states/TerminalStates.ts`: Update `AnalysisContext` imports
- Any other migration FSM state files

#### Performance Dependencies
- Same file (PerformanceAnalysisStateMachine.ts) - internal usage only

#### Configuration Dependencies
- Check for imports from `src/migration/planning/types/config/index.ts`
- Update any re-exports

#### Research Dependencies
- Same file (ResearchAnalysisEngine.ts) - internal usage only

### Phase 3: Update TypeScript References

After renames, update all function signatures, class properties, and type annotations:

```typescript
// Migration FSM
- private async executeAnalysis(context: AnalysisContext): Promise<void>
+ private async executeAnalysis(context: MigrationAnalysisContext): Promise<void>

// Performance
- public async analyze(context: AnalysisContext): Promise<AnalysisResult>
+ public async analyze(context: PerformanceAnalysisContext): Promise<AnalysisResult>

// Configuration
- function validateConfig(context: AnalysisContext): boolean
+ function validateConfig(context: AnalysisConfigurationContext): boolean

// Research
- async analyzeContent(request: { context: AnalysisContext }): Promise<AnalysisResult>
+ async analyzeContent(request: { context: ResearchAnalysisContext }): Promise<AnalysisResult>
```

## Expected Error Reduction

**Current Hypothesis from Progress Report**: ~105 TS2339/TS2353 errors

**Actual Impact Analysis**:
- These interfaces are used in **different domains** with no cross-imports
- The conflicts arise when TypeScript can't disambiguate which `AnalysisContext` to use
- Expected reduction: **50-100 errors** from property access disambiguation
- Additional errors may surface from cascade effects (will address in todo #7)

## Validation Strategy

1. **Before**: Capture baseline error count
2. **After Phase 1**: Check that renamed interfaces compile
3. **After Phase 2**: Verify all imports resolve correctly
4. **After Phase 3**: Full `npx tsc --noEmit` validation
5. **Compare**: Document error reduction

## Success Criteria

✅ Only 1 `AnalysisContext` interface (canonical in `src/analysis/core/types`)
✅ 4 renamed interfaces with clear semantic names
✅ Zero new errors introduced
✅ 50-100 TS2339/TS2353 errors resolved
✅ All imports compile successfully

## Next Steps

1. Execute Phase 1 renames (4 Edit operations in batch)
2. Map and update all dependent imports (Grep + batch Edit)
3. Validate compilation and count errors
4. Document ROI and commit

---

**Epic 3 Status**: Strategy complete, ready for execution
**Estimated Time**: 3-5 hours (original estimate: 5-8h)
**Risk Level**: LOW (isolated changes, clear semantic boundaries)
