const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function setup(){
    const callbacks={};const jobs=new Map();let sequence=0;
    const location={hash:'#/details'};const body={};const doc={body,activeElement:null};
    const item={offsetParent:{},matches:()=>false,focusCount:0,blur(){doc.activeElement=body;},focus(){this.focusCount++;doc.activeElement=this;}};
    doc.activeElement=item;
    const view={contains:element=>element===item};
    const schedule=fn=>{const id=++sequence;jobs.set(id,fn);return id;};
    const context={window:{addEventListener(name,fn){(callbacks[name]??=[]).push(fn);}},document:doc,location,navigator:{userAgent:'fixture'},localStorage:{getItem:()=> 'fixture-device'},btoa:value=>Buffer.from(value).toString('base64'),tizen:{application:{getCurrentApplication:()=>({appInfo:{version:'0.2.2'}})},tvinputdevice:{registerKey(){},unregisterKey(){}}},console:{log(){}},setTimeout:schedule,clearTimeout:id=>jobs.delete(id),requestAnimationFrame:schedule};
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../tizen.js'),'utf8'),context);
    return {doc,item,view,location,show(restored=true){callbacks.viewshow.forEach(fn=>fn({target:view,detail:{isRestored:restored}}));},flush(){for(let i=0;jobs.size&&i<10;i++){const batch=Array.from(jobs);jobs.clear();batch.forEach(([,fn])=>fn());}},jobs};
}
test('Back refreshes the same selected control after the restored view settles',()=>{
    const state=setup();state.show();assert.equal(state.item.focusCount,0);state.flush();assert.equal(state.item.focusCount,1);assert.equal(state.doc.activeElement,state.item);
});
test('a user who moves focus before the delay is not interrupted',()=>{
    const state=setup();state.show();const other={};state.doc.activeElement=other;state.flush();assert.equal(state.item.focusCount,0);assert.equal(state.doc.activeElement,other);
});
test('forward navigation and the video OSD are not refocused',()=>{
    const state=setup();state.show(false);state.flush();assert.equal(state.item.focusCount,0);state.location.hash='#/video';state.show();state.flush();assert.equal(state.item.focusCount,0);
});
test('editable fields and hidden controls are left alone',()=>{
    const state=setup();state.item.matches=()=>true;state.show();state.flush();assert.equal(state.item.focusCount,0);state.item.matches=()=>false;state.item.offsetParent=null;state.show();state.flush();assert.equal(state.item.focusCount,0);
});
test('a subsequent view change cancels a pending refresh',()=>{
    const state=setup();state.show();state.show(false);state.flush();assert.equal(state.item.focusCount,0);
});
