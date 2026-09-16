# Direct wallet acquisition — continuation of the buyer repair

Base repair: `8517c539344e93abf34a1e682453b1e1099467ed`, on `repair/production-buyer-acquisition`. Remote main remained `5e5a9dfc45e9b605d37bec433d4b5cfc874af612` when this continuation began. The earlier acquisition-repair evidence remains historical and unmodified. This continuation is not merged or deployed.

## What changed

An agent with an existing owner-authorized EIP-712 wallet can now acquire through the ordinary submission → 402 → signed-payment retry → result/pending sequence without downloading StandingBuyer, installing a WHP package, creating a WHP authentication key, opening an account, or calling a separate prepare endpoint.

The original unpaid POST includes the payer address as `PAYMENT-PAYER` (MCP: `payer`). The same 402 body exposes the complete `eth_signTypedData_v4` request and the exact object's unpaid eligibility observation. The agent applies its existing owner policy, obtains the normal wallet payment signature, saves the original request and signature in its ordinary durable job state, and retries the same endpoint with `PAYMENT-WALLET-SIGNATURE` (MCP: `wallet_signature`). This is the payment signature, not an additional authentication signature. The standard full base64 PAYMENT-SIGNATURE alternative remains supported; mixed formats fail closed.

`src/wallet-checkout.mjs` reuses StandingBuyer's EIP-712 type definition and the unchanged payment nonce function. It reconstructs authorization times from the original durable quote, so retries cannot silently generate new payment terms. `src/public-machine.mjs` passes that reconstructed envelope into the existing exact-payment validation, facilitator, reservation, settlement, result and recovery code. No authority, result schema, Mark envelope, verifier, evaluator, store, source signature or transition signature is replaced.

The same MCP evaluation tool advertises these optional inputs. The new MCP recovery tool exposes the already existing empty-POST recovery handler by purchase ID. The contract, generated OpenAPI and llms text expose the path. `public/direct-wallet.md` documents its exact scope. The optional reference buyer remains usable.

Before signing, the agent receives `eligibility.can_produce_mark` and exact failed rule/object pairs. This reports current evaluator output for the actual submitted graph; it does not admit a source or promise favorable issuance. A buyer can still purchase a negative assessment, which produces no Mark. Payment remains under the buyer's own purpose and spending policy, not the merchant's authority.

## New targeted execution

`targeted-tests.tap`: four new checks passed, with the real exported Netlify handler running over local HTTP and only production runtime dependencies replaced by TEST fixtures. The client side uses fetch/JSON and an existing viem 2.56.3 wallet, without importing or downloading StandingBuyer. It performs real EIP-712 signing with a disposable TEST key. The TEST rail independently verifies the signature with viem before simulating settlement. No chain RPC, real facilitator, funds or LIVE key is used.

The HTTP purchase used exactly two acquisition requests and one wallet signature. The frozen standalone Python verifier accepted the resulting TEST Mark and fresh registry; retrieval returned identical bytes. MCP exposed both the wallet inputs and recovery tool. Pending settlement survived the service store reopening and recovery after the original authorization window expired, with one signature and one simulated transfer. Replaying a signed request after a lost/uncertain result returned the original result. Missing SOURCE admission appeared before payment and produced only a verified negative assessment. Owner-budget refusal, altered nonce signatures, mixed payment formats, changed submission and expired unpaid authorization all stopped without settlement. Repeating an unpaid request returned the same wallet message rather than minting a new authorization.

Command: `WHP_TEST_WALLET_PACKAGE=/workspace/scratch/a7472929518d/dip-verification/node_modules/viem/package.json PYTHONPATH=/workspace/scratch/14175c52bf7e/python-deps npm run check:direct-wallet`. The environment variable locates an already installed test wallet library; it is not part of the service or buyer deployment. With viem installed in the testing environment, that override is unnecessary. Python uses the previously installed verifier dependencies.

The historical 129/107/83 suites and propagation were not rerun. The previous eight connection checks remain evidence for their previous commit, not a claim of twelve newly executed checks here. Frozen profile, contract and verifier commitments were checked unchanged.

## Remaining boundary

This removes the mandatory WHP buyer installation from acquisition for a machine that already has the required wallet capability and owner policy. It does not turn an agent without a wallet, funds, durable state, independent verifier/runtime or legitimate object authority into an eligible buyer. Generic random-nonce x402 SDKs and smart-contract-wallet signatures are not claimed compatible. Existing EIP-712/EIP-3009 EOA signatures are the demonstrated transport boundary.

The previously observed LIVE bundle still supplies only WHP-controlled SOURCE identity authority for INFORM, with no TRANSITION authority. No outside object's legitimate admission was supplied or created in this continuation. A positive outside-object Mark still requires that object's narrowly scoped existing-root SOURCE admission and, for a COPY/COMPOSE graph, legitimate TRANSITION admission/warrants. The payment adapter cannot supply those authorizations. Production behavior, LIVE settlement, LIVE recovery, actual outside-agent cold interpretation and arbitrary outside-object eligibility remain unexecuted/unestablished.

The transport uses the existing standard signing structures from [EIP-712](https://eips.ethereum.org/EIPS/eip-712) and [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009); the frozen WHP quote binding is preserved. Local signatures and TEST results do not establish a live sale.
