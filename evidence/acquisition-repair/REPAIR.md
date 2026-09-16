# Production buyer acquisition repair

Review branch: `repair/production-buyer-acquisition`. Base: `5e5a9dfc45e9b605d37bec433d4b5cfc874af612`, recovered from remote `main` and checked again after verification. No subsequent main commits were present. No existing worktree was edited. This repair is not deployed or merged.

Netlify's observed active deployment was `6aaa66003416ab6db93b8058`, published September 16, 2026 at 09:48:58 UTC to `https://wheelerhubbellpublishingstandingmark.netlify.app`. Its `commit_ref` is null. `deployment.json` records that deployment identity; no exact deployment-to-Git correspondence is asserted.

## Patch

`src/buyer.mjs` reuses StandingBuyer without `clientProof`, the authentication private key, or the private/public buyer-key comparison. The public `buyer_key`, root pin and durable `client_reference` still determine exactly the same frozen purchase identity. Quote verification, submission hash, owner-pinned recipient/asset/network/domain, spending reservations, EIP-3009 quote nonce and independent result verification are retained. Temporary HTTP 408/429/5xx responses after wallet authorization return recoverable PENDING with the original purchase ID and no additional charge. Recovery continues to replay the stored authorization or use the existing result/recovery handlers, never request a replacement signature.

`scripts/buy.mjs` removes `WHP_BUYER_PRIVATE_KEY`. The owner still supplies an authorized EIP-1193 wallet provider, explicit policy, signed object, durable journal and independently trusted RPC. No wallet authority is created.

`src/public-machine.mjs` awaits `evaluateRoute` inside its existing error handler. Existing Fault codes/statuses therefore survive the Netlify wrapper. No new evaluator, settlement handler or result handler was introduced. Provenance attestations/warrants, payment validation, authority certificates, root, schemas, profile, Mark signer and standalone verifier were not changed.

The current acquisition contract now publishes a SHA-256-bound downloadable runtime containing the existing buyer, journal, CLI, verifier and their dependency closure. `scripts/package-buyer.mjs` builds it deterministically; Netlify's build command runs that packaging step. Discovery reaches it through `/.well-known/whp-standing.json` → `contract_url` → `purchase.buyer_client`, MCP's contract tool, and `llms.txt`. The signed capability resolution commits the updated service-contract hash. `public/buyer/README.md` supplies the command, runtime dependencies, required owner inputs and recovery procedure. There are no runtime npm dependencies in the archive; Python requires cryptography and jsonschema. Compatibility remains the WHP exact-quote x402 v2 binding only.

## Targeted local evidence

`targeted-tests.txt` records 8/8 checks passing. These are new connection checks, executed using the actual exported Netlify handler over localhost HTTP. Only `runtimeFromEnvironment` is substituted with the existing TEST fixture's SQLite stores, disposable TEST authority and FakeRail. They do not exercise production PostgreSQL, a real owner wallet, facilitator or chain. The reference buyer is fetched from the locally served discovery contract, extracted into a separate directory and imported from that archive. Its frozen Python verifier runs in separate processes for resolution signatures, result replay and registry verification.

The checks establish specified 400/415 errors before storage/payment; safe internal 503 handling; downloadable buyer and MCP/llms discovery; positive TEST Mark versus negative TEST assessment with null Mark/standing; preservation of the exact signed submission; pending recovery after both SQLite stores reopen; recovery after a lost request and a lost paid response; one wallet-provider invocation and one simulated transfer per purchase; temporary-service pending handling; rejected wrong nonce, changed submission and excessive spending; and unchanged frozen commitments. No acquisition/retrieval/recovery request carries `whp-client-proof`.

Command: `npm run check:acquisition-repair`. In this workspace, Python's missing jsonschema dependency was installed into `/workspace/scratch/14175c52bf7e/python-deps`, supplied through PYTHONPATH. Initial harness setup errors were corrected (missing Python dependency, immutable-contract argument, canonical equality across parser object prototypes); the final evidence records the passing execution. The inherited 129/107/83 suites and simulated propagation were not rerun, and their evidence is unmodified in its historical scope.

## Observed production and authority boundary

`production-observation.json` records September 16, 2026 public responses separately: malformed JSON, empty body, `{}`, and text/plain each still returned 503 before this patch was published. The existing WHP-controlled signed identity record passed a local evaluation against the observed LIVE trust bundle for INFORM in `whp-standing-structured-passage` / `protocol-structural-assessment-only`. One unchanged-object unpaid POST reached 402 without buyer authentication. That observation created only an unpaid quote. No wallet authorization, settlement, issuance or production recovery was executed. A 402 is not proof of any of those later stages.

The active bundle admits an issuer/registry/discovery key and one SOURCE key whose subject is WHP-controlled protocol identity records only, with INFORM. It admits no TRANSITION key. The evaluated object was `urn:whp:standing:controlled-production-contract`, version 1; it cannot represent an outside agent's object.

The remaining outside-object dependency is an existing-root-signed SOURCE admission for the actual object's signing key, bounded to its scope, jurisdiction, operations, profile and validity interval, together with that exact source attestation. If the object contains COPY/COMPOSE transitions, the exact warrants also need a legitimately admitted TRANSITION signer within those bounds. No outside object or signer was supplied in this task, and none is admitted by the recovered active bundle. Its key ID and object-specific authorization cannot be invented. No authority was granted, root rotated or evaluation weakened.

Publication remains separate. The branch contains the reviewable implementation and evidence; main and production are unchanged. LIVE payment and recovery remain unexecuted by instruction.
