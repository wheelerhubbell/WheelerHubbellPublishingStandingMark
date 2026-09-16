// Read-only preflight. Existing root must authorize this exact version before activation.
import {readFile} from 'node:fs/promises';
import {validateTrust,issuerAuthority} from '../src/authority.mjs';
import {parseStrict,demand,keyId} from '../src/canonical.mjs';
import {PROFILE_HASH} from '../src/profile.mjs';
import {CONTRACT_HASH,VERIFIER_HASH} from '../src/protocol.mjs';
try{
  let bundle,pin;
  if(process.env.WHP_TRUST_BUNDLE_JSON){bundle=parseStrict(process.env.WHP_TRUST_BUNDLE_JSON);pin=process.env.WHP_ROOT_PIN;}
  else if(process.env.WHP_ACTIVATION_BUNDLE){bundle=parseStrict(await readFile(process.env.WHP_ACTIVATION_BUNDLE,'utf8'));pin=process.env.WHP_ROOT_PIN;}
  else{
    const r=await fetch('https://wheelerhubbellpublishingstandingmark.netlify.app/authority/root.json',{redirect:'error',signal:AbortSignal.timeout(15000)});
    demand(r.ok,'PUBLISHED_AUTHORITY_UNAVAILABLE');const published=await r.json();bundle=published.trust_bundle;pin=published.root_pin;
  }
  demand(bundle&&pin,'MATCHING_AUTHORITY_REQUIRED');
  const trust=validateTrust(bundle,pin,Math.floor(Date.now()/1000));demand(trust.profile.environment==='LIVE','LIVE_AUTHORITY_REQUIRED');
  const issuer=[...trust.keys.entries()].find(([,c])=>c.roles.includes('ISSUER')&&c.roles.includes('DISCOVERY')&&c.roles.includes('REGISTRY'));
  demand(issuer,'ISSUER_REQUIRED');issuerAuthority(issuer[0],'https://github.com/independent-controller/records','namespace-control',trust);
  console.log(JSON.stringify({activation_authority_verified:true,root_pin:pin,issuer_key_id:issuer[0],profile:PROFILE_HASH,contract:CONTRACT_HASH,verifier:VERIFIER_HASH,production_completion:false}));
}catch(e){console.error(JSON.stringify({activation_authority_verified:false,error:e.code??e.message,production_completion:false}));process.exitCode=1;}
