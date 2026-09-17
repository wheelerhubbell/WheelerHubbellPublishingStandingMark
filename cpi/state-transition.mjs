import crypto from 'node:crypto';

export const RECORD_ID='WHP-REC-001-CPI';
export const NETWORK='eip155:8453';
export const USDC='0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
export const PURCHASE_AMOUNT_ATOMIC=125_000_000; // 125 native USDC, 6 decimals

export function canonical(value){
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export function sha256(value){return crypto.createHash('sha256').update(typeof value==='string'?value:canonical(value)).digest('hex');}
function fail(code){const e=new Error(code);e.code=code;throw e;}
function requireTrue(v,code){if(!v)fail(code);}

export function transferPayload(current,intent,settlement){
  return {
    domain:'WHP-CPI-TRANSFER-v1',record_id:RECORD_ID,
    predecessor_hash:sha256(current),next_version:current.version+1,
    successor_controller:intent.successor_controller,
    settlement_tx:settlement.tx_hash,
    settlement_amount_atomic:settlement.amount_atomic,
    nonce:intent.nonce
  };
}

/**
 * verifySignature(payload, signature, controller) must independently recover/verify
 * the predecessor controller. verifySettlement(proof) must independently verify
 * finalized Base receipt/log data; caller-supplied fields alone are never proof.
 */
export async function transition({current,intent,signature,settlement,registry,verifySignature,verifySettlement}){
  requireTrue(current?.record_id===RECORD_ID,'RECORD_ID_MISMATCH');
  requireTrue(current.status==='ACTIVE','PREDECESSOR_NOT_ACTIVE');
  requireTrue(Number.isInteger(current.version)&&current.version>=0,'VERSION_INVALID');
  requireTrue(intent?.predecessor_hash===sha256(current),'PREDECESSOR_HASH_MISMATCH');
  requireTrue(intent?.next_version===current.version+1,'NEXT_VERSION_INVALID');
  requireTrue(typeof intent?.successor_controller?.identifier==='string'&&intent.successor_controller.identifier.length>0,'SUCCESSOR_INVALID');
  requireTrue(typeof intent?.nonce==='string'&&intent.nonce.length>=16,'NONCE_INVALID');
  requireTrue(!await registry.hasSuccessor(sha256(current)),'COMPETING_SUCCESSOR_EXISTS');
  requireTrue(!await registry.hasNonce(RECORD_ID,intent.nonce),'NONCE_REPLAY');

  const proof=await verifySettlement(settlement);
  requireTrue(proof?.finalized===true,'SETTLEMENT_NOT_FINAL');
  requireTrue(proof.network===NETWORK,'WRONG_NETWORK');
  requireTrue(String(proof.asset).toLowerCase()===USDC,'WRONG_ASSET');
  requireTrue(proof.amount_atomic===PURCHASE_AMOUNT_ATOMIC,'WRONG_AMOUNT');
  requireTrue(String(proof.recipient).toLowerCase()===String(intent.seller_recipient).toLowerCase(),'WRONG_RECIPIENT');
  requireTrue(typeof proof.tx_hash==='string'&&proof.tx_hash.length>0,'SETTLEMENT_TX_MISSING');
  requireTrue(!await registry.hasSettlementTx(proof.tx_hash),'SETTLEMENT_REPLAY');

  const payload=transferPayload(current,intent,proof);
  requireTrue(await verifySignature(payload,signature,current.controller),'CONTROLLER_SIGNATURE_INVALID');

  const successor={
    schema_version:'WHP-CPI-REGISTRY-v1',record_id:RECORD_ID,
    version:current.version+1,status:'ACTIVE',controller:intent.successor_controller,
    predecessor_hash:sha256(current),transition_id:sha256(payload),
    settlement:{required:true,network:NETWORK,asset:USDC,amount_atomic:PURCHASE_AMOUNT_ATOMIC,recipient:intent.seller_recipient,proof_tx:proof.tx_hash}
  };

  // compare-and-set is the only mutation point. It must atomically reject stale predecessors.
  const committed=await registry.compareAndSet({record_id:RECORD_ID,expected_hash:sha256(current),successor,nonce:intent.nonce,settlement_tx:proof.tx_hash});
  requireTrue(committed===true,'ATOMIC_COMMIT_REJECTED');
  return successor;
}
