const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function host(mkvSupport){
    const context={window:{addEventListener(){}},document:{createElement:()=>({canPlayType:type=>type.includes('mkv')||type.includes('matroska')?mkvSupport:''})},navigator:{userAgent:'Tizen test'},localStorage:{getItem:()=> 'fixture-device'},btoa:value=>Buffer.from(value).toString('base64'),tizen:{application:{getCurrentApplication:()=>({appInfo:{version:'0.2.2'}})}},console:{log(){}}};
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../tizen.js'),'utf8'),context);
    return context.window.NativeShell.AppHost;
}
function profile(){return {DirectPlayProfiles:[{Type:'Video',Container:'mkv'},{Type:'Video',Container:'mp4,mkv,m4v',VideoCodec:'h264'},{Type:'Audio',Container:'mkv'},{Type:'Video',Container:'hls'}],TranscodingProfiles:[{Container:'ts',Protocol:'hls'}]};}
test('unsupported MKV is removed while MP4, HLS, audio and transcoding remain',()=>{
    const result=host('').getDeviceProfile(profile);
    assert.deepEqual(JSON.parse(JSON.stringify(result.DirectPlayProfiles)),[{Type:'Video',Container:'mp4,m4v',VideoCodec:'h264'},{Type:'Audio',Container:'mkv'},{Type:'Video',Container:'hls'}]);
    assert.equal(result.TranscodingProfiles[0].Protocol,'hls');
});
test('a TV reporting real MKV support retains its profile',()=>{
    assert.equal(host('maybe').getDeviceProfile(profile).DirectPlayProfiles[0].Container,'mkv');
});
test('legacy no response is treated as unsupported',()=>{
    assert.equal(host('no').getDeviceProfile(profile).DirectPlayProfiles.some(entry=>entry.Type==='Video'&&entry.Container==='mkv'),false);
});
test('SyncPlay uses the same supported-container correction',()=>{
    assert.equal(host('').getSyncProfile(profile).DirectPlayProfiles.some(entry=>entry.Type==='Video'&&entry.Container==='mkv'),false);
});
