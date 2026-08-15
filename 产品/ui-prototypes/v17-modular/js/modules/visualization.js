/* ============================================================
   Visualization & Dashboard Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 可视化仪表盘模块 ===== */
var dashState = {
  mode: 'run',              // run / config
  currentTab: 'dash-1',
  selectedWidget: null,
  widgets: {},              // 按 tab 存储组件配置
  realtimeTimer: null,
  realtimeFreq: 1000,
  alertActive: false,
  dragState: null,
  resizeState: null,
  marqueeState: null,
  nextWidgetId: 7,
};

// 组件类型映射
var dashWidgetTypes = {
  number: { name: '数字显示', defaultSize: { w: 180, h: 120 } },
  gauge: { name: '仪表盘', defaultSize: { w: 200, h: 160 } },
  bar: { name: '柱状条', defaultSize: { w: 200, h: 110 } },
  line: { name: '折线图', defaultSize: { w: 280, h: 160 } },
  histogram: { name: '柱状图', defaultSize: { w: 260, h: 160 } },
  status: { name: '状态灯', defaultSize: { w: 140, h: 110 } },
  switch: { name: '开关', defaultSize: { w: 140, h: 110 } },
  text: { name: '文本', defaultSize: { w: 180, h: 90 } },
  button: { name: '按钮', defaultSize: { w: 140, h: 90 } },
  slider: { name: '滑块', defaultSize: { w: 200, h: 100 } },
};

// 初始化仪表盘数据
function dashInitData() {
  dashState.widgets['dash-1'] = [
    { id: 'w-1', type: 'number', title: '温度', x: 30, y: 30, w: 180, h: 120, value: 25.3, unit: '°C', decimals: 1, fontSize: 28,
      dataSource: { source: 'current', protocol: 'modbus', field: 'temperature', freq: 1000 },
      alert: { upper: { enabled: true, limit: 85, color: '#f85149', blink: false }, lower: { enabled: false, limit: 10, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-2', type: 'gauge', title: '湿度', x: 240, y: 30, w: 200, h: 160, value: 62, unit: '%', decimals: 0,
      dataSource: { source: 'current', protocol: 'modbus', field: 'humidity', freq: 1000 },
      alert: { upper: { enabled: false, limit: 90, color: '#f85149', blink: false }, lower: { enabled: false, limit: 30, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-3', type: 'line', title: '压力趋势', x: 470, y: 30, w: 280, h: 160, value: 1013, unit: 'hPa', points: 30, yMin: 980, yMax: 1040,
      lineColor: '#0fc6b7', data: [],
      dataSource: { source: 'current', protocol: 'modbus', field: 'pressure', freq: 1000 },
      alert: { upper: { enabled: false, limit: 1050, color: '#f85149', blink: false }, lower: { enabled: false, limit: 980, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-4', type: 'status', title: '设备状态', x: 30, y: 180, w: 140, h: 110, value: 1, onThreshold: 1, onColor: '#3fb950', offColor: '#8b949e',
      dataSource: { source: 'current', protocol: 'modbus', field: 'status', freq: 1000 },
      alert: { upper: { enabled: false, limit: 1, color: '#f85149', blink: false }, lower: { enabled: false, limit: 0, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-5', type: 'bar', title: '缓冲区使用率', x: 200, y: 180, w: 200, h: 110, value: 68, unit: '%', max: 100, barColor: 'var(--grad)',
      dataSource: { source: 'current', protocol: 'custom', field: 'buffer', freq: 500 },
      alert: { upper: { enabled: true, limit: 90, color: '#f85149', blink: true }, lower: { enabled: false, limit: 10, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-6', type: 'switch', title: '继电器控制', x: 430, y: 220, w: 140, h: 110, value: 1,
      dataSource: { source: 'current', protocol: 'custom', field: 'relay', freq: 1000 },
      alert: { upper: { enabled: false, limit: 1, color: '#f85149', blink: false }, lower: { enabled: false, limit: 0, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
  ];
  dashState.widgets['dash-2'] = [
    { id: 'w-2-1', type: 'number', title: '温度 1', x: 30, y: 30, w: 160, h: 110, value: 42.5, unit: '°C', decimals: 1, fontSize: 24,
      dataSource: { source: 'current', protocol: 'modbus', field: 'temp1', freq: 1000 },
      alert: { upper: { enabled: true, limit: 80, color: '#f85149', blink: true }, lower: { enabled: false, limit: 0, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-2-2', type: 'number', title: '温度 2', x: 220, y: 30, w: 160, h: 110, value: 38.2, unit: '°C', decimals: 1, fontSize: 24,
      dataSource: { source: 'current', protocol: 'modbus', field: 'temp2', freq: 1000 },
      alert: { upper: { enabled: true, limit: 80, color: '#f85149', blink: true }, lower: { enabled: false, limit: 0, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
    { id: 'w-2-3', type: 'line', title: '温度曲线', x: 30, y: 170, w: 420, h: 180, value: 40, unit: '°C', points: 50, yMin: 0, yMax: 100,
      lineColor: '#f85149', data: [],
      dataSource: { source: 'current', protocol: 'modbus', field: 'temp_avg', freq: 1000 },
      alert: { upper: { enabled: true, limit: 85, color: '#f85149', blink: false }, lower: { enabled: false, limit: 10, color: '#e3a53c', blink: false } },
      bgColor: 'rgba(22,27,34,.8)' },
  ];
  // 初始化折线图数据
  dashState.widgets['dash-1'].forEach(function(w) {
    if (w.type === 'line') {
      for (var i = 0; i < w.points; i++) {
        w.data.push(1010 + Math.random() * 6);
      }
    }
  });
  dashState.widgets['dash-2'].forEach(function(w) {
    if (w.type === 'line') {
      for (var i = 0; i < w.points; i++) {
        w.data.push(35 + Math.random() * 10);
      }
    }
  });
}

// 切换运行/配置模式
function dashSetMode(mode) {
  dashState.mode = mode;
  var canvas = document.getElementById('dashCanvas');
  var wrap = document.getElementById('dashCanvasWrap');
  var btns = document.querySelectorAll('.dash-mode-btn');
  btns.forEach(function(b) { b.classList.toggle('active', b.dataset.mode === mode); });
  if (mode === 'config') {
    canvas.classList.add('config-mode');
    wrap.classList.add('config-mode');
    dashClosePropPanel();
    dashState.selectedWidget = null;
    document.querySelectorAll('.dash-card').forEach(function(c) { c.classList.remove('selected'); });
  } else {
    canvas.classList.remove('config-mode');
    wrap.classList.remove('config-mode');
    document.getElementById('dashWidgetPicker').classList.remove('show');
    dashClosePropPanel();
    dashState.selectedWidget = null;
    document.querySelectorAll('.dash-card').forEach(function(c) { c.classList.remove('selected'); });
  }
}

// 切换仪表盘标签
function dashSwitchTab(el, tabId) {
  dashState.currentTab = tabId;
  document.querySelectorAll('.dash-tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  dashRenderWidgets();
  dashClosePropPanel();
}

// 新建仪表盘
function dashAddTab() {
  var name = prompt('请输入仪表盘名称：', '新仪表盘');
  if (!name) return;
  var tabId = 'dash-' + Date.now();
  var tabsEl = document.getElementById('dashTabs');
  var addBtn = tabsEl.querySelector('.dash-tab-add');
  var newTab = document.createElement('div');
  newTab.className = 'dash-tab active';
  newTab.dataset.id = tabId;
  newTab.innerHTML = name + '<span class="dt-close" onclick="event.stopPropagation();dashCloseTab(\'' + tabId + '\')">×</span>';
  newTab.onclick = function() { dashSwitchTab(this, tabId); };
  tabsEl.insertBefore(newTab, addBtn);
  document.querySelectorAll('.dash-tab').forEach(function(t) {
    if (t.dataset.id !== tabId) t.classList.remove('active');
  });
  dashState.widgets[tabId] = [];
  dashState.currentTab = tabId;
  dashRenderWidgets();
}

// 关闭仪表盘
function dashCloseTab(tabId) {
  var tabs = document.querySelectorAll('.dash-tab');
  if (tabs.length <= 1) { alert('至少保留一个仪表盘'); return; }
  if (!confirm('确定删除此仪表盘？')) return;
  var tabEl = document.querySelector('.dash-tab[data-id="' + tabId + '"]');
  if (tabEl) {
    if (tabEl.classList.contains('active')) {
      var prev = tabEl.previousElementSibling;
      var next = tabEl.nextElementSibling;
      var target = prev && prev.classList.contains('dash-tab') ? prev : (next && next.classList.contains('dash-tab') ? next : null);
      if (target) dashSwitchTab(target, target.dataset.id);
    }
    tabEl.remove();
  }
  delete dashState.widgets[tabId];
}

// 渲染当前 tab 的组件
function dashRenderWidgets() {
  var canvas = document.getElementById('dashCanvas');
  var widgets = dashState.widgets[dashState.currentTab] || [];
  // 移除现有组件（保留 grid-bg, drop-hint, marquee）
  var cards = canvas.querySelectorAll('.dash-card');
  cards.forEach(function(c) { c.remove(); });
  // 渲染新组件
  widgets.forEach(function(w) {
    var card = dashCreateWidgetElement(w);
    canvas.appendChild(card);
  });
  // 更新空状态提示
  var hint = document.getElementById('dashDropHint');
  if (hint) hint.classList.toggle('empty', widgets.length === 0);
}

// 创建组件 DOM
function dashCreateWidgetElement(w) {
  var card = document.createElement('div');
  card.className = 'dash-card';
  card.dataset.id = w.id;
  card.dataset.type = w.type;
  card.style.left = w.x + 'px';
  card.style.top = w.y + 'px';
  card.style.width = w.w + 'px';
  card.style.height = w.h + 'px';
  if (w.bgColor) card.style.background = w.bgColor;
  card.onmousedown = function(e) { dashStartDrag(e, card); };
  card.onclick = function(e) {
    if (e.target.classList.contains('dc-delete-btn') || e.target.closest('.dc-delete-btn') ||
        e.target.classList.contains('dc-resize-handle') || e.target.closest('.dc-resize-handle') ||
        e.target.classList.contains('dc-switch') || e.target.closest('.dc-switch') ||
        e.target.classList.contains('dc-btn') || e.target.closest('.dc-btn')) return;
    dashSelectWidget(w.id);
  };
  var typeInfo = dashWidgetTypes[w.type] || { name: w.type };
  var contentHtml = '';
  switch (w.type) {
    case 'number':
      contentHtml = '<div class="dc-content">' +
        '<div class="dc-value" id="' + w.id + '-value" style="font-size:' + (w.fontSize || 28) + 'px">' + w.value.toFixed(w.decimals || 0) + '</div>' +
        '<div class="dc-unit">' + (w.unit || '') + '</div></div>';
      break;
    case 'gauge':
      var pct = Math.min(100, Math.max(0, w.value));
      var angle = -90 + (pct / 100) * 180;
      contentHtml = '<div class="dc-content">' +
        '<svg class="dc-gauge" viewBox="0 0 100 50">' +
        '<path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="var(--bg4)" stroke-width="6" stroke-linecap="round"/>' +
        '<path id="' + w.id + '-arc" d="M 10 45 A 40 40 0 0 1 ' + (50 + 40 * Math.cos((180 - pct) * Math.PI / 180)).toFixed(1) + ' ' + (45 - 40 * Math.sin(pct * Math.PI / 180)).toFixed(1) + '" fill="none" stroke="url(#gaugeGrad2)" stroke-width="6" stroke-linecap="round"/>' +
        '<defs><linearGradient id="gaugeGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#0fc6b7"/><stop offset="100%" style="stop-color:#58a6ff"/></linearGradient></defs>' +
        '<line id="' + w.id + '-needle" x1="50" y1="45" x2="50" y2="12" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" transform="rotate(' + (angle + 90) + ',50,45)"/>' +
        '<circle cx="50" cy="45" r="3" fill="var(--primary)"/></svg>' +
        '<div class="dc-value" style="font-size:18px" id="' + w.id + '-value">' + w.value.toFixed(0) + (w.unit || '') + '</div></div>';
      break;
    case 'line':
      var linePath = '', areaPath = '';
      var dataLen = w.data.length;
      var xStep = 260 / (dataLen - 1);
      var range = (w.yMax || 100) - (w.yMin || 0);
      for (var i = 0; i < dataLen; i++) {
        var px = i * xStep;
        var py = 60 - ((w.data[i] - (w.yMin || 0)) / range) * 55 - 2;
        if (i === 0) { linePath = 'M' + px + ',' + py; areaPath = 'M' + px + ',' + py; }
        else { linePath += ' L' + px + ',' + py; areaPath += ' L' + px + ',' + py; }
      }
      areaPath += ' L260,60 L0,60 Z';
      var color = w.lineColor || '#0fc6b7';
      contentHtml = '<div class="dc-content">' +
        '<svg class="dc-chart" id="' + w.id + '-chart" viewBox="0 0 260 60" preserveAspectRatio="none">' +
        '<defs><linearGradient id="' + w.id + '-grad" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" style="stop-color:' + color + ';stop-opacity:.3"/>' +
        '<stop offset="100%" style="stop-color:' + color + ';stop-opacity:0"/></linearGradient></defs>' +
        '<path id="' + w.id + '-area" d="' + areaPath + '" fill="url(#' + w.id + '-grad)"/>' +
        '<path id="' + w.id + '-line" d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="1.5"/>' +
        '</svg>' +
        '<div style="display:flex;justify-content:space-between;width:100%;margin-top:4px">' +
        '<span class="dc-unit">' + w.value.toFixed(1) + ' ' + (w.unit || '') + '</span>' +
        '<span class="dc-unit" style="color:var(--accent2)">实时</span></div></div>';
      break;
    case 'bar':
      var pct2 = Math.min(100, Math.max(0, (w.value / (w.max || 100)) * 100));
      contentHtml = '<div class="dc-content" style="justify-content:center">' +
        '<div class="dc-value" style="font-size:22px" id="' + w.id + '-value">' + w.value.toFixed(0) + '<span style="font-size:12px;color:var(--muted)">' + (w.unit || '%') + '</span></div>' +
        '<div class="dc-bar-wrap" style="width:100%"><div class="dc-bar-fill" id="' + w.id + '-bar" style="width:' + pct2 + '%;background:' + (w.barColor || 'var(--grad)') + '"></div></div></div>';
      break;
    case 'status':
      var isOn = w.value >= (w.onThreshold || 1);
      var statusColor = isOn ? (w.onColor || '#3fb950') : (w.offColor || '#8b949e');
      var statusText = isOn ? '运行中' : '已关闭';
      var statusClass = isOn ? '' : 'off';
      contentHtml = '<div class="dc-content">' +
        '<div class="dc-status-light ' + statusClass + '" id="' + w.id + '-light" style="background:' + statusColor + ';box-shadow:0 0 10px ' + statusColor + '"></div>' +
        '<div class="dc-text" style="font-size:11px;color:' + statusColor + '" id="' + w.id + '-text">' + statusText + '</div></div>';
      break;
    case 'switch':
      var swOn = w.value === 1;
      contentHtml = '<div class="dc-content">' +
        '<div class="dc-switch ' + (swOn ? 'on' : '') + '" id="' + w.id + '-switch" onclick="event.stopPropagation();dashToggleSwitch(\'' + w.id + '\')"></div>' +
        '<div class="dc-text" style="font-size:11px" id="' + w.id + '-text">' + (swOn ? '已开启' : '已关闭') + '</div></div>';
      break;
    case 'text':
      contentHtml = '<div class="dc-content">' +
        '<div class="dc-text" id="' + w.id + '-text">' + (w.textValue || 'Hello PortPilot') + '</div></div>';
      break;
    case 'button':
      contentHtml = '<div class="dc-content">' +
        '<button class="dc-btn" onclick="event.stopPropagation()">' + (w.btnText || '发送指令') + '</button></div>';
      break;
    case 'slider':
      contentHtml = '<div class="dc-content">' +
        '<div class="dc-slider"><input type="range" min="0" max="100" value="' + (w.sliderValue || 50) + '" oninput="this.nextElementSibling.textContent=this.value+\'%\'">' +
        '<div class="dc-slider-value">' + (w.sliderValue || 50) + '%</div></div></div>';
      break;
    case 'histogram':
      var bars = '';
      for (var b = 0; b < 12; b++) {
        var bh = 20 + Math.random() * 35;
        bars += '<rect x="' + (b * 22 + 2) + '" y="' + (55 - bh) + '" width="16" height="' + bh + '" rx="2" fill="var(--primary)" opacity="' + (0.5 + Math.random() * 0.5) + '"/>';
      }
      contentHtml = '<div class="dc-content">' +
        '<svg class="dc-chart" id="' + w.id + '-chart" viewBox="0 0 260 60" preserveAspectRatio="none">' + bars + '</svg>' +
        '<div class="dc-unit" style="margin-top:4px">' + (w.title || '柱状图') + '</div></div>';
      break;
    default:
      contentHtml = '<div class="dc-content"><div class="dc-value">--</div></div>';
  }
  card.innerHTML = '<div class="dc-drag-handle">⋮⋮</div>' +
    '<div class="dc-delete-btn" onclick="event.stopPropagation();dashDeleteWidget(\'' + w.id + '\')">×</div>' +
    '<div class="dc-resize-handle" onmousedown="event.stopPropagation();dashStartResize(event,\'' + w.id + '\')"></div>' +
    '<div class="dc-header"><div class="dc-title">' + w.title + '</div></div>' +
    contentHtml;
  return card;
}

// 选中组件
function dashSelectWidget(widgetId) {
  var widget = dashGetWidget(widgetId);
  if (!widget) return;
  dashState.selectedWidget = widgetId;
  document.querySelectorAll('.dash-card').forEach(function(c) {
    c.classList.toggle('selected', c.dataset.id === widgetId);
  });
  // 配置模式下打开属性面板
  if (dashState.mode === 'config') {
    dashOpenPropPanel(widget);
  }
}

// 获取组件数据
function dashGetWidget(widgetId) {
  var widgets = dashState.widgets[dashState.currentTab] || [];
  return widgets.find(function(w) { return w.id === widgetId; });
}

// 打开属性面板
function dashOpenPropPanel(widget) {
  var panel = document.getElementById('dashPropPanel');
  var typeInfo = dashWidgetTypes[widget.type] || { name: widget.type };
  document.getElementById('dppTitle').textContent = widget.title;
  document.getElementById('dppType').textContent = typeInfo.name;
  document.getElementById('dppTitleInput').value = widget.title;
  document.getElementById('dppPosX').value = widget.x;
  document.getElementById('dppPosY').value = widget.y;
  document.getElementById('dppWidth').value = widget.w;
  document.getElementById('dppHeight').value = widget.h;
  // 数据源
  document.getElementById('dppSource').value = widget.dataSource.source;
  document.getElementById('dppProtocol').value = widget.dataSource.protocol;
  document.getElementById('dppField').value = widget.dataSource.field;
  document.getElementById('dppFreq').value = widget.dataSource.freq;
  // 背景色
  var bgSwatches = document.querySelectorAll('#dppBgColor .dpp-color-swatch');
  bgSwatches.forEach(function(s) { s.classList.toggle('active', s.dataset.color === widget.bgColor); });
  // 按类型显示对应 section
  document.getElementById('dppNumberSection').style.display = (widget.type === 'number' || widget.type === 'gauge') ? '' : 'none';
  document.getElementById('dppLineSection').style.display = (widget.type === 'line' || widget.type === 'histogram') ? '' : 'none';
  document.getElementById('dppStatusSection').style.display = widget.type === 'status' ? '' : 'none';
  document.getElementById('dppBarSection').style.display = widget.type === 'bar' ? '' : 'none';
  // 数值属性
  if (widget.type === 'number' || widget.type === 'gauge') {
    document.getElementById('dppUnit').value = widget.unit || '';
    document.getElementById('dppDecimals').value = widget.decimals || 0;
    document.getElementById('dppFontSize').value = widget.fontSize || 24;
  }
  // 折线图属性
  if (widget.type === 'line') {
    document.getElementById('dppYMin').value = widget.yMin || 0;
    document.getElementById('dppYMax').value = widget.yMax || 100;
    document.getElementById('dppPoints').value = widget.points || 30;
  }
  // 状态灯属性
  if (widget.type === 'status') {
    document.getElementById('dppOnThreshold').value = widget.onThreshold || 1;
  }
  // 柱状条属性
  if (widget.type === 'bar') {
    document.getElementById('dppBarMax').value = widget.max || 100;
  }
  // 告警配置
  document.getElementById('dppUpperAlert').checked = widget.alert.upper.enabled;
  document.getElementById('dppUpperRow').style.display = widget.alert.upper.enabled ? '' : 'none';
  document.getElementById('dppUpperBlink').style.display = widget.alert.upper.enabled ? '' : 'none';
  document.getElementById('dppUpperLimit').value = widget.alert.upper.limit;
  document.getElementById('dppUpperColor').value = widget.alert.upper.color;
  document.getElementById('dppUpperBlinkChk').checked = widget.alert.upper.blink;
  document.getElementById('dppLowerAlert').checked = widget.alert.lower.enabled;
  document.getElementById('dppLowerRow').style.display = widget.alert.lower.enabled ? '' : 'none';
  document.getElementById('dppLowerBlink').style.display = widget.alert.lower.enabled ? '' : 'none';
  document.getElementById('dppLowerLimit').value = widget.alert.lower.limit;
  document.getElementById('dppLowerColor').value = widget.alert.lower.color;
  document.getElementById('dppLowerBlinkChk').checked = widget.alert.lower.blink;
  panel.classList.add('show');
}

// 关闭属性面板
function dashClosePropPanel() {
  document.getElementById('dashPropPanel').classList.remove('show');
  if (dashState.selectedWidget) {
    var card = document.querySelector('.dash-card[data-id="' + dashState.selectedWidget + '"]');
    if (card) card.classList.remove('selected');
  }
  dashState.selectedWidget = null;
}

// 更新通用属性
function dashUpdateProp(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'title') {
    w.title = value;
    document.getElementById('dppTitle').textContent = value;
    var card = document.querySelector('.dash-card[data-id="' + w.id + '"]');
    if (card) {
      var titleEl = card.querySelector('.dc-title');
      if (titleEl) titleEl.textContent = value;
    }
  }
}

// 更新位置
function dashUpdatePos(axis, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  var v = parseInt(value) || 0;
  if (axis === 'x') w.x = v; else w.y = v;
  var card = document.querySelector('.dash-card[data-id="' + w.id + '"]');
  if (card) card.style[axis === 'x' ? 'left' : 'top'] = v + 'px';
}

// 更新尺寸
function dashUpdateSize(dim, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  var v = parseInt(value) || 50;
  if (dim === 'w') w.w = v; else w.h = v;
  var card = document.querySelector('.dash-card[data-id="' + w.id + '"]');
  if (card) card.style[dim === 'w' ? 'width' : 'height'] = v + 'px';
}

// 更新背景色
function dashUpdateBgColor(el) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  var color = el.dataset.color;
  w.bgColor = color;
  el.parentElement.querySelectorAll('.dpp-color-swatch').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
  var card = document.querySelector('.dash-card[data-id="' + w.id + '"]');
  if (card) card.style.background = color;
}

// 更新数据源
function dashUpdateDataSource(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  w.dataSource[key] = value;
  if (key === 'freq' && dashState.mode === 'run') {
    // 重新设置实时数据频率
    dashStopRealtime();
    dashStartRealtime();
  }
}

// 更新数值组件属性
function dashUpdateNumberProp(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'unit') w.unit = value;
  else if (key === 'decimals') w.decimals = parseInt(value) || 0;
  else if (key === 'fontSize') w.fontSize = parseInt(value) || 24;
  dashRenderWidgetValue(w.id);
}

// 更新折线图属性
function dashUpdateLineProp(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'yMin') w.yMin = parseFloat(value) || 0;
  else if (key === 'yMax') w.yMax = parseFloat(value) || 100;
  else if (key === 'points') {
    var newPoints = parseInt(value) || 30;
    // 调整数据长度
    while (w.data.length < newPoints) w.data.unshift(w.value || 0);
    while (w.data.length > newPoints) w.data.shift();
    w.points = newPoints;
  }
  dashRenderWidgetValue(w.id);
}

// 更新折线图颜色
function dashUpdateLineColor(el) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  w.lineColor = el.dataset.color;
  el.parentElement.querySelectorAll('.dpp-color-swatch').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
  dashRenderWidgetValue(w.id);
}

// 更新状态灯属性
function dashUpdateStatusProp(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'onThreshold') w.onThreshold = parseFloat(value) || 1;
  dashRenderWidgetValue(w.id);
}

// 更新状态灯颜色
function dashUpdateStatusColor(state, el) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  var color = el.dataset.color;
  if (state === 'on') w.onColor = color; else w.offColor = color;
  el.parentElement.querySelectorAll('.dpp-color-swatch').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
  dashRenderWidgetValue(w.id);
}

// 更新柱状条属性
function dashUpdateBarProp(key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'max') w.max = parseFloat(value) || 100;
  dashRenderWidgetValue(w.id);
}

// 更新柱状条颜色
function dashUpdateBarColor(el) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  w.barColor = el.dataset.color;
  el.parentElement.querySelectorAll('.dpp-color-swatch').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
  dashRenderWidgetValue(w.id);
}

// 切换告警
function dashToggleAlert(type, enabled) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  w.alert[type].enabled = enabled;
  document.getElementById('dpp' + type.charAt(0).toUpperCase() + type.slice(1) + 'Row').style.display = enabled ? '' : 'none';
  document.getElementById('dpp' + type.charAt(0).toUpperCase() + type.slice(1) + 'Blink').style.display = enabled ? '' : 'none';
  dashRenderWidgetValue(w.id);
}

// 更新告警配置
function dashUpdateAlert(type, key, value) {
  var w = dashGetWidget(dashState.selectedWidget);
  if (!w) return;
  if (key === 'limit') w.alert[type].limit = parseFloat(value);
  else if (key === 'color') w.alert[type].color = value;
  else if (key === 'blink') w.alert[type].blink = value;
  dashRenderWidgetValue(w.id);
}

// 检查并应用告警状态
function dashCheckAlert(widget) {
  var card = document.querySelector('.dash-card[data-id="' + widget.id + '"]');
  if (!card) return;
  card.classList.remove('alert-upper', 'alert-lower', 'alert-blink');
  card.style.borderColor = '';
  card.style.boxShadow = '';
  var value = widget.value;
  var upper = widget.alert.upper;
  var lower = widget.alert.lower;
  var alertTriggered = false;
  if (upper.enabled && value >= upper.limit) {
    card.classList.add('alert-upper');
    card.style.borderColor = upper.color;
    card.style.boxShadow = '0 0 12px ' + upper.color + '55';
    if (upper.blink) card.classList.add('alert-blink');
    alertTriggered = true;
    dashShowAlert(widget.title + ' 超过上限 ' + upper.limit + (widget.unit || ''), upper.color);
  }
  if (lower.enabled && value <= lower.limit) {
    card.classList.add('alert-lower');
    card.style.borderColor = lower.color;
    card.style.boxShadow = '0 0 12px ' + lower.color + '55';
    if (lower.blink) card.classList.add('alert-blink');
    alertTriggered = true;
    dashShowAlert(widget.title + ' 低于下限 ' + lower.limit + (widget.unit || ''), lower.color);
  }
  return alertTriggered;
}

// 显示告警条
function dashShowAlert(text, color) {
  var bar = document.getElementById('dashAlertBar');
  var textEl = document.getElementById('dashAlertText');
  textEl.textContent = '⚠ ' + text;
  bar.style.background = color + '1f';
  bar.style.borderColor = color;
  bar.style.color = color;
  bar.classList.add('show');
  dashState.alertActive = true;
}

// 隐藏告警条
function dashHideAlert() {
  document.getElementById('dashAlertBar').classList.remove('show');
  dashState.alertActive = false;
}

// 切换开关
function dashToggleSwitch(widgetId) {
  var w = dashGetWidget(widgetId);
  if (!w || w.type !== 'switch') return;
  w.value = w.value === 1 ? 0 : 1;
  dashRenderWidgetValue(widgetId);
}

// 渲染单个组件数值
function dashRenderWidgetValue(widgetId) {
  var w = dashGetWidget(widgetId);
  if (!w) return;
  var card = document.querySelector('.dash-card[data-id="' + widgetId + '"]');
  if (!card) return;
  switch (w.type) {
    case 'number':
      var valEl = document.getElementById(w.id + '-value');
      if (valEl) {
        valEl.textContent = w.value.toFixed(w.decimals || 0);
        valEl.style.fontSize = (w.fontSize || 28) + 'px';
      }
      var unitEl = card.querySelector('.dc-unit');
      if (unitEl) unitEl.textContent = w.unit || '';
      break;
    case 'gauge':
      var pct = Math.min(100, Math.max(0, w.value));
      var angle = -90 + (pct / 100) * 180;
      var needle = document.getElementById(w.id + '-needle');
      if (needle) needle.setAttribute('transform', 'rotate(' + (angle + 90) + ',50,45)');
      var arc = document.getElementById(w.id + '-arc');
      if (arc) {
        var ex = 50 + 40 * Math.cos((180 - pct) * Math.PI / 180);
        var ey = 45 - 40 * Math.sin(pct * Math.PI / 180);
        arc.setAttribute('d', 'M 10 45 A 40 40 0 ' + (pct > 50 ? 1 : 0) + ' 1 ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
      }
      var gVal = document.getElementById(w.id + '-value');
      if (gVal) gVal.textContent = w.value.toFixed(w.decimals || 0) + (w.unit || '');
      break;
    case 'line':
      var linePath = '', areaPath = '';
      var dataLen = w.data.length;
      if (dataLen < 2) break;
      var xStep = 260 / (dataLen - 1);
      var range = (w.yMax || 100) - (w.yMin || 0);
      for (var i = 0; i < dataLen; i++) {
        var px = i * xStep;
        var py = 60 - ((w.data[i] - (w.yMin || 0)) / range) * 55 - 2;
        py = Math.max(2, Math.min(58, py));
        if (i === 0) { linePath = 'M' + px + ',' + py; areaPath = 'M' + px + ',' + py; }
        else { linePath += ' L' + px + ',' + py; areaPath += ' L' + px + ',' + py; }
      }
      areaPath += ' L260,60 L0,60 Z';
      var lineEl = document.getElementById(w.id + '-line');
      var areaEl = document.getElementById(w.id + '-area');
      var color = w.lineColor || '#0fc6b7';
      if (lineEl) { lineEl.setAttribute('d', linePath); lineEl.setAttribute('stroke', color); }
      if (areaEl) areaEl.setAttribute('d', areaPath);
      var unitEl2 = card.querySelector('.dc-unit');
      if (unitEl2) unitEl2.textContent = w.value.toFixed(1) + ' ' + (w.unit || '');
      break;
    case 'bar':
      var pct2 = Math.min(100, Math.max(0, (w.value / (w.max || 100)) * 100));
      var barEl = document.getElementById(w.id + '-bar');
      if (barEl) { barEl.style.width = pct2 + '%'; barEl.style.background = w.barColor || 'var(--grad)'; }
      var barVal = document.getElementById(w.id + '-value');
      if (barVal) barVal.innerHTML = w.value.toFixed(0) + '<span style="font-size:12px;color:var(--muted)">' + (w.unit || '%') + '</span>';
      break;
    case 'status':
      var isOn = w.value >= (w.onThreshold || 1);
      var lightEl = document.getElementById(w.id + '-light');
      var textEl = document.getElementById(w.id + '-text');
      var statusColor = isOn ? (w.onColor || '#3fb950') : (w.offColor || '#8b949e');
      if (lightEl) {
        lightEl.style.background = statusColor;
        lightEl.style.boxShadow = '0 0 10px ' + statusColor;
        lightEl.classList.toggle('off', !isOn);
      }
      if (textEl) {
        textEl.textContent = isOn ? '运行中' : '已关闭';
        textEl.style.color = statusColor;
      }
      break;
    case 'switch':
      var swEl = document.getElementById(w.id + '-switch');
      var swText = document.getElementById(w.id + '-text');
      var swOn = w.value === 1;
      if (swEl) swEl.classList.toggle('on', swOn);
      if (swText) swText.textContent = swOn ? '已开启' : '已关闭';
      break;
  }
  dashCheckAlert(w);
}

// 拖拽开始
function dashStartDrag(e, card) {
  if (dashState.mode !== 'config') return;
  if (e.target.closest('.dc-delete-btn') || e.target.closest('.dc-resize-handle')) return;
  e.preventDefault();
  var widgetId = card.dataset.id;
  var w = dashGetWidget(widgetId);
  if (!w) return;
  dashState.dragState = {
    id: widgetId,
    startX: e.clientX,
    startY: e.clientY,
    origX: w.x,
    origY: w.y,
    moved: false,
  };
  dashSelectWidget(widgetId);
  document.addEventListener('mousemove', dashOnDragMove);
  document.addEventListener('mouseup', dashOnDragEnd);
}

function dashOnDragMove(e) {
  var ds = dashState.dragState;
  if (!ds) return;
  var dx = e.clientX - ds.startX;
  var dy = e.clientY - ds.startY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ds.moved = true;
  var w = dashGetWidget(ds.id);
  if (!w) return;
  var newX = Math.max(0, ds.origX + dx);
  var newY = Math.max(0, ds.origY + dy);
  // 吸附到网格（20px）
  newX = Math.round(newX / 10) * 10;
  newY = Math.round(newY / 10) * 10;
  w.x = newX;
  w.y = newY;
  var card = document.querySelector('.dash-card[data-id="' + ds.id + '"]');
  if (card) {
    card.style.left = newX + 'px';
    card.style.top = newY + 'px';
  }
  // 同步属性面板
  if (dashState.selectedWidget === ds.id) {
    document.getElementById('dppPosX').value = newX;
    document.getElementById('dppPosY').value = newY;
  }
}

function dashOnDragEnd() {
  dashState.dragState = null;
  document.removeEventListener('mousemove', dashOnDragMove);
  document.removeEventListener('mouseup', dashOnDragEnd);
}

// 缩放开始
function dashStartResize(e, widgetId) {
  if (dashState.mode !== 'config') return;
  e.preventDefault();
  var w = dashGetWidget(widgetId);
  if (!w) return;
  dashState.resizeState = {
    id: widgetId,
    startX: e.clientX,
    startY: e.clientY,
    origW: w.w,
    origH: w.h,
  };
  dashSelectWidget(widgetId);
  document.addEventListener('mousemove', dashOnResizeMove);
  document.addEventListener('mouseup', dashOnResizeEnd);
}

function dashOnResizeMove(e) {
  var rs = dashState.resizeState;
  if (!rs) return;
  var dx = e.clientX - rs.startX;
  var dy = e.clientY - rs.startY;
  var w = dashGetWidget(rs.id);
  if (!w) return;
  var newW = Math.max(100, Math.round((rs.origW + dx) / 10) * 10);
  var newH = Math.max(80, Math.round((rs.origH + dy) / 10) * 10);
  w.w = newW;
  w.h = newH;
  var card = document.querySelector('.dash-card[data-id="' + rs.id + '"]');
  if (card) {
    card.style.width = newW + 'px';
    card.style.height = newH + 'px';
  }
  if (dashState.selectedWidget === rs.id) {
    document.getElementById('dppWidth').value = newW;
    document.getElementById('dppHeight').value = newH;
  }
}

function dashOnResizeEnd() {
  dashState.resizeState = null;
  document.removeEventListener('mousemove', dashOnResizeMove);
  document.removeEventListener('mouseup', dashOnResizeEnd);
}

// 删除组件
function dashDeleteWidget(widgetId) {
  if (dashState.mode !== 'config') return;
  if (!confirm('确定删除该组件？')) return;
  var widgets = dashState.widgets[dashState.currentTab];
  var idx = widgets.findIndex(function(w) { return w.id === widgetId; });
  if (idx >= 0) {
    widgets.splice(idx, 1);
    var card = document.querySelector('.dash-card[data-id="' + widgetId + '"]');
    if (card) card.remove();
    if (dashState.selectedWidget === widgetId) dashClosePropPanel();
    var hint = document.getElementById('dashDropHint');
    if (hint) hint.classList.toggle('empty', widgets.length === 0);
  }
}

// 切换组件选择面板
function dashToggleWidgetPicker() {
  var picker = document.getElementById('dashWidgetPicker');
  picker.classList.toggle('show');
}

// 添加组件
function dashAddWidget(type) {
  var typeInfo = dashWidgetTypes[type];
  if (!typeInfo) return;
  var id = 'w-' + dashState.nextWidgetId++;
  var canvas = document.getElementById('dashCanvas');
  var canvasRect = canvas.getBoundingClientRect();
  var defSize = typeInfo.defaultSize;
  var x = Math.round((canvasRect.width / 2 - defSize.w / 2) / 10) * 10;
  var y = Math.round((canvasRect.height / 2 - defSize.h / 2) / 10) * 10;
  var widget = {
    id: id,
    type: type,
    title: typeInfo.name,
    x: x, y: y, w: defSize.w, h: defSize.h,
    value: type === 'status' || type === 'switch' ? 1 : 50,
    unit: '',
    decimals: 1,
    fontSize: 28,
    dataSource: { source: 'current', protocol: 'modbus', field: 'value', freq: 1000 },
    alert: {
      upper: { enabled: false, limit: 80, color: '#f85149', blink: false },
      lower: { enabled: false, limit: 20, color: '#e3a53c', blink: false },
    },
    bgColor: 'rgba(22,27,34,.8)',
  };
  if (type === 'line') {
    widget.points = 30;
    widget.yMin = 0;
    widget.yMax = 100;
    widget.lineColor = '#0fc6b7';
    widget.data = [];
    for (var i = 0; i < widget.points; i++) widget.data.push(40 + Math.random() * 20);
  }
  if (type === 'bar') {
    widget.max = 100;
    widget.unit = '%';
    widget.barColor = 'var(--grad)';
  }
  if (type === 'status') {
    widget.onThreshold = 1;
    widget.onColor = '#3fb950';
    widget.offColor = '#8b949e';
  }
  if (type === 'text') widget.textValue = '新文本组件';
  if (type === 'button') widget.btnText = '点击发送';
  if (type === 'slider') widget.sliderValue = 50;
  dashState.widgets[dashState.currentTab].push(widget);
  var card = dashCreateWidgetElement(widget);
  canvas.appendChild(card);
  var hint = document.getElementById('dashDropHint');
  if (hint) hint.classList.remove('empty');
  dashToggleWidgetPicker();
  dashSelectWidget(id);
}

// 启动实时数据模拟
function dashStartRealtime() {
  if (dashState.realtimeTimer) return;
  dashState.realtimeTimer = setInterval(dashRealtimeTick, dashState.realtimeFreq);
}

// 停止实时数据
function dashStopRealtime() {
  if (dashState.realtimeTimer) {
    clearInterval(dashState.realtimeTimer);
    dashState.realtimeTimer = null;
  }
}

// 实时数据刷新
function dashRealtimeTick() {
  if (dashState.mode !== 'run') return;
  var widgets = dashState.widgets[dashState.currentTab] || [];
  var hasAlert = false;
  widgets.forEach(function(w) {
    // 数值随机波动
    if (w.type === 'number' || w.type === 'gauge' || w.type === 'bar') {
      var range = (w.type === 'bar' ? w.max : 100) * 0.05;
      var change = (Math.random() - 0.5) * range;
      w.value = Math.max(0, w.value + change);
      if (w.type === 'gauge') w.value = Math.min(100, w.value);
      if (w.type === 'bar') w.value = Math.min(w.max || 100, w.value);
      // 偶尔触发阈值告警（模拟）
      if (w.alert.upper.enabled && Math.random() < 0.05) {
        w.value = w.alert.upper.limit + Math.random() * 10;
      }
    } else if (w.type === 'line') {
      var lastVal = w.data[w.data.length - 1] || w.value;
      var newVal = lastVal + (Math.random() - 0.5) * 5;
      newVal = Math.max(w.yMin || 0, Math.min(w.yMax || 100, newVal));
      w.data.shift();
      w.data.push(newVal);
      w.value = newVal;
    } else if (w.type === 'status') {
      if (Math.random() < 0.1) {
        w.value = w.value >= (w.onThreshold || 1) ? 0 : 1;
      }
    } else if (w.type === 'histogram') {
      // 柱状图重新随机
      var chart = document.getElementById(w.id + '-chart');
      if (chart) {
        var rects = chart.querySelectorAll('rect');
        rects.forEach(function(r) {
          var bh = 20 + Math.random() * 35;
          r.setAttribute('height', bh);
          r.setAttribute('y', 55 - bh);
          r.setAttribute('opacity', 0.5 + Math.random() * 0.5);
        });
      }
    }
    dashRenderWidgetValue(w.id);
    if (w.alert.upper.enabled && w.value >= w.alert.upper.limit) hasAlert = true;
    if (w.alert.lower.enabled && w.value <= w.alert.lower.limit) hasAlert = true;
  });
  if (!hasAlert && dashState.alertActive) {
    // 告警解除
    dashHideAlert();
  }
}

// 仪表盘视图初始化
function dashInit() {
  dashInitData();
  dashRenderWidgets();
  // 默认运行模式，启动实时数据
  dashStartRealtime();
}

// 页面加载完成后初始化
setTimeout(function() {
  dashInit();
  settingsInit();
}, 200);
