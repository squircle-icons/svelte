# Release audit — 0.1.0-alpha.5

What this repo does: Core provides artwork and Svelte packages it as native components. This change adds automatic npm publication after the existing GitHub quality and compatibility jobs pass. Expected use is one project releasing occasional new versions from main.

## Scope

Work starts from the already published alpha.4 source, commit 9ebc27773f8ff294953771e1d6b8add51bf9e509, in an isolated checkout. Ongoing design work, Core, Homepage and the private local Lab are not included. Version alpha.5 validates the publishing pipeline; all 528 runtime/declaration/catalog/license files match the published alpha.4 archive byte for byte. Only package metadata and README differ in the public payload.

## Release controls

- Pull requests and other branches cannot produce release outputs or request npm publication.
- Publication needs the successful quality job and both consumer compatibility jobs. The static artwork approval gate runs before a release artifact is uploaded.
- Only the publish job can request an OIDC identity. Its npm environment allows the main branch only. No permanent npm token is stored.
- The publisher downloads the same archive tested by the quality job and checks its SHA-512 against that job's output. It does not rebuild or run package lifecycle scripts with publishing rights.
- It confirms the checked revision is still main, serializes releases and waits for npm processing before verifying public integrity and changing tags.
- An existing version with different bytes is skipped during release preparation. A retry can repair tags only for an identical archive. HTTP errors, malformed registry data and network errors stop the release.
- Both alpha and latest are set through OIDC, then checked against npm's authoritative tag endpoint.

## Verification

- Full verification passed: formatting, provenance, deterministic generation, types, build, 41 existing unit/fault cases, six new release-control cases, bundle/import isolation, packed consumer and 411 Chromium/Firefox/WebKit cases.
- The compatibility consumer compiles all 247 component exports for client/server, checks declarations and exercises hydration and morph targets. GitHub retains both exact consumer runtime jobs.
- Release approval passes for all 121 static icons and styles in this published-source checkout.
- Official actionlint 1.7.12, downloaded with a verified release checksum, reports no workflow errors.
- The release-status command against the public registry correctly identifies alpha.5 as unpublished. Unit tests cover a missing version, exact-archive retry, a different existing payload, HTTP/network errors, malformed data and invalid release metadata.
- First real OIDC publication must be verified after the one-time npm trusted-publisher configuration and merge. This report does not treat a dry run as proof of npm authorization.

Verdict: Local release and workflow checks pass. Ready for GitHub CI, the one-time npm publisher grant and the first end-to-end OIDC release.

Not checked: Actual OIDC publication before npm authorizes the workflow, real mobile hardware, new artwork or unrelated local design work. The existing consumer platform scope is unchanged.
