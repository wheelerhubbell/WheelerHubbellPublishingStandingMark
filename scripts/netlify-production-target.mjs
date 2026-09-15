// Target relationship only. Provider operations reuse the existing Netlify API mechanism.
import {appendFile} from 'node:fs/promises';
import {demand} from '../src/canonical.mjs';
export const ORIGIN='https://whpstandingmark.netlify.app';
export const REPOSITORY='wheelerhubbell/WheelerHubbellPublishingStandingMark';
export const ROOT_PIN='c9507f2c5d0d80935a4885071c8372eeba25010e514e81401acabb246134bff6';
export const ISSUER_KEY_ID='baabb9cd21f367bb8467f1bce570cd1f4ef1b418172f2cb68968ebe7186f487e';
export async function api(path,method='GET',body){
  demand(process.env.NETLIFY_AUTH_TOKEN,'NETLIFY_AUTH_TOKEN_REQUIRED',503);
  const r=await fetch('https://api.netlify.com/api/v1'+path,{method,headers:{Authorization:'Bearer '+process.env.NETLIFY_AUTH_TOKEN,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(60000)});
  demand(r.ok,'NETLIFY_'+method+'_'+r.status,503);return r.status===204?null:r.json();
}
export const value=(e,c='production')=>e?.values?.find(v=>v.context===c)?.value??(c==='production'?e?.values?.find(v=>v.context==='all')?.value:undefined);
export const prefix=s=>'/accounts/'+s.account_id+'/env';
export async function variables(site){return api(prefix(site)+'?site_id='+site.id);}
export async function put(site,key,data,context='production'){
  demand(site.name==='whpstandingmark'&&site.ssl_url===ORIGIN,'PRODUCTION_WRITE_TARGET_MISMATCH');
  const vars=await variables(site),prior=vars.find(e=>e.key===key);
  const isolated=['WHP_AUTHORITY_CUSTODY_V1','WHP_ISSUER_PRIVATE_KEY'].includes(key);
  if(!isolated&&value(prior,context)===data)return;
  if(prior?.values?.length===1&&prior.values[0].context===context&&prior.values[0].value===data)return;
  // Context-isolated root and issuer values must not inherit another deploy context.
  const body={key,values:[{context,value:data}]};
  await api(prefix(site)+(prior?'/'+key:'')+'?site_id='+site.id,prior?'PUT':'POST',prior?body:[body]);
}
export async function target(){
  const s=await api('/sites/'+new URL(ORIGIN).hostname);
  demand(s.id&&s.account_id&&s.name==='whpstandingmark'&&s.ssl_url===ORIGIN,'NEW_PRODUCTION_TARGET_REQUIRED');
  const repo=s.build_settings??s.repo??{};
  const path=(repo.repo_path??repo.repo_url??'').replace(/^https?:\/\/github.com\//,'').replace(/\.git$/,'');
  demand(path===REPOSITORY&&repo.repo_branch==='main','NETLIFY_REPOSITORY_CUTOVER_REQUIRED',503);
  return s;
}
export async function exportTarget(site){
  if(process.env.GITHUB_ENV)await appendFile(process.env.GITHUB_ENV,'NETLIFY_SITE_ID='+site.id+'\nWHP_ORIGIN='+ORIGIN+'\nWHP_ROOT_PIN='+ROOT_PIN+'\n');
}
