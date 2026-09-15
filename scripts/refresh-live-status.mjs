// Administrative renewal only. Never run this module in the public request handler.
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {canonical,demand,hash} from '../src/canonical.mjs';
import {target,verifySourceCommitments} from './netlify-production-target.mjs';
import {CEREMONY,ROOT_FILE,readPublic,readCustody,resumeStatus,renewStatus,persistStatus,installAuthority} from './production-authority-v2.mjs';
export async function refreshStatus(){
 await verifySourceCommitments();const site=await target(),pub=await readPublic(),c=await readCustody(site);
 demand(pub.ceremony_id===CEREMONY&&pub.root_pin===c.root_pin,'ROOT_IDENTITY_CHANGED');
 const before=hash(pub.trust_bundle),b=pub.trust_bundle;
 await resumeStatus(site,c,b);renewStatus(c,b,Math.floor(Date.now()/1000));await persistStatus(site,c,b);await installAuthority(site,c,b);
 const changed=before!==hash(b);if(changed){pub.trust_bundle=b;await writeFile(ROOT_FILE,canonical(pub)+'\n');await writeFile('public/authority/trust-bundle.json',canonical(b)+'\n');}
 return {changed,root_pin:c.root_pin,status_sequence:b.status_snapshot.payload.sequence,previous_status_hash:b.status_snapshot.payload.previous_hash,status_valid_from:b.status_snapshot.payload.valid_from,status_valid_until:b.status_snapshot.payload.valid_until,root_rotated:false,certificates_changed:false,revocations_changed:false,production_environment_updated:true,deployed_runtime_refresh_verified:false,payment_executed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await refreshStatus()));}catch(e){console.error('STATUS_REFRESH_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}}
