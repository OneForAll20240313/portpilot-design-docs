/* ============================================================
Bytestream Module
Auto-extracted from prototype-v16-enhanced.html
PortPilot UI Prototype v16
============================================================ */

function updateBytesSummary(node){
 var dot=document.getElementById('bytesStateDot');
 var txt=document.getElementById('bytesStateText');
 var pt=document.getElementById('bytesPortText');
 if(!dot||!txt) return;
 var mode=node?node.dataset.mode:'bytes';
 var online=node?(node.dataset.state==='online'):true;
 var baud=node?(node.dataset.baud||(node.querySelector('.badge')?node.querySelector('.badge').textContent:'115200')):'115200';
 dot.className='cs-dot '+(online?'connected':'');
 txt.textContent=online?('已连接 · '+baud+' bps'):'离线 · '+baud+' bps';
 if(pt) pt.textContent=(node?node.dataset.name:'')+'';
}
