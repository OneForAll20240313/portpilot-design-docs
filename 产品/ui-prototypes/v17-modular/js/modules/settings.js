/* ============================================================
   Settings & Logs Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 设置与日志模块 ===== */

// ========== 工具函数 ==========

// Toast 提示
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  var iconMap = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (iconMap[type] || 'ℹ') + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2000);
}

// 开关切换
function toggleSwitch(el) {
  el.classList.toggle('on');
}

// 获取开关状态
function getSwitchState(id) {
  var el = document.getElementById(id);
  return el ? el.classList.contains('on') : false;
}

// 设置开关状态
function setSwitchState(id, on) {
  var el = document.getElementById(id);
  if (el) {
    if (on) el.classList.add('on');
    else el.classList.remove('on');
  }
}

// ========== 确认模态框 ==========

var _confirmCallback = null;

function showConfirmModal(title, message, hint, callback) {
  document.getElementById('confirmTitle').textContent = title || '确认操作';
  document.getElementById('confirmMessage').textContent = message || '确定要执行此操作吗？';
  document.getElementById('confirmHint').textContent = hint || '';
  _confirmCallback = callback;
  document.getElementById('confirmOverlay').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('confirmOverlay').classList.remove('show');
  _confirmCallback = null;
}

function confirmAction() {
  if (_confirmCallback) _confirmCallback();
  closeConfirmModal();
}

// ========== 设置模块 ==========

var SETTINGS_KEY = 'portpilot_settings';

// 默认设置
var settingsDefaults = {
  // 显示
  recvEncoding: 'ascii',
  wordWrap: true,
  timestamp: true,
  tsFormat: 'HH:mm:ss',
  byteCount: true,
  autoScroll: true,
  // 终端外观
  termFontSize: 12,
  termLineHeight: 16,
  colorScheme: 'default',
  cursorStyle: 'block',
  cursorBlink: true,
  // 系统
  language: 'zh-CN',
  autoReconnect: true,
  reconnectInterval: '5000',
  logLevel: 'info',
  autoBackup: false,
  restoreSession: true,
  // 协议
  protoDefault: 'modbus-rtu',
  protoEndian: 'big',
  protoAutoScroll: true,
  protoHighlight: true,
  protoErrorTip: false,
  // 命令自动化
  cmdInterval: '1000ms',
  cmdDelay: '100ms',
  cmdAutoScroll: true,
  cmdSound: false,
  cmdPauseOnError: true,
  // 网络
  netReconnect: true,
  netKeepalive: '60',
  // 快捷键
  shortcuts: {
    'new-session': 'Ctrl + N',
    'quick-connect': 'Ctrl + Shift + C',
    'send-cmd': 'Enter',
    'clear-screen': 'Ctrl + L',
    'view-bytes': 'Ctrl + 1',
    'view-terminal': 'Ctrl + 2',
    'view-proto': 'Ctrl + 3',
    'view-dash': 'Ctrl + 4',
    'save-log': 'Ctrl + S',
    'find': 'Ctrl + F',
    'zoom-in': 'Ctrl + =',
    'zoom-out': 'Ctrl + -',
    'open-settings': 'Ctrl + ,'
  }
};

// 当前设置
var currentSettings = {};

// 初始化设置
function settingsInit() {
  // 从 localStorage 加载
  var saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      currentSettings = JSON.parse(saved);
    } catch (e) {
      currentSettings = JSON.parse(JSON.stringify(settingsDefaults));
    }
  } else {
    currentSettings = JSON.parse(JSON.stringify(settingsDefaults));
  }
  // 应用到表单
  settingsApplyToForm();
  // 应用终端外观
  settingsApplyTerminalAppearance();
}

// 将设置应用到表单
function settingsApplyToForm() {
  var s = currentSettings;
  // 显示
  var sel1 = document.getElementById('set-recv-encoding'); if (sel1) sel1.value = s.recvEncoding;
  setSwitchState('set-word-wrap', s.wordWrap);
  setSwitchState('set-timestamp', s.timestamp);
  var sel2 = document.getElementById('set-ts-format'); if (sel2) sel2.value = s.tsFormat;
  setSwitchState('set-byte-count', s.byteCount);
  setSwitchState('set-auto-scroll', s.autoScroll);
  // 终端外观
  var fs = document.getElementById('set-term-fontsize');
  if (fs) { fs.value = s.termFontSize; document.getElementById('set-term-fontsize-val').textContent = s.termFontSize + 'px'; }
  var lh = document.getElementById('set-term-lineheight');
  if (lh) { lh.value = s.termLineHeight; document.getElementById('set-term-lineheight-val').textContent = (s.termLineHeight / 10).toFixed(1); }
  settingsSetColorSchemeUI(s.colorScheme);
  var cs = document.getElementById('set-cursor-style'); if (cs) cs.value = s.cursorStyle;
  setSwitchState('set-cursor-blink', s.cursorBlink);
  // 系统
  var lang = document.getElementById('set-language'); if (lang) lang.value = s.language;
  setSwitchState('set-auto-reconnect', s.autoReconnect);
  var ri = document.getElementById('set-reconnect-interval'); if (ri) ri.value = s.reconnectInterval;
  var ll = document.getElementById('set-log-level'); if (ll) ll.value = s.logLevel;
  setSwitchState('set-auto-backup', s.autoBackup);
  setSwitchState('set-restore-session', s.restoreSession);
  // 协议
  var pd = document.getElementById('set-proto-default'); if (pd) pd.value = s.protoDefault;
  var pe = document.getElementById('set-proto-endian'); if (pe) pe.value = s.protoEndian;
  setSwitchState('set-proto-auto-scroll', s.protoAutoScroll);
  setSwitchState('set-proto-highlight', s.protoHighlight);
  setSwitchState('set-proto-error-tip', s.protoErrorTip);
  // 命令自动化
  var ci = document.getElementById('set-cmd-interval'); if (ci) ci.value = s.cmdInterval;
  var cd = document.getElementById('set-cmd-delay'); if (cd) cd.value = s.cmdDelay;
  setSwitchState('set-cmd-auto-scroll', s.cmdAutoScroll);
  setSwitchState('set-cmd-sound', s.cmdSound);
  setSwitchState('set-cmd-pause-on-error', s.cmdPauseOnError);
  // 网络
  setSwitchState('set-net-reconnect', s.netReconnect);
  var nk = document.getElementById('set-net-keepalive'); if (nk) nk.value = s.netKeepalive;
  // 快捷键
  shortcutApplyToForm();
}

// 从表单收集设置
function settingsCollectFromForm() {
  var s = {};
  // 显示
  var sel1 = document.getElementById('set-recv-encoding'); s.recvEncoding = sel1 ? sel1.value : 'ascii';
  s.wordWrap = getSwitchState('set-word-wrap');
  s.timestamp = getSwitchState('set-timestamp');
  var sel2 = document.getElementById('set-ts-format'); s.tsFormat = sel2 ? sel2.value : 'HH:mm:ss';
  s.byteCount = getSwitchState('set-byte-count');
  s.autoScroll = getSwitchState('set-auto-scroll');
  // 终端外观
  var fs = document.getElementById('set-term-fontsize'); s.termFontSize = fs ? parseInt(fs.value) : 12;
  var lh = document.getElementById('set-term-lineheight'); s.termLineHeight = lh ? parseInt(lh.value) : 16;
  s.colorScheme = currentSettings.colorScheme || 'default';
  var cs = document.getElementById('set-cursor-style'); s.cursorStyle = cs ? cs.value : 'block';
  s.cursorBlink = getSwitchState('set-cursor-blink');
  // 系统
  var lang = document.getElementById('set-language'); s.language = lang ? lang.value : 'zh-CN';
  s.autoReconnect = getSwitchState('set-auto-reconnect');
  var ri = document.getElementById('set-reconnect-interval'); s.reconnectInterval = ri ? ri.value : '5000';
  var ll = document.getElementById('set-log-level'); s.logLevel = ll ? ll.value : 'info';
  s.autoBackup = getSwitchState('set-auto-backup');
  s.restoreSession = getSwitchState('set-restore-session');
  // 协议
  var pd = document.getElementById('set-proto-default'); s.protoDefault = pd ? pd.value : 'modbus-rtu';
  var pe = document.getElementById('set-proto-endian'); s.protoEndian = pe ? pe.value : 'big';
  s.protoAutoScroll = getSwitchState('set-proto-auto-scroll');
  s.protoHighlight = getSwitchState('set-proto-highlight');
  s.protoErrorTip = getSwitchState('set-proto-error-tip');
  // 命令自动化
  var ci = document.getElementById('set-cmd-interval'); s.cmdInterval = ci ? ci.value : '1000ms';
  var cd = document.getElementById('set-cmd-delay'); s.cmdDelay = cd ? cd.value : '100ms';
  s.cmdAutoScroll = getSwitchState('set-cmd-auto-scroll');
  s.cmdSound = getSwitchState('set-cmd-sound');
  s.cmdPauseOnError = getSwitchState('set-cmd-pause-on-error');
  // 网络
  s.netReconnect = getSwitchState('set-net-reconnect');
  var nk = document.getElementById('set-net-keepalive'); s.netKeepalive = nk ? nk.value : '60';
  // 快捷键
  s.shortcuts = currentSettings.shortcuts || JSON.parse(JSON.stringify(settingsDefaults.shortcuts));
  return s;
}

// 保存设置
function settingsSave() {
  currentSettings = settingsCollectFromForm();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  var btn = document.getElementById('settingsSaveBtn');
  if (btn) {
    var origText = btn.textContent;
    btn.textContent = '✓ 已保存';
    btn.classList.add('saved');
    setTimeout(function() {
      btn.textContent = origText;
      btn.classList.remove('saved');
    }, 1500);
  }
  showToast('设置已保存', 'success');
}

// 重置为默认值
function settingsResetAll() {
  showConfirmModal(
    '重置设置',
    '确定要将所有设置重置为默认值吗？',
    '此操作将清除所有自定义设置，不可撤销。',
    function() {
      currentSettings = JSON.parse(JSON.stringify(settingsDefaults));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
      settingsApplyToForm();
      settingsApplyTerminalAppearance();
      showToast('设置已重置为默认值', 'success');
    }
  );
}

// ========== 设置实时预览 ==========

// 应用字体大小
function settingsApplyFontSize(val) {
  var valNum = parseInt(val);
  document.getElementById('set-term-fontsize-val').textContent = valNum + 'px';
  var termArea = document.getElementById('termArea');
  if (termArea) {
    termArea.style.fontSize = valNum + 'px';
  }
}

// 应用行高
function settingsApplyLineHeight(val) {
  var valNum = parseInt(val);
  var ratio = (valNum / 10).toFixed(1);
  document.getElementById('set-term-lineheight-val').textContent = ratio;
  var termArea = document.getElementById('termArea');
  if (termArea) {
    termArea.style.lineHeight = ratio;
  }
}

// 设置配色方案 UI
function settingsSetColorSchemeUI(scheme) {
  var items = document.querySelectorAll('#colorSchemeGrid .color-scheme-item');
  items.forEach(function(item) {
    item.classList.toggle('active', item.dataset.scheme === scheme);
  });
}

// 设置配色方案
function settingsSetColorScheme(scheme, el) {
  settingsSetColorSchemeUI(scheme);
  currentSettings.colorScheme = scheme;
  // 应用到终端
  var termWrap = document.querySelector('.term-wrap');
  if (termWrap) {
    termWrap.classList.remove('term-scheme-default', 'term-scheme-solarized', 'term-scheme-dracula', 'term-scheme-onedark');
    termWrap.classList.add('term-scheme-' + scheme);
  }
}

// 应用光标样式
function settingsApplyCursor() {
  var style = document.getElementById('set-cursor-style').value;
  var termArea = document.getElementById('termArea');
  if (!termArea) return;
  var cursor = termArea.querySelector('.cursor');
  if (cursor) {
    cursor.style.borderLeft = '';
    cursor.style.borderBottom = '';
    cursor.style.background = '';
    cursor.style.width = '';
    cursor.style.height = '';
    cursor.style.display = 'inline-block';
    if (style === 'block') {
      cursor.style.background = 'var(--primary)';
      cursor.style.width = '8px';
      cursor.style.height = '1em';
    } else if (style === 'underline') {
      cursor.style.borderBottom = '2px solid var(--primary)';
      cursor.style.width = '8px';
      cursor.style.height = '1em';
    } else if (style === 'bar') {
      cursor.style.borderLeft = '2px solid var(--primary)';
      cursor.style.width = '0';
      cursor.style.height = '1em';
    }
  }
}

// 应用时间戳格式（模拟）
function settingsApplyTimestamp() {
  var format = document.getElementById('set-ts-format').value;
  // 更新字节流视图的时间戳显示
  var tsElements = document.querySelectorAll('#rxArea .ts');
  var now = new Date();
  var formatMap = {
    'HH:mm:ss': function(d) { return d.toTimeString().slice(0, 8); },
    'HH:mm:ss.SSS': function(d) { return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0'); },
    'YYYY-MM-DD HH:mm:ss': function(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + d.toTimeString().slice(0, 8); },
    'mm:ss': function(d) { return String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'); }
  };
  var fmtFn = formatMap[format] || formatMap['HH:mm:ss'];
  tsElements.forEach(function(el, i) {
    var d = new Date(now.getTime() - (tsElements.length - i) * 5000);
    el.textContent = fmtFn(d);
  });
  showToast('时间戳格式已更新', 'info');
}

// 应用自动滚动
function settingsApplyAutoScroll() {
  var on = getSwitchState('set-auto-scroll');
  if (on) {
    var rxArea = document.getElementById('rxArea');
    if (rxArea) rxArea.scrollTop = rxArea.scrollHeight;
    var termArea = document.getElementById('termArea');
    if (termArea) termArea.scrollTop = termArea.scrollHeight;
  }
}

// 语言切换提示
function settingsShowLangHint() {
  showToast('语言将在重启后生效', 'warning');
}

// 应用所有终端外观设置
function settingsApplyTerminalAppearance() {
  var s = currentSettings;
  // 字体大小
  var termArea = document.getElementById('termArea');
  if (termArea) {
    termArea.style.fontSize = s.termFontSize + 'px';
    termArea.style.lineHeight = (s.termLineHeight / 10).toFixed(1);
  }
  // 配色方案
  var termWrap = document.querySelector('.term-wrap');
  if (termWrap) {
    termWrap.classList.remove('term-scheme-default', 'term-scheme-solarized', 'term-scheme-dracula', 'term-scheme-onedark');
    termWrap.classList.add('term-scheme-' + s.colorScheme);
  }
  // 光标
  settingsApplyCursor();
}

// ========== 日志保存模块 ==========

var _logSaveSource = 'bytes';

function openLogSaveModal(source) {
  _logSaveSource = source || 'bytes';
  var title = source === 'terminal' ? '保存终端会话' : '保存日志';
  document.getElementById('logSaveTitle').textContent = title;
  // 重置进度
  document.getElementById('logSaveProgress').style.display = 'none';
  document.getElementById('logSaveProgressBar').style.width = '0%';
  document.getElementById('logSaveProgressText').textContent = '0%';
  document.getElementById('logSaveExportBtn').disabled = false;
  document.getElementById('logSaveOverlay').classList.add('show');
}

function closeLogSaveModal() {
  document.getElementById('logSaveOverlay').classList.remove('show');
}

function logSaveSetFormat(format, el) {
  if (el.classList.contains('disabled')) return;
  document.querySelectorAll('#logSaveFormatGrid .log-format-item').forEach(function(item) {
    item.classList.remove('active');
  });
  el.classList.add('active');
}

function logSaveToggleCustom() {
  var val = document.getElementById('logSaveTimeRange').value;
  document.getElementById('logSaveTimeCustom').style.display = val === 'custom' ? 'flex' : 'none';
}

// 模拟日志数据生成
function generateMockLogData(format, content, includeTs, includeDir) {
  var lines = [];
  var now = new Date();
  var samples = [
    { dir: 'RX', data: '7E 01 03 00 00 10 00 00 00 01 00 00 00 00 00 00 14 00 02 01 4A 7E' },
    { dir: 'TX', data: '7E 01 02 00 00 10 00 00 00 00 00 00 00 00 00 00 00 00 02 01 4A 7E' },
    { dir: 'RX', data: '收到响应帧: 状态码 = 0x00 正常' },
    { dir: 'TX', data: 'AT+STATUS? (查询设备状态)' },
    { dir: 'RX', data: 'OK STATUS=RUNNING UPTIME=86400s' },
    { dir: 'RX', data: '温度: 25.3°C, 湿度: 62%, 气压: 1013hPa' },
    { dir: 'TX', data: 'AT+WRITE REG=0x10 VAL=0xAA' },
    { dir: 'RX', data: 'OK WRITE SUCCESS' },
    { dir: 'RX', data: '设备心跳: 运行正常, 电压 3.3V, 温度 42°C' },
    { dir: 'RX', data: 'AT+VER? → PortPilot v2.1.0 build 20260801' },
    { dir: 'RX', data: '告警: 缓冲区使用率超过 80%' },
    { dir: 'RX', data: '数据帧校验错误 CRC mismatch, 已丢弃' },
    { dir: 'RX', data: 'GPS 定位成功: 纬度 39.9042°N, 经度 116.4074°E' }
  ];
  var termSamples = [
    'root@device:~$ uname -a',
    'Linux device 5.10.120 #1 SMP Thu Jan 10 10:00:00 CST 2026 armv7l GNU/Linux',
    'root@device:~$ cat /proc/cpuinfo',
    'processor : 0',
    'model name : ARM Cortex-A7',
    'BogoMIPS : 198.00',
    'Hardware : Allwinner H3',
    'root@device:~$ ifconfig eth0',
    'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
    '        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255',
    'root@device:~$ free -m',
    '             total       used       free     shared    buffers     cached',
    'Mem:           256        128        128          0         32         64',
    'root@device:~$ '
  ];

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }

  if (_logSaveSource === 'terminal') {
    termSamples.forEach(function(line, i) {
      var d = new Date(now.getTime() - (termSamples.length - i) * 3000);
      var ts = includeTs ? '[' + fmtTime(d) + '] ' : '';
      if (format === 'csv') {
        lines.push('"' + fmtTime(d) + '","' + line.replace(/"/g, '""') + '"');
      } else if (format === 'hex') {
        var hexStr = '';
        for (var j = 0; j < Math.min(line.length, 16); j++) {
          hexStr += line.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase() + ' ';
        }
        lines.push(ts + hexStr.trim());
      } else {
        lines.push(ts + line);
      }
    });
  } else {
    samples.forEach(function(sample, i) {
      if (content === 'tx' && sample.dir !== 'TX') return;
      if (content === 'rx' && sample.dir !== 'RX') return;
      var d = new Date(now.getTime() - (samples.length - i) * 5000);
      var ts = includeTs ? '[' + fmtTime(d) + '] ' : '';
      var dir = includeDir ? '[' + sample.dir + '] ' : '';
      if (format === 'csv') {
        lines.push('"' + fmtTime(d) + '","' + sample.dir + '","' + sample.data.replace(/"/g, '""') + '"');
      } else if (format === 'hex') {
        var hexStr = '';
        for (var j = 0; j < Math.min(sample.data.length, 32); j++) {
          hexStr += sample.data.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase() + ' ';
        }
        lines.push(ts + dir + hexStr.trim());
      } else {
        lines.push(ts + dir + sample.data);
      }
    });
  }

  if (format === 'csv') {
    var header = _logSaveSource === 'terminal' ? '时间,内容' : '时间,方向,数据';
    lines.unshift(header);
  }

  return lines.join('\n');
}

function logSaveExport() {
  var btn = document.getElementById('logSaveExportBtn');
  btn.disabled = true;

  // 获取选项
  var content = document.querySelector('input[name="logSaveContent"]:checked').value;
  var formatEl = document.querySelector('#logSaveFormatGrid .log-format-item.active');
  var format = formatEl ? formatEl.dataset.format : 'txt';
  var includeTs = document.getElementById('logSaveTimestamp').checked;
  var includeDir = document.getElementById('logSaveDirection').checked;

  // 显示进度条
  var progressDiv = document.getElementById('logSaveProgress');
  var progressBar = document.getElementById('logSaveProgressBar');
  var progressText = document.getElementById('logSaveProgressText');
  progressDiv.style.display = 'block';

  var progress = 0;
  var timer = setInterval(function() {
    progress += Math.random() * 20 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      // 生成数据并下载
      var data = generateMockLogData(format, content, includeTs, includeDir);
      var mimeMap = { txt: 'text/plain', csv: 'text/csv', hex: 'text/plain', bin: 'application/octet-stream' };
      var extMap = { txt: 'txt', csv: 'csv', hex: 'hex', bin: 'bin' };
      var blob = new Blob([data], { type: mimeMap[format] + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var now = new Date();
      var pad = function(n) { return String(n).padStart(2, '0'); };
      var dateStr = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      a.href = url;
      a.download = 'portpilot_log_' + dateStr + '.' + extMap[format];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('日志导出成功', 'success');
      setTimeout(function() {
        closeLogSaveModal();
      }, 500);
    }
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.floor(progress) + '%';
  }, 150);
}

// ========== 快捷键模块 ==========

var _shortcutEditing = null;
var _shortcutOrigValue = '';

function shortcutEdit(btn, keyId) {
  // 如果已有正在编辑的，先恢复
  if (_shortcutEditing) {
    shortcutCancelEdit();
  }
  var row = btn.closest('.shortcut-row');
  var keyEl = row.querySelector('.shortcut-key');
  _shortcutEditing = { btn: btn, keyEl: keyEl, keyId: keyId };
  _shortcutOrigValue = keyEl.textContent;
  // 替换为捕获状态
  keyEl.textContent = '按下新快捷键...';
  keyEl.classList.remove('shortcut-key');
  keyEl.classList.add('shortcut-capture');
  btn.textContent = '取消';
  btn.onclick = function() { shortcutCancelEdit(); };
  // 绑定键盘监听
  document.addEventListener('keydown', shortcutCaptureKey, true);
}

function shortcutCaptureKey(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  if (!_shortcutEditing) return;
  // ESC 取消
  if (e.key === 'Escape') {
    shortcutCancelEdit();
    return;
  }
  // 构建快捷键字符串
  var parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey) parts.push('Meta');
  // 功能键或普通键
  var key = e.key;
  if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') {
    // 只按了修饰键，等待完整组合
    return;
  }
  var keyName = key;
  if (key === ' ') keyName = 'Space';
  else if (key.length === 1) keyName = key.toUpperCase();
  else if (key === 'ArrowUp') keyName = '↑';
  else if (key === 'ArrowDown') keyName = '↓';
  else if (key === 'ArrowLeft') keyName = '←';
  else if (key === 'ArrowRight') keyName = '→';

  parts.push(keyName);
  var combo = parts.join(' + ');
  // 应用
  _shortcutEditing.keyEl.textContent = combo;
  currentSettings.shortcuts[_shortcutEditing.keyId] = combo;
  shortcutFinishEdit();
  showToast('快捷键已更新: ' + combo, 'success');
}

function shortcutCancelEdit() {
  if (!_shortcutEditing) return;
  _shortcutEditing.keyEl.textContent = _shortcutOrigValue;
  _shortcutEditing.keyEl.classList.remove('shortcut-capture');
  _shortcutEditing.keyEl.classList.add('shortcut-key');
  _shortcutEditing.btn.textContent = '修改';
  var keyId = _shortcutEditing.keyId;
  _shortcutEditing.btn.onclick = function() { shortcutEdit(this, keyId); };
  document.removeEventListener('keydown', shortcutCaptureKey, true);
  _shortcutEditing = null;
}

function shortcutFinishEdit() {
  if (!_shortcutEditing) return;
  _shortcutEditing.keyEl.classList.remove('shortcut-capture');
  _shortcutEditing.keyEl.classList.add('shortcut-key');
  _shortcutEditing.btn.textContent = '修改';
  var keyId = _shortcutEditing.keyId;
  _shortcutEditing.btn.onclick = function() { shortcutEdit(this, keyId); };
  document.removeEventListener('keydown', shortcutCaptureKey, true);
  _shortcutEditing = null;
}

function shortcutResetAll() {
  showConfirmModal(
    '恢复默认快捷键',
    '确定要将所有快捷键恢复为默认值吗？',
    '当前自定义的快捷键组合将被清除。',
    function() {
      currentSettings.shortcuts = JSON.parse(JSON.stringify(settingsDefaults.shortcuts));
      shortcutApplyToForm();
      showToast('快捷键已恢复默认', 'success');
    }
  );
}

function shortcutApplyToForm() {
  var list = document.getElementById('shortcutList');
  if (!list) return;
  var rows = list.querySelectorAll('.shortcut-row');
  rows.forEach(function(row) {
    var keyEl = row.querySelector('.shortcut-key');
    if (!keyEl) return;
    var keyId = keyEl.dataset.key;
    if (currentSettings.shortcuts[keyId]) {
      keyEl.textContent = currentSettings.shortcuts[keyId];
    }
  });
}

// ========== 关于页面 ==========

function aboutCheckUpdate() {
  var statusEl = document.getElementById('aboutUpdateStatus');
  if (!statusEl) return;
  statusEl.textContent = '正在检查更新...';
  statusEl.style.color = 'var(--muted)';
  setTimeout(function() {
    // 模拟：随机返回已是最新或有新版本
    var hasUpdate = Math.random() > 0.7;
    if (hasUpdate) {
      statusEl.textContent = '发现新版本 v1.1.0';
      statusEl.style.color = 'var(--accent3)';
      showToast('发现新版本 v1.1.0，点击下载', 'warning');
    } else {
      statusEl.textContent = '已是最新版本';
      statusEl.style.color = 'var(--accent2)';
      showToast('已是最新版本', 'success');
    }
  }, 1500);
}

// ========== 导入/导出配置 ==========

function settingsExportConfig() {
  var config = {
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    settings: currentSettings,
    commandGroups: cmdState ? cmdState.groups : [],
    protocolDefinitions: [
      { id: 'p1', name: 'Modbus RTU', type: 'variable' },
      { id: 'p2', name: '传感器数据帧', type: 'fixed' },
      { id: 'p3', name: '文本指令协议', type: 'textline' }
    ],
    quickCommands: ['AT+STATUS?', 'AT+RESET', 'AT+VER?']
  };
  var data = JSON.stringify(config, null, 2);
  var blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  var dateStr = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate());
  a.href = url;
  a.download = 'portpilot_config_' + dateStr + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('配置导出成功', 'success');
}

function settingsImportConfig() {
  document.getElementById('configImportFile').click();
}

function settingsHandleImportFile(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var config = JSON.parse(e.target.result);
      if (!config.settings) throw new Error('无效的配置文件');
      showConfirmModal(
        '导入配置',
        '检测到配置文件，包含 ' + (config.settings ? '设置' : '') + (config.commandGroups ? '、命令组' : '') + (config.protocolDefinitions ? '、协议定义' : '') + '。\n是否覆盖当前配置？',
        '导入后当前设置将被替换，建议先导出备份。',
        function() {
          if (config.settings) {
            currentSettings = Object.assign({}, currentSettings, config.settings);
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
            settingsApplyToForm();
            settingsApplyTerminalAppearance();
          }
          showToast('配置导入成功', 'success');
        }
      );
    } catch (err) {
      showToast('配置文件解析失败: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}
