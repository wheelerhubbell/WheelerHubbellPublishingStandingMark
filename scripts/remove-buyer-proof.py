from pathlib import Path
import json


def replace_exact(path, old, new):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"expected source fragment missing: {path}: {old[:120]!r}")
    if s.count(old) != 1:
        raise SystemExit(f"expected exactly one source fragment: {path}: count={s.count(old)}")
    p.write_text(s.replace(old, new))


replace_exact(
    "src/service.mjs",
    "const raw=await readBody(req),s=validateSubmission(parseStrict(raw));authenticate(req,s.buyer_key,raw,now);\n      // Pure structural validation, client authentication and issuer authority precede all storage/payment calls.",
    "const raw=await readBody(req),s=validateSubmission(parseStrict(raw));\n      // Pure structural validation and issuer authority precede all storage/payment calls. No WHP-specific buyer signature is required to reach the x402 boundary.",
)
replace_exact(
    "src/service.mjs",
    "const row=await this.store.get(purchase[1]);demand(row,'PURCHASE_NOT_FOUND',404);authenticate(req,row.buyer_key,'',now);\n      if(row.state==='ISSUED')return result(row.result_bytes);",
    "const row=await this.store.get(purchase[1]);demand(row,'PURCHASE_NOT_FOUND',404);\n      if(row.state==='ISSUED')return result(row.result_bytes);",
)
replace_exact(
    "src/service.mjs",
    "const raw=await readBody(req);demand(raw==='','RECOVERY_BODY_MUST_BE_EMPTY');const row=await this.store.get(recover[1]);demand(row,'PURCHASE_NOT_FOUND',404);authenticate(req,row.buyer_key,'',now);demand(row.state!=='QUOTED','PAYMENT_NOT_AUTHORIZED',409);return this.progress(row);",
    "const raw=await readBody(req);demand(raw==='','RECOVERY_BODY_MUST_BE_EMPTY');const row=await this.store.get(recover[1]);demand(row,'PURCHASE_NOT_FOUND',404);demand(row.state!=='QUOTED','PAYMENT_NOT_AUTHORIZED',409);return this.progress(row);",
)

replace_exact(
    "src/buyer.mjs",
    "import {clientProof,purchaseId} from './service.mjs';",
    "import {purchaseId} from './service.mjs';",
)
replace_exact(
    "src/buyer.mjs",
    "async request(method,path,body='',payment=null){const headers={'content-type':'application/json','whp-client-proof':clientProof(this.privateKey,method,path,body,this.clock())};if(payment)headers['payment-signature']=encode(payment);",
    "async request(method,path,body='',payment=null){const headers={'content-type':'application/json'};if(payment)headers['payment-signature']=encode(payment);",
)

p = Path("src/discovery.mjs")
s = p.read_text()
start = s.index("  authentication:{header:'whp-client-proof'")
end = s.index("  payment:{protocol:'x402-v2'", start)
replacement = (
    "  authentication:{purchase:'NONE_BEYOND_X402_PAYMENT',retrieval:'NONE',"
    "review:'WHP-Client-Proof-v1 is used only for reviewer-authenticated review submissions; it is not required for purchase, 402 discovery, result retrieval or recovery.'},\n"
)
s = s[:start] + replacement + s[end:]
s = s.replace(
    "lost_response:'Use authenticated GET result or authenticated empty POST recovery. Do not generate a second wallet authorization.'",
    "lost_response:'Use GET result or empty POST recovery with the durable purchase ID. Do not generate a second wallet authorization.'",
)
s = s.replace(
    "headers:{'whp-client-proof':'See '+service.origin+'/v1/contract for a fresh Ed25519 HTTP proof; this is not a wallet key.'}",
    "headers:{}",
)
s = s.replace(
    "The complete purchase and authentication contract is '+service.origin+'/v1/contract",
    "The complete purchase and payment contract is '+service.origin+'/v1/contract",
)
p.write_text(s)

p = Path("public/openapi.json")
api = json.loads(p.read_text())
for route, method in [
    ("/v1/evaluations", "post"),
    ("/v1/purchases/{purchase_id}/result", "get"),
    ("/v1/purchases/{purchase_id}/recover", "post"),
]:
    op = api["paths"][route][method]
    op.pop("security", None)
    op.get("responses", {}).pop("401", None)
api["paths"]["/v1/contract"]["get"]["responses"]["200"]["description"] = (
    "Complete schema, authority, quote binding and independent buyer payment requirements; no WHP-specific buyer signature is required to reach 402."
)
api["components"]["securitySchemes"]["ClientProof"]["description"] = (
    "Reviewer-authentication proof for /v1/reviews only. It is not required for purchase, 402 discovery, result retrieval or recovery."
)
p.write_text(json.dumps(api, indent=2, ensure_ascii=False) + "\n")
