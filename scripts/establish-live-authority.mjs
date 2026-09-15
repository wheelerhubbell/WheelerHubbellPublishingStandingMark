// Existing-lineage ratification only. No root generation, rotation, payment, or old-site writes.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {canonical,parseStrict,demand,hash,publicDer,keyId,openSeal,seal} from '../src/canonical.mjs';
import {AUTHORIZATION,establish,verifyAuthority} from './authority-core.mjs';
import {CONTRACT_HASH,VERIFIER_HASH} from '../src/protocol.mjs';
import {PROFILE_HASH} from '../src/profile.mjs';
import {api,target,variables,put,value,ORIGIN,ROOT_PIN,ISSUER_KEY_ID,exportTarget} from './netlify-production-target.mjs';
const DIR='evidence/live-authority';
try{
  const site=await target();await exportTarget(site);
  const published=parseStrict(await readFile('public/authority/root.json','utf8'),1048576);
  demand(published.root_pin===ROOT_PIN&&published.issuer_key_id===ISSUER_KEY_ID,'PUBLISHED_LINEAGE_MISMATCH');
  let vars=await variables(site),record=vars.find(e=>e.key==='WHP_AUTHORITY_CUSTODY_V1'),custodySource=site;
  const targetPin=value(vars.find(e=>e.key==='WHP_ROOT_PIN'));
  demand(!targetPin||targetPin===ROOT_PIN,'TARGET_ROOT_PIN_CONFLICT');
  if(!record){
    // Historical authority evidence supplies a READ-ONLY custody locator, never a deployment target.
    const historical=parseStrict(await readFile('evidence/live-authority/public-authority.json','utf8'),1048576);
    custodySource=await api('/sites/'+new URL(historical.canonical_origin).hostname);
    demand(custodySource.ssl_url===historical.canonical_origin,'HISTORICAL_CUSTODY_ORIGIN_MISMATCH');
    record=(await variables(custodySource)).find(e=>e.key==='WHP_AUTHORITY_CUSTODY_V1');
  }
  demand(record&&record.values.every(v=>v.context==='dev')&&value(record,'dev'),'EXISTING_ROOT_CUSTODY_REQUIRED');
  const saved=parseStrict(value(record,'dev'),1048576),c=saved.custody,prior=saved.authority;
  demand(keyId(publicDer(c.root_private_key))===ROOT_PIN&&keyId(publicDer(c.issuer_private_key))===ISSUER_KEY_ID,'EXISTING_PRIVATE_LINEAGE_MISMATCH');
  demand(prior.root_pin===ROOT_PIN&&prior.issuer_key_id===ISSUER_KEY_ID&&keyId(prior.bundle.root_public_key)===ROOT_PIN,'EXISTING_AUTHORITY_LINEAGE_MISMATCH');
  const oldPa=openSeal(prior.bundle.profile_authorization,'WHP-PROFILE-AUTHORIZATION-v1',prior.bundle.root_public_key);
  demand(oldPa.environment==='LIVE'&&oldPa.ratified===true,'HISTORICAL_LIVE_AUTHORITY_REQUIRED');
  for(const cert of prior.bundle.certificates)openSeal(cert,'WHP-AUTHORITY-CERTIFICATE-v1',prior.bundle.root_public_key);
  const oldStatus=openSeal(prior.bundle.status_snapshot,'WHP-TRUST-STATUS-v1',prior.bundle.root_public_key);
  demand(oldStatus.profile_authorization_hash===hash(prior.bundle.profile_authorization)&&oldStatus.certificates_hash===hash(prior.bundle.certificates)&&oldStatus.revocations_hash===hash(prior.bundle.revocations),'PRIOR_STATUS_MANIFEST_MISMATCH');
  const now=Math.floor(Date.now()/1000);
  let a=prior,reused=oldPa.profile_hash===PROFILE_HASH&&oldPa.contract_hash===CONTRACT_HASH&&oldPa.verifier_sha256===VERIFIER_HASH&&prior.bundle.certificates.some(e=>keyId(e.payload.public_key)===ISSUER_KEY_ID&&e.payload.roles.includes('DISCOVERY'));
  if(!reused){
    const generated=establish(c,AUTHORIZATION,now);
    const priorCert=prior.bundle.certificates.find(e=>keyId(e.payload.public_key)===ISSUER_KEY_ID);
    demand(priorCert,'EXISTING_ISSUER_CERTIFICATE_REQUIRED');
    // Preserve prior identity, bounds, validity and revocations. Add only first-public DISCOVERY authority.
    generated.bundle.certificates=prior.bundle.certificates.map(e=>seal('WHP-AUTHORITY-CERTIFICATE-v1',{...e.payload,profile_hash:PROFILE_HASH,roles:keyId(e.payload.public_key)===ISSUER_KEY_ID?[...new Set([...e.payload.roles,'DISCOVERY'])]:e.payload.roles},c.root_private_key));
    generated.bundle.revocations=prior.bundle.revocations;
    generated.bundle.profile_authorization=seal('WHP-PROFILE-AUTHORIZATION-v1',{...generated.bundle.profile_authorization.payload,valid_until:oldPa.valid_until},c.root_private_key);
    generated.bundle.status_snapshot=seal('WHP-TRUST-STATUS-v1',{sequence:oldStatus.sequence+1,previous_hash:hash(prior.bundle.status_snapshot),profile_authorization_hash:hash(generated.bundle.profile_authorization),certificates_hash:hash(generated.bundle.certificates),revocations_hash:hash(generated.bundle.revocations),valid_from:now-30,valid_until:Math.min(now+86400,oldPa.valid_until,...generated.bundle.certificates.map(e=>e.payload.valid_until))},c.root_private_key);
    const ratification=seal('WHP-FIRST-PUBLIC-RATIFICATION-v1',{...generated.act.payload,previous_authority_act_hash:hash(prior.act),previous_trust_bundle_hash:hash(prior.bundle),trust_bundle_hash:hash(generated.bundle)},c.root_private_key);
    // The original establishment act remains the original act, with its original meaning and date.
    a={...generated,act:prior.act,ratification};saved.authority=a;
    saved.prior_authorities=[...(saved.prior_authorities??[]),prior];
  }
  if(reused&&a.bundle.status_snapshot.payload.valid_until<now+64800){
    const previous=a.bundle.status_snapshot;
    const until=Math.min(now+86400,a.bundle.profile_authorization.payload.valid_until,...a.bundle.certificates.map(e=>e.payload.valid_until));
    demand(until>now+3600,'AUTHORITY_RENEWAL_REQUIRED');
    a.bundle.status_snapshot=seal('WHP-TRUST-STATUS-v1',{...previous.payload,sequence:previous.payload.sequence+1,previous_hash:hash(previous),valid_from:now-30,valid_until:until},c.root_private_key);
  }
  verifyAuthority(a.bundle,ROOT_PIN,c.issuer_private_key,now);
  // Isolated dev custody is persisted before public/runtime state, preserving retry continuity.
  await put(site,'WHP_AUTHORITY_CUSTODY_V1',canonical(saved),'dev');
  const back=(await variables(site)).find(e=>e.key==='WHP_AUTHORITY_CUSTODY_V1');
  demand(back?.values.every(v=>v.context==='dev')&&hash(parseStrict(value(back,'dev'),1048576))===hash(saved),'EXISTING_CUSTODY_TRANSFER_READBACK_FAILED');
  const publicObject={...published,canonical_origin:ORIGIN,root_pin:ROOT_PIN,issuer_key_id:ISSUER_KEY_ID,authorization_act:a.act,current_ratification:a.ratification??published.current_ratification,trust_bundle:a.bundle,profile:{id:'WHP-STANDING-STRUCTURED-PASSAGE',version:'1.0.0',sha256:PROFILE_HASH},contract_sha256:CONTRACT_HASH,verifier_sha256:VERIFIER_HASH};
  if(!publicObject.current_ratification)delete publicObject.current_ratification;
  for(const [k,v] of Object.entries({WHP_ORIGIN:ORIGIN,WHP_ROOT_PIN:ROOT_PIN,WHP_TRUST_BUNDLE_JSON:canonical(a.bundle),WHP_ISSUER_PRIVATE_KEY:c.issuer_private_key}))await put(site,k,v);
  vars=await variables(site);
  demand(value(vars.find(e=>e.key==='WHP_ROOT_PIN'))===ROOT_PIN&&hash(parseStrict(value(vars.find(e=>e.key==='WHP_TRUST_BUNDLE_JSON')),1048576))===hash(a.bundle),'LIVE_AUTHORITY_CONFIGURATION_READBACK_FAILED');
  const issuer=vars.find(e=>e.key==='WHP_ISSUER_PRIVATE_KEY');
  demand(issuer?.values.every(v=>v.context==='production')&&keyId(publicDer(value(issuer)))===ISSUER_KEY_ID,'ISSUER_SECRET_CUSTODY_MISMATCH');
  await mkdir(DIR,{recursive:true});await mkdir('public/authority',{recursive:true});
  await writeFile('public/authority/root.json',canonical(publicObject)+'\n');await writeFile('public/authority/trust-bundle.json',canonical(a.bundle)+'\n');
  const report={checked_at:new Date().toISOString(),source_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,state:'CURRENT_FIRST_PUBLIC_RATIFICATION_VERIFIED',root_pin:ROOT_PIN,issuer_key_id:ISSUER_KEY_ID,profile_sha256:PROFILE_HASH,contract_sha256:CONTRACT_HASH,verifier_sha256:VERIFIER_HASH,existing_current_ratification_reused:reused,existing_root_preserved:true,existing_issuer_key_preserved:true,original_authorization_act_preserved:true,previous_status_hash:a.bundle.status_snapshot.payload.previous_hash,root_excluded_from_production_context:true,secret_custody_readback_verified:true,historical_custody_modified:false,production_origin:ORIGIN,service_deployed:false,payment_executed:false,live_mark_issued:false,trust_status_valid_until:a.bundle.status_snapshot.payload.valid_until};
  await writeFile(DIR+'/first-public-ratification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(e){console.error('EXISTING_AUTHORITY_RATIFICATION_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}
