# geiger-report

Understand what your AI tools can access, without reading a wall of scanner output.

A small skill for Claude Code and Codex. It checks Node/npx, runs [Geiger](https://github.com/Atomburstofficial/geiger), connects findings to their relevant GitHub repositories, and gives you a plain-language report with prioritized next steps.

The workflow lives in [SKILL.md](SKILL.md). The [synthetic example report](examples/synthetic-report.html) demonstrates its visual output. No server, account, custom scanner, or runtime dependencies beyond Geiger's Node requirement.

## Install

Copy this repository's `SKILL.md` into a folder named `geiger-report` in your assistant's skill directory:

- **Claude Code:** `~/.claude/skills/geiger-report/SKILL.md`
- **Codex:** `~/.agents/skills/geiger-report/SKILL.md`

For project-only use, place that folder under `.claude/skills/` or `.agents/skills/` in the project instead. You can also copy `examples/` into the skill folder to give the assistant a visual reference. The optional `agents/openai.yaml` supplies Codex display metadata; copy it into the skill folder's `agents/` directory if desired. Reload your assistant if the skill does not appear immediately. See the official [Claude Code](https://code.claude.com/docs/en/skills) and [Codex](https://developers.openai.com/codex/skills) skill documentation.

Then ask:

> Use geiger-report to check my AI tools and tell me what needs my attention.

Or supply an existing Geiger JSON report. No new scan or Node installation is needed to interpret an existing report.

## What you get

- A short explanation of your setup and up to three useful next steps.
- Every detected entry classified by type, access, source confidence, and review priority.
- A repository index with verified links and clearly marked unknowns.
- A self-contained, mobile-friendly `geiger-report.html` with clear next-step cards, source links, and expandable technical evidence. The scan JSON is a secondary artifact.

The priorities are **Review first**, **Confirm purpose**, and **No extra action identified**. They are not malware verdicts or security certifications. Repository stars do not establish trust.

## Requirements and data

New scans require Node.js 18+ and npx. The skill checks both and points to the Node LTS installer if needed. The tested command uses `geiger-scan@0.3.0`; npx may download it from npm. Geiger is a separate open-source project by Atomburst, not maintained by Ultra.

Reports are written locally outside version control. Your assistant reads them in its normal conversation context and uses public package/repository metadata for source lookups. It does not upload raw reports, expose key values, execute discovered tools, or automatically change your setup.

Geiger reads known configuration locations. It cannot prove what a tool did, whether it is malicious, or that everything on a machine was found. Permission labels describe capabilities; they are not proof of compromise.

## Development

This is intentionally a Markdown skill, not a wrapper application. Changes should keep the workflow small and readable. When changing the scan command, check the npm release, upstream JSON schema, diagnostics, and a synthetic fixture before updating the tested version. Never commit real scan reports or credentials.

Validated against Geiger 0.3.0: a synthetic MCP configuration produced schema-v1 findings, the expected access labels, and a credential key name without exposing its dummy value. Frontmatter is checked with the skill-creator validator. The included synthetic HTML report was developed from that scan and checked in desktop/mobile browsers. This checks the example and command/schema compatibility, not the quality of every model-generated report.

MIT licensed. Intended repository: `ultradotdev/geiger-report`.
