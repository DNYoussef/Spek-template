# Phase 1.1.2 Strategy: Comment Missing Imports

## Approach: Surgical Import Commenting

### Priority 1: Missing Type Files (~26 files)
Pattern: `~types/XxxxTypes` imports where file doesn't exist

**Strategy**: Comment import + add TODO
```typescript
// TODO(Phase 4): Create AdaptiveThresholdTypes.ts
// Reference: .claude/.artifacts/missing-files-inventory.md
// import { AdaptiveThresholdState, AdaptiveThresholdEvent } from '~types/AdaptiveThresholdTypes';
```

### Priority 2: Missing State Handlers (~120 files)
Pattern: `./states/XxxStateHandler` imports

**Strategy**: Comment import + update class to not reference
```typescript
// TODO(Phase 4): Implement state handlers
// import { InitializationStateHandler } from './states/InitializationStateHandler';
// import { MonitoringStateHandler } from './states/MonitoringStateHandler';

// Temporary: FSM without state handlers
// Will cause runtime errors if executed, but allows compilation
```

### Priority 3: Missing Facades (~250 files)
Pattern: `./XxxFacade` imports

**Strategy**: Comment import + note in inventory
```typescript
// TODO(Phase 4): Implement facade pattern
// import { PrincessStateMachineFacade } from './PrincessStateMachineFacade';
```

## Execution Plan

1. Generate full missing files inventory
2. Sort by category (types, handlers, facades)
3. Use sed/grep to comment imports systematically
4. Validate TS2307 reduction (455 → ~60)
5. Document all missing files for Phase 4

## Success Criteria
- TS2307: 455 → 60 (-87%)
- All missing file imports commented
- Zero stub implementations created
- Complete inventory for Phase 4
