// Existing production configuration machinery, restricted to the new project.
// Reuse established facilitator/RPC/payment facts; do not repeat their test campaign.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {canonical,parseStrict,demand,hash} from '../src/canonical.mjs';
import {verifyAuthority} from './authority-core.mjs';
import {postgresStore} from '../src/store.mjs';
import {livePaymentDestination} from '../src/discovery.mjs';
import {api,target,variables,put,value,ORIGIN,ROOT_PIN,exportTarget} from './netlify-production-target.mjs';
const report={checked_at:new Date().toISOString(),source_commit:process.env.GITHUB_SHA,origin:ORIGIN,payment_executed:false,paid_plan_enabled:false};
try{
 const site=await target();await exportTarget(site);
 const account=await api('/accounts/'+site.account_id);demand(account.type_name==='Free','NO_PAID_ACCOUNT_OPERATION_AUTHORIZED');report.account_plan=account.type_name;report.site_id=site.id;
 const vars=await variables(site),pub=parseStrict(await readFile('public/authority/root.json','utf8'),1048576);
 const issuer=value(vars.find(e=>e.key==='WHP_ISSUER_PRIVATE_KEY')),bundle=parseStrict(value(vars.find(e=>e.key==='WHP_TRUST_BUNDLE_JSON')),1048576);
 verifyAuthority(bundle,ROOT_PIN,issuer,Math.floor(Date.now()/1000));demand(pub.root_pin===ROOT_PIN&&value(vars.find(e=>e.key==='WHP_ROOT_PIN'))===ROOT_PIN,'ROOT_PIN_CONFIGURATION_MISMATCH');
 report.authority_verified=true;
 const requirements={scheme:'exact',network:'eip155:8453',amount:'1000000',asset:'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',payTo:'0x1050eddd8282623b0c263ed6bdbd42370bbc28d3',maxTimeoutSeconds:300,extra:{assetTransferMethod:'eip3009',paymentFlow:'authorization',name:'USD Coin',version:'2'}};
 livePaymentDestination(requirements);report.payment_requirements=requirements;
 const facilitator='https://facilitator.payai.network',rpc='https://base-rpc.publicnode.com';
 report.rail_configuration_reused_from='e1c030f3942973aec947be1d90f9060e33f4d34c';report.facilitator_and_rpc_tests_rerun=false;
 // Same idempotent managed PostgreSQL provisioning and native migration mechanism.
 await api('/sites/'+site.id+'/database','POST',{});
 const db=await api('/sites/'+site.id+'/database?role=netlifydb_owner');demand(typeof db.connection_string==='string','DATABASE_CONNECTION_REQUIRED');
 const store=await postgresStore(db.connection_string);try{
  const role=(await store.driver.query('SELECT current_user AS role'))[0].role;
  report.database={provider:'Netlify managed PostgreSQL',api_role:role,available_on_new_target:true,migration_verified:false,production_runtime_connection:'Netlify getConnectionString',migration_path:'netlify/database/migrations/0001_whp_standing.sql'};
 }finally{await store.close();}
 const configuration={WHP_USE_NETLIFY_DATABASE:'true',WHP_ORIGIN:ORIGIN,WHP_FACILITATOR_URL:facilitator,WHP_RPC_URL:rpc,WHP_PAYMENT_REQUIREMENTS_JSON:canonical(requirements),WHP_RESOLUTION_URL:ORIGIN+'/.well-known/standing-capability.json',WHP_CAPABILITY_CATALOG_URL:ORIGIN+'/discovery/provider-index.json'};
 for(const [k,v] of Object.entries(configuration))await put(site,k,v);
 const back=await variables(site);for(const [k,v] of Object.entries(configuration))demand(value(back.find(e=>e.key===k))===v,'CONFIG_READBACK_FAILED_'+k);
 demand(hash(parseStrict(value(back.find(e=>e.key==='WHP_PAYMENT_REQUIREMENTS_JSON'))))===hash(requirements),'PAYMENT_CONFIG_MISMATCH');
 report.configuration_ready_for_deployment=true;report.configuration_accepted_on_new_target=true;report.production_boundary_observed=false;
}catch(e){report.failure=e.code??e.name;process.exitCode=1;}
await mkdir('evidence/production',{recursive:true});await writeFile('evidence/production/configuration.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
