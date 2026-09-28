import common from "./common.json";
import editor from "./editor.json";

export const enResources = {
  common,
  editor,
} as const;

export type Namespace = keyof typeof enResources;

export const namespaces = Object.keys(enResources) as Namespace[];
