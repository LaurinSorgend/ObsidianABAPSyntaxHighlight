# ABAP Syntax Highlight

Adds ABAP syntax highlighting to ` ```abap ` fenced code blocks in [Obsidian](https://obsidian.md), both in Reading view and while editing (Live Preview / Source mode).

## Features

- Highlights ABAP keywords, strings (`'...'`, `` `...` ``, `|...|` string templates), comments (`*` line comments and inline `"` comments), pragmas (`##...`), numbers, and operators.
- Works in Reading view and in the editor, using Obsidian's theme CSS variables so colors match your active theme in both light and dark mode.
- No network access, no telemetry, no external dependencies bundled into the plugin.

## Example

````markdown
```abap
REPORT zz_test_report.

DATA: lv_name TYPE string.

IF lv_name IS INITIAL.
  lv_name = |Hello { sy-uname }|. " inline comment
ENDIF.
```
````

## Installation

### From the Community Plugins directory

Once available in Obsidian's Community Plugins directory: open **Settings → Community plugins → Browse**, search for "ABAP Syntax Highlight", and select **Install**, then **Enable**.

### Manually

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/LaurinSorgend/ObsidianABAPSyntaxHighlight/releases).
2. Copy them into `<YourVault>/.obsidian/plugins/abap-syntax-highlight/`.
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # type-check + production build
npm run lint   # eslint
```

Source lives in `src/`:

- `abap-tokenizer.ts` — the shared ABAP token rules used by both rendering paths.
- `abap-reading-view.ts` — renders highlighted ` ```abap ` blocks in Reading view via `registerMarkdownCodeBlockProcessor`.
- `abap-live-preview.ts` — a CodeMirror 6 extension that highlights ` ```abap ` blocks in the editor.
- `main.ts` — plugin entry point, wires the two above.

## License

[MIT](LICENSE)
