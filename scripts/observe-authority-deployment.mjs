// Read-only observation of the single connected deployment after public authority publication.
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {demand,parseStrict,hash} from '../src/canonical.mjs';
import {validateTrust} from '../src/authority.mjs';
import {target,api,ORIGIN,SITE_ID} from './netlify-production-target.mjs';
import {readPublic,CEREMONY} from './production-authority-v2.mjs';
export async function observeDeployment(commit){
 demand(/^[0-9a-f]{40}$/.test(commit??''),'DEPLOYMENT_COMMIT_REQUIRED');await target();const expected=await readPublic();demand(expected.ceremony_id===CEREMONY,'FRESH_AUTHORITY_REQUIRED');
 let deployment=null;
 for(let attempt=0;attempt<36;attempt++){
  const s=await api('/sites/'+SITE_ID),d=s.published_deploy;
  if(d?.commit_ref===commit&&d.state==='ready'){deployment=d;break;}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 demand(deployment,'CONNECTED_DEPLOYMENT_NOT_OBSERVED');
 const r=await fetch(ORIGIN+'/.well-known/whp-standing.json',{redirect:'error',signal:AbortSignal.timeout(20000)});demand(r.status===200,'RUNTIME_DISCOVERY_HTTP_'+r.status);
 const live=parseStrict(await r.text(),2000000);demand(live.root_pin===expected.root_pin&&hash(live.trust_bundle)===hash(expected.trust_bundle),'DEPLOYED_RUNTIME_TRUST_MISMATCH');validateTrust(live.trust_bundle,expected.root_pin,Math.floor(Date.now()/1000));
 const h=await fetch(ORIGIN+'/healthz',{redirect:'error',signal:AbortSignal.timeout(20000)});demand(h.status===200,'RUNTIME_HEALTH_HTTP_'+h.status);
 const result={checked_at:new Date().toISOString(),deployed_commit:deployment.commit_ref,deployment_id:deployment.id,site_id:SITE_ID,origin:ORIGIN,root_pin:live.root_pin,runtime_trust_bundle_sha256:hash(live.trust_bundle),runtime_status_sequence:live.trust_bundle.status_snapshot.payload.sequence,status_valid_until:live.trust_bundle.status_snapshot.payload.valid_until,public_status_matches_runtime:true,production_function_refreshed:true,health_status:h.status,payment_executed:false,live_mark_issued:false};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/authority-deployment.json',JSON.stringify(result,null,2)+'\n');return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await observeDeployment(process.env.EXPECTED_DEPLOY_COMMIT)));}catch(e){console.error('AUTHORITY_DEPLOYMENT_OBSERVATION_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}}
