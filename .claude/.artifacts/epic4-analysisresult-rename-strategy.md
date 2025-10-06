# Epic 4: AnalysisResult Type Consolidation - Rename Strategy

## Discovery Summary

### 5 Conflicting AnalysisResult Interfaces Found

1. **`src/analysis/core/types/AnalysisTypes.ts` (lines 110-124)** - **CANONICAL**
   - **Purpose**: General-purpose analysis result for all analyzer/validator components
   - **Properties**: `analysisId`, `analysisType`, `passed`, `score`, `errors`, `warnings`, `patterns`, `violations`, `recommendations`, `executionTime`, `timestamp`, `data?`, `metadata?`
   - **Usage**: Re-exported from `src/types/AnalysisTypes.ts`, extended by TheaterScanResult, SecurityScanResult, PerformanceAnalysisResult, ComplianceAnalysisResult, SandboxValidationResult
   - **Decision**: **KEEP AS-IS** (canonical location)

2. **`src/architecture/langgraph/state-machines/research/ResearchAnalysisEngine.ts` (lines 57-66)**
   - **Purpose**: Research content analysis results (keywords, categories, insights)
   - **Properties**: `id`, `status`, `summary: AnalysisSummary`, `keywords: Keyword[]`, `categories: Category[]`, `insights: Insight[]`, `metrics: AnalysisMetrics`, `recommendations`
   - **Semantic Name**: Research content analysis output
   - **Decision**: **RENAME to `ResearchAnalysisResult`**

3. **`src/migration/planning/types/config/modules/analysis/AnalysisTypes.ts` (lines 141-150)**
   - **Purpose**: Configuration analysis with findings and quality assessment
   - **Properties**: `id`, `analysis_id`, `timestamp`, `status`, `findings: AnalysisFinding[]`, `recommendations: AnalysisRecommendation[]`, `quality_assessment`, `metadata`
   - **Semantic Name**: Configuration/methodology analysis result
   - **Decision**: **RENAME to `ConfigurationAnalysisResult`**

4. **`src/swarm/reasoning/types/ReasoningTypes.ts` (lines 190-196)**
   - **Purpose**: Reasoning analysis with confidence and uncertainty
   - **Properties**: `finding`, `confidence`, `evidence`, `implications`, `uncertainty`
   - **Semantic Name**: Reasoning/logic analysis result
   - **Decision**: **RENAME to `ReasoningAnalysisResult`**

5. **`src/performance/analysis/fsm/PerformanceAnalysisStateMachine.ts` (lines 58-67)**
   - **Purpose**: Performance benchmarking analysis
   - **Properties**: `summary: PerformanceSummary`, `statistics`, `patterns`, `outliers`, `correlations`, `trends`, `recommendations`, `riskAssessment`
   - **Semantic Name**: Performance benchmarking result
   - **Decision**: **RENAME to `PerformanceBenchmarkResult`** (distinguish from canonical `PerformanceAnalysisResult`)

6. **`src/swarm/reasoning/rationalist/RationalistReasoningEngineFacade.ts` (lines 48-54)**
   - **Purpose**: Rationalist reasoning engine result (similar to #4 but with Evidence[] type)
   - **Properties**: `type`, `finding`, `confidence`, `evidence: Evidence[]`, `implications`
   - **Semantic Name**: Rationalist reasoning result
   - **Decision**: **RENAME to `RationalistAnalysisResult`**

## Incompatibility Analysis

**Key Finding**: These are **NOT duplicate types** - they are **incompatible interfaces** serving different domains:

- **Canonical** (`src/analysis/core/types`): Generic analysis with `analysisType` discriminator, violations, patterns
- **Research** (`src/architecture/langgraph/state-machines/research`): Content analysis with keywords, categories, insights
- **Configuration** (`src/migration/planning/types/config`): Configuration analysis with findings, quality assessment
- **Reasoning** (`src/swarm/reasoning/types`): Logic analysis with confidence, uncertainty
- **Performance** (`src/performance/analysis/fsm`): Benchmarking with statistics, correlations, trends
- **Rationalist** (`src/swarm/reasoning/rationalist`): Rationalist reasoning with typed Evidence

**No structural overlap** - each has unique properties for its domain.

## Rename Execution Plan

### Phase 1: Renames (5 files)

1. **Research** (`src/architecture/langgraph/state-machines/research/ResearchAnalysisEngine.ts`)
   ```diff
   - export interface AnalysisResult {
   + export interface ResearchAnalysisResult {
   ```

2. **Configuration** (`src/migration/planning/types/config/modules/analysis/AnalysisTypes.ts`)
   ```diff
   - export interface AnalysisResult {
   + export interface ConfigurationAnalysisResult {
   ```

3. **Reasoning** (`src/swarm/reasoning/types/ReasoningTypes.ts`)
   ```diff
   - export interface AnalysisResult {
   + export interface ReasoningAnalysisResult {
   ```

4. **Performance** (`src/performance/analysis/fsm/PerformanceAnalysisStateMachine.ts`)
   ```diff
   - export interface AnalysisResult {
   + export interface PerformanceBenchmarkResult {
   ```

5. **Rationalist** (`src/swarm/reasoning/rationalist/RationalistReasoningEngineFacade.ts`)
   ```diff
   - export interface AnalysisResult {
   + export interface RationalistAnalysisResult {
   ```

### Phase 2: Update Dependent Usages

#### Research Dependencies
- `src/architecture/langgraph/state-machines/research/ResearchStateMachineFacade.ts` (re-exports)
- `src/architecture/langgraph/state-machines/ResearchStateMachine.ts` (re-exports)
- Any research engine consumers

#### Configuration Dependencies
- Check for imports from `src/migration/planning/types/config/index.ts`
- Update any configuration analysis consumers

#### Reasoning Dependencies
- `src/swarm/reasoning/` module consumers
- Swarm reasoning engine dependencies

#### Performance Dependencies
- Already updated `PerformanceAnalyzer.ts` in Epic 3
- Check for additional performance analysis consumers

#### Rationalist Dependencies
- `src/swarm/reasoning/rationalist/` module consumers
- Rationalist engine facade users

### Phase 3: Update TypeScript References

After renames, update all function signatures, class properties, and type annotations:

```typescript
// Research
- async analyzeContent(...): Promise<AnalysisResult>
+ async analyzeContent(...): Promise<ResearchAnalysisResult>

// Configuration
- function performAnalysis(...): Promise<AnalysisResult>
+ function performAnalysis(...): Promise<ConfigurationAnalysisResult>

// Reasoning
- async analyze(...): Promise<AnalysisResult>
+ async analyze(...): Promise<ReasoningAnalysisResult>

// Performance
- getAnalysisResult(): AnalysisResult
+ getAnalysisResult(): PerformanceBenchmarkResult

// Rationalist
- async execute(...): Promise<AnalysisResult>
+ async execute(...): Promise<RationalistAnalysisResult>
```

## Expected Error Reduction

**Current Hypothesis**: ~50-100 errors from `AnalysisResult` property access disambiguation

**Actual Impact Analysis**:
- These interfaces are used in **different domains** with minimal cross-imports
- The conflicts arise when TypeScript can't disambiguate which `AnalysisResult` to use
- Expected reduction: **30-80 errors** from property access disambiguation
- Additional errors may surface from cascade effects (will address in todo #7)

## Validation Strategy

1. **Before**: Capture baseline error count
2. **After Phase 1**: Check that renamed interfaces compile
3. **After Phase 2**: Verify all imports resolve correctly
4. **After Phase 3**: Full `npx tsc --noEmit` validation
5. **Compare**: Document error reduction

## Success Criteria

✅ Only 1 `AnalysisResult` interface (canonical in `src/analysis/core/types`)
✅ 5 renamed interfaces with clear semantic names
✅ Zero new errors introduced
✅ 30-80 AnalysisResult-related errors resolved
✅ All imports compile successfully

## Next Steps

1. Execute Phase 1 renames (5 Edit operations in batch)
2. Map and update all dependent imports (Grep + batch Edit)
3. Validate compilation and count errors
4. Document ROI and commit

---

**Epic 4 Status**: Strategy complete, ready for execution
**Estimated Time**: 2-4 hours (based on Epic 3 experience)
**Risk Level**: LOW (isolated changes, clear semantic boundaries)
**Methodology**: Following proven Epic 1-3 systematic approach
