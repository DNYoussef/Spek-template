#!/bin/bash
# Fix FSM naming: Numeric identifiers → Valid TypeScript identifiers

for file in src/fsm/range-eliminated/*.ts; do
  echo "Processing: $(basename $file)"

  # Replace all numeric identifier patterns with valid names
  sed -i 's/export interface 500599FSMState/export interface FSMState_500599/g' "$file"
  sed -i 's/export enum 500599Events/export enum FSMEvents_500599/g' "$file"
  sed -i 's/export class 500599FSMCore/export class FSMCore_500599/g' "$file"
  sed -i 's/private currentState: 500599FSMState/private currentState: FSMState_500599/g' "$file"

  sed -i 's/export interface 600699FSMState/export interface FSMState_600699/g' "$file"
  sed -i 's/export enum 600699Events/export enum FSMEvents_600699/g' "$file"
  sed -i 's/export class 600699FSMCore/export class FSMCore_600699/g' "$file"
  sed -i 's/private currentState: 600699FSMState/private currentState: FSMState_600699/g' "$file"

  sed -i 's/export interface 700799FSMState/export interface FSMState_700799/g' "$file"
  sed -i 's/export enum 700799Events/export enum FSMEvents_700799/g' "$file"
  sed -i 's/export class 700799FSMCore/export class FSMCore_700799/g' "$file"
  sed -i 's/private currentState: 700799FSMState/private currentState: FSMState_700799/g' "$file"

  sed -i 's/export interface 800899FSMState/export interface FSMState_800899/g' "$file"
  sed -i 's/export enum 800899Events/export enum FSMEvents_800899/g' "$file"
  sed -i 's/export class 800899FSMCore/export class FSMCore_800899/g' "$file"
  sed -i 's/private currentState: 800899FSMState/private currentState: FSMState_800899/g' "$file"
done

echo "FSM naming fixed in all files"