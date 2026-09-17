export const BASE_CHAIN_ID='0x2105'; // 8453
export const USDC='0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
export const TRANSFER_TOPIC='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export const REQUIRED_ATOMIC=125000000n;

const norm=a=>String(a).toLowerCase();
const padAddress=a=>'0x'+norm(a).replace(/^0x/,'').padStart(64,'0');
const hexBigInt=h=>BigInt(h);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function need(v,code){if(!v)fail(code);}

async function rpc(url,method,params){
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  need(r.ok,'RPC_HTTP_ERROR');
  const j=await r.json();need(!j.error,'RPC_RESPONSE_ERROR');return j.result;
}

/** Verify independently from Base RPC data. Caller-provided transaction summaries are never proof. */
export async function verifyBaseUsdcSettlement({rpcUrl,txHash,expectedPayer,expectedRecipient,minConfirmations=12}){
  need(/^https:\/\//.test(rpcUrl),'HTTPS_RPC_REQUIRED');
  need(/^0x[0-9a-fA-F]{64}$/.test(txHash),'TX_HASH_INVALID');
  const chain=await rpc(rpcUrl,'eth_chainId',[]);need(chain===BASE_CHAIN_ID,'WRONG_CHAIN');
  const receipt=await rpc(rpcUrl,'eth_getTransactionReceipt',[txHash]);need(receipt,'RECEIPT_NOT_FOUND');
  need(receipt.status==='0x1','TX_REVERTED');
  const head=hexBigInt(await rpc(rpcUrl,'eth_blockNumber',[]));
  const block=hexBigInt(receipt.blockNumber);need(head>=block,'HEAD_BEHIND_RECEIPT');
  need(head-block+1n>=BigInt(minConfirmations),'INSUFFICIENT_CONFIRMATIONS');

  const fromTopic=padAddress(expectedPayer);
  const toTopic=padAddress(expectedRecipient);
  const matches=(receipt.logs??[]).filter(l=>norm(l.address)===USDC&&norm(l.topics?.[0])===TRANSFER_TOPIC&&norm(l.topics?.[1])===norm(fromTopic)&&norm(l.topics?.[2])===norm(toTopic));
  need(matches.length===1,'EXACT_USDC_TRANSFER_NOT_UNIQUE');
  const amount=hexBigInt(matches[0].data);need(amount===REQUIRED_ATOMIC,'WRONG_AMOUNT');

  return Object.freeze({finalized:true,network:'eip155:8453',asset:USDC,amount_atomic:Number(REQUIRED_ATOMIC),payer:norm(expectedPayer),recipient:norm(expectedRecipient),tx_hash:norm(txHash),block_number:Number(block),confirmations:Number(head-block+1n),log_index:parseInt(matches[0].logIndex,16)});
}
