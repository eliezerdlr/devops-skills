# Ghidra operating checklist (local adaptation)

- Confirm release-specific prerequisites; source checkout build requirements are not package dependencies. No runtime is bundled or automatically downloaded.
- Prefer fresh local projects and reviewed explicit script paths. Inspect default user script/plugin discovery and isolate the home/config environment; a script path alone is not a sandbox.
- In import mode, -readOnly avoids saving imported programs; in process mode it discards project/program changes. It is not an OS sandbox. Scripts can still write files, spawn processes or access the network.
- Auto-analysis is on by default. -analysisTimeoutPerFile bounds analysis only: post-scripts can still run, and earlier analyzer output can survive. Detect and disclose partial results. Use an outer timeout covering scripts and child processes.
- -max-cpu limits CPU parallelism, not memory/disk. Apply OS quotas externally.
- Do not use -overwrite, -okToDelete, shared ghidra:// projects or remote commits by default. Review persistence before any approved use; delete options can be permanent.
- Version Tracking: correlators score associations; false/conflicting matches require analyst inspection. Applying markup changes project data. Work on copies.
- PyGhidra is optional CPython/JPype/JVM automation, version-matched to Ghidra. It is not an installed Pi API. Review scripts; its script API can echo stdout/stderr, so bound and sanitize output before exposing it to a model.
- Preserve evidential originals/hashes, limit logs and decompiled exports, and agree retention/cleanup. No live credentials, cloud connections or sample execution.
- Validation should start with an approved benign fixture in isolation. No real runtime behavior, platform compatibility, containment or performance has been established by offline documentation tests.
