const book=JSON.parse(document.querySelector('#seed').textContent);
const caseStorage={getItem(k){if(k==='cmt_current_project')return book.project.id;return null},setItem(){}};
const CMT=window.CMT={
  getProject:async()=>book.project,getCurrentProjectId:()=>book.project.id,setCurrentProjectId(){},
  loadAllModules:async()=>structuredClone(book.modules),
  getTouchedModules:async()=>Object.keys(book.modules),
  saveModule:async(id,key,value)=>parent.postMessage({type:'saved',value},'*'),
  exportProject:()=>parent.postMessage({type:'export'},'*')
};
addEventListener('message',e=>{if(e.source===parent&&e.data==='snapshot')parent.postMessage({type:'snapshot',value:data},'*')});
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a)return;
  const url=a.getAttribute('href');if(url==='#')return;
  e.preventDefault();
  if(/^unit[1-6].*\.html(?:\?|$)|^index\.html/.test(url))
    parent.postMessage({type:'open',target:url},'*');
},true);
