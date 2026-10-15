# DevOps Skills

[Português](README.md) | **English**

A collection of skills for engineering, DevOps, cybersecurity, and IT operations.

Includes **89 skills/sub-skills**, organized in the [main catalogue](skills/engineering-skills/SKILL.md). Each skill contains instructions and, where applicable, scripts, references, and assets.

## 1. Prerequisites

- Pi installed, with an authenticated model/provider.
- Git to obtain and update the repository.
- Task-specific tools only for the workflows you intend to run; see [dependencies and compatibility](docs/DEPENDENCIES.md).

Skills are not executables or services. Enabling them makes instructions available to the agent; it does not install Terraform, kubectl, Python, browsers, or credentials.

## 2. Enable skills in Pi

After cloning this repository, choose **one** of the following methods. Do not register the same copy through multiple methods, to avoid duplicate skill names.

### Option A — Register the path in settings.json

Edit `~/.pi/agent/settings.json` and add the absolute skills directory path to the existing `skills` list:

```json
{
  "skills": [
    "/absolute/path/devops-skills/skills/engineering-skills"
  ]
}
```

Replace the path with your actual checkout location. **Do not replace the entire settings file** if it already contains configuration: preserve other fields and paths.

The [configuration example](examples/pi-settings.json) uses `~/devops-skills`; adjust it if you cloned elsewhere. Pi discovers nested SKILL.md files recursively, without requiring a separate entry for each skill.

### Option B — Install the checkout as a Pi package

```bash
pi install /absolute/path/devops-skills
pi list
```

The `package.json` manifest registers skills only. It does not include extensions, hooks, themes, prompts, or installation scripts. You do not need to run `npm install` at the repository root to load the skills.

You can also install directly from GitHub:

```bash
pi install git:github.com/eliezerdlr/devops-skills
```

Choose this method or one of the local methods above, without registering the same resources twice.

### Reload and verify

Inside Pi:

```text
/reload
/skill:engineering-skills
```

The second command loads the catalogue. To select a specialist directly:

```text
/skill:senior-devops Review this pipeline and suggest improvements without making changes.
```

Check loading warnings. If a skill is missing, check paths, permissions, duplicate registrations, and SKILL.md formatting. For package installations, also check `pi list` and enabled resources in `pi config`. Project configuration may require project trust.

Pi advertises skill names/descriptions and loads detailed instructions when needed. You do not need to load every skill's full instructions at once.

## 3. Enable operational capabilities

**Registering the pack above makes the 89 skills available.** Running their workflows may require additional setup:

| Capability | Separate setup |
|---|---|
| Python scripts | Compatible interpreter; optional libraries in an isolated environment, depending on the script |
| Terraform/cloud | Selected CLI, authentication, correct account/project, and permissions |
| Kubernetes/containers | kubectl or Docker/Compose, configuration, and access to the intended environment |
| Browser testing | Project Playwright package and browsers, or Chrome/Chromium for CDP, depending on the skill |
| Microsoft 365/Google Workspace | Tools, modules, OAuth, and tenant permissions |
| BrowserStack/TestRail MCP | Separate integration installation/configuration, credentials, and review before enabling |

There is no single command that safely installs and authenticates everything. Do not recursively install every `package.json`: the pack contains test fixtures that are not applications to install.

The [dependency guide](docs/DEPENDENCIES.md) distinguishes optional libraries, examples, external services, platform limitations, and checks already performed.

### What is not enabled/included

- The recommended ECC skills and agents have not yet been incorporated.
- Markdown agent definitions do not automatically become Pi subagents.
- Original hooks for other agent environments are not enabled by this pack.
- Snyk Agent Scan and Sage are neither distributed nor installed by this pack.
- No credentials, automatic infrastructure access, or SYSTEM.md/AGENTS.md changes are provided.

## 4. Updates

In your checkout directory:

```bash
git pull --ff-only
```

Review changes before loading them and resolve local modifications deliberately; do not force-overwrite them. Then, inside Pi:

```text
/reload
```

For copies managed directly through a Git source in `pi install`, use the package update mechanism supported by your installed Pi version. Pinned refs do not automatically advance to a new version.

## 5. Security and validation status

The included skills **have not undergone an official security assessment**. Structural, syntax, or licence checks do not guarantee security or complete functionality. Loading in a clean Pi installation and workflows with real dependencies still require testing.

Before executing scripts or actions, review the content, confirm tools and scope, start with read-only diagnosis, and require approval, a rollback plan, and an appropriate maintenance window for production changes. Do not store secrets in skills or this repository.

## 6. Licence and attribution

Upstream content is redistributed under MIT, with notices preserved in [LICENSE](LICENSE), nested licence files, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This is a curated/adapted collection, not a claim of exclusive authorship or official affiliation with upstream authors, Snyk, or Gen Digital.

New local contributions are also distributed under MIT, as authorised by the maintainer. Original component copyright notices remain preserved.
