/* ============================================================
   Session Management Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 会话管理增强模块 ===== */

// ========== 会话状态 UI 同步（离线禁用功能） ==========
function updateSessionUIState(node){
  node = node || document.querySelector('.session-node.active');
  if(!node) return;
  var state = node.dataset.state || 'offline';
  var isOnline = (state === 'online');
  var disabled = !isOnline;

  // --- 字节流视图 ---
  var sendArea = document.getElementById('sendArea');
  if(sendArea){
    sendArea.classList.toggle('disabled', disabled);
  }
  var bytesBanner = document.getElementById('bytesOfflineBanner');
  if(bytesBanner){
    bytesBanner.classList.toggle('show', disabled);
    if(state === 'connecting'){
      bytesBanner.innerHTML = '<span class="ob-dot" style="background:var(--accent3)"></span> 正在连接设备...';
      bytesBanner.style.color = 'var(--accent3)';
      bytesBanner.style.borderColor = 'rgba(227,165,60,.3)';
      bytesBanner.style.background = 'rgba(227,165,60,.1)';
    } else if(state === 'disconnecting'){
      bytesBanner.innerHTML = '<span class="ob-dot" style="background:var(--muted)"></span> 正在断开连接...';
      bytesBanner.style.color = 'var(--muted)';
      bytesBanner.style.borderColor = 'rgba(139,148,158,.3)';
      bytesBanner.style.background = 'rgba(139,148,158,.1)';
    } else if(!isOnline){
      bytesBanner.innerHTML = '<span class="ob-dot"></span> 会话已离线，发送功能已禁用';
      bytesBanner.style.color = '';
      bytesBanner.style.borderColor = '';
      bytesBanner.style.background = '';
    }
  }

  // --- 终端视图 ---
  var termMask = document.getElementById('termOfflineMask');
  if(termMask){
    termMask.classList.toggle('show', disabled);
  }
  var termBanner = document.getElementById('termOfflineBanner');
  if(termBanner){
    termBanner.classList.toggle('show', disabled);
    if(state === 'connecting'){
      termBanner.innerHTML = '<span class="ob-dot" style="background:var(--accent3)"></span> 正在连接设备...';
      termBanner.style.color = 'var(--accent3)';
      termBanner.style.borderColor = 'rgba(227,165,60,.3)';
      termBanner.style.background = 'rgba(227,165,60,.1)';
    } else if(state === 'disconnecting'){
      termBanner.innerHTML = '<span class="ob-dot" style="background:var(--muted)"></span> 正在断开连接...';
      termBanner.style.color = 'var(--muted)';
      termBanner.style.borderColor = 'rgba(139,148,158,.3)';
      termBanner.style.background = 'rgba(139,148,158,.1)';
    } else if(!isOnline){
      termBanner.innerHTML = '<span class="ob-dot"></span> 会话已离线，终端输入已禁用';
      termBanner.style.color = '';
      termBanner.style.borderColor = '';
      termBanner.style.background = '';
    }
  }
  var termArea = document.getElementById('termArea');
  if(termArea){
    termArea.contentEditable = isOnline ? 'true' : 'false';
    termArea.style.cursor = isOnline ? 'text' : 'not-allowed';
  }
  var tcpBtns = document.querySelectorAll('.tcp-btn');
  tcpBtns.forEach(function(btn){
    if(disabled){
      btn.style.opacity = '.45';
      btn.style.cursor = 'not-allowed';
      btn.style.pointerEvents = 'none';
    } else {
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.style.pointerEvents = '';
    }
  });

  // --- 命令自动化 ---
  var cmdBar = document.getElementById('cmdBar');
  if(cmdBar){
    cmdBar.classList.toggle('disabled', disabled);
  }

  // --- 协议视图发送按钮 ---
  var protoSendBtns = document.querySelectorAll('.pft-right .conn-btn');
  protoSendBtns.forEach(function(btn){
    btn.classList.toggle('proto-send-disabled', disabled);
  });

  // --- 可视化 ---
  var vizOverlay = document.getElementById('vizOfflineOverlay');
  if(vizOverlay){
    vizOverlay.classList.toggle('show', disabled);
  }
}

// ========== 扩展 selectSession ==========
var _origSelectSession = selectSession;
selectSession = function(el, name){
  _origSelectSession(el, name);
  setTimeout(function(){ updateSessionUIState(el); }, 0);
};

// ========== 扩展 setSessionState：支持过渡态 ==========
var _origSetSessionState = setSessionState;
setSessionState = function(node, state){
  if(!node) return;
  node.dataset.state = state;
  var dot = node.querySelector('.sdot');
  if(dot){
    if(state === 'online') dot.className = 'sdot on';
    else if(state === 'connecting') dot.className = 'sdot connecting';
    else if(state === 'disconnecting') dot.className = 'sdot disconnecting';
    else dot.className = 'sdot off';
  }
  if(node.classList.contains('active')){
    syncSessionManager(node);
    updateSessionUIState(node);
  }
  updateBytesSummary(node);
};

// ========== 扩展 syncSessionManager：支持过渡态文本 ==========
var _origSyncSessionManager = syncSessionManager;
syncSessionManager = function(node){
  _origSyncSessionManager(node);
  if(!node) return;
  var state = node.dataset.state || 'offline';
  var isTransition = (state === 'connecting' || state === 'disconnecting');

  var dot = document.getElementById('smStateDot');
  var st = document.getElementById('smStateText');
  if(dot){
    if(state === 'online') dot.className = 'sdot on';
    else if(state === 'connecting') dot.className = 'sdot connecting';
    else if(state === 'disconnecting') dot.className = 'sdot disconnecting';
    else dot.className = 'sdot off';
  }
  if(st){
    if(state === 'online') st.textContent = '在线';
    else if(state === 'connecting') st.textContent = '连接中...';
    else if(state === 'disconnecting') st.textContent = '断开中...';
    else st.textContent = '离线';
  }

  var btn = document.getElementById('smConnectBtn');
  if(btn){
    btn.disabled = isTransition;
    if(state === 'connecting'){
      btn.textContent = '连接中...';
      btn.style.background = 'var(--accent3)';
      btn.style.borderColor = 'var(--accent3)';
      btn.style.color = '#0b0f14';
    } else if(state === 'disconnecting'){
      btn.textContent = '断开中...';
      btn.style.background = 'var(--muted)';
      btn.style.borderColor = 'var(--muted)';
      btn.style.color = '#fff';
    }
  }
};

// ========== 扩展 updateBytesSummary：支持过渡态 ==========
var _origUpdateBytesSummary = updateBytesSummary;
updateBytesSummary = function(node){
  _origUpdateBytesSummary(node);
  if(!node) return;
  var state = node.dataset.state || 'offline';
  var dot = document.getElementById('bytesStateDot');
  var txt = document.getElementById('bytesStateText');
  var baud = node.dataset.baud || (node.querySelector('.badge') ? node.querySelector('.badge').textContent : '115200');
  if(dot && txt){
    if(state === 'online'){
      dot.className = 'cs-dot connected';
      txt.textContent = '已连接 · ' + baud + ' bps';
      txt.style.color = '';
    } else if(state === 'connecting'){
      dot.className = 'cs-dot connecting';
      txt.textContent = '连接中... · ' + baud + ' bps';
      txt.style.color = 'var(--accent3)';
    } else if(state === 'disconnecting'){
      dot.className = 'cs-dot disconnecting';
      txt.textContent = '断开中... · ' + baud + ' bps';
      txt.style.color = 'var(--muted)';
    } else {
      dot.className = 'cs-dot';
      txt.textContent = '离线 · ' + baud + ' bps';
      txt.style.color = '';
    }
  }
};

// ========== 过渡态连接/断开 ==========
function sessStartConnect(node){
  node = node || document.querySelector('.session-node.active');
  if(!node) return;
  var state = node.dataset.state;
  if(state === 'online' || state === 'connecting') return;
  setSessionState(node, 'connecting');
  setTimeout(function(){
    if(node && node.dataset.state === 'connecting'){
      setSessionState(node, 'online');
    }
  }, 1500);
}

function sessStartDisconnect(node){
  node = node || document.querySelector('.session-node.active');
  if(!node) return;
  var state = node.dataset.state;
  if(state === 'offline' || state === 'disconnecting') return;
  setSessionState(node, 'disconnecting');
  setTimeout(function(){
    if(node && node.dataset.state === 'disconnecting'){
      setSessionState(node, 'offline');
    }
  }, 800);
}

// ========== 扩展 sessionMenuAction ==========
var _origSessionMenuAction = sessionMenuAction;
sessionMenuAction = function(action){
  var m = document.getElementById('sessionCtxMenu');
  m.style.display = 'none';
  var node = ctxNode;
  if(action === 'connect'){
    sessStartConnect(node);
  } else if(action === 'disconnect'){
    sessStartDisconnect(node);
  } else if(action === 'rename'){
    startInlineRename(node);
  } else {
    _origSessionMenuAction(action);
  }
};

// ========== 扩展 ssToggleConnect ==========
var _origSsToggleConnect = ssToggleConnect;
ssToggleConnect = function(){
  var node = ctxNode || document.querySelector('.session-node.active');
  if(!node) return;
  var state = node.dataset.state;
  if(state === 'connecting' || state === 'disconnecting') return;
  if(state === 'online'){
    sessStartDisconnect(node);
  } else {
    sessStartConnect(node);
  }
  setTimeout(function(){ openSessionSettings(node); }, 0);
};

// ========== 扩展 openSessionSettings：支持过渡态 ==========
var _origOpenSessionSettings = openSessionSettings;
openSessionSettings = function(node){
  node = node || document.querySelector('.session-node.active');
  if(!node) return;
  _origOpenSessionSettings(node);
  var state = node.dataset.state || 'offline';
  var isTransition = (state === 'connecting' || state === 'disconnecting');
  var dot = document.getElementById('ssStateDot');
  var st = document.getElementById('ssStateText');
  var btn = document.getElementById('ssConnectBtn');
  if(dot){
    if(state === 'online') dot.className = 'sdot on';
    else if(state === 'connecting') dot.className = 'sdot connecting';
    else if(state === 'disconnecting') dot.className = 'sdot disconnecting';
    else dot.className = 'sdot off';
  }
  if(st){
    if(state === 'online') st.textContent = '在线';
    else if(state === 'connecting') st.textContent = '连接中...';
    else if(state === 'disconnecting') st.textContent = '断开中...';
    else st.textContent = '离线';
  }
  if(btn){
    btn.disabled = isTransition;
    if(state === 'connecting'){
      btn.textContent = '连接中...';
      btn.style.background = 'var(--accent3)';
      btn.style.borderColor = 'var(--accent3)';
      btn.style.color = '#0b0f14';
    } else if(state === 'disconnecting'){
      btn.textContent = '断开中...';
      btn.style.background = 'var(--muted)';
      btn.style.borderColor = 'var(--muted)';
      btn.style.color = '#fff';
    }
  }
  if(isTransition){
    ['ssPort','ssBaud','ssDataBits','ssStopBits','ssParity'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.disabled = true;
    });
  }
};

// ========== 扩展 toggleConnect ==========
// ========== 扩展 toggleConnect：支持过渡态 ==========
var _origToggleConnect = toggleConnect;
toggleConnect = function(){
  var node = document.querySelector('.session-node.active');
  if(!node) return;
  var state = node.dataset.state;
  if(state === 'connecting' || state === 'disconnecting') return;
  if(state === 'online'){
    sessStartDisconnect(node);
  } else {
    sessStartConnect(node);
  }
}

// ========== 内联重命名 ==========
var _renameInputNode = null;
var _renameInputNameEl = null;
var _renameInputEl = null;

function startInlineRename(node){
  if(!node) return;
  if(_renameInputNode && _renameInputNode !== node){
    confirmInlineRename();
  }
  var nameEl = node.querySelector('.name');
  if(!nameEl) return;
  var currentName = node.dataset.name || nameEl.textContent;
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'name-input';
  input.value = currentName;
  nameEl.style.display = 'none';
  nameEl.parentNode.insertBefore(input, nameEl);
  input.focus();
  input.select();
  _renameInputNode = node;
  _renameInputNameEl = nameEl;
  _renameInputEl = input;

  input.onkeydown = function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      confirmInlineRename();
    } else if(e.key === 'Escape'){
      e.preventDefault();
      cancelInlineRename();
    }
  };
  input.onblur = function(){
    confirmInlineRename();
  };
  input.onclick = function(e){ e.stopPropagation(); };
}

function confirmInlineRename(){
  if(!_renameInputNode || !_renameInputEl || !_renameInputNameEl) return;
  var newName = _renameInputEl.value.trim();
  var node = _renameInputNode;
  if(newName && newName !== (node.dataset.name || '')){
    node.dataset.name = newName;
    _renameInputNameEl.textContent = newName;
    if(node.classList.contains('active')){
      syncSessionManager(node);
      var sdName = document.getElementById('sdDeviceName');
      if(sdName) sdName.textContent = newName;
    }
  }
  _renameInputNameEl.style.display = '';
  if(_renameInputEl && _renameInputEl.parentNode){
    _renameInputEl.parentNode.removeChild(_renameInputEl);
  }
  _renameInputNode = null;
  _renameInputNameEl = null;
  _renameInputEl = null;
}

function cancelInlineRename(){
  if(!_renameInputNode || !_renameInputEl || !_renameInputNameEl) return;
  _renameInputNameEl.style.display = '';
  if(_renameInputEl && _renameInputEl.parentNode){
    _renameInputEl.parentNode.removeChild(_renameInputEl);
  }
  _renameInputNode = null;
  _renameInputNameEl = null;
  _renameInputEl = null;
}

// ========== 详情面板名称编辑 ==========
var _detailRenameInput = null;
var _detailRenameEl = null;

function startDetailRename(el){
  if(_detailRenameInput) return;
  var currentName = el.textContent;
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'sd-name-input';
  input.value = currentName;
  el.style.display = 'none';
  el.parentNode.insertBefore(input, el);
  input.focus();
  input.select();
  _detailRenameInput = input;
  _detailRenameEl = el;

  input.onkeydown = function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      confirmDetailRename();
    } else if(e.key === 'Escape'){
      e.preventDefault();
      cancelDetailRename();
    }
  };
  input.onblur = function(){
    confirmDetailRename();
  };
  input.onclick = function(e){ e.stopPropagation(); };
}

function confirmDetailRename(){
  if(!_detailRenameInput || !_detailRenameEl) return;
  var newName = _detailRenameInput.value.trim();
  var activeNode = document.querySelector('.session-node.active');
  if(newName && activeNode){
    activeNode.dataset.name = newName;
    var nameEl = activeNode.querySelector('.name');
    if(nameEl) nameEl.textContent = newName;
    _detailRenameEl.textContent = newName;
    syncSessionManager(activeNode);
  }
  _detailRenameEl.style.display = '';
  if(_detailRenameInput && _detailRenameInput.parentNode){
    _detailRenameInput.parentNode.removeChild(_detailRenameInput);
  }
  _detailRenameInput = null;
  _detailRenameEl = null;
}

function cancelDetailRename(){
  if(!_detailRenameInput || !_detailRenameEl) return;
  _detailRenameEl.style.display = '';
  if(_detailRenameInput && _detailRenameInput.parentNode){
    _detailRenameInput.parentNode.removeChild(_detailRenameInput);
  }
  _detailRenameInput = null;
  _detailRenameEl = null;
}

// 双击会话节点名称触发内联编辑
document.addEventListener('dblclick', function(e){
  var node = e.target.closest('.session-node');
  if(node && e.target.classList.contains('name')){
    e.preventDefault();
    e.stopPropagation();
    startInlineRename(node);
  }
});

// ========== 会话统计重置 ==========
function resetSessionStats(){
  var activeNode = document.querySelector('.session-node.active');
  if(!activeNode) return;
  var name = activeNode.dataset.name || activeNode.querySelector('.name').textContent;
  if(!confirm('确定要重置会话 "' + name + '" 的统计数据吗？\n将清零 RX/TX 计数和连接时长。')){
    return;
  }
  var durEl = document.getElementById('sdConnDuration');
  if(durEl) durEl.textContent = '00:00:00';
  var rxtxEl = document.getElementById('sdRxtx');
  if(rxtxEl) rxtxEl.textContent = '0 / 0';
  var rxStat = document.querySelector('.stat[data-stat="rx"] b');
  var txStat = document.querySelector('.stat[data-stat="tx"] b');
  if(rxStat) rxStat.textContent = '0';
  if(txStat) txStat.textContent = '0';
  activeNode.dataset.rx = '0';
  activeNode.dataset.tx = '0';
  activeNode.dataset.connTime = '0';
}

// ========== 分组管理 ==========
var _ctxGroupHeader = null;

function showGroupMenu(e, headerEl){
  e.preventDefault();
  e.stopPropagation();
  var group = headerEl.closest('.session-group');
  _ctxGroupHeader = headerEl;
  var menu = document.getElementById('groupCtxMenu');
  menu.style.display = 'block';
  menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 160) + 'px';
  var body = group.querySelector('.sg-body');
  var count = body ? body.querySelectorAll('.session-node').length : 0;
  var delItem = document.getElementById('deleteGroupItem');
  if(delItem){
    if(count > 0){
      delItem.classList.add('disabled');
      delItem.title = '分组不为空，无法删除';
    } else {
      delItem.classList.remove('disabled');
      delItem.title = '';
    }
  }
}

function groupMenuAction(action){
  var menu = document.getElementById('groupCtxMenu');
  menu.style.display = 'none';
  var header = _ctxGroupHeader;
  var group = header ? header.closest('.session-group') : null;
  if(!group) return;

  if(action === 'rename'){
    var currentName = group.dataset.group || '';
    var newName = prompt('重命名分组：', currentName);
    if(newName && newName.trim()){
      newName = newName.trim();
      group.dataset.group = newName;
      var textNode = null;
      for(var i = 0; i < header.childNodes.length; i++){
        if(header.childNodes[i].nodeType === 3 && header.childNodes[i].textContent.trim()){
          textNode = header.childNodes[i];
          break;
        }
      }
      if(textNode){
        textNode.textContent = ' ' + newName + ' ';
      }
      updateGroupCounts();
    }
  } else if(action === 'addSession'){
    ctxNode = null;
    openNewSession();
    _newSessionTargetGroup = group;
  } else if(action === 'delete'){
    var body = group.querySelector('.sg-body');
    var count = body ? body.querySelectorAll('.session-node').length : 0;
    if(count > 0) return;
    var gName = group.dataset.group || '';
    if(confirm('确定删除分组 "' + gName + '"？')){
      group.remove();
    }
  }
  _ctxGroupHeader = null;
}

document.addEventListener('click', function(e){
  if(!e.target.closest('#groupCtxMenu') && !e.target.closest('.sg-header')){
    var menu = document.getElementById('groupCtxMenu');
    if(menu) menu.style.display = 'none';
  }
});

// ========== 新建分组 ==========
function addGroupPrompt(){
  var name = prompt('新建分组', '新分组');
  if(!name || !name.trim()) return;
  name = name.trim();
  var tree = document.getElementById('sessionTree');
  var group = document.createElement('div');
  group.className = 'session-group';
  group.dataset.group = name;
  group.innerHTML = '<div class="sg-header" onclick="toggleGroup(this)" oncontextmenu="showGroupMenu(event,this)"><span class="sg-arrow">▾</span> ' + name + ' <span class="sg-count">0</span></div><div class="sg-body"></div>';
  tree.appendChild(group);
}

// ========== 更新所有分组计数 ==========
function updateGroupCounts(){
  document.querySelectorAll('.session-group').forEach(function(group){
    var body = group.querySelector('.sg-body');
    var count = body ? body.querySelectorAll('.session-node').length : 0;
    var cntEl = group.querySelector('.sg-count');
    if(cntEl) cntEl.textContent = count;
  });
}

// ========== 移动到分组 ==========
function populateMoveToGroupMenu(){
  var panel = document.getElementById('moveToGroupPanel');
  if(!panel) return;
  panel.innerHTML = '';
  var activeNode = ctxNode;
  var currentGroup = activeNode ? activeNode.closest('.session-group') : null;
  var currentGroupName = currentGroup ? (currentGroup.dataset.group || '') : '';

  document.querySelectorAll('.session-group').forEach(function(group){
    var gName = group.dataset.group || '';
    var item = document.createElement('div');
    item.className = 'cm-sub-item';
    item.textContent = gName;
    if(gName === currentGroupName){
      item.style.opacity = '.5';
      item.style.cursor = 'default';
      item.textContent = gName + ' (当前)';
    } else {
      item.onclick = function(e){
        e.stopPropagation();
        moveSessionToGroup(activeNode, group);
        document.getElementById('sessionCtxMenu').style.display = 'none';
      };
    }
    panel.appendChild(item);
  });
}

function moveSessionToGroup(node, targetGroup){
  if(!node || !targetGroup) return;
  var targetBody = targetGroup.querySelector('.sg-body');
  if(!targetBody) return;
  targetBody.appendChild(node);
  updateGroupCounts();
}

// 扩展 showSessionMenu
var _origShowSessionMenu = showSessionMenu;
showSessionMenu = function(e, name){
  _origShowSessionMenu(e, name);
  populateMoveToGroupMenu();
};

// ========== 扩展 createSession ==========
var _newSessionTargetGroup = null;
var _origCreateSession = createSession;
createSession = function(){
  if(_newSessionTargetGroup){
    var mode = document.getElementById('nsMode').value || 'bytes';
    var name = document.getElementById('nsName').value || '新设备';
    var baud = document.getElementById('nsBaud').value;
    var body = _newSessionTargetGroup.querySelector('.sg-body');
    if(!body) { _origCreateSession(); return; }

    var node = document.createElement('div');
    node.className = 'session-node';
    node.setAttribute('data-mode', mode);
    node.setAttribute('data-state', 'online');
    node.setAttribute('data-name', name);
    node.setAttribute('data-baud', baud);
    var modeText = (mode === 'terminal') ? '终端' : '字节流';
    node.innerHTML = '<span class="sdot on"></span><span class="name">' + name + '</span><span class="badge">' + baud + '</span><span class="mode-tag">' + modeText + '</span><span class="s-more">⋯</span>';
    node.onclick = function(){ selectSession(this, name); };
    node.oncontextmenu = function(e){ showSessionMenu(e, name); };
    var moreBtn = node.querySelector('.s-more');
    if(moreBtn){
      moreBtn.onclick = function(e){ event.stopPropagation(); showSessionMenu(e, name); };
    }
    body.appendChild(node);
    updateGroupCounts();
    selectSession(node, name);
    closeNewSession();
    switchView((mode === 'terminal') ? 'view-terminal' : 'view-bytes', document.querySelector('.vt-item[data-view=' + (mode === 'terminal' ? 'view-terminal' : 'view-bytes') + ']'));
    _newSessionTargetGroup = null;
    return;
  }
  _origCreateSession();
  setTimeout(updateGroupCounts, 0);
};

// ========== 扩展 duplicateSession ==========
var _origDuplicateSession = duplicateSession;
duplicateSession = function(src){
  _origDuplicateSession(src);
  setTimeout(updateGroupCounts, 0);
};

// ========== renameSession 兼容旧调用 ==========
// ========== 扩展 renameSession：内联重命名 ==========
var _origRenameSession = renameSession;
renameSession = function(node){
  startInlineRename(node);
}

// ========== 初始化状态应用 ==========
setTimeout(function(){
  var active = document.querySelector('.session-node.active');
  if(active) updateSessionUIState(active);
}, 100);
