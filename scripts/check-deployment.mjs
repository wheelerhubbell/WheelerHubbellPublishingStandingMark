// Manual Netlify deployment: check the actual runtime and initialize the existing
// idempotent PostgreSQL schema before publishing. No wallet or settlement call.
import {runtimeFromEnvironment} from '../src/runtime.mjs';
const env=process.env;
const missing=['WHP_ISSUER_PRIVATE_KEY','WHP_FACILITATOR_URL','WHP_RPC_URL'].filter(k=>!env[k]);
if(!env.WHP_ORIGIN&&!env.URL)missing.push('WHP_ORIGIN or Netlify URL');
if(!env.WHP_PAYMENT_REQUIREMENTS_JSON&&!env.WHP_PAYMENT_REQUIREMENTS_FILE)missing.push('WHP_PAYMENT_REQUIREMENTS_JSON');
if(env.WHP_USE_NETLIFY_DATABASE!=='true'&&!env.DATABASE_URL&&!env.NETLIFY_DB_URL)missing.push('WHP_USE_NETLIFY_DATABASE=true with a provisioned Netlify database, or DATABASE_URL');
let service;
try{
  if(missing.length){
    console.error(JSON.stringify({deployment_ready:false,error:'NETLIFY_RUNTIME_CONFIGURATION_MISSING',missing}));
    process.exitCode=1;
  }else{
    service=await runtimeFromEnvironment(env);
    await service.store.initialize();
    await service.store.get('__deployment_readiness_probe__');
    console.log(JSON.stringify({deployment_configuration_verified:true,database_schema_initialized:true,origin:service.origin,
      root_pin:service.rootPin,issuer_key_id:service.keyId,payment_executed:false,production_completion:false}));
  }
}catch(e){
  const code=typeof e.code==='string'&&/^[A-Z0-9_]{1,100}$/.test(e.code)?e.code:'DEPLOYMENT_CONFIGURATION_OR_DATABASE_INVALID';
  console.error(JSON.stringify({deployment_ready:false,error:code,production_completion:false}));process.exitCode=1;
}finally{if(service)await service.store.close();}
