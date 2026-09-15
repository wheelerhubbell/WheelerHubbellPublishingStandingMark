// Fresh production identity authorized 2026-09-15T22:45:12Z. No historical private-key lookup.
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {demand} from '../src/canonical.mjs';
import {verifyAuthority} from './authority-core.mjs';
import {target,exportTarget,ORIGIN,verifySourceCommitments} from './netlify-production-target.mjs';
import {CEREMONY,readPublic,getOrEstablishCustody,proveCustody,makeFreshAuthority,makeSourceRecord,readSourceRecord,resumeStatus,renewStatus,persistStatus,installAuthority,checkAdmission,writePublic} from './production-authority-v2.mjs';
export async function establishProduction(){
 const commitments=await verifySourceCommitments(),site=await target();await exportTarget(site);
 const previous=await readPublic(),c=await getOrEstablishCustody(site,previous),proof=proveCustody(c);
 demand(previous.root_pin===c.previous_root_pin||previous.ceremony_id===CEREMONY&&previous.root_pin===c.root_pin,'UNRELATED_PUBLIC_AUTHORITY_CHANGE');
 const reuse=previous.ceremony_id===CEREMONY;
 const a=reuse?{bundle:previous.trust_bundle,act:previous.authorization_act}:makeFreshAuthority(c);
 const node=reuse?await readSourceRecord():makeSourceRecord(c);
 await resumeStatus(site,c,a.bundle);renewStatus(c,a.bundle,Math.floor(Date.now()/1000));
 await persistStatus(site,c,a.bundle);
 verifyAuthority(a.bundle,c.root_pin,c.issuer_private_key,Math.floor(Date.now()/1000));
 const admission=checkAdmission(c,a.bundle,node,Math.floor(Date.now()/1000));
 const configuration=await installAuthority(site,c,a.bundle);
 await writePublic(c,a,node,previous);
 const report={checked_at:new Date().toISOString(),state:'FRESH_AUTHORITY_STORED_AND_PREPARED',ceremony_id:CEREMONY,source_commit:process.env.GITHUB_SHA??null,site_id:site.id,origin:ORIGIN,commitments,custody:proof,configuration,source_admission:admission,reused_durable_key_set:reuse,old_private_keys_searched:false,signing_identity_changed:true,previous_trust_identity_continued:false,historical_public_record_preserved:true,status_sequence:a.bundle.status_snapshot.payload.sequence,status_previous_hash:a.bundle.status_snapshot.payload.previous_hash,status_valid_until:a.bundle.status_snapshot.payload.valid_until,public_cutover_completed:false,payment_executed:false,live_mark_issued:false};
 await mkdir('evidence/live-authority',{recursive:true});await writeFile('evidence/live-authority/fresh-key-establishment.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await establishProduction()));}catch(e){console.error('FRESH_PRODUCTION_ESTABLISHMENT_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}}
