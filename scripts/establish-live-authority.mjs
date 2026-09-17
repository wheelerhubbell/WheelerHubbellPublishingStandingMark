// Existing WHP production identity recovery/synchronization only. Never generates keys.
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {demand,parseStrict,hash} from '../src/canonical.mjs';
import {verifyAuthority} from './authority-core.mjs';
import {target,api,variable,value,createVariable,exportTarget,ORIGIN,verifySourceCommitments} from './netlify-production-target.mjs';
import {CEREMONY,CUSTODY_KEY,readPublic,readCustody,proveCustody,assertAuthorityContinuity,readSourceRecord,resumeStatus,renewStatus,persistStatus,installAuthority,checkAdmission,writePublic} from './production-authority-v2.mjs';
const HISTORICAL_SITE_ID='813ee022-f4d9-4d8e-a974-86158583a39f';
async function existingCustody(site,published){
 try{const c=await readCustody(site);assertAuthorityContinuity(published,c);return {custody:c,recovered:false};}
 catch(e){if(e.code!=='FRESH_ADMIN_CUSTODY_REQUIRED')throw e;}
 const old=await api('/sites/'+HISTORICAL_SITE_ID);demand(old?.id===HISTORICAL_SITE_ID&&old.account_id,'HISTORICAL_AUTHORITY_SITE_REQUIRED');
 const row=await variable(old,CUSTODY_KEY);demand(row?.values?.length===1&&row.values[0].context==='dev','HISTORICAL_ADMIN_CUSTODY_REQUIRED');
 const raw=value(row,'dev'),c=parseStrict(raw,1048576);proveCustody(c);assertAuthorityContinuity(published,c);
 demand(!await variable(site,CUSTODY_KEY),'CURRENT_CUSTODY_CHANGED_DURING_RECOVERY');
 await createVariable(site,CUSTODY_KEY,raw,'dev');
 const recovered=await readCustody(site);demand(hash(recovered)===hash(c),'RECOVERED_CUSTODY_READBACK_FAILED');assertAuthorityContinuity(published,recovered);
 return {custody:recovered,recovered:true};
}
export async function establishProduction(){
 const commitments=await verifySourceCommitments(),site=await target();await exportTarget(site);
 const previous=await readPublic(),{custody:c,recovered}=await existingCustody(site,previous),proof=proveCustody(c);assertAuthorityContinuity(previous,c);
 const a={bundle:previous.trust_bundle,act:previous.authorization_act},node=await readSourceRecord();
 await resumeStatus(site,c,a.bundle);renewStatus(c,a.bundle,Math.floor(Date.now()/1000));await persistStatus(site,c,a.bundle);
 verifyAuthority(a.bundle,c.root_pin,c.issuer_private_key,Math.floor(Date.now()/1000));
 const admission=checkAdmission(c,a.bundle,node,Math.floor(Date.now()/1000));
 const configuration=await installAuthority(site,c,a.bundle);await writePublic(c,a,node,previous);
 const report={checked_at:new Date().toISOString(),state:'EXISTING_AUTHORITY_RECOVERED_AND_SYNCHRONIZED',ceremony_id:CEREMONY,source_commit:process.env.GITHUB_SHA??null,site_id:site.id,origin:ORIGIN,commitments,custody:{...proof,recovered_from_historical_site:recovered},configuration,source_admission:admission,reused_durable_key_set:true,new_keys_generated:false,signing_identity_changed:false,previous_trust_identity_continued:true,historical_public_record_preserved:true,status_sequence:a.bundle.status_snapshot.payload.sequence,status_previous_hash:a.bundle.status_snapshot.payload.previous_hash,status_valid_until:a.bundle.status_snapshot.payload.valid_until,public_cutover_completed:false,payment_executed:false,live_mark_issued:false};
 await mkdir('evidence/live-authority',{recursive:true});await writeFile('evidence/live-authority/fresh-key-establishment.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await establishProduction()));}catch(e){console.error('EXISTING_PRODUCTION_AUTHORITY_RECOVERY_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}}
