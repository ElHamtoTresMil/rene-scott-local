'use strict';
const $=id=>document.getElementById(id);
const state={csrf:'',models:[],messages:[],busy:false};
async function json(path,options={}){const r=await fetch(path,{cache:'no-store',...options});const out=await r.json();if(!r.ok)throw Error(out.error||'Error');return out}
function renderMessage(role,content){const empty=$('messages').querySelector('.empty');if(empty)empty.remove();const el=document.createElement('div');el.className='msg '+role;el.textContent=content;$('messages').append(el);$('messages').scrollTop=$('messages').scrollHeight}
function refreshButton(){ $('submit').disabled=state.busy||!state.models.length; $('refresh').disabled=state.busy; }
async function load(){
 try{
  const data=await json('/api/models');state.models=data.models;
  const select=$('model');select.replaceChildren();
  for(const name of state.models){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option)}
  select.disabled=!state.models.length;
  $('ollama-status').textContent=state.models.length?state.models.length+' modelo(s) local(es) disponible(s)':'Sin modelos locales';
 }catch{$('ollama-status').textContent='Ollama no disponible en 127.0.0.1:11434';state.models=[];$('model').disabled=true}
 refreshButton();
}
$('refresh').addEventListener('click',load);
$('send').addEventListener('submit',async event=>{
 event.preventDefault();if(state.busy||!state.models.length)return;
 const prompt=$('prompt').value.trim(),model=$('model').value;
 if(!prompt||!model)return;
 const messages=[...state.messages,{role:'user',content:prompt}].slice(-12);
 state.busy=true;refreshButton();renderMessage('user',prompt);$('prompt').value='';
 try{
  const answer=await json('/api/chat',{method:'POST',headers:{'content-type':'application/json','x-rs-session':state.csrf},body:JSON.stringify({model,messages})});
  state.messages=[...messages,{role:'assistant',content:answer.text}].slice(-12);
  renderMessage('assistant',answer.text);
 }catch(error){renderMessage('assistant','Error local: '+error.message+' (el mensaje no se guardó).')}
 finally{state.busy=false;refreshButton()}
});
(async()=>{try{state.csrf=(await json('/api/session')).csrf;await load()}catch{$('ollama-status').textContent='No se puede establecer la sesión local'}})();
