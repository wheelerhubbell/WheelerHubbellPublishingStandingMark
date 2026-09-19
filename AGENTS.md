# WHP Standing open acquisition

Justin's September 16 directive controls: open entry, truthful bring-your-own authority, ordinary owner-authorized x402 and recursive discovery. Completion requires one actual full `A → Mark A → B → Mark B` chain with published evidence and enduring provenance. This repository is designated as the committed-source authority for the production deployment target.

Read `docs/OPEN-ACQUISITION-v1.1.md` before changing this candidate. New semantic rules are explicitly versioned v1.1. Preserve the historical v1 profile, contract, schema, verifier bytes, result bundles and release evidence as pinned artifacts. Do not present older reports as new candidate evidence.

The public buyer contract requires no buyer Ed25519 key, WHP proof, registration or StandingBuyer installation. Provenance signatures and owner wallet authorization remain distinct. Preserve every signed public authority artifact and keep any change in authority scope explicit.

Run the executable open-acquisition gate for changes to these relationships. Existing v1 129/107/83 reports remain historical at their pinned commits. Do not present them as new candidate evidence.

Justin explicitly authorized deploying the signed version before the real paid chain can execute. Deployment requires matching existing-root authorization and the complete executable TEST acquisition gate. The GitHub Action in `.github/workflows/deploy-netlify.yml` performs this verification automatically on pushes to `main` and supports manual dispatch when needed.

Justin now authorizes automatic deployment to his new Netlify account. The runtime uses the configured `WHP_ORIGIN` or Netlify URL. The prior origin `https://wheelerhubbellpublishingstandingmark.netlify.app` remains historical; production is targeted to the configured site and exact committed tree, not to previous manual deployment state.

