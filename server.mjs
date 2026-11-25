// René Scott Local: original, standalone loopback-only example.
// No provider SDK, OAuth, ChatGPT tokens, files, accounts, or external APIs.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const DIR=dirname(fileURLToPath(import.meta.url));
const HOST='127.0.0.1';
const DEFAULT_PORT=4286;
const ALLOWED_FILES=new Map([
  ['/', ['public/index.html','text/html; charset=utf-8']],
  ['/app.js', ['public/app.js','text/javascript; charset=utf-8']],
  ['/style.css', ['public/style.css','text/css; charset=utf-8']]
]);

function send(res,code,payload,type='application/json; charset=utf-8'){
  res.writeHead(code,{'content-type':type,'cache-control':'no-store',
    'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
    'x-frame-options':'DENY',
    'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});
  res.end(type.startsWith('application/json')?JSON.stringify(payload):payload);
}
const fail=(code,message)=>Object.assign(Error(message),{status:code});

async function parseJson(req){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type']||''))throw fail(415,'JSON_REQUIRED');
  let value='',total=0;
  for await(const chunk of req){
    total+=chunk.length;
    if(total>32768)throw fail(413,'REQUEST_TOO_LARGE');
    value+=chunk.toString('utf8');
  }
  try{return JSON.parse(value)}catch{throw fail(400,'BAD_JSON')}
}

function validateMessages(messages){
  if(!Array.isArray(messages)||!messages.length||messages.length>12)throw fail(400,'INVALID_MESSAGES');
  for(const item of messages){
    if(!item||typeof item!=='object'||!['user','assistant'].includes(item.role)||
       typeof item.content!=='string'||!item.content.trim()||item.content.length>4000)
      throw fail(400,'INVALID_MESSAGES');
  }
  if(messages.at(-1).role!=='user')throw fail(400,'LAST_MESSAGE_MUST_BE_USER');
  return messages.map(({role,content})=>({role,content}));
}

export function createApp({fetchImpl=fetch,ollamaBase='http://127.0.0.1:11434'}={}){
  // Restrict even test-supplied base URLs: only loopback Ollama is supported.
  const u=new URL(ollamaBase);
  if(u.protocol!=='http:'||!['127.0.0.1','localhost'].includes(u.hostname)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)
    throw fail(400,'OLLAMA_MUST_BE_LOOPBACK');
  const sessionToken=randomBytes(32).toString('hex');
  async function models(){
    const r=await fetchImpl(ollamaBase+'/api/tags',{signal:AbortSignal.timeout(3000)});
    if(!r.ok)throw fail(503,'OLLAMA_UNAVAILABLE');
    const j=await r.json();
    return Array.isArray(j.models)?j.models.map(x=>x?.name).filter(x=>typeof x==='string'&&x.length<128).slice(0,32):[];
  }
  return http.createServer(async(req,res)=>{
    const origin='http://'+HOST+':'+(req.socket.localPort||DEFAULT_PORT);
    if(req.headers.host!==HOST+':'+req.socket.localPort){send(res,403,{error:'INVALID_HOST'});return}
    let path;
    try{path=new URL(req.url,origin).pathname;}catch{send(res,400,{error:'BAD_URL'});return}
    // Reject query strings to keep the interface's request surface narrow.
    if(req.url.includes('?')){send(res,400,{error:'QUERY_NOT_SUPPORTED'});return}
    try{
      if(req.method==='GET'&&ALLOWED_FILES.has(path)){
        const [file,mime]=ALLOWED_FILES.get(path);
        const body=await readFile(resolve(DIR,file));
        send(res,200,body,mime);return;
      }
      if(req.method==='GET'&&path==='/api/status'){
        send(res,200,{project:'rene-scott-local',mode:'local-only',chatgpt:'not-connected',claude:'not-connected',ollama:'local'});return;
      }
      if(req.method==='GET'&&path==='/api/session'){
        send(res,200,{csrf:sessionToken});return;
      }
      if(req.method==='GET'&&path==='/api/models'){
        try{send(res,200,{models:await models()});}
        catch{send(res,503,{error:'OLLAMA_UNAVAILABLE',models:[]});}
        return;
      }
      if(req.method==='POST'&&path==='/api/chat'){
        if(req.headers.origin!==origin||req.headers['x-rs-session']!==sessionToken){send(res,403,{error:'UNAUTHORIZED_LOCAL_REQUEST'});return}
        const body=await parseJson(req);
        if(!body||typeof body.model!=='string')throw fail(400,'INVALID_MODEL');
        const allowed=await models();
        if(!allowed.includes(body.model))throw fail(400,'MODEL_NOT_AVAILABLE');
        const messages=validateMessages(body.messages);
        const out=await fetchImpl(ollamaBase+'/api/chat',{
          method:'POST',headers:{'content-type':'application/json'},
          body:JSON.stringify({model:body.model,messages,stream:false,
            // Some Qwen 3.x releases return thinking but no final content unless disabled.
            ...(/^qwen3(?:\.[0-9]+)?(?::|[-/]|$)/i.test(body.model)?{think:false}:{}),
            options:{num_predict:512}}),
          signal:AbortSignal.timeout(120000)
        });
        if(!out.ok)throw fail(502,'OLLAMA_REQUEST_FAILED');
        const result=await out.json();
        const text=result?.message?.content;
        if((typeof text!=='string'||!text.trim())&&typeof result?.message?.thinking==='string'&&result.message.thinking.trim())
          throw fail(502,'OLLAMA_THINKING_ONLY');
        if(typeof text!=='string'||!text.trim()||text.length>1048576)throw fail(502,'OLLAMA_INVALID_RESPONSE');
        send(res,200,{model:body.model,text,provider:'ollama-local'});return;
      }
      send(res,404,{error:'NOT_FOUND'});
    }catch(e){
      const timedOut=e?.name==='TimeoutError'||e?.name==='AbortError';
      send(res,e.status||(timedOut?504:503),{error:e.status?e.message:(timedOut?'OLLAMA_TIMEOUT':'LOCAL_SERVICE_UNAVAILABLE')});
    }
  });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const raw=process.env.RS_LOCAL_PORT||String(DEFAULT_PORT);
  const port=Number(raw);
  if(!Number.isInteger(port)||port<1024||port>65535){console.error('Puerto inválido');process.exit(1)}
  const server=createApp();
  server.listen(port,HOST,()=>console.log(`René Scott Local — http://${HOST}:${port}\nOllama: localhost:11434 (solo local)\nMain y Claude: NO CONECTADOS\nCtrl+C para detener`));
}
