// Comments to strip from CSS: real /* */ comments, plus HTML-style <!-- --> and <!...> ones.
// AO3 strips both kinds. A browser doesn't: it reads "<!— note —>" as part of the next selector
// and drops that whole rule, so the preview has to remove them first to match AO3.
export const CSS_COMMENT_REGEX = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|<![^>]*>/g
