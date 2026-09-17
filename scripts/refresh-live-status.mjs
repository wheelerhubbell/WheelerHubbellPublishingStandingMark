// One-purpose renewal of the already-ratified v1.1 status. No key establishment or provider writes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {canonical,parseStrict,hash,demand} from '../src/canonical.mjs';
import {readExistingCustody} from './sync-v11-authority.mjs';
import {renewStatus} from './production-authority-v2.mjs';

const ROOT='public/authority/root.json';
const BUNDLE='public/authority/trust-bundle.json';
const rules=b=>({...b,status_snapshot:null});

export async function refreshStatus(){
  const raw=await readFile(ROOT,'utf8'),publication=parseStrict(raw,1048576);
  demand(publication.version==='WHP-PUBLIC-AUTHORITY-v1.1','V11_PUBLIC_AUTHORITY_REQUIRED');
  const bundle=parseStrict(await readFile(BUNDLE,'utf8'),1048576);
  demand(hash(bundle)===hash(publication.trust_bundle),'PUBLIC_AUTHORITY_FILES_DISAGREE');
  const beforeRules=hash(rules(bundle)),beforeStatus=hash(bundle.status_snapshot);
  const existing=await readExistingCustody();
  const renewed=renewStatus(existing.custody,structuredClone(bundle),Math.floor(Date.now()/1000));
  demand(hash(rules(renewed))===beforeRules,'RATIFIED_AUTHORITY_CHANGED');
  demand(hash(renewed.status_snapshot)!==beforeStatus,'STATUS_RENEWAL_REQUIRED');
  await mkdir('public/authority/history',{recursive:true});
  const prior=hash(publication);
  try{await writeFile('public/authority/history/'+prior+'.json',raw,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
  try{await writeFile('public/authority/history/'+prior+'.trust-bundle.json',canonical(bundle)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
  publication.trust_bundle=renewed;
  await writeFile(ROOT,canonical(publication)+'\n');
  await writeFile(BUNDLE,canonical(renewed)+'\n');
  return {changed:true,status_renewed:true,root_pin:existing.root_pin,issuer_key_id:existing.issuer_key_id,custody_source:existing.source,status_sequence:renewed.status_snapshot.payload.sequence,status_valid_until:renewed.status_snapshot.payload.valid_until,generated_new_keys:false,root_rotated:false,private_custody_migrated:false,provider_configuration_changed:false,payment_executed:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(JSON.stringify(await refreshStatus()));}
  catch(e){console.error('STATUS_REFRESH_STOPPED',e.code??'SAFE_INTERNAL_FAILURE');process.exitCode=1;}
}
