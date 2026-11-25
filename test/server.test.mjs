import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';

function setup(){
 let calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/api/tags'))return {ok:true,json:async()=>({models:[{name:'local-fixture:1'}]})};
  if(url.endsWith('/api/chat'))return {ok:true,json:async()=>({message:{content:'Respuesta local sintética'}})};
  throw Error('Unrecognized URL');
 };
 const server=createApp({fetchImpl});
 return {calls,server};
}
async function live(t){
 const f=setup();await new Promise(resolve=>f.server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>f.server.close(resolve)));
 const url='http://127.0.0.1:'+f.server.address().port;
 const token=(await (await fetch(url+'/api/session')).json()).csrf;
 return {...f,url,token};
}
test('Local client starts on loopback, serves page, shows disabled cloud providers',async t=>{
 const f=await live(t);
 assert.equal((await fetch(f.url)).status,200);
 const status=await (await fetch(f.url+'/api/status')).json();
 assert.equal(status.chatgpt,'not-connected');
 assert.equal(status.claude,'not-connected');
 assert.equal(f.calls.length,0);
});
test('Only local Ollama model and exact same-origin authorized POST are allowed',async t=>{
 const f=await live(t);
 const models=await (await fetch(f.url+'/api/models')).json();
 assert.deepEqual(models.models,['local-fixture:1']);
 const body={model:'local-fixture:1',messages:[{role:'user',content:'Hola'}]};
 const options={method:'POST',headers:{'content-type':'application/json','origin':f.url,'x-rs-session':f.token},body:JSON.stringify(body)};
 const ok=await fetch(f.url+'/api/chat',options);
 assert.equal(ok.status,200);
 assert.deepEqual(await ok.json(),{model:'local-fixture:1',text:'Respuesta local sintética',provider:'ollama-local'});
 assert.equal(f.calls.filter(c=>c.url.endsWith('/api/chat')).length,1);
 assert.equal((await fetch(f.url+'/api/chat',{...options,headers:{...options.headers,'origin':'https://evil.invalid'}})).status,403);
 assert.equal((await fetch(f.url+'/api/chat',{...options,headers:{...options.headers,'x-rs-session':'bad'}})).status,403);
 assert.equal((await fetch(f.url+'/api/chat',{...options,body:JSON.stringify({...body,model:'remote-unapproved'})})).status,400);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/api/chat')).length,1);
});
test('No outward Ollama base URL is permitted',()=>{
 assert.throws(()=>createApp({fetchImpl:async()=>null,ollamaBase:'https://api.openai.com'}),{message:'OLLAMA_MUST_BE_LOOPBACK'});
 assert.throws(()=>createApp({fetchImpl:async()=>null,ollamaBase:'http://192.168.1.1:11434'}),{message:'OLLAMA_MUST_BE_LOOPBACK'});
});
