/* ============================================================
   App Core - State, Router, Initialization, Shared Utilities
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

// ===== 路由：视图与模块互斥，各自维护状态 =====
var routeMap = {};
var currentView = 'view-bytes';   // 当前会话内的视图（字节流/终端/协议）
var currentModule = null;         // 当前打开的模块（可视化/命令/设置），null 表示在会话视图
var lastView = 'view-bytes';      // 记录离开会话视图前的视图，用于从模块返回时还原

// 显示指定 page，隐藏其余
function showPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.getElementById(id).classList.add('active');
}
// 高亮视图 Tab
function highlightViewTabs(viewId){
  document.querySelectorAll('.vt-item').forEach(function(b){b.classList.toggle('active', b.dataset.view===viewId)});
}

// ===== 视图切换（会话内：字节流/终端/协议，互斥） =====
function switchView(viewId, btn){
 currentModule = null;      // 回到会话视图
 currentView = viewId;
 lastView = viewId;
 showPage(viewId);
 highlightViewTabs(viewId);
 var bb=document.getElementById('backBtn'); if(bb)bb.style.display='none';
}
// 打开模块（可视化/命令/设置），记录返回档位
function openModule(moduleId){
 if(currentModule===null) lastView = currentView;  // 首次离开会话视图时记住返回点
 currentView = null;        // 当前不在会话视图
 currentModule = moduleId;
 showPage(moduleId);
 // 视图 Tab 全部取消高亮
 document.querySelectorAll('.vt-item').forEach(function(b){b.classList.remove('active')});
 var bb=document.getElementById('backBtn'); if(bb)bb.style.display='inline-block';
}
// 从模块返回会话视图（供"返回"按钮/会话选择调用）
function backToView(){
 if(currentModule===null) return;   // 已在会话视图
 currentModule = null;
 currentView = lastView;
 showPage(lastView);
 highlightViewTabs(lastView);
 var bb=document.getElementById('backBtn'); if(bb)bb.style.display='none';
}

// ===== 会话选择 =====
function selectSession(el, name){
 document.querySelectorAll('.session-node').forEach(function(n){n.classList.remove('active')});
 el.classList.add('active');
 // 更新详情
 var detail = document.getElementById('sessionDetail');
 if(detail){
  detail.querySelector('.sd-row b').textContent = name;
 }
 // 更新会话管理面板（联动）
  syncSessionManager(el);
  // 若当前处于模块页：在设置页内保持设置页以便连续切换对比；其他模块返回该会话视图
  if(currentModule==='page-settings'){
   backToView();
   openModule('page-settings');
  } else if(currentModule){
    backToView();
    // 视图已恢复后重新应用模式，纠正到新模式对应的默认视图（修复跨模式切换残留）
    if(el&&el.dataset.mode) applyMode(el.dataset.mode);
   }
  }
// 根据会话所在节点应用模式（视图Tab + 可视化显隐）
function applyMode(mode){
 var isBytes = (mode!=='terminal');
 // 视图 Tab 按模式显示
 document.querySelectorAll('.vt-item').forEach(function(b){
  var show = b.classList.contains('vm-bytes') ? isBytes : b.classList.contains('vm-terminal') ? !isBytes : true;
  b.style.display = show ? '' : 'none';
 });
 // 可视化按钮：字节流模式开放，终端模式不开放
 var vb=document.getElementById('vizBtn'); if(vb) vb.style.display = isBytes ? '' : 'none';
 // 若当前视图不属于该模式，切到模式默认视图
 if(!isBytes && currentView && currentView!=='view-terminal'){
  switchView('view-terminal',document.querySelector('.vt-item[data-view=view-terminal]'));
 } else if(isBytes && currentView==='view-terminal'){
  switchView('view-bytes',document.querySelector('.vt-item[data-view=view-bytes]'));
 }
}
// 同步会话管理面板：名称/模式/状态 + 按状态禁用连接参数
function syncSessionManager(node){
 var mode = node ? node.dataset.mode : 'bytes';
 var state = node ? node.dataset.state : 'online';
 var name = node ? (node.dataset.name||node.querySelector('.name').textContent) : '';
 var online = (state==='online');
 // 顶部
 var smName=document.getElementById('smName'); if(smName) smName.textContent=name;
 var smNameInput=document.getElementById('smNameInput'); if(smNameInput) smNameInput.value=name;
 var smMode=document.getElementById('smMode');
 var smModeInput=document.getElementById('smModeInput');
 if(smMode) smMode.textContent = (mode==='terminal')?'终端':'字节流';
 if(smModeInput) smModeInput.value = mode;
 var dot=document.getElementById('smStateDot'); if(dot) dot.className='sdot '+(online?'on':'off');
var st=document.getElementById('smStateText'); if(st) st.textContent=online?'在线':'离线';
// 会话详情 + 顶部全局状态联动
var dD=document.getElementById('sessionDetail');
var dP=dD?dD.querySelector('.sd-title .sdot'):null;
if(dP) dP.className='sdot '+(online?'on':'off');
var gs=document.querySelector('.global-status');
if(gs) gs.innerHTML='<span class="gs-dot'+(online?'':' off')+'"></span> '+(online?('已连接 · '+name):('离线 · '+name));
 var btn=document.getElementById('smConnectBtn'); if(btn) btn.textContent=online?'断开':'连接';
 btn.style.background=online?'var(--danger)':'var(--primary)';
 btn.style.borderColor=online?'var(--danger)':'var(--primary)';
 btn.style.color=online?'#fff':'#04211e';
 // 连接参数禁用（在线时置灰）
 ['smPort','smBaud','smDataBits','smStopBits','smParity'].forEach(function(id){
  var el=document.getElementById(id); if(el) el.disabled=online;
 });
 // 回填波特率（随会话切换联动，源自节点 badge）
 var baudEl=document.getElementById('smBaud');
 if(baudEl && node){
  var b=node.dataset.baud||(node.querySelector('.badge')?node.querySelector('.badge').textContent:'');
  if(b){
   var opt=baudEl.querySelector('option[value="'+b+'"]');
   baudEl.value=opt?opt.value:b;
  }
 }
 // 回填视图模式对应标签已由 smMode/smModeInput 处理
 // 应用视图模式
 applyMode(mode);
 updateBytesSummary(node);
}
// 更新字节流视图顶部只读状态摘要
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

// ===== 会话右键菜单 =====
var ctxNode = null; // 右键目标会话节点
function showSessionMenu(e,name){
 e.preventDefault(); e.stopPropagation();
 var m = document.getElementById('sessionCtxMenu');
 m.style.display='block';
 m.style.left=Math.min(e.clientX,window.innerWidth-180)+'px';
 m.style.top=Math.min(e.clientY,window.innerHeight-240)+'px';
 m.dataset.session=name;
 // 记录目标节点
 ctxNode = e.currentTarget.closest('.session-node');
 // 按会话状态条件显示"连接/断开"：在线显示断开、离线显示连接
 var online=(ctxNode&&ctxNode.dataset.state==='online');
 var items=m.querySelectorAll('.ctx-item');
 items.forEach(function(it){
  var act=(it.getAttribute('onclick')||'').match(/sessionMenuAction\('(\w+)'\)/);
  if(act){
   var a=act[1];
   if(a==='connect') it.style.display=online?'none':'';
   else if(a==='disconnect') it.style.display=online?'':'none';
  }
 });
}
function sessionMenuAction(action){
 var m=document.getElementById('sessionCtxMenu');
 m.style.display='none';
 var node=ctxNode;
 if(action==='delete'){
  var nm=node?node.querySelector('.name').textContent:(m.dataset.session||'');
  if(confirm('删除会话 "'+nm+'"？')){ node&&node.remove(); }
 }
 else if(action==='settings'){ openSessionSettings(node); }
 else if(action==='duplicate'){ duplicateSession(node); }
 else if(action==='rename'){ renameSession(node); }
 else if(action==='connect'){ setSessionState(node,'online'); }
 else if(action==='disconnect'){ setSessionState(node,'offline'); }
}
document.addEventListener('click',function(e){
 if(!e.target.closest('#sessionCtxMenu')) document.getElementById('sessionCtxMenu').style.display='none';
});

// 设置会话在线/离线状态（右键连接/断开 + 会话管理通用）
function setSessionState(node,state){
 if(!node) return;
 var online=(state==='online');
 node.dataset.state=online?'online':'offline';
 var dot=node.querySelector('.sdot'); if(dot) dot.className='sdot '+(online?'on':'off');
 if(node.classList.contains('active')) syncSessionManager(node);
 updateBytesSummary(node);
}
// 重命名会话
function renameSession(node){
 if(!node) return;
 var old=node.dataset.name||node.querySelector('.name').textContent;
 var nm=prompt('重命名会话：',old);
 if(nm&&nm.trim()){
  node.dataset.name=nm.trim();
  node.querySelector('.name').textContent=nm.trim();
  if(node.classList.contains('active')) syncSessionManager(node);
 }
}
// 复制会话：克隆连接/缓冲/模式参数，生成离线副本，统计不继承
function duplicateSession(src){
 var tree=document.querySelector('.session-tree');
 // 插入到源会话所在分组（无源则第一个分组）
 var group = src ? (src.closest('.session-group')||tree.querySelector('.session-group')) : tree.querySelector('.session-group');
 var body=group.querySelector('.sg-body');
 // 生成副本名（递增后缀）
 var base=src?src.dataset.name:'新会话';
 var name=base+' (副本)';
 var exist=Array.prototype.slice.call(body.querySelectorAll('.session-node .name')).map(function(s){return s.textContent});
 var i=2;
 while(exist.indexOf(name)>-1){ name=base+' (副本 '+i+')'; i++; }
 // 创建副本节点：克隆连接/缓冲/模式参数，状态离线，统计不继承
 var node=document.createElement('div');
 node.className='session-node';
 node.setAttribute('data-mode',src?src.dataset.mode:'bytes');
 node.setAttribute('data-state','offline');
 node.setAttribute('data-name',name);
 node.setAttribute('data-baud',src?(src.dataset.baud||(src.querySelector('.badge')?src.querySelector('.badge').textContent:'115200')):'115200');
 // 克隆连接/缓冲参数（源无则用默认）
 node.setAttribute('data-port',src?(src.dataset.port||''):'');
 node.setAttribute('data-databits',src?(src.dataset.databits||'8'):'8');
 node.setAttribute('data-stopbits',src?(src.dataset.stopbits||'1'):'1');
 node.setAttribute('data-parity',src?(src.dataset.parity||'None'):'None');
 node.setAttribute('data-bufstrategy',src?(src.dataset.bufstrategy||'环形缓冲'):'环形缓冲');
 node.setAttribute('data-bufsize',src?(src.dataset.bufsize||'16 MB'):'16 MB');
 node.setAttribute('data-overflow',src?(src.dataset.overflow||'停止接收'):'停止接收');
 var modeText=(node.dataset.mode==='terminal')?'终端':'字节流';
 node.innerHTML='<span class="sdot off"></span><span class="name">'+name+'</span><span class="badge">'+node.dataset.baud+'</span><span class="mode-tag">'+modeText+'</span><span class="s-more">⋯</span>';
 node.onclick=function(){selectSession(this,name)};
 node.oncontextmenu=function(e){showSessionMenu(e,name)};
 body.appendChild(node);
 // 更新计数
 var cnt=body.querySelectorAll('.session-node').length;
 group.querySelector('.sg-count').textContent=cnt;
 // 清理搜索残留并选中副本
 var si=document.getElementById('searchInput'); if(si)si.value='';
 var cb=document.getElementById('chipsBox'); if(cb)cb.innerHTML='';
 updateSearchCount();
 selectSession(node,name);
}

// ===== 会话设置弹窗 =====
function openSessionSettings(node){
 node=node||document.querySelector('.session-node.active');
 if(!node) return;
 ctxNode=node;
 var overlay=document.getElementById('ssOverlay');
 if(!overlay) return;
 // 回填字段
 var name=node.dataset.name||node.querySelector('.name').textContent;
 var mode=node.dataset.mode||'bytes';
 var online=(node.dataset.state==='online');
 var baud=node.dataset.baud||(node.querySelector('.badge')?node.querySelector('.badge').textContent:'115200');
 var ssN=document.getElementById('ssName'); if(ssN) ssN.textContent=name;
 setVal('ssNameInput',name);
 setVal('ssModeInput',mode);
 setSel('ssBaud',baud);
 // 回填连接/缓冲参数（从节点 data 属性，无则用默认)
 setSel('ssPort',node.dataset.port||'');
 setSel('ssDataBits',node.dataset.databits||'8');
 setSel('ssStopBits',node.dataset.stopbits||'1');
 setSel('ssParity',node.dataset.parity||'None');
 setSel('ssBufStrategy',node.dataset.bufstrategy||'环形缓冲');
 setSel('ssBufSize',node.dataset.bufsize||'16 MB');
 setSel('ssOverflow',node.dataset.overflow||'停止接收');
 // 状态
 var dot=document.getElementById('ssStateDot'); if(dot) dot.className='sdot '+(online?'on':'off');
 var st=document.getElementById('ssStateText'); if(st) st.textContent=online?'在线':'离线';
 var btn=document.getElementById('ssConnectBtn'); if(btn){ btn.textContent=online?'断开':'连接'; btn.style.background=online?'var(--danger)':'var(--primary)'; btn.style.borderColor=online?'var(--danger)':'var(--primary)'; btn.style.color=online?'#fff':'#04211e'; }
 // 连接参数禁用（在线置灰）
 ['ssPort','ssBaud','ssDataBits','ssStopBits','ssParity'].forEach(function(id){ var el=document.getElementById(id); if(el) el.disabled=online; });
 // 清测试结果
 var tr=document.getElementById('ssTestResult'); if(tr) tr.textContent='';
 overlay.classList.add('show');
}
function setVal(id,v){ var el=document.getElementById(id); if(el) el.value=v; }
function setSel(id,v){ var el=document.getElementById(id); if(el){ var o=el.querySelector('option[value="'+v+'"]'); el.value=o?o.value:v; } }
function closeSessionSettings(){ var o=document.getElementById('ssOverlay'); if(o) o.classList.remove('show'); }
// 弹窗内连接/断开
function ssToggleConnect(){
 var node=ctxNode||document.querySelector('.session-node.active');
 if(!node) return;
 var online=node.dataset.state==='online';
 setSessionState(node,online?'offline':'online');
 // 刷新弹窗状态
 openSessionSettings(node);
}
// 保存并应用：写回节点 + 同步会话管理
function saveSessionSettings(){
 var node=ctxNode;
 if(!node) return;
 var name=document.getElementById('ssNameInput').value||'会话';
 var mode=document.getElementById('ssModeInput').value;
 node.dataset.name=name;
 node.dataset.mode=mode;
 var n=node.querySelector('.name'); if(n) n.textContent=name;
 var baud=document.getElementById('ssBaud').value;
 node.dataset.baud=baud;
 var badge=node.querySelector('.badge'); if(badge) badge.textContent=baud;
 var modeText=(mode==='terminal')?'终端':'字节流';
 var tag=node.querySelector('.mode-tag'); if(tag) tag.textContent=modeText;
 // 写回连接/缓冲参数到节点 data 属性
 node.dataset.port=document.getElementById('ssPort').value;
 node.dataset.databits=document.getElementById('ssDataBits').value;
 node.dataset.stopbits=document.getElementById('ssStopBits').value;
 node.dataset.parity=document.getElementById('ssParity').value;
 node.dataset.bufstrategy=document.getElementById('ssBufStrategy').value;
 node.dataset.bufsize=document.getElementById('ssBufSize').value;
 node.dataset.overflow=document.getElementById('ssOverflow').value;
 if(node.classList.contains('active')) syncSessionManager(node);
 closeSessionSettings();
}
// 通讯测试：基于当前端口名判断能否打开（原型模拟）
function communicationTest(){
 var port=document.getElementById('ssPort').value;
 var res=document.getElementById('ssTestResult');
 if(!res) return;
 var known=['COM3 · USB-SER (FTDI)','COM4 · USB Serial (CH340)'];
 if(known.indexOf(port)>-1){
  res.innerHTML='<span style="color:var(--accent2)">✓ 通讯正常，端口可打开</span>';
 } else {
  res.innerHTML='<span style="color:var(--danger)">✗ 无法打开，端口可能被占用或不存在</span>';
 }
}

// ===== 会话分组 =====
function toggleGroup(h){h.classList.toggle('collapsed');var b=h.nextElementSibling;if(b)b.classList.toggle('hidden')}
function filterSessions(val){
 val=(val||'').trim().toLowerCase();
 document.querySelectorAll('.session-node').forEach(function(n){
 n.style.display=n.textContent.toLowerCase().indexOf(val)>-1?'':'none';
 });
 document.querySelectorAll('.session-group').forEach(function(g){
 var any=false;g.querySelectorAll('.session-node').forEach(function(n){if(n.style.display!=='none')any=true});
 g.style.display=any?'':'none';
 });
}

// ===== 新建会话 =====
function openNewSession(){document.getElementById('newSessionOverlay').classList.add('show')}
function closeNewSession(){document.getElementById('newSessionOverlay').classList.remove('show')}
// 高级选项折叠
function toggleAdv(el){
 el.classList.toggle('open');
 var b=document.getElementById('advBody');
 b.style.display = (b.style.display==='none') ? 'block' : 'none';
}
function createSession(){
 var mode=document.getElementById('nsMode').value||'bytes';
 var name=document.getElementById('nsName').value||'新设备';
 var port=document.getElementById('nsPort').value;
 var baud=document.getElementById('nsBaud').value;
 // 创建节点
 var tree=document.querySelector('.session-tree');
 var group=tree.querySelector('.session-group');
 var body=group.querySelector('.sg-body');
 var node=document.createElement('div');
 node.className='session-node';
 node.setAttribute('data-mode',mode);
 node.setAttribute('data-state','online');
 node.setAttribute('data-name',name);
 node.setAttribute('data-baud',baud);
 var modeText=(mode==='terminal')?'终端':'字节流';
 node.innerHTML='<span class="sdot on"></span><span class="name">'+name+'</span><span class="badge">'+baud+'</span><span class="mode-tag">'+modeText+'</span><span class="s-more">⋯</span>';
 node.onclick=function(){selectSession(this,name)};
 node.oncontextmenu=function(e){showSessionMenu(e,name)};
 body.appendChild(node);
 // 更新计数
 var cnt=body.querySelectorAll('.session-node').length;
 group.querySelector('.sg-count').textContent=cnt;
 // 清空搜索状态（新会话不应残留旧标签/旧命中数）
 var si=document.getElementById('searchInput'); if(si)si.value='';
 var cb=document.getElementById('chipsBox'); if(cb)cb.innerHTML='';
 updateSearchCount();
 selectSession(node,name);
 closeNewSession();
 // 按模式进入对应默认视图
 switchView((mode==='terminal')?'view-terminal':'view-bytes',document.querySelector('.vt-item[data-view='+(mode==='terminal'?'view-terminal':'view-bytes')+']'));
}
// 会话管理页：连接/断开当前会话
function toggleConnect(){
 var node=document.querySelector('.session-node.active');
 if(!node) return;
 var online = node.dataset.state==='online';
 node.dataset.state = online ? 'offline' : 'online';
 var dot=node.querySelector('.sdot'); if(dot) dot.className='sdot '+(online?'off':'on');
 syncSessionManager(node);
}
// 会话管理页：修改视图模式后应用
function applySessionModeChange(){
 var node=document.querySelector('.session-node.active');
 var sel=document.getElementById('smModeInput');
 if(!node||!sel) return;
 var mode=sel.value;
 node.setAttribute('data-mode',mode);
 var tag=node.querySelector('.mode-tag'); if(tag) tag.textContent=(mode==='terminal')?'终端':'字节流';
 var smMode=document.getElementById('smMode'); if(smMode) smMode.textContent=(mode==='terminal')?'终端':'字节流';
 applyMode(mode);
}

// ===== 搜索标签 =====
var customSlots = ['#e5484d','#ff9432','#e3a53c','#3fb950','#39c0c0','#58a6ff','#a371f7'];
var presetColors = [];
var currentChip = null;   // 当前正在调色的 chip（局部引用，避免全局污染）
// 生成35种预设色：7 基色 × 5 档亮度（0.6/0.8/1.0/1.2/1.4）
function shadeHex(hex,f){
 var h=hex.replace('#','');
 var r=Math.min(255,Math.round(parseInt(h.substring(0,2),16)*f));
 var g=Math.min(255,Math.round(parseInt(h.substring(2,4),16)*f));
 var b=Math.min(255,Math.round(parseInt(h.substring(4,6),16)*f));
 return '#'+[r,g,b].map(function(v){return ('0'+v.toString(16)).slice(-2)}).join('');
}
(function(){
 var base=['#e5484d','#ff9432','#e3a53c','#3fb950','#39c0c0','#58a6ff','#a371f7'];
 var shade=[0.6,0.8,1.0,1.2,1.4];
 for(var i=0;i<base.length;i++){
 for(var j=0;j<shade.length;j++){
 presetColors.push(shadeHex(base[i], shade[j]));
 }
 }
})();
function initPalette(){
 var grid=document.getElementById('plGrid');
 grid.innerHTML='';
 presetColors.forEach(function(c,i){
 var s=document.createElement('span');
 s.className='pl-color';
 s.style.background=c;
 s.title='颜色 '+(i+1);
 s.onclick=function(){applyColorToChip(c)};
 grid.appendChild(s);
 });
 // 自定义色槽（7 个，可保存自定义颜色）渲染到独立容器 plCustomGrid
 var customGrid=document.getElementById('plCustomGrid');
 if(!customGrid)return;
 customGrid.innerHTML='';
 customSlots.forEach(function(c,i){
 var s=document.createElement('span');
 s.className='pl-color custom-slot';
 s.style.background=c;
 s.style.outline='2px dashed rgba(255,255,255,.35)';
 s.title='自定义槽 '+(i+1)+'（点击应用，可在下方选色后保存到该槽）';
 s.onclick=function(){applyColorToChip(c);hidePalette()};
 customGrid.appendChild(s);
 });
}
// 将颜色应用到当前 chip（带存在性校验）
function applyColorToChip(c){
 if(!currentChip || !currentChip.isConnected){hidePalette();return;}
 currentChip.style.background=hexToRgba(c,0.55);
 currentChip.dataset.color=c;
 renderRx();
 updateSearchCount();
}
function applyPaletteCustom(c){
 if(!currentChip || !currentChip.isConnected){hidePalette();return;}
 currentChip.style.background=hexToRgba(c,0.55);currentChip.dataset.color=c;
 renderRx();
 updateSearchCount();
}
function savePaletteCustom(){
 var c=document.getElementById('plCustomColor').value;
 var slot=parseInt(document.getElementById('plCustomSlot').value||'0',10);
 customSlots[slot]=c;
 var slots=document.querySelectorAll('.pl-color.custom-slot');
 if(slots[slot])slots[slot].style.background=c;
 applyColorToChip(c);
 hidePalette();
}
function addChip(e){if(e.key==='Enter')addChipFromInput()}
function addChipFromInput(){
 var input=document.getElementById('searchInput');
 var val=input.value.trim();if(!val)return;
 var box=document.getElementById('chipsBox');
 // 自动分配一个未被当前标签使用的颜色（从 35 预设色中取），保证多标签可区分
 var used=[];
 document.querySelectorAll('.chip').forEach(function(c){ if(c.dataset.color) used.push(c.dataset.color); });
 var color=null;
 for(var i=0;i<presetColors.length;i++){
  if(used.indexOf(presetColors[i])===-1){ color=presetColors[i]; break; }
 }
 if(!color) color=presetColors[(used.length)%presetColors.length];
 var chip=document.createElement('span');
 chip.className='chip active';
 chip.dataset.kw=val;
 chip.dataset.color=color;
 chip.style.background=hexToRgba(color,0.55);
 chip.style.color='#0b0f14';
 chip.textContent=val;
 var x=document.createElement('span');
 x.className='chip-x';x.textContent='×';
 chip.appendChild(x);
 box.appendChild(chip);
 if(chip.scrollIntoView) chip.scrollIntoView({block:'nearest',behavior:'smooth'});
 input.value='';
 selectChip(chip);
 renderRx();
 updateSearchCount();
}
// 移除单个 chip（若正在调色则清引用）
// 选中某个标签（选中态 + 定位到该关键字）
function selectChip(chip){
 if(!chip) return;
 document.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
 chip.classList.add('active');
 currentChip=chip;
 // 定位到该标签第一个命中
 var kw=chip.dataset.kw;
 var kws=Array.prototype.slice.call(document.querySelectorAll('#rxArea .kw'));
 var found=null;
 for(var i=0;i<kws.length;i++){ if(kws[i].textContent===kw){ found=kws[i]; break; } }
 if(found) activateHit(found);
 else updateSearchCount();
}
// 折叠/展开标签区
function toggleChips(){
 var box=document.getElementById('chipsBox');
 var btn=document.getElementById('chipsToggle');
 if(!box) return;
 var exp=box.classList.toggle('expanded');
 if(btn) btn.textContent=exp?'收起':'展开';
}
function removeChip(chip){
 if(currentChip===chip) currentChip=null;
 chip.remove();
 renderRx();
 updateSearchCount();
}
function showPalette(e,chip){
 var p=document.getElementById('chipPalette');
 currentChip=chip;
 p.style.display='block';
 p.style.left=Math.min(e.clientX,window.innerWidth-310)+'px';
 p.style.top=Math.min(e.clientY,window.innerHeight-320)+'px';
 updatePlNavInfo();
}
function hidePalette(){document.getElementById('chipPalette').style.display='none'}
function cancelFilter(){
 document.querySelectorAll('.chip').forEach(function(c){c.remove()});
 currentChip=null;
 hidePalette();
 renderRx();
 updateSearchCount();
}
// 转义正则特殊字符
function escapeRe(s){return (s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
// 统计数据区中所有标签的关键字命中总数
function countHits(){
 var area=document.getElementById('rxArea');
 if(!area) return 0;
 var text=area.textContent||'';
 var chips=document.querySelectorAll('.chip');
 var total=0;
 for(var i=0;i<chips.length;i++){
  var kw=chips[i].firstChild ? (chips[i].firstChild.textContent||'') : '';
  if(!kw) continue;
  var re=new RegExp(escapeRe(kw),'g');
  var m=text.match(re);
  total += m ? m.length : 0;
 }
 return total;
}
function updateSearchCount(){
 var n=document.querySelectorAll('.chip').length;
 var hits=countHits();
 var c=document.getElementById('searchCount');
 var active=document.querySelector('#rxArea .kw.active');
 if(c){
  if(n>0){
   if(active){
    var kw=active.textContent;
    var kws=document.querySelectorAll('#rxArea .kw');
    var total=0,pos=0;
    for(var i=0;i<kws.length;i++){
     if(kws[i].textContent===kw){ total++; if(kws[i]===active) pos=total; }
    }
    c.textContent='第 '+pos+' / '+total+' 处 · '+n+' 标签';
   } else {
    c.textContent=hits+' 处命中 / '+n+' 标签';
   }
  } else c.textContent='0 处命中 / 0 标签';
 }
}
function toggleSearch(btn){
 btn.classList.toggle('active');
 var area=document.getElementById('rxArea');
 if(area) area.classList.toggle('hl-off', !btn.classList.contains('active'));
}
document.addEventListener('click',function(e){
 if(!e.target.closest('#chipPalette'))hidePalette();
});
// chip 事件委托：点击选中、× 删除、右键调色板（覆盖静态默认标签与动态标签）
document.addEventListener('click',function(e){
 var x=e.target.closest('.chip-x');
 if(x){
  var chip=x.closest('.chip');
  if(chip){ e.stopPropagation(); removeChip(chip); return; }
 }
 var chip=e.target.closest('.chip');
 if(chip){ selectChip(chip); }
});
document.addEventListener('contextmenu',function(e){
 var chip=e.target.closest('.chip');
 if(!chip) return;
 e.preventDefault();
 showPalette(e,chip);
});
initPalette();
updateSearchCount();   // 加载时校准初始命中计数

// ===== 终端（直接键入 + 回显） =====
var termBuf='';   // 当前输入缓冲
var termHistory=[]; // 命令历史
var termHistoryIdx=-1; // 当前历史回溯位置（-1 表示最新/非历史状态）
var termConfig={echo:true,wrap:true,encoding:'UTF-8'}; // 终端配置
var _termDangerPending=''; // 危险命令确认中的待执行命令
var _termDangerFromKey=false; // 危险命令是否来自键盘输入
var _termParamPending=''; // 参数化命令中的待执行命令
var _termParamFromKey=false; // 参数化命令是否来自键盘输入
var _termParamNames=[]; // 当前参数名列表
var _termCmdMgrData=[]; // 命令管理临时数据
// 渲染当前输入行（含光标）
function renderTermInput(){
 var t=document.getElementById('termArea');
 if(!t) return;
 var old=t.querySelector('.term-input-line');
 if(old) old.remove();
 var esc=escapeHtml(termBuf);
 var div=document.createElement('div');
 div.className='term-input-line';
 div.innerHTML='<span class="prompt">root@<span class="t">device</span>:~$</span> '+esc+'<span class="cursor">&nbsp;</span>';
 t.appendChild(div);
 t.scrollTop=t.scrollHeight;
}
function escapeHtml(s){
 return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
// 处理终端区按键
function termKey(e){
 if(e.ctrlKey||e.metaKey||e.altKey) return;
 var t=document.getElementById('termArea');
 if(e.key==='Enter'){
  e.preventDefault();
  var cmd=termBuf;
  // 固定命令行的"输入"行（替换为已提交行）
  var old=t.querySelector('.term-input-line');
  if(old){
   old.innerHTML='<span class="prompt">root@<span class="t">device</span>:~$</span> '+escapeHtml(cmd);
   old.classList.remove('term-input-line');
  }
  termBuf='';
  termHistoryIdx=-1;
  // 通过 sendTermCmd 走完整流程（危险检测+参数+回显）
  sendTermCmd(cmd, true);
 } else if(e.key==='Backspace'){
  e.preventDefault();
  termBuf=termBuf.slice(0,-1);
  renderTermInput();
 } else if(e.key==='ArrowUp'){
  e.preventDefault();
  if(termHistory.length===0) return;
  if(termHistoryIdx<termHistory.length-1){
   termHistoryIdx++;
   termBuf=termHistory[termHistoryIdx];
   renderTermInput();
  }
 } else if(e.key==='ArrowDown'){
  e.preventDefault();
  if(termHistory.length===0) return;
  if(termHistoryIdx>0){
   termHistoryIdx--;
   termBuf=termHistory[termHistoryIdx];
   renderTermInput();
  } else if(termHistoryIdx===0){
   termHistoryIdx=-1;
   termBuf='';
   renderTermInput();
  }
 } else if(e.key.length===1){
  e.preventDefault();
  termBuf+=e.key;
  termHistoryIdx=-1;
  renderTermInput();
 }
}
// 模拟命令回显
function termEcho(cmd){
 var t=document.getElementById('termArea');
 var out='';
 cmd=(cmd||'').trim();
 if(cmd==='') out='';
 else if(cmd==='uname -a') out='Linux device 5.10.120 #1 SMP Thu Jan 10 10:00:00 CST 2026 armv7l GNU/Linux';
 else if(cmd.indexOf('cat /proc/cpuinfo')===0) out='processor : 0<br>model name : ARM Cortex-A7<br>BogoMIPS : 198.00<br>Hardware : Allwinner H3';
 else if(cmd.indexOf('ifconfig')===0) out='eth0: flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt; mtu 1500<br>&nbsp;&nbsp;&nbsp;&nbsp;inet 192.168.1.100 netmask 255.255.255.0';
 else if(cmd==='free -m') out='total used free shared buff/cache<br>Mem: 1024 342 512 12 170';
 else if(cmd==='top -b -n 1'||cmd==='top -n1') out='top - 10:33:00 up 1 day, load average: 0.05, 0.02, 0.00';
 else if(cmd==='df -h') out='Filesystem Size Used Avail Use%<br>/dev/root 1.9G 642M 1.2G 36% /';
 else if(cmd==='ps aux') out='USER PID %CPU %MEM VSZ RSS<br>root 1 0.0 1.2 13256 4264 ? Ss init';
 else if(cmd.indexOf('ping ')===0) out='PING 192.168.1.1 : 56 data bytes<br>64 bytes: icmp_seq=1 ttl=64 time=0.8 ms';
 else if(cmd==='cat /etc/os-release') out='NAME="Buildroot"<br>VERSION="2024.02"<br>ID=buildroot';
 else if(cmd==='reboot') out='Connection closed by remote host.';
else if(cmd.indexOf('echo ')===0) out=escapeHtml(cmd.slice(5));
else out='-sh: '+cmd+': not found';
if(out){
  var d=document.createElement('div');
  d.innerHTML=out;
  t.appendChild(d);
}
 t.scrollTop=t.scrollHeight;
}
function sendTermCmd(cmd, fromTermKey){
 // 危险命令检测
 if(termIsDangerCmd(cmd) && !termIsCmdWhitelisted(cmd)){
  termOpenDangerModal(cmd, fromTermKey);
  return;
 }
 // 参数占位符检测
 var params=termExtractParams(cmd);
 if(params.length>0){
  termOpenParamModal(cmd, params, fromTermKey);
  return;
 }
 // 实际执行
 termDoSendCmd(cmd, fromTermKey);
}
// 实际执行命令发送（危险检测+参数解析均通过后调用）
function termDoSendCmd(cmd, fromTermKey){
 var t=document.getElementById('termArea');
 if(!t) return;
 // 快捷命令路径：当前输入行先落定，再添加快捷命令行
 if(!fromTermKey){
  var old=t.querySelector('.term-input-line');
  if(old){
   old.innerHTML='<span class="prompt">root@<span class="t">device</span>:~$</span> '+escapeHtml(termBuf);
   old.classList.remove('term-input-line');
  }
  var div=document.createElement('div');
  div.innerHTML='<span class="prompt">root@<span class="t">device</span>:~$</span> '+escapeHtml(cmd);
  t.appendChild(div);
 }
 termBuf='';
 termHistoryIdx=-1;
 termAddToHistory(cmd);
 if(termConfig.echo){
  termEcho(cmd);
 }
 renderTermInput();
 t.scrollTop=t.scrollHeight;
}
function clearTerm(){
 var t=document.getElementById('termArea');if(!t)return;
 termBuf='';
 t.innerHTML='<div class="term-input-line"><span class="prompt">root@<span class="t">device</span>:~$</span> <span class="cursor">&nbsp;</span></div>';
}
function resetTerm(){
 var t=document.getElementById('termArea');
 termBuf='';
 t.innerHTML='<div class="term-input-line"><span class="prompt">root@<span class="t">device</span>:~$</span> <span class="cursor">&nbsp;</span></div>';
}
// ===== 字节流数据源 + 渲染（标签驱动高亮 + 当前命中定位） =====
var rxLog=[
 {dir:'RX',ts:'10:32:01',data:'7E 01 03 00 00 10 00 00 00 01 00 00 00 00 00 00 14 00 02 01 4A 7E'},
 {dir:'TX',ts:'10:32:01',data:'7E 01 02 00 00 10 00 00 00 00 00 00 00 00 00 00 00 00 02 01 4A 7E'},
 {dir:'RX',ts:'10:32:02',data:'收到响应帧: 状态码 = 0x00 正常'},
 {dir:'TX',ts:'10:32:05',data:'AT+STATUS? (查询设备状态)'},
 {dir:'RX',ts:'10:32:05',data:'OK STATUS=RUNNING UPTIME=86400s'},
 {dir:'RX',ts:'10:32:12',data:'温度: 25.3°C, 湿度: 62%, 气压: 1013hPa'},
 {dir:'TX',ts:'10:32:15',data:'AT+WRITE REG=0x10 VAL=0xAA'},
 {dir:'RX',ts:'10:32:15',data:'OK WRITE SUCCESS'},
 {dir:'RX',ts:'10:32:20',data:'设备心跳: 运行正常, 电压 3.3V, 温度 42°C'},
 {dir:'RX',ts:'10:32:25',data:'AT+VER? → PortPilot v2.1.0 build 20260801'},
 {dir:'RX',ts:'10:32:30',data:'告警: 缓冲区使用率超过 80%'},
 {dir:'RX',ts:'10:32:35',data:'数据帧校验错误 CRC mismatch, 已丢弃'},
 {dir:'RX',ts:'10:32:40',data:'GPS 定位成功: 纬度 39.9042°N, 经度 116.4074°E'}
];
var curHit=null; // 当前命中节点
// 高亮文本：把 data 中所有标签命中处用 <kw> 包裹
function hlText(text){
 var chips=Array.prototype.slice.call(document.querySelectorAll('.chip'));
 var kwList=[];
 chips.forEach(function(c){var k=c.dataset.kw; if(k) kwList.push(k);});
 if(kwList.length===0) return document.createTextNode(text);
 // 找出所有命中区间，并记录每个区间归属的 chip（用于取颜色）
 var ranges=[];
 kwList.forEach(function(kw){
  var chip=chips.filter(function(c){return c.dataset.kw===kw})[0];
  var color=chip?chip.dataset.color:null;
  var re=new RegExp(escapeRe(kw),'g'),m;
  while((m=re.exec(text))!==null){ ranges.push({s:m.index,e:m.index+kw.length,color:color}); }
 });
 if(ranges.length===0) return document.createTextNode(text);
 // 区间合并排序（重叠时优先保留第一个 chip 的颜色）
 ranges.sort(function(a,b){return a.s-b.s});
 var merged=[];
 ranges.forEach(function(r){
  var last=merged[merged.length-1];
  if(last && r.s<=last.e){ if(r.e>last.e) last.e=r.e; }
  else merged.push({s:r.s,e:r.e,color:r.color});
 });
 var frag=document.createDocumentFragment();
 var pos=0;
 merged.forEach(function(r){
  if(r.s>pos) frag.appendChild(document.createTextNode(text.slice(pos,r.s)));
  var s=document.createElement('span');
  s.className='kw';
  // 用 chip 颜色作高亮背景（半透明与 chip 一致）；无自定义色时回退默认橙色
  if(r.color) s.style.background=hexToRgba(r.color,0.55);
  else { s.className='kw kw0'; }
  s.style.color='#0b0f14';
  s.textContent=text.slice(r.s,r.e);
  frag.appendChild(s);
  pos=r.e;
 });
 if(pos<text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
 return frag;
}
// 渲染数据区
function renderRx(){
 var area=document.getElementById('rxArea');
 if(!area) return;
 if(typeof rxLog==='undefined'||!(rxLog instanceof Array)){ area.innerHTML=rxLogMarkup||''; return; }
 var frag=document.createDocumentFragment();
 rxLog.forEach(function(rec){
  var line=document.createElement('div');
  line.className='line';
  var d=document.createElement('span');
  d.className='dir '+(rec.dir==='TX'?'tx':'rx'); d.textContent=rec.dir;
  var t=document.createElement('span');
  t.className='ts'; t.textContent=rec.ts;
  var data=document.createElement('span');
  data.className='data';
  data.appendChild(hlText(rec.data));
  line.appendChild(d); line.appendChild(t); line.appendChild(data);
  frag.appendChild(line);
 });
 area.innerHTML='';
 area.appendChild(frag);
 curHit=null;
}
// 上一个/下一个命中：遍历所有 .kw，按当前高亮关键字定位
function nextHit(dir){
 var kws=document.querySelectorAll('#rxArea .kw');
 if(kws.length===0) return;
 var cur=document.querySelector('#rxArea .kw.active');
 var idx=-1;
 for(var i=0;i<kws.length;i++){ if(kws[i]===cur){ idx=i; break; } }
 var target;
 if(cur && kws[idx].textContent===cur.textContent){
  target=kws[(idx+dir+kws.length)%kws.length];
 } else {
  target=dir>0?kws[0]:kws[kws.length-1];
 }
 activateHit(target);
}
// 激活某个命中：仅当存在同关键字 chip 时高亮定位，否则跳过同关键字
function activateHit(kwEl){
 if(!kwEl) return;
 var kw=kwEl.textContent;
 var has=document.querySelector('.chip[data-kw="'+kw+'"]');
 var kws=document.querySelectorAll('#rxArea .kw');
 if(curHit) curHit.classList.remove('active');
 kwEl.classList.add('active');
 curHit=kwEl;
 if(kwEl.scrollIntoView) kwEl.scrollIntoView({block:'center',behavior:'smooth'});
 // 若当前关键字无 chip，则自动跳到下一个
 if(!has){
  // 找到下一个有 chip 的关键字
  var i=0; for(var j=0;j<kws.length;j++){ if(kws[j]===kwEl){ i=j; break; } }
  var found=null;
  for(var s=1;s<=kws.length;s++){
   var k=kws[(i+s)%kws.length];
   if(document.querySelector('.chip[data-kw="'+k.textContent+'"]')){ found=k; break; }
  }
  if(found){ activateHit(found); return; }
 }
 updateSearchCount();
}
function jumpSearch(dir){
 nextHit(dir);
}
function updatePlNavInfo(){
 var c=document.getElementById('plNavInfo');
 var kws=document.querySelectorAll('#rxArea .kw');
 if(!c) return;
 if(kws.length===0){ c.textContent='0 处'; return; }
 var active=document.querySelector('#rxArea .kw.active');
 var kw=currentChip?currentChip.dataset.kw:null;
 var total=0,pos=0;
 for(var i=0;i<kws.length;i++){
  if(!kw || kws[i].textContent===kw){ total++; if(active&&kws[i]===active) pos=total; }
 }
 if(kw) c.textContent=(active?pos:0)+' / '+total+' 处';
 else c.textContent=total+' 处命中';
}
function clearRx(){ rxLog.length=0; curHit=null; renderRx(); }
// 页面加载完成后由数据源渲染字节流数据区（标签驱动高亮）
renderRx();

// ===== 主题 =====
var themes=[
 {name:'默认',cls:'',css:'linear-gradient(135deg,#0fc6b7,#58a6ff)'},
 {name:'红',cls:'th-red',css:'linear-gradient(135deg,#e5484d,#ff6b6b)'},
 {name:'橙',cls:'th-orange',css:'linear-gradient(135deg,#ff9432,#ffc078)'},
 {name:'黄',cls:'th-yellow',css:'linear-gradient(135deg,#e3a53c,#ffd43b)'},
 {name:'绿',cls:'th-green',css:'linear-gradient(135deg,#3fb950,#7ee787)'},
 {name:'青',cls:'th-cyan',css:'linear-gradient(135deg,#39c0c0,#67e8f9)'},
 {name:'蓝',cls:'th-blue',css:'linear-gradient(135deg,#58a6ff,#79c0ff)'},
 {name:'紫',cls:'th-purple',css:'linear-gradient(135deg,#a371f7,#bc8cff)'},
 {name:'红绿',cls:'th-rdgr',css:'linear-gradient(135deg,#e5484d,#3fb950)'},
 {name:'红蓝',cls:'th-rdbl',css:'linear-gradient(135deg,#e5484d,#58a6ff)'},
 {name:'黄绿',cls:'th-ylgr',css:'linear-gradient(135deg,#e3a53c,#3fb950)'},
 {name:'青紫',cls:'th-cypu',css:'linear-gradient(135deg,#39c0c0,#a371f7)'},
 {name:'彩虹',cls:'th-rainbow',css:'linear-gradient(90deg,#e5484d,#ff9432,#e3a53c,#3fb950,#39c0c0,#58a6ff,#a371f7)'}
];
function initThemes(){
 var box=document.getElementById('themePresets');
 box.innerHTML='';
 themes.forEach(function(t,i){
 var d=document.createElement('div');
 d.className='th-one'+(i===0?' active':'');
 d.dataset.cls=t.cls;
 d.innerHTML='<span class="th-swatch" style="background:'+t.css+'"></span><span class="th-name">'+t.name+'</span>';
 d.onclick=function(){setTheme(t.cls,d)};
 box.appendChild(d);
 });
}
function setTheme(cls,el){
 document.querySelectorAll('.th-one').forEach(function(x){x.classList.remove('active')});
 if(el)el.classList.add('active');
 document.body.className = document.body.className.replace(/ ?th-[a-z]+/g,'');
 document.body.classList.add(cls);
}
function applyCustomColor(c){
 var r=document.createElement('style');
 r.textContent='body{--primary:'+c+';--primary-dim:'+hexToRgba(c,0.12)+';--grad:linear-gradient(135deg,'+c+',#58a6ff)}';
 document.head.appendChild(r);
 document.querySelectorAll('.th-one').forEach(function(x){x.classList.remove('active')});
}
function hexToRgba(hex,a){
 var h=hex.replace('#','');var r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);
 return 'rgba('+r+','+g+','+b+','+a+')';
}
function applyBg(){
  var url=document.getElementById('bgUrlInput').value.trim();
  if(!url){ showToast('请输入图片地址','warn'); return; }
  // Show download progress bar (simulated network download)
  var bar=document.getElementById('bgDownloadBar');
  var fill=document.getElementById('bgDlFill');
  var pct=document.getElementById('bgDlPercent');
  var status=document.getElementById('bgDlStatus');
  if(bar){
    bar.style.display='block';
    fill.style.width='0%';
    pct.textContent='0%';
    status.textContent='正在从网络加载图片...';
    var progress=0;
    var timer=setInterval(function(){
      progress+=Math.random()*15+5;
      if(progress>=100){
        progress=100;
        clearInterval(timer);
        fill.style.width='100%';
        pct.textContent='100%';
        status.textContent='下载完成，正在应用...';
        setTimeout(function(){
          bar.style.display='none';
          document.getElementById('bgLayer').style.backgroundImage='url("'+url+'")';
          document.documentElement.style.setProperty('--bgimg','url("'+url+'")');
          showToast('背景图已应用','success');
        },400);
      }else{
        fill.style.width=progress+'%';
        pct.textContent=Math.floor(progress)+'%';
        if(progress<30) status.textContent='正在建立连接...';
        else if(progress<70) status.textContent='正在下载图片数据...';
        else status.textContent='即将完成...';
      }
    },180);
  }else{
    document.getElementById('bgLayer').style.backgroundImage='url("'+url+'")';
    document.documentElement.style.setProperty('--bgimg','url("'+url+'")');
    showToast('背景图已应用','success');
  }
}
function clearBg(){
 var layer=document.getElementById('bgLayer');
 layer.classList.remove('show');
 layer.style.backgroundImage='';
}
function updateMask(v){
 document.getElementById('maskVal').textContent=v+'%';
 var layer=document.getElementById('maskLayer');
 // 单一来源：更新 CSS 变量 + 同步内联（避免双源不一致）
 layer.style.setProperty('--mask-opacity', (v/100).toFixed(2));
 layer.style.background='rgba(13,17,23,'+(v/100)+')';
}
initThemes();

// ===== 会话管理面板初始化：加载时同步当前会话（默认"设备 A · COM3"，字节流在线） =====
(function(){
 var activeNode=document.querySelector('.session-node.active')||document.querySelector('.session-node');
 if(activeNode) syncSessionManager(activeNode);
})();

// ===== 设置分类 =====
function setSettingsTab(el,groupId){
 document.querySelectorAll('.sn-item').forEach(function(i){i.classList.remove('active')});
 el.classList.add('active');
 document.querySelectorAll('#settingsForm .sf-group').forEach(function(g){g.style.display='none'});
 var t=document.getElementById('sf-'+groupId);if(t)t.style.display='block';
}
function filterSettings(val){
 val=(val||'').trim().toLowerCase();
 document.querySelectorAll('#settingsForm .sf-item').forEach(function(item){
 var hit=item.textContent.toLowerCase().indexOf(val)>-1;
 item.classList.toggle('hit',hit);
 item.classList.toggle('miss',!hit&&val!=='');
 });
}

// ===== 使用手册（独立 HTML 文件弹出） =====
function openManual(){window.open('portpilot-manual.html','_blank','width=960,height=760')}

// ===== 主题弹窗 =====
function openThemeModal(){
 setSettingsTab(document.querySelector('.sn-item[onclick*="theme"]'),'theme');
 openModule('page-settings');
}
function openSessionDetail(){document.getElementById('detailOverlay').classList.add('show')}
function exportLog(){openLogSaveModal('bytes')}

// 键盘：ESC 关闭
document.addEventListener('keydown',function(e){
 if(e.key==='Escape'){
 document.querySelectorAll('.modal-overlay.show').forEach(function(m){m.classList.remove('show')});
 hidePalette();
  cmdHideCtxMenu();
  cmdCloseMultiDevice();
 }
});

// ============================================================
// Application Boot Sequence
// Runs after all modules are loaded
// ============================================================
document.addEventListener('DOMContentLoaded', function(){
  // Initialize modules in dependency order
  // 1. Session manager already initialized inline
  
  // 2. Protocol module (depends on command module data)
  if(typeof initProtocolModule === 'function'){
    try { initProtocolModule(); } catch(e) { console.warn('Protocol init failed:', e); }
  }
  
  // 3. Dashboard/visualization init
  if(typeof initDashboard === 'function'){
    try { initDashboard(); } catch(e) { console.warn('Dashboard init failed:', e); }
  }
  
  // 4. Settings apply saved preferences
  if(typeof settingsApplyAll === 'function'){
    try { settingsApplyAll(); } catch(e) { console.warn('Settings apply failed:', e); }
  }
  
  console.log('[PortPilot] UI boot complete');

  // Initialize slider gradient fills
  setTimeout(function(){
    document.querySelectorAll('input[type=range]').forEach(function(s){
      updateSliderFill(s);
      s.addEventListener('input', function(){ updateSliderFill(this); });
    });
  }, 50);
});


// ============================================
// Dynamic Slider Track Fill (滑块轨道动态渐变填充)

// ============================================
// Dynamic Slider Track Fill v2 (滑块轨道渐变填充)
// ============================================
function updateSliderFill(slider){
  if(!slider || slider.type !== 'range') return;
  var min = parseFloat(slider.min) || 0;
  var max = parseFloat(slider.max) || 100;
  var val = parseFloat(slider.value) || 0;
  var pct = ((val - min) / (max - min)) * 100;
  if(pct < 0) pct = 0;
  if(pct > 100) pct = 100;
  slider.style.backgroundImage = 'linear-gradient(to right, var(--grad) 0%, var(--grad) ' + pct + '%, var(--bg4) ' + pct + '%, var(--bg4) 100%)';
  slider.style.backgroundColor = 'transparent';
}

function initAllSliderFills(){
  var sliders = document.querySelectorAll('input[type=range]');
  sliders.forEach(function(s){
    updateSliderFill(s);
    if(!s._gradBound){
      s.addEventListener('input', function(){ updateSliderFill(this); });
      s.addEventListener('change', function(){ updateSliderFill(this); });
      s._gradBound = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){ initAllSliderFills(); }, 0);
  setTimeout(function(){ initAllSliderFills(); }, 100);
  setTimeout(function(){ initAllSliderFills(); }, 500);
  setTimeout(function(){ initAllSliderFills(); }, 1500);
});
window.initAllSliderFills = initAllSliderFills;
window.updateSliderFill = updateSliderFill;
