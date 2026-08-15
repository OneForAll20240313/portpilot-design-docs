/* ============================================================
   Terminal Enhancement Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 终端增强模块 ===== */

// ---- 配置持久化 ----
function termLoadConfig(){
  try{
    var s=localStorage.getItem('termConfig');
    if(s){
      var c=JSON.parse(s);
      if(typeof c.echo==='boolean') termConfig.echo=c.echo;
      if(typeof c.wrap==='boolean') termConfig.wrap=c.wrap;
      if(c.encoding) termConfig.encoding=c.encoding;
    }
  }catch(e){}
}
function termSaveConfig(){
  try{ localStorage.setItem('termConfig',JSON.stringify(termConfig)); }catch(e){}
}

// ---- 回显开关 ----
function termToggleEcho(){
  termConfig.echo=!termConfig.echo;
  termSaveConfig();
  termApplyEchoState();
}
function termApplyEchoState(){
  var btn=document.getElementById('termEchoBtn');
  if(btn){
    if(termConfig.echo) btn.classList.add('active');
    else btn.classList.remove('active');
  }
}

// ---- 自动换行开关 ----
function termToggleWrap(){
  termConfig.wrap=!termConfig.wrap;
  termSaveConfig();
  termApplyWrapState();
}
function termApplyWrapState(){
  var t=document.getElementById('termArea');
  var btn=document.getElementById('termWrapBtn');
  if(t){
    t.classList.toggle('term-wrap-on',termConfig.wrap);
    t.classList.toggle('term-wrap-off',!termConfig.wrap);
  }
  if(btn){
    if(termConfig.wrap) btn.classList.add('active');
    else btn.classList.remove('active');
  }
}

// ---- 危险命令检测 ----
var _termDangerPatterns=[
  /^reboot(\s|$)/i,
  /^shutdown(\s|$)/i,
  /^rm\s+(-rf?|--recursive)\s+\/(\s|$)/i,
  /^rm\s+-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+\/(\s|$)/i,
  /^format(\s|$)/i,
  /^flash_erase(\s|$)/i,
  /^factory_reset(\s|$)/i,
  /^erase_all(\s|$)/i,
  /^dd\s+.*of=\/dev/i
];
function termIsDangerCmd(cmd){
  if(!cmd) return false;
  cmd=cmd.trim();
  for(var i=0;i<_termDangerPatterns.length;i++){
    if(_termDangerPatterns[i].test(cmd)) return true;
  }
  return false;
}
function termGetWhitelist(){
  try{
    var s=localStorage.getItem('termDangerWhitelist');
    return s?JSON.parse(s):[];
  }catch(e){ return []; }
}
function termIsCmdWhitelisted(cmd){
  if(!cmd) return false;
  var wl=termGetWhitelist();
  return wl.indexOf(cmd.trim())>=0;
}
function termAddToWhitelist(cmd){
  var wl=termGetWhitelist();
  if(wl.indexOf(cmd.trim())<0){
    wl.push(cmd.trim());
    try{ localStorage.setItem('termDangerWhitelist',JSON.stringify(wl)); }catch(e){}
  }
}

// ---- 危险命令确认模态框 ----
function termOpenDangerModal(cmd, fromTermKey){
  _termDangerPending=cmd;
  _termDangerFromKey=!!fromTermKey;
  document.getElementById('termDangerCmdText').textContent=cmd;
  document.getElementById('termDangerWhitelist').checked=false;
  document.getElementById('termDangerOverlay').classList.add('show');
}
function termCloseDangerModal(){
  document.getElementById('termDangerOverlay').classList.remove('show');
  _termDangerPending='';
  _termDangerFromKey=false;
}
function termConfirmDangerCmd(){
  var cmd=_termDangerPending;
  var fromKey=_termDangerFromKey;
  if(document.getElementById('termDangerWhitelist').checked){
    termAddToWhitelist(cmd);
  }
  termCloseDangerModal();
  // 跳过危险检测，继续后续流程（参数检测+执行）
  var params=termExtractParams(cmd);
  if(params.length>0){
    termOpenParamModal(cmd, params, fromKey);
    return;
  }
  termDoSendCmd(cmd, fromKey);
}

// ---- 参数占位符 ----
function termExtractParams(cmd){
  if(!cmd) return [];
  var re=/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  var m, names=[], seen={};
  while((m=re.exec(cmd))!==null){
    if(!seen[m[1]]){
      seen[m[1]]=true;
      names.push(m[1]);
    }
  }
  return names;
}
function termOpenParamModal(cmd, params, fromTermKey){
  _termParamPending=cmd;
  _termParamFromKey=!!fromTermKey;
  _termParamNames=params;
  var container=document.getElementById('termParamInputs');
  container.innerHTML='';
  for(var i=0;i<params.length;i++){
    var name=params[i];
    var group=document.createElement('div');
    group.className='param-input-group';
    group.innerHTML='<label>参数 <span class="param-name-tag">{'+name+'}</span></label>'+
      '<input type="text" id="termParamInput_'+name+'" value="" oninput="termUpdateParamPreview()">';
    container.appendChild(group);
  }
  termUpdateParamPreview();
  document.getElementById('termParamOverlay').classList.add('show');
  // 聚焦第一个输入框
  setTimeout(function(){
    var first=container.querySelector('input');
    if(first) first.focus();
  },50);
}
function termCloseParamModal(){
  document.getElementById('termParamOverlay').classList.remove('show');
  _termParamPending='';
  _termParamFromKey=false;
  _termParamNames=[];
}
function termUpdateParamPreview(){
  var cmd=_termParamPending;
  for(var i=0;i<_termParamNames.length;i++){
    var name=_termParamNames[i];
    var input=document.getElementById('termParamInput_'+name);
    var val=input?input.value:'';
    var re=new RegExp('\\{'+name+'\\}','g');
    cmd=cmd.replace(re, '<span class="preview-val">'+escapeHtml(val||('{'+name+'}'))+'</span>');
  }
  document.getElementById('termParamPreview').innerHTML='预览: '+cmd;
}
function termConfirmParamCmd(){
  var cmd=_termParamPending;
  var fromKey=_termParamFromKey;
  for(var i=0;i<_termParamNames.length;i++){
    var name=_termParamNames[i];
    var input=document.getElementById('termParamInput_'+name);
    var val=input?input.value:'';
    var re=new RegExp('\\{'+name+'\\}','g');
    cmd=cmd.replace(re, val);
  }
  termCloseParamModal();
  termDoSendCmd(cmd, fromKey);
}

// ---- 命令历史 ----
function termAddToHistory(cmd){
  if(!cmd||!cmd.trim()) return;
  // 去重：如果和最后一条相同则不重复添加
  if(termHistory.length>0 && termHistory[0]===cmd.trim()) return;
  termHistory.unshift(cmd.trim());
  if(termHistory.length>100) termHistory.pop();
}

// ---- 编码切换（视觉模拟） ----
function termChangeEncoding(enc){
  termConfig.encoding=enc;
  termSaveConfig();
  var t=document.getElementById('termArea');
  if(!t) return;
  // HEX 模式切换
  t.classList.toggle('term-hex', enc==='HEX');
  // 如果切换到 HEX，对现有内容做视觉转换模拟
  if(enc==='HEX'){
    termConvertToHexView();
  } else {
    termRestoreFromHexView();
  }
}
function termConvertToHexView(){
  var t=document.getElementById('termArea');
  if(!t) return;
  // 保存原始文本（用于恢复）
  if(!t._origLines){
    var lines=[];
    var children=t.querySelectorAll(':scope > div');
    for(var i=0;i<children.length;i++){
      lines.push(children[i].textContent);
    }
    t._origLines=lines;
  }
  // 转换已有输出行为 HEX 显示
  var children=t.querySelectorAll(':scope > div');
  for(var i=0;i<children.length;i++){
    var div=children[i];
    if(div.classList.contains('term-input-line')) continue;
    if(div._hexConverted) continue;
    var text=div.textContent||'';
    var hex=textToHex(text);
    div._origText=text;
    div.innerHTML='<span style="opacity:.7">['+text.length+'B] </span>'+hex;
    div._hexConverted=true;
  }
}
function termRestoreFromHexView(){
  var t=document.getElementById('termArea');
  if(!t) return;
  var children=t.querySelectorAll(':scope > div');
  for(var i=0;i<children.length;i++){
    var div=children[i];
    if(div._hexConverted && div._origText!==undefined){
      div.textContent=div._origText;
      div._hexConverted=false;
    }
  }
}
function textToHex(text){
  var hex='';
  for(var i=0;i<text.length;i++){
    var code=text.charCodeAt(i);
    if(code<128){
      hex+=('0'+code.toString(16).toUpperCase()).slice(-2)+' ';
    } else {
      // UTF-8 多字节简化模拟
      var bytes=[];
      if(code<0x800){
        bytes.push(0xC0|(code>>6), 0x80|(code&0x3F));
      } else {
        bytes.push(0xE0|(code>>12), 0x80|((code>>6)&0x3F), 0x80|(code&0x3F));
      }
      for(var j=0;j<bytes.length;j++){
        hex+=('0'+bytes[j].toString(16).toUpperCase()).slice(-2)+' ';
      }
    }
  }
  return hex.trim();
}

// ---- 快捷命令管理 ----
var _termDefaultCmds=[
  {name:'ifconfig eth0', cmd:'ifconfig eth0'},
  {name:'cat /proc/cpuinfo', cmd:'cat /proc/cpuinfo'},
  {name:'free -m', cmd:'free -m'},
  {name:'top -n1', cmd:'top -b -n 1'},
  {name:'df -h', cmd:'df -h'},
  {name:'ps aux', cmd:'ps aux'},
  {name:'ping {ip}', cmd:'ping {ip} -c 4'},
  {name:'os-release', cmd:'cat /etc/os-release'},
  {name:'reboot', cmd:'reboot'}
];
function termGetQuickCmds(){
  try{
    var s=localStorage.getItem('termQuickCmds');
    if(s){
      var arr=JSON.parse(s);
      if(Array.isArray(arr)&&arr.length>0) return arr;
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(_termDefaultCmds));
}
function termSetQuickCmds(cmds){
  try{ localStorage.setItem('termQuickCmds',JSON.stringify(cmds)); }catch(e){}
}
function termRenderQuickCmdGrid(){
  var grid=document.getElementById('termQuickCmdGrid');
  if(!grid) return;
  var cmds=termGetQuickCmds();
  grid.innerHTML='';
  for(var i=0;i<cmds.length;i++){
    var item=cmds[i];
    var btn=document.createElement('button');
    btn.className='tcp-btn';
    btn.type='button';
    btn.setAttribute('onclick',"sendTermCmd('"+item.cmd.replace(/'/g,"\\'")+"')");
    // 显示名称中的占位符高亮
    var displayName=item.name.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
      '<span class="ph">{$1}</span>');
    btn.innerHTML=displayName;
    grid.appendChild(btn);
  }
}
function termOpenCmdManager(){
  _termCmdMgrData=JSON.parse(JSON.stringify(termGetQuickCmds()));
  termRenderCmdMgrList();
  document.getElementById('termCmdMgrOverlay').classList.add('show');
}
function termCloseCmdManager(){
  document.getElementById('termCmdMgrOverlay').classList.remove('show');
  _termCmdMgrData=[];
}
function termRenderCmdMgrList(){
  var list=document.getElementById('termCmdMgrList');
  if(!list) return;
  list.innerHTML='';
  for(var i=0;i<_termCmdMgrData.length;i++){
    var item=_termCmdMgrData[i];
    var row=document.createElement('div');
    row.className='cmd-mgr-item';
    row.innerHTML=
      '<span class="cmd-index">'+(i+1)+'</span>'+
      '<input type="text" class="cmd-name-input" value="'+escapeHtml(item.name)+'" placeholder="显示名称" onchange="termUpdateMgrItem('+i+',\'name\',this.value)">'+
      '<input type="text" class="cmd-content-input" value="'+escapeHtml(item.cmd)+'" placeholder="命令内容，支持 {param}" onchange="termUpdateMgrItem('+i+',\'cmd\',this.value)">'+
      '<div class="cmd-actions">'+
        '<button type="button" class="move-btn" title="上移" onclick="termMoveCmdItem('+i+',-1)">↑</button>'+
        '<button type="button" class="move-btn" title="下移" onclick="termMoveCmdItem('+i+',1)">↓</button>'+
        '<button type="button" title="删除" onclick="termRemoveCmdItem('+i+')" style="color:var(--danger)">×</button>'+
      '</div>';
    list.appendChild(row);
  }
  if(_termCmdMgrData.length===0){
    list.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">暂无命令，点击「+ 添加命令」新增</div>';
  }
}
function termUpdateMgrItem(idx, field, value){
  if(_termCmdMgrData[idx]){
    _termCmdMgrData[idx][field]=value;
  }
}
function termAddCmdItem(){
  _termCmdMgrData.push({name:'新命令', cmd:'echo hello'});
  termRenderCmdMgrList();
}
function termRemoveCmdItem(idx){
  _termCmdMgrData.splice(idx,1);
  termRenderCmdMgrList();
}
function termMoveCmdItem(idx, dir){
  var newIdx=idx+dir;
  if(newIdx<0||newIdx>=_termCmdMgrData.length) return;
  var tmp=_termCmdMgrData[idx];
  _termCmdMgrData[idx]=_termCmdMgrData[newIdx];
  _termCmdMgrData[newIdx]=tmp;
  termRenderCmdMgrList();
}
function termSaveCmdManager(){
  // 过滤空命令
  var filtered=_termCmdMgrData.filter(function(item){
    return item.cmd && item.cmd.trim()!=='';
  });
  termSetQuickCmds(filtered);
  termRenderQuickCmdGrid();
  termCloseCmdManager();
}
function termRestoreDefaultCmds(){
  _termCmdMgrData=JSON.parse(JSON.stringify(_termDefaultCmds));
  termRenderCmdMgrList();
}

// ---- 初始化 ----
function termInit(){
  termLoadConfig();
  termApplyEchoState();
  termApplyWrapState();
  // 设置编码下拉
  var sel=document.getElementById('termEncoding');
  if(sel) sel.value=termConfig.encoding;
  // 应用编码样式
  var t=document.getElementById('termArea');
  if(t){
    t.classList.toggle('term-hex', termConfig.encoding==='HEX');
  }
  // 渲染快捷命令
  termRenderQuickCmdGrid();
}
// 页面加载后初始化
document.addEventListener('DOMContentLoaded',function(){
  termInit();
});
// 兼容：如果 DOMContentLoaded 已触发，手动初始化
if(document.readyState!=='loading'){
  setTimeout(termInit, 100);
}


// ========== 协议树搜索过滤 ==========
function protoFilterTree(keyword){
  var tree = document.querySelector('.proto-tree');
  var items = tree.querySelectorAll('.proto-item');
  var subitems = tree.querySelectorAll('.proto-subitem');
  var empty = document.getElementById('protoSearchEmpty');
  var kw = keyword.trim().toLowerCase();
  
  if(!kw){
    tree.classList.remove('filtering');
    items.forEach(function(it){ it.classList.remove('match'); });
    subitems.forEach(function(si){ si.classList.remove('match'); });
    if(empty) empty.classList.remove('no-result');
    return;
  }
  
  tree.classList.add('filtering');
  var hasMatch = false;
  
  items.forEach(function(item){
    var nameEl = item.querySelector('.pi-name');
    var name = nameEl ? nameEl.textContent.toLowerCase() : '';
    if(name.indexOf(kw) >= 0){
      item.classList.add('match');
      hasMatch = true;
      // 高亮
      if(nameEl && !nameEl.classList.contains('match-highlight')){
        nameEl.classList.add('match-highlight');
      }
    } else {
      item.classList.remove('match');
      if(nameEl) nameEl.classList.remove('match-highlight');
    }
  });
  
  subitems.forEach(function(si){
    var text = si.textContent.toLowerCase();
    if(text.indexOf(kw) >= 0){
      si.classList.add('match');
      hasMatch = true;
      // 同时显示父级 proto-item
      var parent = si.closest('.proto-subitems');
      if(parent){
        var prev = parent.previousElementSibling;
        if(prev && prev.classList.contains('proto-item')){
          prev.classList.add('match');
        }
      }
    } else {
      si.classList.remove('match');
    }
  });
  
  if(empty){
    if(hasMatch){
      empty.classList.remove('no-result');
    } else {
      empty.classList.add('no-result');
    }
  }
}


// ========== 可视化增强：时间范围 + 联动 + 筛选 ==========
var _vizCurrentRange = '1m';
var _vizLinkEnabled = true;
var _vizFilters = [{field:'温度',op:'>',val:'20°C'},{field:'状态',op:'=',val:'在线'}];

function vizSetTimeRange(range, btn){
  _vizCurrentRange = range;
  var btns = document.querySelectorAll('.viz-tr-btn');
  btns.forEach(function(b){ b.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  // 联动：如果开启联动，所有图表同步时间范围
  if(_vizLinkEnabled){
    vizSyncAllChartsRange(range);
  }
}

function vizToggleLink(cb){
  _vizLinkEnabled = cb.checked;
  var label = cb.closest('.viz-link-toggle');
  if(label){
    if(cb.checked){
      label.classList.add('on');
      vizSyncAllChartsRange(_vizCurrentRange);
    } else {
      label.classList.remove('on');
    }
  }
}

function vizSyncAllChartsRange(range){
  // 模拟多图表联动：所有组件更新时间范围
  var comps = document.querySelectorAll('.viz-component');
  comps.forEach(function(c){
    c.setAttribute('data-range', range);
  });
}

function vizOpenRangePicker(){
  // 简化：弹出时间选择（原型中用 alert 模拟）
  alert('自定义时间范围选择器');
}

function vizAddFilter(){
  var fieldSel = document.getElementById('vfFieldSel');
  var opSel = document.getElementById('vfOpSel');
  var valInput = document.getElementById('vfValInput');
  if(!fieldSel || !valInput || !valInput.value.trim()) return;
  
  var filter = {
    field: fieldSel.value,
    op: opSel ? opSel.value : '=',
    val: valInput.value.trim()
  };
  _vizFilters.push(filter);
  vizRenderFilters();
  valInput.value = '';
  vizApplyFilterHighlight();
}

function vizRemoveFilter(btn){
  var item = btn.closest('.vf-item');
  if(!item) return;
  var idx = Array.from(item.parentNode.children).indexOf(item);
  if(idx >= 0 && idx < _vizFilters.length){
    _vizFilters.splice(idx, 1);
  }
  item.remove();
  vizApplyFilterHighlight();
}

function vizClearFilters(){
  _vizFilters = [];
  vizRenderFilters();
  vizApplyFilterHighlight();
}

function vizRenderFilters(){
  var list = document.getElementById('vizFilterList');
  if(!list) return;
  if(_vizFilters.length === 0){
    list.innerHTML = '<div class="vf-empty">暂无筛选条件</div>';
    return;
  }
  list.innerHTML = _vizFilters.map(function(f, i){
    return '<div class="vf-item"><span class="vf-field">' + f.field + '</span><span class="vf-op">' + f.op + '</span><span class="vf-val">' + f.val + '</span><button class="vf-del" type="button" onclick="vizRemoveFilter(this)">×</button></div>';
  }).join('');
}

function vizApplyFilterHighlight(){
  // 模拟筛选高亮效果
  var comps = document.querySelectorAll('.viz-component');
  if(_vizFilters.length === 0){
    comps.forEach(function(c){ c.classList.remove('filtered','highlight'); });
    return;
  }
  // 简化：第一个组件高亮，其他变灰（模拟筛选效果）
  comps.forEach(function(c, i){
    if(i === 0){
      c.classList.add('highlight');
      c.classList.remove('filtered');
    } else {
      c.classList.add('filtered');
      c.classList.remove('highlight');
    }
  });
}


// ========== Log search & filter ==========
var _logLevelFilter = {info:true, warn:true, error:true, debug:false};

function logSearch(keyword){
  var content = document.getElementById('logContent');
  if(!content) return;
  var lines = content.querySelectorAll('.log-line');
  var kw = keyword.trim().toLowerCase();
  var visibleCount = 0;
  var totalCount = lines.length;
  
  lines.forEach(function(line){
    var level = line.dataset.level;
    var msg = line.querySelector('.log-msg');
    var text = msg ? msg.textContent.toLowerCase() : '';
    
    if(!_logLevelFilter[level]){
      line.style.display = 'none';
      return;
    }
    
    if(kw && text.indexOf(kw) < 0){
      line.style.display = 'none';
      line.classList.remove('match');
      return;
    }
    
    line.style.display = '';
    visibleCount++;
    
    if(kw && msg){
      var originalText = msg.textContent;
      var idx = originalText.toLowerCase().indexOf(kw);
      if(idx >= 0){
        var before = originalText.substring(0, idx);
        var match = originalText.substring(idx, idx + kw.length);
        var after = originalText.substring(idx + kw.length);
        msg.innerHTML = before + '<span class="hl">' + match + '</span>' + after;
        line.classList.add('match');
      }
    } else if(msg){
      msg.textContent = msg.textContent;
      line.classList.remove('match');
    }
  });
  
  var countEl = document.getElementById('logCount');
  if(countEl){
    countEl.textContent = '显示 ' + visibleCount + ' / ' + totalCount + ' 条';
  }
}

function logToggleLevel(level, btn){
  _logLevelFilter[level] = !_logLevelFilter[level];
  if(_logLevelFilter[level]){
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
  var input = document.getElementById('logSearchInput');
  logSearch(input ? input.value : '');
}
