import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('Storage temporarily unavailable');return env.DB;}
export async function readRecords(owner:string){const r=await database().prepare('SELECT kind,id,body FROM store_records WHERE owner = ?').bind(owner).all<{kind:string;id:string;body:string}>();return r.results.map(x=>({...x,body:JSON.parse(x.body)}));}
export async function getRecord(owner:string,kind:string,id='main'){const r=await database().prepare('SELECT body FROM store_records WHERE owner = ? AND kind = ? AND id = ?').bind(owner,kind,id).first<{body:string}>();return r?JSON.parse(r.body):null;}
export async function putRecord(owner:string,kind:string,id:string,body:unknown){await database().prepare('INSERT INTO store_records(owner,kind,id,body,updated) VALUES(?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET body=excluded.body,updated=excluded.updated').bind(owner,kind,id,JSON.stringify(body),Date.now()).run();}
