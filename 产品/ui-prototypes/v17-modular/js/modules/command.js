/* ============================================================
   Command Automation Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 命令自动化模块 ===== */
var cmdState = {
  groups: [],
  activeGroupId: null,
  ctxMenuGroupId: null,
  modalMode: 'create',
  execStatus: 'idle',
  execIndex: -1,
  execTimer: null,
  loopEnabled: false,
  loopCurrent: 0,
  mdSelected: {},
  devices: [
    {id:'dev-a', name:'设备 A · COM3', online:true},
    {id:'dev-b', name:'设备 B · COM4', online:true},
    {id:'dev-c', name:'设备 C · COM5', online:false},
    {id:'dev-d', name:'设备 D · TCP 192.168.1.10', online:true}
  ]
};

var cmdTypes = [
  {value:'send', label:'发送', hasContent:true, hasDelay:true, fields:[
    {key:'encoding', label:'编码', type:'select', options:['ASCII','HEX'], default:'ASCII'},
    {key:'lineEnd', label:'行尾', type:'select', options:['无','\\r\\n','\\n','\\r'], default:'\\r\\n'}
  ]},
  {value:'wait', label:'等待', hasContent:true, hasDelay:false, fields:[
    {key:'timeout', label:'超时(ms)', type:'number', default:5000}
  ]},
  {value:'sleep', label:'延时', hasContent:false, hasDelay:false, fields:[
    {key:'duration', label:'时长(ms)', type:'number', default:1000}
  ]},
  {value:'loop', label:'循环', hasContent:false, hasDelay:false, fields:[
    {key:'count', label:'次数', type:'number', default:3}
  ]},
  {value:'condition', label:'条件', hasContent:true, hasDelay:false, fields:[
    {key:'pattern', label:'匹配内容', type:'text', default:''},
    {key:'target', label:'跳转组', type:'text', default:''}
  ]},
  {value:'read', label:'读取', hasContent:false, hasDelay:false, fields:[
    {key:'varName', label:'变量名', type:'text', default:'data'},
    {key:'timeout', label:'超时(ms)', type:'number', default:2000}
  ]}
];

function cmdInitData(){
  cmdState.groups = [
    {
      id: 'g-init',
      name: '初始化序列',
      type: 'normal',
      loopMode: 'none',
      loopCount: 3,
      loopInterval: 1000,
      commands: [
        {type:'send', content:'AT+RST', encoding:'ASCII', lineEnd:'\\r\\n', delay:1000},
        {type:'sleep', duration:500},
        {type:'send', content:'AT+CWMODE=1', encoding:'ASCII', lineEnd:'\\r\\n', delay:500},
        {type:'wait', content:'OK', timeout:3000},
        {type:'send', content:'AT+CWJAP="SSID","PASS"', encoding:'ASCII', lineEnd:'\\r\\n', delay:3000}
      ]
    },
    {
      id: 'g-poll',
      name: '状态轮询',
      type: 'normal',
      loopMode: 'infinite',
      loopCount: 0,
      loopInterval: 2000,
      commands: [
        {type:'send', content:'AT+STATE?', encoding:'ASCII', lineEnd:'\\r\\n', delay:500},
        {type:'wait', content:'OK', timeout:2000},
        {type:'read', varName:'state', timeout:1000}
      ]
    },
    {
      id: 'g-calib',
      name: '校准流程',
      type: 'normal',
      loopMode: 'count',
      loopCount: 3,
      loopInterval: 1000,
      commands: [
        {type:'send', content:'CAL:START', encoding:'ASCII', lineEnd:'\\r\\n', delay:2000},
        {type:'loop', count:5},
        {type:'send', content:'CAL:STEP', encoding:'ASCII', lineEnd:'\\r\\n', delay:1000},
        {type:'condition', pattern:'SUCCESS', target:''},
        {type:'send', content:'CAL:DONE', encoding:'ASCII', lineEnd:'\\r\\n', delay:500}
      ]
    },
    {
      id: 'g-script',
      name: '脚本: setup.py',
      type: 'script',
      loopMode: 'none',
      loopCount: 0,
      loopInterval: 1000,
      commands: [
        {type:'send', content:'import serial', encoding:'ASCII', lineEnd:'\\n', delay:0}
      ]
    }
  ];
  cmdState.activeGroupId = 'g-init';
}

function cmdGetActiveGroup(){
  return cmdState.groups.find(function(g){return g.id===cmdState.activeGroupId});
}

function cmdRenderGroupList(){
  var list = document.getElementById('cmdGroupList');
  if(!list) return;
  list.innerHTML = '';
  cmdState.groups.forEach(function(g){
    var item = document.createElement('div');
    item.className = 'cl-item type-' + g.type + (g.id===cmdState.activeGroupId ? ' active' : '');
    item.dataset.id = g.id;
    var count = g.commands ? g.commands.length : 0;
    item.innerHTML = '<span class="cl-type-icon"></span><span class="cl-name" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + g.name + '</span>' +
      '<span class="count">' + count + '</span>' +
      '<button class="cl-more" type="button" onclick="event.stopPropagation();cmdShowCtxMenu(event,\''+g.id+'\')">\u22ef</button>';
    item.onclick = function(){cmdSelectGroup(g.id)};
    item.oncontextmenu = function(e){e.preventDefault();cmdShowCtxMenu(e, g.id)};
    list.appendChild(item);
  });
}

function cmdSelectGroup(id){
  if(cmdState.execStatus==='running'){
    if(!confirm('当前命令组正在执行，切换将停止执行。确认切换？')) return;
    cmdStop();
  }
  cmdState.activeGroupId = id;
  cmdRenderGroupList();
  cmdRenderEditArea();
  cmdUpdateStatus();
}

function cmdRenderEditArea(){
  var group = cmdGetActiveGroup();
  if(!group) return;
  document.getElementById('cmdGroupTitle').textContent = group.name;
  var tag = document.getElementById('cmdTypeTag');
  tag.textContent = group.type==='script' ? '脚本组' : '普通组';
  tag.className = 'cmd-type-tag' + (group.type==='script' ? ' script' : '');
  document.getElementById('cmdLoopMode').value = group.loopMode || 'none';
  document.getElementById('cmdLoopCount').value = group.loopCount || 3;
  document.getElementById('cmdLoopInterval').value = group.loopInterval || 1000;
  document.getElementById('cmdLoopCountRow').style.display = (group.loopMode==='count') ? 'flex' : 'none';
  cmdRenderRows();
}

function cmdGetTypeFieldsHtml(cmd, idx){
  var typeDef = cmdTypes.find(function(t){return t.value===cmd.type});
  if(!typeDef || !typeDef.fields) return '';
  var html = '<div class="cmd-field-row">';
  typeDef.fields.forEach(function(f){
    var val = cmd[f.key] !== undefined ? cmd[f.key] : f.default;
    html += '<span class="cmd-field-label">' + f.label + '</span>';
    if(f.type==='select'){
      html += '<select class="cmd-field-input" style="width:auto" onchange="cmdUpdateField('+idx+',\''+f.key+'\',this.value)">';
      f.options.forEach(function(opt){
        html += '<option value="'+opt+'"'+(opt===val?' selected':'')+'>'+opt+'</option>';
      });
      html += '</select>';
    } else {
      html += '<input type="'+f.type+'" class="cmd-field-input" style="width:70px" value="'+val+'" onchange="cmdUpdateField('+idx+',\''+f.key+'\',this.value)">';
    }
  });
  html += '</div>';
  return html;
}

function cmdRenderRows(){
  var group = cmdGetActiveGroup();
  if(!group) return;
  var container = document.getElementById('cmdRowsContainer');
  if(!container) return;
  container.innerHTML = '';
  group.commands.forEach(function(cmd, idx){
    var typeDef = cmdTypes.find(function(t){return t.value===cmd.type});
    var row = document.createElement('div');
    row.className = 'cmd-row' + (cmdState.execIndex===idx && cmdState.execStatus==='running' ? ' running' : '');
    row.dataset.idx = idx;
    var contentHtml = '';
    if(typeDef && typeDef.hasContent){
      contentHtml = '<input type="text" class="cmd-input" value="'+(cmd.content||'').replace(/"/g,'&quot;')+'" placeholder="命令内容" onchange="cmdUpdateContent('+idx+',this.value)">';
    } else {
      contentHtml = cmdGetTypeFieldsHtml(cmd, idx);
    }
    var delayHtml = '';
    if(typeDef && typeDef.hasDelay){
      delayHtml = '<input type="number" class="cmd-delay-input" value="'+(cmd.delay||0)+'" min="0" onchange="cmdUpdateDelay('+idx+',this.value)">' +
        '<span class="cmd-delay-unit">ms</span>';
    }
    row.innerHTML =
      '<span class="idx">'+(idx+1)+'</span>' +
      '<select class="cmd-type-select" onchange="cmdChangeType('+idx+',this.value)">' +
        cmdTypes.map(function(t){return '<option value="'+t.value+'"'+(t.value===cmd.type?' selected':'')+'>'+t.label+'</option>'}).join('') +
      '</select>' +
      contentHtml +
      delayHtml +
      '<div class="cmd-row-actions">' +
        '<button class="row-btn" type="button" title="上移" onclick="cmdMoveRow('+idx+',-1)">\u2191</button>' +
        '<button class="row-btn" type="button" title="下移" onclick="cmdMoveRow('+idx+',1)">\u2193</button>' +
        '<button class="row-btn del" type="button" title="删除" onclick="cmdDeleteRow('+idx+')">\u00d7</button>' +
      '</div>';
    container.appendChild(row);
  });
}

function cmdUpdateContent(idx, val){
  var group = cmdGetActiveGroup();
  if(group && group.commands[idx]) group.commands[idx].content = val;
}

function cmdUpdateDelay(idx, val){
  var group = cmdGetActiveGroup();
  if(group && group.commands[idx]) group.commands[idx].delay = parseInt(val)||0;
}

function cmdUpdateField(idx, key, val){
  var group = cmdGetActiveGroup();
  if(group && group.commands[idx]){
    if(key==='timeout'||key==='duration'||key==='count') val = parseInt(val)||0;
    group.commands[idx][key] = val;
  }
}

function cmdChangeType(idx, newType){
  var group = cmdGetActiveGroup();
  if(!group || !group.commands[idx]) return;
  var typeDef = cmdTypes.find(function(t){return t.value===newType});
  var newCmd = {type: newType};
  if(typeDef){
    if(typeDef.hasContent) newCmd.content = '';
    if(typeDef.hasDelay) newCmd.delay = 1000;
    typeDef.fields.forEach(function(f){ newCmd[f.key] = f.default; });
  }
  group.commands[idx] = newCmd;
  cmdRenderRows();
}

function cmdAddRow(){
  var group = cmdGetActiveGroup();
  if(!group) return;
  group.commands.push({type:'send', content:'', encoding:'ASCII', lineEnd:'\\r\\n', delay:1000});
  cmdRenderRows();
  cmdRenderGroupList();
  cmdUpdateStatus();
}

function cmdDeleteRow(idx){
  var group = cmdGetActiveGroup();
  if(!group || !group.commands[idx]) return;
  group.commands.splice(idx, 1);
  cmdRenderRows();
  cmdRenderGroupList();
  cmdUpdateStatus();
}

function cmdMoveRow(idx, dir){
  var group = cmdGetActiveGroup();
  if(!group) return;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= group.commands.length) return;
  var tmp = group.commands[idx];
  group.commands[idx] = group.commands[newIdx];
  group.commands[newIdx] = tmp;
  cmdRenderRows();
}

function cmdCreateGroup(){
  cmdState.modalMode = 'create';
  document.getElementById('cmdGroupModalTitle').textContent = '新建命令组';
  document.getElementById('cmdGroupNameInput').value = '';
  document.getElementById('cmdGroupTypeSelect').value = 'normal';
  document.getElementById('cmdGroupModal').classList.add('show');
  setTimeout(function(){document.getElementById('cmdGroupNameInput').focus()}, 50);
}

function cmdRenameGroup(){
  var id = cmdState.ctxMenuGroupId;
  if(!id) return;
  var group = cmdState.groups.find(function(g){return g.id===id});
  if(!group) return;
  cmdHideCtxMenu();
  cmdState.modalMode = 'rename';
  document.getElementById('cmdGroupModalTitle').textContent = '重命名命令组';
  document.getElementById('cmdGroupNameInput').value = group.name;
  document.getElementById('cmdGroupTypeSelect').value = group.type;
  document.getElementById('cmdGroupModal').classList.add('show');
  setTimeout(function(){
    var inp = document.getElementById('cmdGroupNameInput');
    inp.focus();
    inp.select();
  }, 50);
}

function cmdDuplicateGroup(){
  var id = cmdState.ctxMenuGroupId;
  if(!id) return;
  var group = cmdState.groups.find(function(g){return g.id===id});
  if(!group) return;
  cmdHideCtxMenu();
  var newGroup = JSON.parse(JSON.stringify(group));
  newGroup.id = 'g-' + Date.now();
  newGroup.name = group.name + ' 副本';
  var idx = cmdState.groups.findIndex(function(g){return g.id===id});
  cmdState.groups.splice(idx+1, 0, newGroup);
  cmdState.activeGroupId = newGroup.id;
  cmdRenderGroupList();
  cmdRenderEditArea();
  cmdUpdateStatus();
}

function cmdDeleteGroup(){
  var id = cmdState.ctxMenuGroupId;
  if(!id) return;
  cmdHideCtxMenu();
  if(!confirm('确定删除该命令组？此操作不可撤销。')) return;
  var idx = cmdState.groups.findIndex(function(g){return g.id===id});
  if(idx < 0) return;
  cmdState.groups.splice(idx, 1);
  if(cmdState.activeGroupId === id){
    cmdState.activeGroupId = cmdState.groups.length > 0 ? cmdState.groups[0].id : null;
  }
  cmdRenderGroupList();
  cmdRenderEditArea();
  cmdUpdateStatus();
}

function cmdExportGroup(){
  var id = cmdState.ctxMenuGroupId;
  if(!id) return;
  var group = cmdState.groups.find(function(g){return g.id===id});
  if(!group) return;
  cmdHideCtxMenu();
  var script = '# PortPilot 命令组导出: ' + group.name + '\n';
  script += '# 命令数: ' + group.commands.length + '\n\n';
  group.commands.forEach(function(cmd, i){
    script += '# Step ' + (i+1) + ': ' + cmd.type + '\n';
    if(cmd.type==='send'){
      script += 'send("' + (cmd.content||'') + '")\n';
    } else if(cmd.type==='sleep'){
      script += 'sleep(' + (cmd.duration||1000) + ')\n';
    } else if(cmd.type==='wait'){
      script += 'wait_for("' + (cmd.content||'') + '", timeout=' + (cmd.timeout||5000) + ')\n';
    }
  });
  var blob = new Blob([script], {type:'text/plain'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = group.name.replace(/\s+/g,'_') + '.py';
  a.click();
  URL.revokeObjectURL(url);
}

function cmdCloseGroupModal(){
  document.getElementById('cmdGroupModal').classList.remove('show');
}

function cmdConfirmGroupModal(){
  var name = document.getElementById('cmdGroupNameInput').value.trim();
  var type = document.getElementById('cmdGroupTypeSelect').value;
  if(!name){ alert('请输入命令组名称'); return; }
  if(cmdState.modalMode==='create'){
    var newGroup = {
      id: 'g-' + Date.now(),
      name: name,
      type: type,
      loopMode: 'none',
      loopCount: 3,
      loopInterval: 1000,
      commands: [{type:'send', content:'', encoding:'ASCII', lineEnd:'\\r\\n', delay:1000}]
    };
    cmdState.groups.push(newGroup);
    cmdState.activeGroupId = newGroup.id;
  } else if(cmdState.modalMode==='rename'){
    var group = cmdState.groups.find(function(g){return g.id===cmdState.ctxMenuGroupId});
    if(group){
      group.name = name;
      group.type = type;
    }
  }
  cmdCloseGroupModal();
  cmdRenderGroupList();
  cmdRenderEditArea();
  cmdUpdateStatus();
}

function cmdShowCtxMenu(e, groupId){
  e.stopPropagation();
  cmdState.ctxMenuGroupId = groupId;
  var menu = document.getElementById('cmdCtxMenu');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.classList.add('show');
}

function cmdHideCtxMenu(){
  var menu = document.getElementById('cmdCtxMenu');
  if(menu) menu.classList.remove('show');
  cmdState.ctxMenuGroupId = null;
}

document.addEventListener('click', function(e){
  var menu = document.getElementById('cmdCtxMenu');
  if(menu && menu.classList.contains('show') && !menu.contains(e.target)){
    cmdHideCtxMenu();
  }
});

function cmdUpdateLoopConfig(){
  var group = cmdGetActiveGroup();
  if(!group) return;
  group.loopMode = document.getElementById('cmdLoopMode').value;
  group.loopCount = parseInt(document.getElementById('cmdLoopCount').value)||3;
  group.loopInterval = parseInt(document.getElementById('cmdLoopInterval').value)||0;
  document.getElementById('cmdLoopCountRow').style.display = (group.loopMode==='count') ? 'flex' : 'none';
}

function cmdToggleLoopBtn(){
  var btn = document.getElementById('cmdLoopBtn');
  cmdState.loopEnabled = !cmdState.loopEnabled;
  btn.classList.toggle('active', cmdState.loopEnabled);
  var group = cmdGetActiveGroup();
  if(group){
    group.loopMode = cmdState.loopEnabled ? 'infinite' : 'none';
    document.getElementById('cmdLoopMode').value = group.loopMode;
    document.getElementById('cmdLoopCountRow').style.display = 'none';
  }
}

function cmdUpdateStatus(){
  var statusEl = document.getElementById('cmdStatus');
  if(!statusEl) return;
  var group = cmdGetActiveGroup();
  var total = group ? group.commands.length : 0;
  statusEl.classList.remove('running','paused','error','done');
  switch(cmdState.execStatus){
    case 'running':
      statusEl.classList.add('running');
      statusEl.textContent = '执行中 · 第 ' + (cmdState.execIndex+1) + '/' + total + ' 条';
      break;
    case 'paused':
      statusEl.classList.add('paused');
      statusEl.textContent = '已暂停 · 第 ' + (cmdState.execIndex+1) + '/' + total + ' 条';
      break;
    case 'done':
      statusEl.classList.add('done');
      statusEl.textContent = '已完成 · 共 ' + total + ' 条命令';
      break;
    case 'error':
      statusEl.classList.add('error');
      statusEl.textContent = '执行错误 · 第 ' + (cmdState.execIndex+1) + '/' + total + ' 条';
      break;
    default:
      statusEl.textContent = '待执行 · ' + total + ' 条命令';
  }
}

function cmdHighlightRow(idx){
  var rows = document.querySelectorAll('#cmdRowsContainer .cmd-row');
  rows.forEach(function(r, i){
    r.classList.toggle('running', i===idx && cmdState.execStatus==='running');
  });
}

function cmdGetCmdDelay(cmd){
  if(cmd.type==='send') return cmd.delay || 1000;
  if(cmd.type==='sleep') return cmd.duration || 1000;
  if(cmd.type==='wait') return Math.min(cmd.timeout || 5000, 800);
  if(cmd.type==='loop') return 300;
  if(cmd.type==='condition') return 300;
  if(cmd.type==='read') return Math.min(cmd.timeout || 2000, 500);
  return 500;
}

function cmdExecNext(){
  var group = cmdGetActiveGroup();
  if(!group || !group.commands.length) return;
  if(cmdState.execStatus !== 'running') return;
  cmdState.execIndex++;
  if(cmdState.execIndex >= group.commands.length){
    var loopMode = cmdState.loopEnabled ? 'infinite' : (group.loopMode || 'none');
    if(loopMode === 'infinite'){
      cmdState.execIndex = -1;
      cmdState.execTimer = setTimeout(function(){
        cmdExecNext();
      }, group.loopInterval || 0);
      return;
    } else if(loopMode === 'count'){
      cmdState.loopCurrent++;
      if(cmdState.loopCurrent < group.loopCount){
        cmdState.execIndex = -1;
        cmdState.execTimer = setTimeout(function(){
          cmdExecNext();
        }, group.loopInterval || 0);
        return;
      } else {
        cmdState.loopCurrent = 0;
      }
    }
    cmdState.execStatus = 'done';
    cmdState.execIndex = -1;
    cmdHighlightRow(-1);
    cmdUpdateStatus();
    return;
  }
  var cmd = group.commands[cmdState.execIndex];
  cmdHighlightRow(cmdState.execIndex);
  cmdUpdateStatus();
  var delay = cmdGetCmdDelay(cmd);
  cmdState.execTimer = setTimeout(function(){
    cmdExecNext();
  }, delay);
}

function cmdPlay(){
  var group = cmdGetActiveGroup();
  if(!group || !group.commands.length) return;
  if(cmdState.execStatus === 'paused'){
    cmdState.execStatus = 'running';
    cmdHighlightRow(cmdState.execIndex);
    cmdUpdateStatus();
    var cmd = group.commands[cmdState.execIndex];
    var delay = cmdGetCmdDelay(cmd);
    cmdState.execTimer = setTimeout(function(){
      cmdExecNext();
    }, delay / 2);
    return;
  }
  if(cmdState.execStatus === 'running') return;
  cmdStop(false);
  cmdState.execStatus = 'running';
  cmdState.loopCurrent = 0;
  cmdUpdateStatus();
  cmdExecNext();
}

function cmdPause(){
  if(cmdState.execStatus !== 'running') return;
  if(cmdState.execTimer){
    clearTimeout(cmdState.execTimer);
    cmdState.execTimer = null;
  }
  cmdState.execStatus = 'paused';
  cmdHighlightRow(cmdState.execIndex);
  cmdUpdateStatus();
}

function cmdStep(){
  var group = cmdGetActiveGroup();
  if(!group || !group.commands.length) return;
  if(cmdState.execStatus === 'done' || cmdState.execStatus === 'idle'){
    cmdState.execIndex = -1;
  }
  if(cmdState.execIndex >= group.commands.length - 1){
    cmdState.execIndex = -1;
  }
  cmdState.execIndex++;
  cmdState.execStatus = 'paused';
  cmdHighlightRow(cmdState.execIndex);
  cmdUpdateStatus();
}

function cmdStop(resetStatus){
  if(cmdState.execTimer){
    clearTimeout(cmdState.execTimer);
    cmdState.execTimer = null;
  }
  cmdState.execStatus = resetStatus === false ? cmdState.execStatus : 'idle';
  cmdState.execIndex = -1;
  cmdState.loopCurrent = 0;
  cmdHighlightRow(-1);
  if(resetStatus !== false) cmdUpdateStatus();
}

function cmdToggleMultiDevice(){
  var wrap = document.querySelector('.cmd-multi-device');
  wrap.classList.toggle('show');
  if(wrap.classList.contains('show')){
    cmdRenderMdList();
  }
}

function cmdCloseMultiDevice(){
  var wrap = document.querySelector('.cmd-multi-device');
  if(wrap) wrap.classList.remove('show');
}

function cmdRenderMdList(){
  var list = document.getElementById('cmdMdList');
  if(!list) return;
  list.innerHTML = '';
  cmdState.devices.forEach(function(d){
    var item = document.createElement('div');
    item.className = 'cmd-md-item' + (d.online ? '' : ' offline');
    var checked = cmdState.mdSelected[d.id] ? ' checked' : '';
    item.innerHTML = '<input type="checkbox" id="md-'+d.id+'"'+checked+(!d.online?' disabled':'')+' onchange="cmdToggleMdDevice(\''+d.id+'\')">' +
      '<span class="md-name">'+d.name+'</span>' +
      '<span class="md-dot" title="'+(d.online?'在线':'离线')+'"></span>';
    list.appendChild(item);
  });
}

function cmdToggleMdDevice(id){
  var cb = document.getElementById('md-'+id);
  if(cb){
    cmdState.mdSelected[id] = cb.checked;
  }
}

function cmdRunMultiDevice(){
  var selected = Object.keys(cmdState.mdSelected).filter(function(k){return cmdState.mdSelected[k]});
  if(selected.length === 0){
    alert('请至少选择一台设备');
    return;
  }
  cmdCloseMultiDevice();
  cmdState.execStatus = 'running';
  cmdState.execIndex = -1;
  cmdUpdateStatus();
  var statusEl = document.getElementById('cmdStatus');
  statusEl.textContent = '并行执行中 · ' + selected.length + ' 台设备';
  statusEl.classList.add('running');
  var group = cmdGetActiveGroup();
  var total = group ? group.commands.length : 0;
  var current = 0;
  function step(){
    if(current >= total){
      cmdState.execStatus = 'done';
      statusEl.textContent = '并行完成 · ' + selected.length + ' 台设备 · ' + total + ' 条命令';
      statusEl.classList.remove('running');
      statusEl.classList.add('done');
      cmdHighlightRow(-1);
      return;
    }
    cmdHighlightRow(current);
    statusEl.textContent = '并行执行中 · ' + selected.length + ' 台设备 · 第 ' + (current+1) + '/' + total + ' 条';
    current++;
    cmdState.execTimer = setTimeout(step, 800);
  }
  if(cmdState.execTimer) clearTimeout(cmdState.execTimer);
  step();
}

document.addEventListener('click', function(e){
  var wrap = document.querySelector('.cmd-multi-device');
  if(wrap && wrap.classList.contains('show') && !wrap.contains(e.target)){
    cmdCloseMultiDevice();
  }
});
