import type { EmailTemplate } from "../functions/shared/bugReportEmails";

// Every variable a template references ({{x}}, {{{x}}}, {{#if x}}). SES fails to render (after
// accepting the send) when one is missing from TemplateData, so tests check these are all passed.
export function templateVariables(template: EmailTemplate): string[] {
  const source = template.subject + template.html + template.text;
  const names = new Set<string>();
  for (const match of source.matchAll(/\{\{\{?\s*(?:#if\s+)?([A-Za-z]\w*)\s*\}?\}\}/g)) {
    if (match[1] !== "else") names.add(match[1]!);
  }
  return [...names].sort();
}
