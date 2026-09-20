import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const tmp=mkdtempSync(join(tmpdir(),'ryze-test-'));const sql=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(join('drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const prepare=(query)=>{let args=[];return{bind(...a){args=a;return this},async run(){const result=sql.prepare(query).run(...args);return{meta:{changes:Number(result.changes)}}},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}}}};
globalThis.ryzeTestDB={prepare};globalThis.ryzeTestUser=null;
function compile(source,name,replacements={}){let text=readFileSync(source,'utf8');for(const [a,b]of Object.entries(replacements))text=text.replaceAll(a,b);writeFileSync(join(tmp,name),ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);}
writeFileSync(join(tmp,'auth.mjs'),'export async function getChatGPTUser(){return globalThis.ryzeTestUser;}');writeFileSync(join(tmp,'env.mjs'),'export const env={DB:globalThis.ryzeTestDB};');
compile('lib/catalog.ts','catalog.mjs');compile('lib/store-db.ts','db.mjs',{'cloudflare:workers':'./env.mjs'});compile('app/api/store/route.ts','api.mjs',{'@/app/chatgpt-auth':'./auth.mjs','@/lib/store-db':'./db.mjs','@/lib/catalog':'./catalog.mjs'});
const {GET,POST}=await import(pathToFileURL(join(tmp,'api.mjs')).href);
async function post(data,origin='https://preview.test'){const r=await POST(new Request('https://preview.test/api/store',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)}));return{status:r.status,data:await r.json()};}
const userA={userId:'test-a',email:'a@example.test',fullName:'A'};const userB={userId:'test-b',email:'b@example.test',fullName:'B'};
try{
assert.equal((await post({action:'cart',id:'aura',qty:1})).status,401);
globalThis.ryzeTestUser=userA;
assert.equal((await post({action:'cart',id:'aura',qty:1},'https://other.test')).status,403);
for(const qty of [-1,1.5,21])assert.equal((await post({action:'cart',id:'aura',qty})).status,400);
assert.equal((await post({action:'cart',id:'missing',qty:1})).status,400);
let r=await post({action:'cart',id:'aura',qty:2});assert.equal(r.data.cart[0].qty,2);
assert.equal((await (await GET()).json()).cart[0].qty,2);
await post({action:'wishlist',id:'arc'});await post({action:'profile',name:'Preview A'});
globalThis.ryzeTestUser=userB;let other=await (await GET()).json();assert.equal(other.cart.length,0);assert.equal(other.wishlist.length,0);assert.deepEqual(other.profile,{});
globalThis.ryzeTestUser=userA;
await post({action:'search',query:'wireless audio'});await post({action:'location',city:'Kannur',pin:'670001'});r=await post({action:'claimVoucher',code:'FIRST250'});assert.equal(r.data.vouchers[0].code,'FIRST250');
const savedState=await (await GET()).json();assert.deepEqual(savedState.searches,['wireless audio']);assert.equal(savedState.location.pin,'670001');
const orderData={action:'previewOrder',key:'12345678-abcd-1234-1234-123456789abc',coupon:'RYZE10',voucher:'FIRST250',method:'UPI',simulated:true,address:{name:'Preview A',line:'Example street',city:'Kannur',pin:'670001'},total:1};
r=await post(orderData);assert.equal(r.status,200);assert.equal(r.data.order.subtotal,6998);assert.equal(r.data.order.discount,950);assert.equal(r.data.order.total,6048);assert.equal(r.data.order.paid,false);assert.equal(r.data.order.status,'Preview saved');assert.equal(r.data.order.mockPayment.method,'UPI');
const first=r.data.order;r=await post(orderData);assert.deepEqual(r.data.order,first);assert.equal(r.data.orders.length,1);
globalThis.ryzeTestUser=userB;assert.equal((await post({action:'cancelOrder',id:first.id})).status,404);assert.equal((await (await GET()).json()).orders.length,0);
globalThis.ryzeTestUser=userA;assert.equal((await post({action:'cancelOrder',id:first.id})).data.orders[0].status,'Cancelled');assert.equal((await post({action:'cancelOrder',id:first.id})).status,400);
const basicOrder={...orderData,voucher:''};
await post({action:'catalog',id:'aura',name:'Aura Studio Headphones',price:3500,stock:1});assert.equal((await post({...basicOrder,key:'22345678-abcd-1234-1234-123456789abc'})).status,400);
await post({action:'cart',id:'aura',qty:1});r=await post({...basicOrder,key:'32345678-abcd-1234-1234-123456789abc'});assert.equal(r.data.order.subtotal,3500);
await post({action:'cart',id:'aura',qty:0});assert.equal((await post({...orderData,key:'42345678-abcd-1234-1234-123456789abc'})).status,400);
assert.equal((await post({action:'address',address:{name:'A',line:'B',city:'C',pin:'bad'}})).status,400);
for(const id of ['aura','type','pulse'])await post({action:'compare',id});assert.equal((await post({action:'compare',id:'arc'})).status,400);
console.log('PASS: authenticated saves, user isolation, stock validation, server totals, duplicate order protection, cancellation ownership, catalogue price updates, address validation and comparison limits.');
}finally{sql.close();rmSync(tmp,{recursive:true,force:true});delete globalThis.ryzeTestDB;delete globalThis.ryzeTestUser;}
