# Filling the standard report

The renderer uses only Node built-ins. Keep the template's layout and CSS unchanged for ordinary reports; put your interpretation in an `analysis.json` outside version control.

## Fields

All prose values are plain text, not HTML or Markdown. The renderer escapes the embedded payload and uses DOM text nodes.

- `headline`, `summary`, `context`: conclusion, explanation, short inventory/scope context.
- `scope`: where this particular scan ran, including unknown or unscanned areas. Do not copy the example's scope.
- `coverage`: important limits, unknowns and diagnostic interpretation. Raw diagnostics also appear automatically.
- `synthetic`: optional boolean, true only for fixture/example data.
- `rawNote`: optional text only if the linked/embedded scan has been sanitized; explain the redaction without quoting the removed value.
- `actions`: zero to three objects with `title`, `body`, `findingId`.
- `findings`: one object per input finding, each containing `id`, `description`, `priority`, `access`, `why`, `sourceId`, `sourceExplanation`, `nextStep`.
  - Assign `F01` to input `findings[0]`, `F02` to `findings[1]`, etc. Every input finding appears exactly once. Do not combine cards in this template; share source IDs to avoid duplicate research.
  - `priority` is `review`, `confirm`, or `clear`. The renderer orders cards and computes counts from these values.
  - Names, evidence paths, secret key names/shapes, confidence, notes and labels come directly from the input scan, not from your prose.
- `sources`: objects with `id` (`R01`, etc.), `name`, `url` (http(s) URL or null), `status`, `basis`.
  - `status` is `Verified source link`, `Possible match`, `No public repo identified`, or `Lookup unavailable`.
  - Each finding references a source, even when its source is unresolved. The renderer builds the “Used by” links.

See `examples/analysis.json` for a complete synthetic input.

## Render

```sh
node "<skill-directory>/scripts/render-report.mjs" "/absolute/path/scan.json" "/absolute/path/analysis.json" "/absolute/fresh-output/geiger-report.html"
```

The renderer writes the HTML and an exact copy of the supplied JSON as sibling `scan.json`. It embeds that same JSON text in an expandable block and provides open/download links to the file. No network requests or separate assets are needed to view the HTML. Keep both files together for the file links to work. It refuses to overwrite a report or a different existing scan.

Geiger output is normally value-redacted. Inspect supplied reports before rendering. If an input unexpectedly contains real secret values, preserve the original privately and render from a separately sanitized copy. Set `rawNote` to explain that the displayed/downloadable JSON is redacted. Do not claim that a sanitized copy is byte-identical to the original.

If Node is unavailable when interpreting supplied JSON, use another available file-writing tool to assemble the same template: replace its single `__GEIGER_REPORT_DATA__` token with serialized `{analysis, rawJson}`. `rawJson` is the exact file text, not an object. Escape `<` as `\u003c`, `&` as `\u0026`, U+2028 and U+2029 in the serialized payload before embedding. Write the same raw text to sibling `scan.json`. Preserve all findings, validate source/action IDs, and never insert scan text as HTML. Do not redesign the template or silently omit the raw-data section.
