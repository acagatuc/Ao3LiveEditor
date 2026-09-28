import common from "./common.json";

export const enResources = {
  common,
} as const;

export type Namespace = keyof typeof enResources;

export const namespaces = Object.keys(enResources) as Namespace[];
