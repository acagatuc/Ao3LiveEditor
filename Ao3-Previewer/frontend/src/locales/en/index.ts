import common from "./common.json";
import editor from "./editor.json";
import richText from "./richText.json";

export const enResources = {
  common,
  editor,
  richText,
} as const;

export type Namespace = keyof typeof enResources;

export const namespaces = Object.keys(enResources) as Namespace[];
