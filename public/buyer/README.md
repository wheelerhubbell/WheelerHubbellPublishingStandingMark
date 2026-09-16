# StandingBuyer acquisition

The reference buyer is reachable from `/.well-known/whp-standing.json` → `contract_url` → `purchase.buyer_client`. The same contract is available through the MCP `whp_standing_contract` tool. `llms.txt` also links here. It uses the existing `StandingBuyer`, durable SQLite journal and standalone Python verifier.

Read the signed capability resolution and verify its service-contract hash using the independent verifier and your independently admitted root policy. Download `purchase.buyer_client.url`; verify the archive's SHA-256 against `purchase.buyer_client.sha256` in that verified contract before extracting it. Review/execute downloaded code only in your approved artifact sandbox. Extract with `tar -xzf standing-buyer.tar.gz -C BUYER_DIRECTORY`. The archive contains no wallet, secret keys, sample authority, or spending allowance.

Runtime requirements: Node >=22.16.0 with `node:sqlite`; Python >=3.11 with `cryptography` and `jsonschema` installed (`python3 -m pip install cryptography jsonschema` in your approved Python environment). No npm install is needed for the buyer archive. The packaged Python verifier's bytes match the frozen verifier hash.

Supply a policy JSON with these owner-approved fields:

```json
{
  "environment": "LIVE",
  "origin": "OWNER_APPROVED_SERVICE_ORIGIN",
  "root_pin": "INDEPENDENTLY_ADMITTED_ROOT_SHA256",
  "profile_hash": "4244be9ed0012eaeba8e2efeb9d274ad3c1f3e188748838c191129054d24c5ab",
  "network": "eip155:8453",
  "asset": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "pay_to": "0x1050eddd8282623b0c263ed6bdbd42370bbc28d3",
  "payer": "OWNER_AUTHORIZED_WALLET_ADDRESS",
  "asset_name": "USD Coin",
  "asset_version": "2",
  "max_per_purchase": "OWNER_APPROVED_INTEGER_BASE_UNITS",
  "max_total": "OWNER_APPROVED_INTEGER_BASE_UNITS"
}
```

These placeholders deliberately grant no authority. Confirm the origin, root, recipient, asset, payer and spending limits under the owner's existing policy. The server's proposal does not grant wallet authority. `OWNER_PROVIDER.mjs` must default-export the owner's existing authorized EIP-1193 provider implementing `request({method:'eth_signTypedData_v4',params:[payer,typedDataJson]})`. The buyer creates no wallet and funds none.

`SUBMISSION.json` must contain the actual object and its distinct signed SOURCE attestations and any separately authorized TRANSITION warrants. Preserve the existing `buyer_key` (base64 Ed25519 SPKI public identity) and `client_reference`; together with the root pin they identify this purchase. No buyer authentication signature or buyer authentication private key is required. Source and transition signatures remain required provenance; the payment signature remains a separate wallet authorization.

For positive standing, the actual SOURCE signer must be admitted for the exact scope, jurisdiction, operations and validity window. Any COPY/COMPOSE passage also needs an admitted TRANSITION signer and exact signed warrant. WHP's controlled protocol identity record is authority only for that record, not a substitute for an outside object. Payment purchases an evaluation: a negative assessment produces no Mark.

Set `WHP_BUYER_RPC_URL` to an independently trusted HTTPS Base RPC. From the extracted directory run:

```sh
node scripts/buy.mjs POLICY.json SUBMISSION.json OWNER_PROVIDER.mjs JOURNAL.sqlite OUTPUT.json
```

The buyer discovers trust, submits unchanged JSON, checks the signed 402 quote, reserves the permitted budget, signs one quote-bound EIP-3009 authorization and journals it before sending payment. The nonce binds the complete signed quote payload. This is WHP's exact-quote x402 v2 profile; generic random-nonce x402 compatibility is not claimed.

On a completed response, the buyer checks purchase/submission/quote identity and runs the independent Python verifier with fresh registry data and the owner's RPC. The verified result may be a Mark or a negative assessment; `VERIFIED` does not mean positive standing.

On an interruption or pending response, resume the exact same command with the same policy, submission and journal. Recovery uses GET result, empty POST recovery, or replays the identical journaled authorization if the original POST was never recorded. It does not sign another payment. Do not replace the journal, public buyer identity or client reference to work around uncertainty. `WHP_BUYER_MAX_WAIT_SECONDS` sets the polling deadline (default 1800); exit code 2 leaves a durable pending purchase to resume. An expired unpaid quote or a policy/authority refusal stops for explicit resolution; it does not generate a replacement purchase.

The package and local TEST checks establish executable connections, not evidence of a LIVE payment, issuance, sale or outside-object authority.
