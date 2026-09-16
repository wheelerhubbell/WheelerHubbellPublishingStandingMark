# Direct acquisition with an existing wallet

No WHP buyer client, account, authentication key or separate preparation call is needed for this acquisition route. An agent uses its existing HTTP/MCP access, owner-authorized EIP-712 wallet and durable job state. This does not provide a wallet, spending authority, source authority or independent verification runtime to an agent that lacks them.

Discover `/v1/contract` through `/.well-known/whp-standing.json` or the MCP `whp_standing_contract` tool. `purchase.direct_wallet` describes the fields below; the signed capability resolution commits that service contract. Existing owner trust and spending policies remain controlling.

Send the actual signed submission to `POST /v1/evaluations`, adding `PAYMENT-PAYER` with the existing wallet address. With MCP, call `whp_standing_evaluation` with `submission_raw` and `payer`. The object, public buyer identity, client reference, SOURCE attestations and TRANSITION warrants are unchanged.

The same HTTP 402 response now supplies `/extensions/whp-standing/info/wallet_checkout`. It contains the exact object's unpaid eligibility observation, durable purchase ID, complete `wallet_request`, signature-return fields and recovery locations. Inspect `eligibility.can_produce_mark` and `failed_checks`. Missing authority is reported there, not silently created. A negative assessment is purchasable, but cannot produce a Mark.

Pass `wallet_request` to the agent's existing owner-authorized wallet. Its method is `eth_signTypedData_v4`; its parameters already contain the payer and complete EIP-712 JSON. The existing wallet/runtime must enforce the owner's network, token, recipient, purpose, per-purchase and aggregate budget before signing. This authorization is the x402 payment signature itself; there is no extra buyer authentication signature or approval added by WHP.

Persist the original submission, purchase ID and returned signature in the agent's existing durable job state before sending. Retry the same evaluation endpoint with the original body, same `PAYMENT-PAYER`, and returned signature as `PAYMENT-WALLET-SIGNATURE`. In MCP, repeat `whp_standing_evaluation` with the original `submission_raw`, same `payer`, and returned `wallet_signature`. The service reconstructs the original quote-bound x402 envelope and uses the existing validation, settlement and durable-result machinery. A complete base64 `PAYMENT-SIGNATURE` envelope remains supported as an alternative; never send both formats.

This is two acquisition requests: submission → 402 → signed payment retry → 200/202. Discovery and independent verification remain distinct operations. There is no additional preparation endpoint or mandatory WHP installation. The optional StandingBuyer package remains available for hosts that want its local quote checks, spending journal and verifier wrapper.

On pending or lost responses, use the returned result/recovery URLs, or `whp_standing_result` and `whp_standing_recover`, with the same purchase ID. If the server still reports QUOTED, resend the identical original signed request. Do not sign a replacement payment, change the client reference or reset the purchase. The authorization is deterministically reconstructed from the durable original quote, not the retry clock. Once recorded, pending recovery can continue after that authorization window expires. An expired authorization that never reached the service is an explicit error, not permission to charge again.

The completed result still uses the frozen independently verifiable Mark/assessment contract. Obtain the registry and use the existing `/v1/verification` procedure with an independently admitted root and trusted chain RPC; service success alone is not independent verification. No change to that verifier or its runtime requirements is implied by removing buyer installation from acquisition.

Compatibility is specifically EIP-712/EIP-3009 EOA signing with 65-byte signatures. Local tests used viem 2.56.3 for real off-chain signing and signature verification, with TEST settlement only. Generic random-nonce x402 SDK compatibility, smart-contract-wallet signatures, LIVE facilitator interoperability, real settlement, and arbitrary outside-agent eligibility are not established by these tests.

The standard signing structures are defined in [EIP-712](https://eips.ethereum.org/EIPS/eip-712) and [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009). WHP's existing exact quote nonce binding remains mandatory.
