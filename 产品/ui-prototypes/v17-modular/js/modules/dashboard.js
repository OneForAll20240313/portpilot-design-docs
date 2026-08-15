/* ============================================================
Dashboard Module
Auto-extracted from prototype-v16-enhanced.html
PortPilot UI Prototype v16
============================================================ */

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
