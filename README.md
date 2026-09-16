# Geiger Gauge

An [Ultra.dev](https://ultra.dev) skill for Claude Code and Codex that explains what your AI tools can access and what to review next.

[Project page](https://ultra.dev/projects/geiger-gauge) · [GitHub](https://github.com/ultradotdev/geiger-gauge)

## What it does

- Checks Node/npx and runs [Geiger](https://github.com/Atomburstofficial/geiger).
- Explains each finding in plain language and prioritizes useful next steps.
- Matches tools to their source repositories, marking uncertain matches honestly.
- Produces an Ultra-branded HTML report with expandable evidence, raw JSON, and a JSON download.

Reports use a shared template, work offline, and stay local. The skill recommends changes; it does not automatically change your setup. Findings describe configured capabilities, not proof of compromise or a security certification.

## Install

Copy `SKILL.md`, `assets/`, `scripts/`, and `references/` into a `geiger-gauge` folder under:

- **Claude Code:** `~/.claude/skills/`
- **Codex:** `~/.agents/skills/`

Use `.claude/skills/` or `.agents/skills/` inside a project for project-only installation. Optionally include `agents/` for Codex display metadata and `examples/` for a complete sample. Reload your assistant if needed.

Then ask:

> Use geiger-gauge to check my AI tools and tell me what needs my attention.

New scans require Node.js 18+ and npx. The tested scanner is `geiger-scan@0.3.0`. You can also provide an existing Geiger JSON report. Your assistant processes findings in its normal conversation context and uses public metadata for repository lookups.

## Example and development

See the [synthetic report](examples/synthetic-report.html) and [report data contract](references/report-data.md). From the repository, render the fixture into a fresh output directory and run the tests:

```sh
node scripts/render-report.mjs examples/scan.json examples/analysis.json /tmp/geiger-example/geiger-gauge.html
node --test tests/render-report.test.mjs
```

Keep the generated HTML and `scan.json` together so the open/download links work. Never commit real scan reports or credentials; the included example data is synthetic.

## License and credits

[MIT](LICENSE). Geiger is a separate project by [Atomburst](https://github.com/Atomburstofficial/geiger). Bundled Inter and JetBrains Mono fonts retain their SIL Open Font License notices in `assets/brand/`.
