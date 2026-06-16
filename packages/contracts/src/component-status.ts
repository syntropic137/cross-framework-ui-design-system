import type { BadgeContract } from "./components/badge.js";
import type { ButtonContract } from "./components/button.js";
import type { ToggleContract } from "./components/toggle.js";

export type ContractStatus = "required" | "planned" | "experimental";

export const componentContractStatus = {
  accordion: "planned",
  "alert-dialog": "planned",
  "aspect-ratio": "planned",
  avatar: "planned",
  badge: "required",
  button: "required",
  calendar: "planned",
  checkbox: "planned",
  collapsible: "planned",
  combobox: "planned",
  command: "planned",
  "context-menu": "planned",
  "date-field": "planned",
  "date-picker": "planned",
  "date-range-field": "planned",
  "date-range-picker": "planned",
  dialog: "planned",
  "dropdown-menu": "planned",
  label: "planned",
  "link-preview": "planned",
  menu: "planned",
  menubar: "planned",
  meter: "planned",
  "navigation-menu": "planned",
  pagination: "planned",
  "pin-input": "planned",
  popover: "planned",
  progress: "planned",
  "radio-group": "planned",
  "range-calendar": "planned",
  "rating-group": "planned",
  "scroll-area": "planned",
  select: "planned",
  separator: "planned",
  slider: "planned",
  switch: "planned",
  tabs: "planned",
  "time-field": "planned",
  "time-range-field": "planned",
  toggle: "required",
  "toggle-group": "planned",
  toolbar: "planned",
  tooltip: "planned",
} as const satisfies Record<string, ContractStatus>;

export type ComponentContractName = keyof typeof componentContractStatus;

export type RequiredContractName = {
  [Name in ComponentContractName]: (typeof componentContractStatus)[Name] extends "required"
    ? Name
    : never;
}[ComponentContractName];

export const requiredContractNames = [
  "badge",
  "button",
  "toggle",
] as const satisfies readonly RequiredContractName[];

export interface RequiredComponentContracts {
  badge: BadgeContract;
  button: ButtonContract;
  toggle: ToggleContract;
}

export type RequiredComponentAdapter = {
  [Name in keyof RequiredComponentContracts]: unknown;
};

export type RequiredComponentAdapterProps = {
  [Name in keyof RequiredComponentContracts]: RequiredComponentContracts[Name];
};

export type AssertRequiredComponentProps<
  Props extends RequiredComponentAdapterProps,
> = Props;
