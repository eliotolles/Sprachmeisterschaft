import {discoverModels} from './ai-providers.js';
import {digest} from './passwords.js';
// Per-worker binding scope, successful catalogs only. No raw keys, prompts or responses are cached.
const TTL=300000,MAX_ENTRIES=64;
export function createModelCatalogCache({discover=discoverModels,now=()=>Date.now()}={}){
 const caches=new WeakMap();
 const scope=env=>{let cache=caches.get(env);if(!cache){cache=new Map();caches.set(env,cache);}return cache;};
 const prefix=async(provider,key)=>provider+':'+await digest(key)+':';
 return {
  async read(env,provider,key,{freeOnly=false,deadlineAt=now()+120000}={}){
   const cache=scope(env),id=await prefix(provider,key)+(freeOnly?'free':'all'),entry=cache.get(id);
   if(entry&&(entry.pending||entry.expires>now())){const status=entry.pending?'shared':'hit';return {...structuredClone(await entry.promise),cacheStatus:status};}
   cache.delete(id);while(cache.size>=MAX_ENTRIES)cache.delete(cache.keys().next().value);
   const next={pending:true,expires:0,promise:null};
   next.promise=Promise.resolve().then(()=>discover(provider,key,{freeOnly,deadlineAt:Math.min(deadlineAt,now()+8000)})).then(catalog=>{next.pending=false;next.expires=now()+TTL;return structuredClone(catalog);},error=>{if(cache.get(id)===next)cache.delete(id);throw error;});
   cache.set(id,next);return {...structuredClone(await next.promise),cacheStatus:'miss'};
  },
  async invalidate(env,provider,key){const cache=scope(env),start=await prefix(provider,key);for(const id of cache.keys())if(id.startsWith(start))cache.delete(id);}
 };
}
const catalogs=createModelCatalogCache();
export const cachedModelCatalog=(env,provider,key,options)=>catalogs.read(env,provider,key,options);
export const invalidateModelCatalog=(env,provider,key)=>catalogs.invalidate(env,provider,key);
