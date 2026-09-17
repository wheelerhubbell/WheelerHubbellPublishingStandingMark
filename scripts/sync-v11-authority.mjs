// Existing-root v1.1 administration only. Never generates or rotates keys.
import {copyFile,mkdir,readdir,rm} from 'node:fs/promises';
import {canonical,parseStrict,demand,hash,keyId,publicDer,seal,openSeal,randomHex} from '../src/canonical.mjs';
import {api,target,variable,value,createVariable,ACCOUNT_ID} from './netlify-production-target.mjs';
import {CUSTODY_KEY} from './production-authority-v2.mjs';
import {administer} from './open-authority-administration.mjs';

const HISTORICAL_SITE_ID='813ee022-f4d9-4d8e-a974-86158583a39f';
const ROOT_PIN='e3a0a2945081823171841bde32a6df7fc505b6f0b3e6ab9b6c85ecc9f3d49bfc';
const ISSUER_ID='8d65f5a4057eedb76ac3db83e9217a374c0072adfa3986b4745e4b5b5bbb22e8';

function proveExistingCustody(c){
  demand(c&&typeof c.root_private_key==='string'&&typeof c.issuer_private_key==='string','EXISTING_CUSTODY_REQUIRED');
  const rootPublic=publicDer(c.root_private_key),issuerPublic=publicDer(c.issuer_private_key);
  demand(keyId(rootPublic)===ROOT_PIN&&keyId(issuerPublic)===ISSUER_ID,'EXISTING_CUSTODY_IDENTITY_MISMATCH');
  const nonce=randomHex();
  const rootProof=seal('WHP-EXISTING-CUSTODY-PROOF-v1',{nonce,role:'ROOT'},c.root_private_key);
  const issuerProof=seal('WHP-EXISTING-CUSTODY-PROOF-v1',{nonce,role:'ISSUER'},c.issuer_private_key);
  demand(openSeal(rootProof,'WHP-EXISTING-CUSTODY-PROOF-v1',rootPublic).nonce===nonce,'EXISTING_ROOT_SIGNING_ACCESS_FAILED');
  demand(openSeal(issuerProof,'WHP-EXISTING-CUSTODY-PROOF-v1',issuerPublic).nonce===nonce,'EXISTING_ISSUER_SIGNING_ACCESS_FAILED');
  return {root_pin:ROOT_PIN,issuer_key_id:ISSUER_ID,root_signing_access_verified:true,issuer_signing_access_verified:true};
}

export async function recoverExistingCustody(){
  const current=await target();
  const present=await variable(current,CUSTODY_KEY);
  if(present){
    demand(present.values?.length===1&&present.values[0].context==='dev','EXISTING_DEV_CUSTODY_REQUIRED');
    const custody=parseStrict(value(present,'dev'),1048576),proof=proveExistingCustody(custody);
    return {site:current,custody_recovered:false,...proof};
  }
  const rawHistorical=await api('/sites/'+HISTORICAL_SITE_ID);
  demand(rawHistorical?.id===HISTORICAL_SITE_ID,'HISTORICAL_CUSTODY_SITE_REQUIRED');
  const historical={...rawHistorical,account_id:rawHistorical.account_id??ACCOUNT_ID};
  if(rawHistorical.account_id)demand(rawHistorical.account_id===ACCOUNT_ID,'HISTORICAL_ACCOUNT_TARGET_MISMATCH');
  const record=await variable(historical,CUSTODY_KEY);
  demand(record?.values?.length===1&&record.values[0].context==='dev','HISTORICAL_DEV_CUSTODY_REQUIRED');
  const custody=parseStrict(value(record,'dev'),1048576),proof=proveExistingCustody(custody);
  await createVariable(current,CUSTODY_KEY,canonical(custody),'dev');
  const back=await variable(current,CUSTODY_KEY);
  demand(back?.values?.length===1&&back.values[0].context==='dev'&&hash(parseStrict(value(back,'dev'),1048576))===hash(custody),'RECOVERED_CUSTODY_READBACK_FAILED');
  return {site:current,custody_recovered:true,source_site_id:HISTORICAL_SITE_ID,...proof};
}

export async function syncV11Authority(directory='artifacts/authority-prepared'){
  const custody=await recoverExistingCustody();
  await rm(directory,{recursive:true,force:true});
  const administration=await administer('sync',directory);
  await mkdir('public/authority/history',{recursive:true});
  await copyFile(directory+'/root.json','public/authority/root.json');
  await copyFile(directory+'/trust-bundle.json','public/authority/trust-bundle.json');
  try{for(const name of await readdir(directory+'/history'))await copyFile(directory+'/history/'+name,'public/authority/history/'+name);}catch(e){if(e.code!=='ENOENT')throw e;}
  return {custody_recovered:custody.custody_recovered,root_pin:custody.root_pin,issuer_key_id:custody.issuer_key_id,status_sequence:administration.status_sequence,status_renewed:administration.status_renewed,production_configuration_changed:administration.production_configuration_changed,generated_new_keys:false,root_rotated:false,payment_executed:false};
}
