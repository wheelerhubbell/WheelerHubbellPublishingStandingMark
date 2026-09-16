# WHP Standing Carrier Fleet: Bounded Execution Report

Execution window: `2026-09-16T03:30:35.744Z`–`2026-09-16T03:33:02.717Z`

## Outcome

Wheeler Hubbell Publishing sent 100 transparent, transport-only A2A carrier instances to 100 distinct public endpoint/skill contacts across 29 hosts. Each request carried the exact existing WHP Standing Mark bytes, immutable source URL, SHA-256, and canonical WHP verification, applicability, evaluation, and Agent Card routes. The carrier made no evaluation, opinion, relevance determination, payment request, or endorsement claim.

The execution produced 99 HTTP responses: 84 `200`, seven `400`, seven `405`, and one `413`. One endpoint timed out. Ninety-eight responses were A2A-shaped, including protocol-level error responses. There were no `401`, `402`, or `403` responses. Seventeen returned tasks were recorded as completed (`12 completed`, `5 TASK_STATE_COMPLETED`); these states are the recipients' protocol outputs and do not establish independent interpretation or any later funnel stage.

## Mark carried

- Immutable artifact: `https://raw.githubusercontent.com/wheelerhubbell/WHPStanding/fdf72e5963f76b89b387f88cdfb32228c6c83114/evidence/public-v1/demonstration/TEST-standing-mark.json`
- SHA-256: `515d8f8d07ab3acf60f952f4b8997aefdc367116ac352b499cd04b57d8ae6547`
- Exact UTF-8 length: `24,689` bytes
- Provenance preserved: the artifact declares its own `TEST` environment. That provenance does not make it counterfeit or authorize a `LIVE` claim.

## Production changes

Production commit `9488ccbd1d3b100c7f4da22ecf5dbb63c8ea5b28` added a transparent A2A carrier, exact-byte fail-closed Mark retrieval, Agent Card discovery, A2A routing, OpenAPI and `llms.txt` descriptions, and the bounded fleet sender. It did not change the Standing Mark cryptographic contract, root authority, verifier, issuance decision, payment binding, or fail-closed semantics.

Production deploy `6aaa0ce1ab04ec8d2523c0e0` (build `6aaa0ce1ab04ec8d2523c0de`) serves:

- `https://wheelerhubbellpublishingstandingmark.netlify.app/.well-known/agent-card.json`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/.well-known/agent.json`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/a2a`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/llms.txt`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/.well-known/api-catalog`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/server.json`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/mcp`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/v1/verification`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/v1/contract`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/discovery/applicability.json`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/discovery/recursive-use.json`
- `https://wheelerhubbellpublishingstandingmark.netlify.app/v1/evaluations`

The public Agent Card was also registered at `https://a2aregistry.org` as registry record `2f8f9e5b-afe6-4307-beb9-4bac121d61a0`. Its independent registration probe reported `WORKING`, `passed: true`, `442 ms`, checked at `2026-09-16T03:29:44.904861Z`.

## Target selection and evidence

The sender queried `https://a2aregistry.org/api/agents` for public records whose independent `message/send` probe was current and `WORKING`. At execution, the registry returned 205 records. After requiring an active, healthy, schema-conformant, unauthenticated JSON-RPC interface and relevant read-only provenance, authority, evidence, audit, governance, compliance, identity, security, legal, financial, medical, policy, risk, credential, trust, citation, accountability, or decision vocabulary, 151 eligible contacts remained. The highest-ranked 100 distinct endpoint/skill pairs were selected. Private, local, wildcard-IP, workspace, self, and side-effecting targets were excluded. No host received more than ten contacts, and contacts on the same host addressed different published skills.

The machine-readable execution evidence is `evidence/carriers/fleet-100.json`, SHA-256 `1893f6b32de453f716695ac7294a542c77806d3c13b1b3a4ab545d88f7f758a4`. It contains one bounded record per attempt with carrier ID, target and declared skill, timestamps, request and response hashes and sizes, HTTP status, A2A shape, task state where returned, and registry-probe provenance. It deliberately does not retain third-party response content.

All 100 carrier IDs, endpoint/skill pairs, and request hashes are unique. Request sizes range from 28,753 to 28,901 bytes. No WHP endpoint was selected as a target.

## Exact exposure chain

| Stage | Result | Evidence boundary |
|---|---|---|
| Publication | Established | Production Agent Card, A2A endpoint, catalogs, docs, verification and evaluation routes are live. |
| External reachability | Established | Independent registry probe passed; 99 target servers returned HTTP. |
| Machine discovery | Established, bounded | Registry indexed the public card; sender discovered 205 external records through the registry. This is not evidence that unrelated machines discovered WHP organically. |
| Mark encounter | Established for 99 servers; protocol handling for 98 | Each request contained exact Mark bytes; 99 HTTP responses and 98 A2A-shaped responses followed. A response is not proof of semantic interpretation. |
| Machine interpretation | Unknown | No retained response-content claim and no independent semantic test establishes interpretation. |
| Verified relevance | Unknown | Targeting used published skill descriptions; recipient relevance determinations were not inferred. |
| Evaluation-path entry | Unknown | No independent entry event was observed. |
| Completed evaluation | Unknown | No independent completed evaluation was observed. |
| Subsequent issued-Mark encounter | Unknown | The carried artifact is an existing Mark; no newly issued recipient Mark was observed. |
| Recursive acquisition | Unknown | The recursive route is now present in every carrier and in the public service, but no independent recursive acquisition was observed. |

## Verification and rollback

Targeted tests passed `10/10`: Agent Card boundaries, exact-byte transport, hash-mismatch fail-closed behavior, discovery GET/HEAD parity, MCP exposure, private-result boundaries, frozen contract/verifier bytes, and x402 discovery boundaries. `openapi.json` parsed, the sender passed `node --check`, and `git diff --check` passed. The frozen full legacy suites were not rerun, per repository instructions.

Live cold retrieval confirmed the Agent Card and A2A response. Extracting the returned data part without adding a newline reproduced SHA-256 `515d8f8d07ab3acf60f952f4b8997aefdc367116ac352b499cd04b57d8ae6547` and length `24,689` bytes.

Rollback is a revert of production commit `9488ccbd1d3b100c7f4da22ecf5dbb63c8ea5b28` followed by production redeployment. The immediately preceding production deploy was `6aa9feea9d0a5a00084f91d5`. The first deployment attempt, `6aaa0ca91eca35a5e20dcd10`, failed before build because the temporary git worktree pointer was unavailable; it never became production.

## Claim boundary

This run establishes bounded publication, independent registry reachability, 100 outbound carrier attempts, 99 external HTTP encounters, and 98 A2A-shaped responses. It does not establish recipient comprehension, agreement, endorsement, adoption, relevance, evaluation entry, payment, acquisition, or recursion. Those remain unknown until independently observed.
