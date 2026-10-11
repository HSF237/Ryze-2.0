import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const db = getFirestore(initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")})}));
const base="https://developers.cjdropshipping.com/api2.0/v1";
const pid="BF1CB4F9-B017-4753-A7E0-56467FAF1C26";
async function call(path, token, body){
 const r=await fetch(base+path,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",...(token?{"CJ-Access-Token":token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const p=await r.json();
 if(!r.ok||p.code!==200)throw new Error("CJ API returned "+p.code+" at "+path.split("?")[0]+": "+p.message);
 return p.data;
}
try {
 const ref=db.doc("integrations/cj");
 const old=(await ref.get()).data();
 let token=old?.accessToken;
 if(!token||Date.parse(old.accessTokenExpiryDate)<Date.now()+86400000){
  const data=await call("/authentication/getAccessToken",null,{apiKey:process.env.CJ_API_KEY});
  await ref.set({...data,updatedAt:Date.now()},{merge:true});token=data.accessToken;
 }
 const product=await call("/product/query?pid="+pid,token);
 const variants=await call("/product/variant/query?pid="+pid,token);
 await db.doc("integrations/cj-gloves-import").set({pid,product,variants,fetchedAt:Date.now()});
 console.log("RYZE_GLOVES_DATA_READY",pid,"variants",variants.length);
} catch(e) { console.error("RYZE_GLOVES_FETCH_FAILED",e.message);process.exitCode=1; }
await db.terminate();
