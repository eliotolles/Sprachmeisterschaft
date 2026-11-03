// Offline only. Requires the original AI_ENCRYPTION_KEY in the environment.
// Never restores directly into Turso or overwrites an existing local file.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,createDecipheriv} from 'node:crypto';
export async function decryptBackup(input,output,key){
 if(!key||typeof key!=='string')throw Error('BACKUP_KEY_REQUIRED');
 const bytes=await readFile(input);if(bytes.subarray(0,8).toString()!=='ELIOBK1\n'||bytes.length<37)throw Error('BACKUP_FORMAT');
 const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(key).digest(),bytes.subarray(8,20));decipher.setAAD(Buffer.from('Sprachmeisterschaft Turso backup v1'));decipher.setAuthTag(bytes.subarray(-16));const result=Buffer.concat([decipher.update(bytes.subarray(20,-16)),decipher.final()]);if(result.subarray(0,16).toString()!=='SQLite format 3\0')throw Error('BACKUP_SQLITE_FORMAT');await writeFile(output,result,{flag:'wx',mode:0o600});return {decrypted:true,bytes:result.length,productionWritten:false};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){try{console.log(JSON.stringify(await decryptBackup(process.argv[2],process.argv[3],process.env.AI_ENCRYPTION_KEY)));}catch{console.log(JSON.stringify({decrypted:false,productionWritten:false,error:'BACKUP_DECRYPT_FAILED'}));process.exitCode=1;}}
