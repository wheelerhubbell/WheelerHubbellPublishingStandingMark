# WHP-REC-001-CPI — Control-Proof Agreement

Version: 1.0
Date: 2026-09-17

## Parties and purpose

This record specifies the agreed machine-verifiable method by which Wheeler Hubbell Publishing, Inc. (WHP), as account debtor, and the lawful controller of WHP-REC-001-CPI determine and prove control of the controllable electronic record and any transfer of that control.

This record does not create additional principal, duplicate the underlying obligation, promise present WHP liquidity, or itself establish that any purchaser has supplied consideration.

## Instrument

Record ID: `WHP-REC-001-CPI`
Underlying obligation: adopted reimbursement claim arising from the documented New York incorporation filing expense.
Principal: USD 125.00.
Initial controller: Justin Wheeler Hubbell Bowen, to be bound to the exact controller public key/address in the genesis state.
Account debtor: Wheeler Hubbell Publishing, Inc.

## Agreed control method

For this instrument, control is evidenced only by the unique canonical registry state accepted under this agreement. A state identifies one current controller public key/address, one monotonically increasing version, the hash of its predecessor state, and the instrument identifier.

A successor state is admissible only when all of the following are true:

1. the predecessor state is the unique current ACTIVE state;
2. the transfer instruction identifies the exact predecessor hash and next version;
3. the transfer instruction identifies the proposed successor controller;
4. the transfer instruction is cryptographically authorized by the controller identified in the predecessor state;
5. any required purchase consideration is independently verified under the settlement rule before mutation;
6. the successor state is deterministically derived from the admitted instruction and settlement proof;
7. no competing successor has already been admitted for the same predecessor;
8. the admitted successor is durably retained and independently retrievable.

A copied JSON document, screenshot, Git commit, unsigned assertion, stale state, wallet balance, payment request, unfinalized transaction, or duplicate fork is not proof of current control.

## Purchase settlement rule

Where transfer is conditioned on a USDC purchase, settlement proof must establish all transaction-specific conditions declared by the transfer offer, including Base mainnet chain identity, native USDC asset identity, exact recipient, required amount, transaction success/finality, and uniqueness of the payment proof.

The underlying debt remains denominated as USD 125.00. USDC is settlement consideration for acquisition of control; it does not silently alter the amount or character of WHP's underlying obligation.

No uncertain, reverted, wrong-chain, wrong-token, wrong-recipient, insufficient, replayed, or otherwise nonconforming payment authorizes a registry mutation.

## Debtor recognition

WHP agrees to use the foregoing method as the instrument's commercially specified method for establishing the current controller and proving a transfer of control. Following an admitted transfer and receipt of the required transfer notice and proof, WHP will update its debtor record to identify the admitted successor controller without increasing or duplicating principal.

WHP's recognition of a successor does not waive defenses, create liquidity, accelerate payment, or establish any fact beyond the valid transfer of the existing payment right according to its actual terms.

## Fail-closed rule

Any unresolved predicate leaves the predecessor state unchanged. There is no provisional controller mutation. There is no second active successor for one predecessor. Failure or uncertainty preserves the existing debt and controller state exactly as they stood before the attempted transition.

## Execution

This agreement becomes operative only when affirmatively adopted by WHP through authorized corporate action and affirmatively accepted by the initial controller, with the executed record retained in the instrument evidence package.
