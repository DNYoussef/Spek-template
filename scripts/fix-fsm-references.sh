#!/bin/bash
# Fix remaining FSM references in method bodies and facades

for file in src/fsm/range-eliminated/*.ts; do
  echo "Fixing references in: $(basename $file)"

  # Fix method parameter and return types
  sed -i 's/transition(event: 500599Events/transition(event: FSMEvents_500599/g' "$file"
  sed -i 's/): 500599FSMState/): FSMState_500599/g' "$file"
  sed -i 's/if (event === 500599Events\./if (event === FSMEvents_500599./g' "$file"
  sed -i 's/this.fsm.transition(500599Events\./this.fsm.transition(FSMEvents_500599./g' "$file"
  sed -i 's/export class 500599Facade/export class FSMFacade_500599/g' "$file"
  sed -i 's/private fsm: 500599FSMCore/private fsm: FSMCore_500599/g' "$file"
  sed -i 's/this.fsm = new 500599FSMCore/this.fsm = new FSMCore_500599/g' "$file"

  sed -i 's/transition(event: 600699Events/transition(event: FSMEvents_600699/g' "$file"
  sed -i 's/): 600699FSMState/): FSMState_600699/g' "$file"
  sed -i 's/if (event === 600699Events\./if (event === FSMEvents_600699./g' "$file"
  sed -i 's/this.fsm.transition(600699Events\./this.fsm.transition(FSMEvents_600699./g' "$file"
  sed -i 's/export class 600699Facade/export class FSMFacade_600699/g' "$file"
  sed -i 's/private fsm: 600699FSMCore/private fsm: FSMCore_600699/g' "$file"
  sed -i 's/this.fsm = new 600699FSMCore/this.fsm = new FSMCore_600699/g' "$file"

  sed -i 's/transition(event: 700799Events/transition(event: FSMEvents_700799/g' "$file"
  sed -i 's/): 700799FSMState/): FSMState_700799/g' "$file"
  sed -i 's/if (event === 700799Events\./if (event === FSMEvents_700799./g' "$file"
  sed -i 's/this.fsm.transition(700799Events\./this.fsm.transition(FSMEvents_700799./g' "$file"
  sed -i 's/export class 700799Facade/export class FSMFacade_700799/g' "$file"
  sed -i 's/private fsm: 700799FSMCore/private fsm: FSMCore_700799/g' "$file"
  sed -i 's/this.fsm = new 700799FSMCore/this.fsm = new FSMCore_700799/g' "$file"

  sed -i 's/transition(event: 800899Events/transition(event: FSMEvents_800899/g' "$file"
  sed -i 's/): 800899FSMState/): FSMState_800899/g' "$file"
  sed -i 's/if (event === 800899Events\./if (event === FSMEvents_800899./g' "$file"
  sed -i 's/this.fsm.transition(800899Events\./this.fsm.transition(FSMEvents_800899./g' "$file"
  sed -i 's/export class 800899Facade/export class FSMFacade_800899/g' "$file"
  sed -i 's/private fsm: 800899FSMCore/private fsm: FSMCore_800899/g' "$file"
  sed -i 's/this.fsm = new 800899FSMCore/this.fsm = new FSMCore_800899/g' "$file"
done

echo "All FSM references fixed"