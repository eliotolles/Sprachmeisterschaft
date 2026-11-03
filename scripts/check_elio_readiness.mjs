// Read-only preflight. Does not apply schema, enable flags, authenticate users,
// call paid providers, print credentials, or touch existing rows.
import {query,APPROVED_HOST,databaseEndpoint} from '../src/core/elio/database.js';
export async function collectReadiness(env){
 databaseEndpoint(env.TURSO_DATABASE_URL,APPROVED_HOST);
 const tables=(await query(env,"SELECT name FROM sqlite_master WHERE type='table'",[])).rows.map(r=>r.name);
 const missingTables=['sprach_core_sessions','sprach_core_limits','sprach_core_google_flows'].filter(t=>!tables.includes(t));
 const counts={};for(const t of ['ee_users','ee_records','ee_state','elio_shared_vocabulary'])if(tables.includes(t))counts[t]=Number((await query(env,'SELECT count(*) AS n FROM '+t,[])).rows[0].n);
 const aiConfigs=tables.includes('ee_config')?Number((await query(env,"SELECT count(*) AS n FROM ee_config WHERE key GLOB 'sprach:ai:*'",[])).rows[0].n):0;
 const knownGoogleConfig=!!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET;
 const knownTranscriptConfig=!!env.TRANSCRIPT_BACKEND_URL&&!!env.TRANSCRIPT_BACKEND_TOKEN;
 return {approvedHost:APPROVED_HOST,checkedAt:new Date().toISOString(),readOnly:true,counts,missingTables,aiConfigs,providedEnvironment:{google:knownGoogleConfig,transcript:knownTranscriptConfig,encryptionKey:!!env.AI_ENCRYPTION_KEY},ready:false,blockers:[...(missingTables.length?['Additive schema is not applied']:[]),...(!aiConfigs?['No core AI providers are configured']:[]),...(!knownGoogleConfig?['Google credentials are absent from the provided environment; Worker secrets have not been inspected']:[]),...(!knownTranscriptConfig?['Transcript backend is absent from the provided environment; Worker secrets have not been inspected']:[]),'Live Google/provider/media acceptance and remaining module/data mappings are required']};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 try{console.log(JSON.stringify(await collectReadiness(process.env),null,2));}
 catch(e){console.log(JSON.stringify({ready:false,readOnly:true,errorCode:e.code||'PREFLIGHT_FAILED'}));process.exitCode=1;}
}
