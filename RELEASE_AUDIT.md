# Release audit — 0.1.0-alpha.6

What this repo does: Core provides artwork and Svelte packages it as native components. This release adds a GitHub Release after the existing automatic npm publication. Expected load is one repository releasing occasional package versions.

## Scope

Work starts from GitHub main commit 77849b3ff10b432335bee0ba9f8efc642a6e6296 in an isolated checkout. Core, Homepage, the private local Lab and concurrent local artwork/morph work are excluded. All 528 runtime, declaration, catalog and LICENSE files match published alpha.5 byte for byte. Public payload changes are package metadata and README only.

## Release controls

- The GitHub Release job depends on a successful npm job and its verified-version output. Failed publication, integrity or distribution-tag checks cannot trigger a release.
- Only the final GitHub Release job has contents write permission. It uses GitHub's temporary workflow token, without npm OIDC permission or a new permanent secret.
- The helper checks published package identity and integrity against the tested archive. It obtains the original publishing commit from npm provenance and validates the package subject, digest, repository, main ref and workflow path.
- It reserves the exact source tag before creating a release. Existing lightweight or annotated tags must resolve to the published commit; conflicting tags are never moved. Recursive tag reads are bounded.
- Release titles equal package versions; Git tags have a v prefix. Alpha versions are prereleases. Existing releases and maintainer-written notes are retained; conflicting titles, drafts or release types fail explicitly.
- Releases are serialized. Reruns recover both a created tag without a release and a created release whose response was lost. HTTP errors and network failures are not treated as missing resources.
- Optional report uploads now include the explicitly listed files under the hidden .artifacts directory, correcting the earlier compatibility-report warnings.

## Verification

- Full application verification passed: formatting, source provenance, deterministic generation, types, build, 41 existing unit/fault cases, bundle/import isolation, packed consumer, compatibility consumer and all 411 Chromium/Firefox/WebKit cases.
- Nineteen release-control tests pass, including new-release creation, prerelease/stable classification, exact original source tags, annotated tags, retries after lost responses, conflicting tags/drafts/titles and fail-closed registry/API errors.
- The static release approval gate passes for all 121 icons and their styles. Consumer requirements and public exports are unchanged.
- Official actionlint 1.7.12 reports no workflow errors.

Verdict: Local validation passes. The final delivery must also confirm real npm publication, the generated GitHub Release and its tag against npm provenance after GitHub main CI succeeds.

Not checked at this preflight stage: Real GitHub Release creation before the workflow runs, historical backfills with changed workflow permissions, real mobile hardware or unrelated local design work.
