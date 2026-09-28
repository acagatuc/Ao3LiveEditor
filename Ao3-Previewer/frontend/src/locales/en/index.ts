import common from "./common.json";
import cssWarnings from "./cssWarnings.json";
import editor from "./editor.json";
import pages from "./pages.json";
import richText from "./richText.json";

export const enResources = {
  common,
  editor,
  richText,
  pages,
  cssWarnings,
} as const;

export type Namespace = keyof typeof enResources;

export const namespaces = Object.keys(enResources) as Namespace[];
