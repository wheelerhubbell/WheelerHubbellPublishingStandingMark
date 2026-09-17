# WHP-REC-001-CPI

## Controllable Payment Intangible / Electronic Record specification

Status: DRAFT IMPLEMENTATION — NOT YET OFFERED OR TRANSFERRED
Date: 2026-09-17
Jurisdiction declaration: New York

## 1. Purpose

This object is intended to evidence one existing $125 reimbursement obligation of Wheeler Hubbell Publishing, Inc. (WHP) to Justin Wheeler Hubbell Bowen and to provide machine-verifiable control and transfer mechanics. It does not create a second obligation, increase principal, create money, guarantee liquidity, or represent that a purchaser exists.

The design targets New York UCC Article 12's rules for a controllable electronic record evidencing a controllable payment intangible. Legal characterization depends on the actual underlying obligation and satisfaction of applicable law; this specification does not declare its own legal effectiveness by fiat.

## 2. Underlying obligation

Instrument ID: WHP-REC-001-CPI
Account debtor: Wheeler Hubbell Publishing, Inc.
Creditor at genesis: Justin Wheeler Hubbell Bowen
Principal: USD 125.00
Origin: reimbursement of the New York Department of State incorporation filing expense adopted by WHP on 2026-09-17.
Debt conservation rule: exactly one $125 principal obligation exists. Creating, copying, serving, hashing, or transferring this electronic record does not duplicate or enlarge that obligation.

## 3. Record model

Canonical JSON MUST include:
- version
- record_id
- jurisdiction
- account_debtor identity
- underlying_obligation identity and principal
- controller identity
- controller key type and public identifier
- genesis evidence hashes/locators
- transfer-proof method agreed by debtor and controller
- current state/version
- prior state hash
- status

Principal is represented as 12500 USD cents for the legal obligation. A sale may settle in native USDC on Base, but USDC is purchase consideration and is not silently substituted for the denomination of the underlying debt.

## 4. Control

The system MUST satisfy the functional requirements of NY UCC 12-105 rather than merely placing an address in JSON.

The controller must have:
1. power to avail itself of substantially all benefit of the electronic record;
2. exclusive power, subject to applicable statutory rules, to prevent others from availing themselves of substantially all benefit;
3. exclusive power to transfer control or cause another person to obtain control; and
4. a readily identifiable controller identity, which may include a cryptographic key.

A static GitHub file alone is NOT treated as sufficient control.

## 5. Transfer-proof agreement

Before any Article 12 debtor notification is relied upon, WHP and the then-controller MUST have a signed record agreeing to a commercially reasonable method for proving transfer of control, consistent with NY UCC 12-106(d)(1).

Initial method:
- canonical state hashes;
- controller ECDSA signature;
- Base address identity;
- append-only transition record;
- independently retrievable prior/current states;
- proof that the transferee can obtain substantially all benefit, exclude prior controllers from that benefit, and transfer those powers onward.

This method remains subject to legal review before LIVE transfer.

## 6. Sale / settlement protocol

Target settlement network: Base mainnet (eip155:8453)
Target purchase consideration: native USDC
Native Base USDC contract: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
Seller: current controller
Buyer: independently controlled buyer address

Sequence:
1. Buyer obtains exact immutable instrument state and evidence manifest.
2. Buyer independently verifies account debtor, principal, provenance, current controller, jurisdiction, and transfer terms.
3. Buyer submits a purchase intent binding price, seller address, buyer address, chain, token, nonce, expiry, and instrument state hash.
4. Buyer transfers the agreed USDC purchase price to the seller.
5. Settlement verifier independently confirms finalized exact-chain transfer.
6. Current controller signs a transfer instruction binding the confirmed USDC transaction hash, buyer identity, prior state hash, and new state hash.
7. Registry accepts exactly one valid transition from the prior state and makes the buyer the current controller.
8. Prior controller can no longer produce an accepted successor state.
9. Debtor notification is produced under the agreed proof method.
10. WHP records the transferee and future discharge instructions without changing principal.

A failed, pending, reorged, mismatched, or uncertain payment MUST NOT transfer control.

## 7. Debtor discharge

WHP's $125 obligation remains one obligation after transfer. The transfer changes the person entitled to payment; it does not create new debt.

Notification must satisfy applicable NY UCC 12-106 requirements, including reasonable identification of the payment intangible, transfer notice, transferee identification, and a commercially reasonable payment method.

The protocol MUST preserve the statutory proof-of-transfer mechanism and must not claim that an automated event alone eliminates requirements imposed by law.

## 8. Purchase price

Principal and purchase price are distinct.

Principal: $125.00 owed by WHP.
Purchase price: consideration voluntarily agreed between seller and buyer for transfer of the payment right. It may be at par or at a discount. The protocol does not assert that the claim is worth par to a purchaser and does not require par pricing.

## 9. No false claims

The implementation MUST NOT state any of the following unless separately established:
- that WHP currently has $125 available to pay;
- that the instrument is a security or is not a security;
- that a purchaser is guaranteed repayment;
- that transfer is risk-free;
- that Article 12 overrides Article 9;
- that the instrument is a negotiable instrument under Article 3;
- that tokenization itself creates liquidity;
- that Coinbase, Base, Circle, or any facilitator endorses or guarantees the obligation;
- that the record is LIVE before control, debtor-proof agreement, transfer, and settlement mechanics are actually implemented and verified.

## 10. Existing WHP infrastructure reuse

The implementation MAY reuse existing WHP Standing primitives for canonicalization, hashing, durable retrieval, cryptographic signatures, immutable artifacts, Base/USDC verification, discovery, and fail-closed state transitions.

It MUST NOT reuse WHP Standing semantics in a way that implies a Standing Mark validates creditworthiness or legal enforceability. Standing and payment-right control remain separate objects.

## 11. Completion test

The prototype is technically complete only when an independent verifier can demonstrate:
- one genesis obligation;
- one current controller;
- deterministic canonical state;
- no accepted double transfer from one state;
- finalized Base USDC purchase consideration;
- transfer bound to that settlement;
- buyer becomes sole accepted controller;
- prior controller loses accepted transfer authority;
- debtor notification is generated from the accepted transition;
- principal remains exactly $125 throughout.

LIVE economic completion requires a real independent purchaser and real USDC settlement. A self-transfer or WHP-funded circular purchase does not satisfy that terminal condition.
