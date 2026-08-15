/* ============================================================
   Protocol Parser Module
   PortPilot UI Prototype v16 (Modular)
   ============================================================ */

/* ===== 协议解析模块 ===== */
var protoState = {
  protocols: [],
  selectedId: null,
  ctxMenuId: null,
  editingFieldIdx: -1,
  autoParse: false,
  autoParseTimer: null,
  currentTab: 'parse',
  frameValues: {},
  userTemplates: [],
  nextId: 1
};

// 字段类型定义
var PROTO_FIELD_TYPES = {
  uint8:   { name: 'uint8',   bytes: 1, hasEndian: false },
  uint16:  { name: 'uint16',  bytes: 2, hasEndian: true },
  uint32:  { name: 'uint32',  bytes: 4, hasEndian: true },
  int8:    { name: 'int8',    bytes: 1, hasEndian: false },
  int16:   { name: 'int16',   bytes: 2, hasEndian: true },
  int32:   { name: 'int32',   bytes: 4, hasEndian: true },
  float32: { name: 'float32', bytes: 4, hasEndian: true },
  double:  { name: 'double',  bytes: 8, hasEndian: true },
  bytes:   { name: 'bytes',   bytes: -1, hasEndian: false },
  ascii:   { name: 'ascii',   bytes: -1, hasEndian: false },
  hex:     { name: 'hex',     bytes: -1, hasEndian: false },
  bitfield:{ name: 'bitfield',bytes: 1, hasEndian: false }
};

// 协议类型名称映射
var PROTO_TYPE_NAMES = {
  fixed: '固定长度',
  variable: '可变长度',
  textline: '文本行',
  csv: 'CSV'
};

// 内置协议模板
var PROTO_BUILTIN_TEMPLATES = [
  {
    id: 'modbus-rtu',
    name: 'Modbus RTU',
    type: 'variable',
    desc: '工业标准Modbus RTU协议，含CRC16校验',
    fields: [
      { name: 'addr', type: 'uint8', len: 1, endian: 'be', desc: '设备地址' },
      { name: 'func_code', type: 'uint8', len: 1, endian: 'be', desc: '功能码' },
      { name: 'data', type: 'bytes', len: -1, endian: 'be', desc: '数据区' },
      { name: 'crc16', type: 'uint16', len: 2, endian: 'le', desc: 'CRC校验' }
    ],
    crc: 'crc16',
    header: null,
    trailer: null
  },
  {
    id: 'ymodem',
    name: 'YMODEM',
    type: 'variable',
    desc: 'YMODEM文件传输协议，128/1024字节数据块',
    fields: [
      { name: 'soh', type: 'uint8', len: 1, endian: 'be', desc: '帧头(0x01/0x02)' },
      { name: 'seq', type: 'uint8', len: 1, endian: 'be', desc: '包序号' },
      { name: 'seq_inv', type: 'uint8', len: 1, endian: 'be', desc: '包序号反码' },
      { name: 'data', type: 'bytes', len: 128, endian: 'be', desc: '数据区' },
      { name: 'crc16', type: 'uint16', len: 2, endian: 'be', desc: 'CRC16校验' }
    ],
    crc: 'crc16',
    header: '0x01',
    trailer: null
  },
  {
    id: 'nmea0183',
    name: 'NMEA 0183',
    type: 'textline',
    desc: 'GPS标准NMEA 0183文本协议，$开头\\r\\n结尾',
    fields: [
      { name: 'talker', type: 'ascii', len: 2, endian: 'be', desc: '会话标识' },
      { name: 'sentence', type: 'ascii', len: 3, endian: 'be', desc: '语句类型' },
      { name: 'data', type: 'ascii', len: -1, endian: 'be', desc: '数据字段' },
      { name: 'checksum', type: 'hex', len: 2, endian: 'be', desc: '校验和' }
    ],
    crc: 'none',
    header: '$',
    trailer: '\\r\\n'
  },
  {
    id: 'sbus',
    name: 'SBUS',
    type: 'fixed',
    desc: 'FrSky SBUS遥控协议，25字节固定长度',
    fields: [
      { name: 'header', type: 'uint8', len: 1, endian: 'be', desc: '帧头(0x0F)' },
      { name: 'ch0_6', type: 'bytes', len: 11, endian: 'be', desc: '通道0-6' },
      { name: 'ch7_13', type: 'bytes', len: 11, endian: 'be', desc: '通道7-13' },
      { name: 'ch15_16_flags', type: 'uint8', len: 1, endian: 'be', desc: '通道15/16+标志' },
      { name: 'footer', type: 'uint8', len: 1, endian: 'be', desc: '帧尾(0x00)' }
    ],
    crc: 'none',
    header: '0x0F',
    trailer: '0x00'
  },
  {
    id: 'custom-fixed',
    name: '自定义固定帧',
    type: 'fixed',
    desc: '固定长度协议模板，可自定义字段',
    fields: [
      { name: 'header', type: 'uint8', len: 1, endian: 'be', desc: '帧头' },
      { name: 'cmd', type: 'uint8', len: 1, endian: 'be', desc: '命令字' },
      { name: 'data_len', type: 'uint8', len: 1, endian: 'be', desc: '数据长度' },
      { name: 'data', type: 'bytes', len: 8, endian: 'be', desc: '数据区' },
      { name: 'checksum', type: 'uint8', len: 1, endian: 'be', desc: '校验和' }
    ],
    crc: 'none',
    header: '0x7E',
    trailer: null
  },
  {
    id: 'csv-simple',
    name: 'CSV 数据',
    type: 'csv',
    desc: '逗号分隔的CSV文本协议',
    fields: [
      { name: 'timestamp', type: 'ascii', len: -1, endian: 'be', desc: '时间戳' },
      { name: 'sensor1', type: 'ascii', len: -1, endian: 'be', desc: '传感器1' },
      { name: 'sensor2', type: 'ascii', len: -1, endian: 'be', desc: '传感器2' }
    ],
    crc: 'none',
    header: null,
    trailer: null
  }
];

// ========== 初始化 ==========
function protoInit(){
  // 加载一些示例协议
  protoState.protocols = [
    {
      id: 'p1',
      name: 'Modbus RTU',
      type: 'variable',
      header: null,
      trailer: null,
      crc: 'crc16',
      fields: [
        { name: 'addr', type: 'uint8', len: 1, endian: 'be', desc: '设备地址' },
        { name: 'func_code', type: 'uint8', len: 1, endian: 'be', desc: '功能码' },
        { name: 'start_addr', type: 'uint16', len: 2, endian: 'be', desc: '起始地址' },
        { name: 'reg_count', type: 'uint16', len: 2, endian: 'be', desc: '寄存器数量' }
      ],
      lenField: null,
      builtin: true
    },
    {
      id: 'p2',
      name: '传感器数据帧',
      type: 'fixed',
      header: '0x7E',
      trailer: null,
      crc: 'crc8',
      fields: [
        { name: 'header', type: 'uint8', len: 1, endian: 'be', desc: '帧头 0x7E' },
        { name: 'temp', type: 'float32', len: 4, endian: 'be', desc: '温度(°C)' },
        { name: 'humidity', type: 'float32', len: 4, endian: 'be', desc: '湿度(%RH)' },
        { name: 'pressure', type: 'uint16', len: 2, endian: 'be', desc: '气压(hPa)' },
        { name: 'status', type: 'uint8', len: 1, endian: 'be', desc: '状态字' },
        { name: 'crc8', type: 'uint8', len: 1, endian: 'be', desc: 'CRC8校验' }
      ],
      builtin: false
    },
    {
      id: 'p3',
      name: '文本指令协议',
      type: 'textline',
      header: null,
      trailer: '\\r\\n',
      crc: 'none',
      fields: [
        { name: 'cmd', type: 'ascii', len: -1, endian: 'be', desc: '命令文本' }
      ],
      builtin: false
    }
  ];
  protoState.nextId = 4;
  protoState.selectedId = 'p1';
  protoRenderTree();
  protoRenderAll();
  protoRenderTemplates();
}

// ========== 协议树渲染 ==========
function protoRenderTree(){
  var container = document.getElementById('protoTreeItems');
  if(!container) return;
  container.innerHTML = '';
  protoState.protocols.forEach(function(p){
    var item = document.createElement('div');
    item.className = 'proto-item' + (protoState.selectedId === p.id ? ' active' : '');
    item.dataset.id = p.id;
    item.onclick = function(e){ protoSelectProtocol(p.id, e); };
    item.oncontextmenu = function(e){ e.preventDefault(); protoShowCtxMenu(p.id, e); };
    
    var arrow = document.createElement('span');
    arrow.className = 'pi-arrow';
    arrow.textContent = '▼';
    arrow.onclick = function(e){
      e.stopPropagation();
      item.classList.toggle('collapsed');
      subitems.classList.toggle('show');
    };
    
    var name = document.createElement('span');
    name.className = 'pi-name';
    name.textContent = p.name;
    
    var type = document.createElement('span');
    type.className = 'pi-type';
    type.textContent = PROTO_TYPE_NAMES[p.type] || p.type;
    
    item.appendChild(arrow);
    item.appendChild(name);
    item.appendChild(type);
    container.appendChild(item);
    
    // 子项（字段预览）
    var subitems = document.createElement('div');
    subitems.className = 'proto-subitems show';
    p.fields.slice(0, 5).forEach(function(f){
      var si = document.createElement('div');
      si.className = 'proto-subitem';
      si.innerHTML = '<span class="psi-icon">■</span> ' + f.name + ' <span class="psi-type">' + f.type + '</span>';
      si.onclick = function(e){
        e.stopPropagation();
        protoSelectProtocol(p.id);
        protoSwitchTab('fields', document.querySelector('[data-proto-tab=fields]'));
      };
      subitems.appendChild(si);
    });
    if(p.fields.length > 5){
      var more = document.createElement('div');
      more.className = 'proto-subitem';
      more.style.color = 'var(--muted)';
      more.innerHTML = '<span class="psi-icon">…</span> 共 ' + p.fields.length + ' 个字段';
      subitems.appendChild(more);
    }
    container.appendChild(subitems);
  });
}

function protoSelectProtocol(id, e){
  if(e && e.target.closest('.pi-arrow')) return;
  protoState.selectedId = id;
  protoRenderTree();
  protoRenderAll();
}

function protoGetSelected(){
  return protoState.protocols.find(function(p){ return p.id === protoState.selectedId; });
}

// ========== Tab 切换 ==========
function protoSwitchTab(tab, btn){
  protoState.currentTab = tab;
  document.querySelectorAll('[data-proto-tab]').forEach(function(b){
    b.classList.toggle('active', b.dataset.protoTab === tab);
  });
  document.querySelectorAll('.proto-tab-content').forEach(function(c){
    c.style.display = 'none';
  });
  var tabEl = document.getElementById('protoTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if(tabEl) tabEl.style.display = 'flex';
  protoRenderAll();
}

// ========== 渲染所有内容 ==========
function protoRenderAll(){
  protoRenderParse();
  protoRenderFields();
  protoRenderFrameEditor();
}

// ========== 协议CRUD ==========
function protoOpenAddMenu(e){
  e.stopPropagation();
  var menu = document.getElementById('protoAddMenu');
  if(!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function(e){
  var menu = document.getElementById('protoAddMenu');
  if(menu && !e.target.closest('.proto-tree-actions')){
    menu.style.display = 'none';
  }
  var ctx = document.getElementById('protoCtxMenu');
  if(ctx && !e.target.closest('.proto-ctx-menu')){
    ctx.style.display = 'none';
  }
});

function protoShowNewModal(type){
  var menu = document.getElementById('protoAddMenu');
  if(menu) menu.style.display = 'none';
  document.getElementById('protoNewModal').classList.add('show');
  document.getElementById('protoNewName').value = '';
  document.getElementById('protoNewType').value = type || 'fixed';
  document.getElementById('protoNewHeader').value = '';
  document.getElementById('protoNewTrailer').value = '';
  document.getElementById('protoNewCrc').value = 'none';
  setTimeout(function(){ document.getElementById('protoNewName').focus(); }, 100);
}

function protoCloseNewModal(){
  document.getElementById('protoNewModal').classList.remove('show');
}

function protoConfirmNew(){
  var name = document.getElementById('protoNewName').value.trim();
  if(!name){ alert('请输入协议名称'); return; }
  var type = document.getElementById('protoNewType').value;
  var header = document.getElementById('protoNewHeader').value.trim() || null;
  var trailer = document.getElementById('protoNewTrailer').value.trim() || null;
  var crc = document.getElementById('protoNewCrc').value;
  
  var id = 'p' + protoState.nextId++;
  var newProto = {
    id: id,
    name: name,
    type: type,
    header: header,
    trailer: trailer,
    crc: crc,
    fields: [],
    builtin: false
  };
  
  // 根据类型添加默认字段
  if(type === 'fixed'){
    newProto.fields = [
      { name: 'data', type: 'uint8', len: 1, endian: 'be', desc: '数据' }
    ];
  } else if(type === 'variable'){
    newProto.fields = [
      { name: 'len', type: 'uint8', len: 1, endian: 'be', desc: '长度字段' },
      { name: 'data', type: 'bytes', len: -1, endian: 'be', desc: '数据区' }
    ];
  } else if(type === 'textline'){
    newProto.fields = [
      { name: 'content', type: 'ascii', len: -1, endian: 'be', desc: '文本内容' }
    ];
  } else if(type === 'csv'){
    newProto.fields = [
      { name: 'field1', type: 'ascii', len: -1, endian: 'be', desc: '字段1' }
    ];
  }
  
  // 添加CRC字段
  if(crc !== 'none'){
    var crcLen = crc === 'crc8' ? 1 : crc === 'crc16' ? 2 : 4;
    var crcType = crc === 'crc8' ? 'uint8' : crc === 'crc16' ? 'uint16' : 'uint32';
    newProto.fields.push({ name: 'crc', type: crcType, len: crcLen, endian: 'be', desc: crc.toUpperCase() + '校验' });
  }
  
  protoState.protocols.push(newProto);
  protoState.selectedId = id;
  protoState.frameValues = {};
  protoCloseNewModal();
  protoRenderTree();
  protoRenderAll();
  protoSwitchTab('fields', document.querySelector('[data-proto-tab=fields]'));
}

// ========== 右键菜单 ==========
function protoShowCtxMenu(id, e){
  protoState.ctxMenuId = id;
  var menu = document.getElementById('protoCtxMenu');
  if(!menu) return;
  menu.style.display = 'block';
  var x = e.clientX, y = e.clientY;
  // 防止溢出
  var rect = menu.getBoundingClientRect();
  if(x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 5;
  if(y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 5;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function protoCtxAction(action){
  var id = protoState.ctxMenuId;
  var proto = protoState.protocols.find(function(p){ return p.id === id; });
  if(!proto) return;
  document.getElementById('protoCtxMenu').style.display = 'none';
  
  if(action === 'rename'){
    document.getElementById('protoRenameInput').value = proto.name;
    document.getElementById('protoRenameModal').classList.add('show');
    setTimeout(function(){ document.getElementById('protoRenameInput').focus(); }, 100);
  } else if(action === 'copy'){
    var copy = JSON.parse(JSON.stringify(proto));
    copy.id = 'p' + protoState.nextId++;
    copy.name = proto.name + ' 副本';
    copy.builtin = false;
    var idx = protoState.protocols.findIndex(function(p){ return p.id === id; });
    protoState.protocols.splice(idx + 1, 0, copy);
    protoRenderTree();
  } else if(action === 'delete'){
    document.getElementById('protoDeleteName').textContent = proto.name;
    document.getElementById('protoDeleteModal').classList.add('show');
  } else if(action === 'export'){
    var data = JSON.stringify(proto, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = proto.name + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}

function protoCloseRenameModal(){
  document.getElementById('protoRenameModal').classList.remove('show');
}

function protoConfirmRename(){
  var newName = document.getElementById('protoRenameInput').value.trim();
  if(!newName){ alert('请输入协议名称'); return; }
  var proto = protoState.protocols.find(function(p){ return p.id === protoState.ctxMenuId; });
  if(proto){
    proto.name = newName;
    protoRenderTree();
    protoRenderAll();
  }
  protoCloseRenameModal();
}

function protoCloseDeleteModal(){
  document.getElementById('protoDeleteModal').classList.remove('show');
}

function protoConfirmDelete(){
  var id = protoState.ctxMenuId;
  var idx = protoState.protocols.findIndex(function(p){ return p.id === id; });
  if(idx >= 0){
    protoState.protocols.splice(idx, 1);
    if(protoState.selectedId === id){
      protoState.selectedId = protoState.protocols.length > 0 ? protoState.protocols[0].id : null;
    }
    protoRenderTree();
    protoRenderAll();
  }
  protoCloseDeleteModal();
}

function protoImportJson(){
  var menu = document.getElementById('protoAddMenu');
  if(menu) menu.style.display = 'none';
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      try{
        var data = JSON.parse(ev.target.result);
        if(!data.name || !data.type || !Array.isArray(data.fields)){
          alert('无效的协议JSON文件');
          return;
        }
        data.id = 'p' + protoState.nextId++;
        data.builtin = false;
        protoState.protocols.push(data);
        protoState.selectedId = data.id;
        protoState.frameValues = {};
        protoRenderTree();
        protoRenderAll();
      } catch(err){
        alert('解析JSON失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ========== 字段编辑器 ==========
function protoCalcTotalLen(proto){
  if(!proto || !proto.fields) return 0;
  var total = 0;
  proto.fields.forEach(function(f){
    var t = PROTO_FIELD_TYPES[f.type];
    if(t && t.bytes > 0){
      total += t.bytes;
    } else if(f.len > 0){
      total += f.len;
    }
  });
  return total;
}

function protoRenderFields(){
  var proto = protoGetSelected();
  var nameEl = document.getElementById('pfhName');
  var typeEl = document.getElementById('pfhType');
  var lenEl = document.getElementById('pfhTotalLen');
  var bodyEl = document.getElementById('protoFieldBody');
  var vizEl = document.getElementById('protoFrameViz');
  
  if(!nameEl || !bodyEl) return;
  
  if(!proto){
    nameEl.textContent = '未选择协议';
    typeEl.textContent = '';
    lenEl.textContent = '-';
    bodyEl.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">请选择一个协议</td></tr>';
    vizEl.innerHTML = '';
    return;
  }
  
  nameEl.textContent = proto.name;
  typeEl.textContent = PROTO_TYPE_NAMES[proto.type] || proto.type;
  lenEl.textContent = protoCalcTotalLen(proto);
  
  // 渲染字段表
  if(proto.fields.length === 0){
    bodyEl.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">暂无字段，点击下方「+ 添加字段」</td></tr>';
  } else {
    var html = '';
    proto.fields.forEach(function(f, idx){
      var t = PROTO_FIELD_TYPES[f.type];
      var len = t && t.bytes > 0 ? t.bytes : (f.len || 0);
      var lenStr = t && t.bytes > 0 ? t.bytes + ' B' : (f.len > 0 ? f.len + ' B' : '变长');
      var endianStr = t && t.hasEndian ? (f.endian === 'le' ? '小端' : '大端') : '-';
      html += '<tr data-idx="' + idx + '">' +
        '<td>' + (idx + 1) + '</td>' +
        '<td><input type="text" value="' + f.name + '" onchange="protoUpdateFieldName(' + idx + ', this.value)"></td>' +
        '<td><select onchange="protoUpdateFieldType(' + idx + ', this.value)">';
      Object.keys(PROTO_FIELD_TYPES).forEach(function(ft){
        html += '<option value="' + ft + '"' + (f.type === ft ? ' selected' : '') + '>' + ft + '</option>';
      });
      html += '</select></td>' +
        '<td>' + lenStr + '</td>' +
        '<td>' + endianStr + '</td>' +
        '<td><input type="text" value="' + (f.desc || '') + '" onchange="protoUpdateFieldDesc(' + idx + ', this.value)"></td>' +
        '<td><div class="field-actions">' +
        '<button type="button" onclick="protoMoveField(' + idx + ',-1)" title="上移" ' + (idx === 0 ? 'disabled style="opacity:.4;cursor:not-allowed"' : '') + '>↑</button>' +
        '<button type="button" onclick="protoMoveField(' + idx + ',1)" title="下移" ' + (idx === proto.fields.length - 1 ? 'disabled style="opacity:.4;cursor:not-allowed"' : '') + '>↓</button>' +
        '<button type="button" onclick="protoDeleteField(' + idx + ')" title="删除" style="color:var(--danger)">✕</button>' +
        '</div></td></tr>';
    });
    bodyEl.innerHTML = html;
  }
  
  // 渲染帧结构可视化
  protoRenderFrameViz(proto, vizEl);
}

function protoRenderFrameViz(proto, container){
  if(!container) return;
  if(!proto || proto.fields.length === 0){
    container.innerHTML = '';
    return;
  }
  
  var colors = [
    '#0fc6b7', '#58a6ff', '#a371f7', '#3fb950', '#e3a53c',
    '#f85149', '#39c0c0', '#ff9432', '#d2a8ff', '#56d364'
  ];
  var totalLen = protoCalcTotalLen(proto);
  if(totalLen === 0) totalLen = proto.fields.length;
  
  var html = '';
  proto.fields.forEach(function(f, idx){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : 1);
    var pct = (flen / totalLen) * 100;
    if(pct < 5) pct = 5;
    var color = colors[idx % colors.length];
    var isHeader = idx === 0 && proto.header;
    var cls = isHeader ? 'header-seg' : '';
    html += '<div class="pfv-segment ' + cls + '" style="flex:' + pct + ';background:' + color + '" title="' + f.name + ' (' + f.type + ')">' +
      '<span class="pfv-seg-label">' + f.name + '</span></div>';
  });
  container.innerHTML = html;
}

function protoAddField(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  protoState.editingFieldIdx = -1;
  document.getElementById('protoFieldModalTitle').textContent = '添加字段';
  document.getElementById('protoFieldName').value = '';
  document.getElementById('protoFieldType').value = 'uint8';
  document.getElementById('protoFieldLen').value = 1;
  document.getElementById('protoFieldEndian').value = 'be';
  document.getElementById('protoFieldDesc').value = '';
  protoOnFieldTypeChange();
  document.getElementById('protoFieldModal').classList.add('show');
  setTimeout(function(){ document.getElementById('protoFieldName').focus(); }, 100);
}

function protoOnFieldTypeChange(){
  var type = document.getElementById('protoFieldType').value;
  var t = PROTO_FIELD_TYPES[type];
  var lenRow = document.getElementById('protoFieldLenRow');
  var endianRow = document.getElementById('protoFieldEndianRow');
  if(t.bytes > 0){
    lenRow.style.display = 'none';
    document.getElementById('protoFieldLen').value = t.bytes;
  } else {
    lenRow.style.display = '';
  }
  endianRow.style.display = t.hasEndian ? '' : 'none';
}

function protoCloseFieldModal(){
  document.getElementById('protoFieldModal').classList.remove('show');
}

function protoConfirmField(){
  var proto = protoGetSelected();
  if(!proto) return;
  var name = document.getElementById('protoFieldName').value.trim();
  if(!name){ alert('请输入字段名'); return; }
  var type = document.getElementById('protoFieldType').value;
  var len = parseInt(document.getElementById('protoFieldLen').value) || 1;
  var endian = document.getElementById('protoFieldEndian').value;
  var desc = document.getElementById('protoFieldDesc').value.trim();
  
  var field = { name: name, type: type, len: len, endian: endian, desc: desc };
  
  if(protoState.editingFieldIdx >= 0){
    proto.fields[protoState.editingFieldIdx] = field;
  } else {
    proto.fields.push(field);
  }
  
  protoCloseFieldModal();
  protoRenderTree();
  protoRenderAll();
}

function protoUpdateFieldName(idx, val){
  var proto = protoGetSelected();
  if(proto && proto.fields[idx]){
    proto.fields[idx].name = val;
    protoRenderTree();
    protoRenderFrameViz(proto, document.getElementById('protoFrameViz'));
  }
}

function protoUpdateFieldType(idx, val){
  var proto = protoGetSelected();
  if(proto && proto.fields[idx]){
    proto.fields[idx].type = val;
    var t = PROTO_FIELD_TYPES[val];
    if(t.bytes > 0){
      proto.fields[idx].len = t.bytes;
    }
    protoRenderFields();
  }
}

function protoUpdateFieldDesc(idx, val){
  var proto = protoGetSelected();
  if(proto && proto.fields[idx]){
    proto.fields[idx].desc = val;
  }
}

function protoMoveField(idx, dir){
  var proto = protoGetSelected();
  if(!proto) return;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= proto.fields.length) return;
  var tmp = proto.fields[idx];
  proto.fields[idx] = proto.fields[newIdx];
  proto.fields[newIdx] = tmp;
  protoRenderFields();
  protoRenderTree();
}

function protoDeleteField(idx){
  var proto = protoGetSelected();
  if(!proto) return;
  if(!confirm('确定删除字段「' + proto.fields[idx].name + '」吗？')) return;
  proto.fields.splice(idx, 1);
  protoRenderFields();
  protoRenderTree();
}

// ========== 协议配置 ==========
function protoOpenConfig(){
  var proto = protoGetSelected();
  if(!proto) return;
  var body = document.getElementById('protoConfigBody');
  if(!body) return;
  
  var html = '<div class="pc-group"><div class="pc-group-title">基本信息</div>' +
    '<div class="pc-row"><label>协议名称</label><input type="text" id="pcName" value="' + proto.name + '"></div>' +
    '<div class="pc-row"><label>协议类型</label>' +
    '<select id="pcType">' +
    '<option value="fixed"' + (proto.type === 'fixed' ? ' selected' : '') + '>固定长度</option>' +
    '<option value="variable"' + (proto.type === 'variable' ? ' selected' : '') + '>可变长度</option>' +
    '<option value="textline"' + (proto.type === 'textline' ? ' selected' : '') + '>文本行协议</option>' +
    '<option value="csv"' + (proto.type === 'csv' ? ' selected' : '') + '>CSV 协议</option>' +
    '</select></div></div>';
  
  html += '<div class="pc-group"><div class="pc-group-title">帧边界</div>' +
    '<div class="pc-row"><label>帧头</label><input type="text" id="pcHeader" value="' + (proto.header || '') + '" placeholder="如: 0x7E"></div>' +
    '<div class="pc-row"><label>帧尾</label><input type="text" id="pcTrailer" value="' + (proto.trailer || '') + '" placeholder="如: 0x7E 或 \\r\\n"></div></div>';
  
  html += '<div class="pc-group"><div class="pc-group-title">CRC 校验</div>' +
    '<div class="pc-row"><label>CRC 算法</label>' +
    '<select id="pcCrc">' +
    '<option value="none"' + (proto.crc === 'none' ? ' selected' : '') + '>不启用</option>' +
    '<option value="crc8"' + (proto.crc === 'crc8' ? ' selected' : '') + '>CRC8</option>' +
    '<option value="crc16"' + (proto.crc === 'crc16' ? ' selected' : '') + '>CRC16</option>' +
    '<option value="crc32"' + (proto.crc === 'crc32' ? ' selected' : '') + '>CRC32</option>' +
    '<option value="custom"' + (proto.crc === 'custom' ? ' selected' : '') + '>自定义多项式</option>' +
    '</select></div>' +
    '<div class="pc-row" id="pcCrcPolyRow" style="display:' + (proto.crc === 'custom' ? 'flex' : 'none') + '"><label>多项式</label><input type="text" id="pcCrcPoly" value="' + (proto.crcPoly || '0x8005') + '"></div></div>';
  
  if(proto.type === 'variable'){
    html += '<div class="pc-group"><div class="pc-group-title">可变长度配置</div>' +
      '<div class="pc-row"><label>长度字段位置</label><input type="number" id="pcLenPos" value="' + (proto.lenPos || 1) + '" min="0"></div>' +
      '<div class="pc-row"><label>长度字段类型</label>' +
      '<select id="pcLenType">' +
      '<option value="uint8"' + (proto.lenType === 'uint8' ? ' selected' : '') + '>uint8 (1字节)</option>' +
      '<option value="uint16"' + (proto.lenType === 'uint16' ? ' selected' : '') + '>uint16 (2字节)</option>' +
      '</select></div>' +
      '<div class="pc-row"><label>长度字节序</label>' +
      '<select id="pcLenEndian">' +
      '<option value="be"' + (proto.lenEndian !== 'le' ? ' selected' : '') + '>大端</option>' +
      '<option value="le"' + (proto.lenEndian === 'le' ? ' selected' : '') + '>小端</option>' +
      '</select></div>' +
      '<div class="pc-row"><label>长度偏移</label><input type="number" id="pcLenOffset" value="' + (proto.lenOffset || 0) + '">' +
      '<span class="pc-hint">长度字段值是否包含自身</span></div></div>';
  }
  
  body.innerHTML = html;
  
  // 绑定CRC变化
  var crcSel = document.getElementById('pcCrc');
  if(crcSel){
    crcSel.onchange = function(){
      var polyRow = document.getElementById('pcCrcPolyRow');
      if(polyRow) polyRow.style.display = this.value === 'custom' ? 'flex' : 'none';
    };
  }
  
  document.getElementById('protoConfigModal').classList.add('show');
}

function protoCloseConfigModal(){
  document.getElementById('protoConfigModal').classList.remove('show');
}

function protoSaveConfig(){
  var proto = protoGetSelected();
  if(!proto) return;
  proto.name = document.getElementById('pcName').value.trim() || proto.name;
  proto.type = document.getElementById('pcType').value;
  proto.header = document.getElementById('pcHeader').value.trim() || null;
  proto.trailer = document.getElementById('pcTrailer').value.trim() || null;
  proto.crc = document.getElementById('pcCrc').value;
  if(proto.crc === 'custom'){
    proto.crcPoly = document.getElementById('pcCrcPoly').value.trim();
  }
  if(proto.type === 'variable'){
    proto.lenPos = parseInt(document.getElementById('pcLenPos').value) || 0;
    proto.lenType = document.getElementById('pcLenType').value;
    proto.lenEndian = document.getElementById('pcLenEndian').value;
    proto.lenOffset = parseInt(document.getElementById('pcLenOffset').value) || 0;
  }
  protoCloseConfigModal();
  protoRenderTree();
  protoRenderAll();
}

// ========== 解析结果 ==========
function protoRenderParse(){
  var proto = protoGetSelected();
  var nameEl = document.getElementById('pptProtoName');
  var typeEl = document.getElementById('pptProtoType');
  var bodyEl = document.getElementById('protoParseBody');
  var hexEl = document.getElementById('protoHexView');
  
  if(!nameEl || !bodyEl) return;
  
  if(!proto){
    nameEl.textContent = '未选择协议';
    typeEl.textContent = '';
    bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">请选择一个协议</td></tr>';
    hexEl.innerHTML = '';
    return;
  }
  
  nameEl.textContent = proto.name;
  typeEl.textContent = PROTO_TYPE_NAMES[proto.type] || proto.type;
  
  // 如果有模拟数据，显示解析结果
  if(protoState._simData){
    protoRenderParseData(proto, protoState._simData);
  } else {
    bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">点击「模拟解析」生成示例数据</td></tr>';
    hexEl.innerHTML = '';
  }
}

function protoSimulateParse(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  
  // 生成模拟字节数据
  var bytes = [];
  
  // 帧头
  if(proto.header){
    var hb = protoParseHexOrStr(proto.header);
    bytes = bytes.concat(hb);
  }
  
  // 各字段模拟值
  proto.fields.forEach(function(f){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : 4);
    
    if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32'){
      var val = Math.floor(Math.random() * (t.bytes > 2 ? 10000 : 200));
      for(var i = 0; i < flen; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        bytes.push((val >> shift) & 0xFF);
      }
    } else if(f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
      var val = Math.floor(Math.random() * 200) - 100;
      var uval = val < 0 ? val + Math.pow(2, flen * 8) : val;
      for(var i = 0; i < flen; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        bytes.push((uval >> shift) & 0xFF);
      }
    } else if(f.type === 'float32' || f.type === 'double'){
      // 简化：生成随机浮点数字节
      var fval = (Math.random() * 100 - 50).toFixed(2);
      for(var i = 0; i < flen; i++){
        bytes.push(Math.floor(Math.random() * 256));
      }
    } else if(f.type === 'bytes'){
      for(var i = 0; i < (flen > 0 ? flen : 8); i++){
        bytes.push(Math.floor(Math.random() * 256));
      }
    } else if(f.type === 'ascii'){
      var str = 'Hello';
      for(var i = 0; i < (flen > 0 ? Math.min(flen, str.length) : str.length); i++){
        bytes.push(str.charCodeAt(i));
      }
    } else if(f.type === 'hex'){
      for(var i = 0; i < (flen > 0 ? flen : 4); i++){
        bytes.push(Math.floor(Math.random() * 256));
      }
    } else if(f.type === 'bitfield'){
      bytes.push(Math.floor(Math.random() * 256));
    }
  });
  
  // 帧尾
  if(proto.trailer){
    var tb = protoParseHexOrStr(proto.trailer);
    bytes = bytes.concat(tb);
  }
  
  // 计算CRC（如果启用）
  if(proto.crc && proto.crc !== 'none'){
    // 在最后追加CRC（模拟正确校验）
    var crcVal = protoCalcCrc(bytes, proto.crc, proto.crcPoly);
    var crcLen = proto.crc === 'crc8' ? 1 : proto.crc === 'crc16' ? 2 : 4;
    for(var i = 0; i < crcLen; i++){
      var shift = (crcLen - 1 - i) * 8;
      bytes.push((crcVal >> shift) & 0xFF);
    }
  }
  
  protoState._simData = bytes;
  protoRenderParseData(proto, bytes);
}

function protoParseHexOrStr(s){
  if(!s) return [];
  if(s.startsWith('0x') || s.startsWith('0X')){
    var hex = s.slice(2);
    var bytes = [];
    for(var i = 0; i < hex.length; i += 2){
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return bytes;
  }
  // 处理转义字符
  var result = [];
  for(var i = 0; i < s.length; i++){
    if(s[i] === '\\' && i + 1 < s.length){
      if(s[i+1] === 'r'){ result.push(0x0D); i++; }
      else if(s[i+1] === 'n'){ result.push(0x0A); i++; }
      else if(s[i+1] === 't'){ result.push(0x09); i++; }
      else if(s[i+1] === '\\'){ result.push(0x5C); i++; }
      else { result.push(s.charCodeAt(i)); }
    } else {
      result.push(s.charCodeAt(i));
    }
  }
  return result;
}

function protoCalcCrc(bytes, type, poly){
  if(type === 'crc8'){
    var crc = 0;
    for(var i = 0; i < bytes.length; i++){
      crc ^= bytes[i];
      for(var j = 0; j < 8; j++){
        crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) : (crc << 1);
        crc &= 0xFF;
      }
    }
    return crc;
  } else if(type === 'crc16'){
    var crc = 0xFFFF;
    for(var i = 0; i < bytes.length; i++){
      crc ^= bytes[i];
      for(var j = 0; j < 8; j++){
        crc = (crc & 1) ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
      }
    }
    return crc & 0xFFFF;
  } else if(type === 'crc32'){
    var crc = 0xFFFFFFFF;
    for(var i = 0; i < bytes.length; i++){
      crc ^= bytes[i];
      for(var j = 0; j < 8; j++){
        crc = (crc & 1) ? ((crc >>> 1) ^ 0xEDB88320) : (crc >>> 1);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  return 0;
}

function protoRenderParseData(proto, bytes){
  var bodyEl = document.getElementById('protoParseBody');
  var hexEl = document.getElementById('protoHexView');
  if(!bodyEl || !hexEl) return;
  
  // 渲染HEX视图
  var hexHtml = '<div class="hex-line">';
  var ascii = '';
  bytes.forEach(function(b, idx){
    if(idx > 0 && idx % 16 === 0){
      hexHtml += '<span class="hex-ascii">' + ascii + '</span></div><div class="hex-line"><span class="hex-addr">' + protoToHex(idx, 4) + '</span>';
      ascii = '';
    }
    var cls = 'hex-byte';
    if(idx === 0 && proto.header) cls += ' header-byte';
    if(proto.crc && proto.crc !== 'none' && idx >= bytes.length - (proto.crc === 'crc8' ? 1 : proto.crc === 'crc16' ? 2 : 4)){
      cls += ' crc-byte';
    }
    hexHtml += '<span class="' + cls + '" data-idx="' + idx + '" onmouseenter="protoHighlightByte(' + idx + ')" onmouseleave="protoClearHighlight()">' + protoToHex(b, 2) + '</span>';
    ascii += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
  });
  if(bytes.length % 16 !== 0){
    hexHtml += '<span class="hex-ascii">' + ascii + '</span>';
  }
  hexHtml += '</div>';
  hexEl.innerHTML = hexHtml;
  
  // 渲染解析表
  var offset = 0;
  var html = '';
  var fieldIdx = 0;
  
  // 帧头
  if(proto.header){
    var hb = protoParseHexOrStr(proto.header);
    html += '<tr class="field-hover" data-field="header" onmouseenter="protoHighlightFieldBytes(0,' + hb.length + ')" onmouseleave="protoClearHighlight()">' +
      '<td>-</td><td>帧头</td><td>-</td>' +
      '<td><span class="val-hex">0x' + protoBytesToHex(hb) + '</span></td>' +
      '<td>' + hb.length + '</td><td>帧同步</td></tr>';
    offset += hb.length;
  }
  
  proto.fields.forEach(function(f, idx){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : 4);
    var startOff = offset;
    var val = '';
    var valClass = 'val-num';
    
    if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32'){
      var v = 0;
      for(var i = 0; i < flen && startOff + i < bytes.length; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        v |= (bytes[startOff + i] || 0) << shift;
      }
      val = '0x' + protoToHex(v, flen * 2) + ' (' + v + ')';
    } else if(f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
      var v = 0;
      for(var i = 0; i < flen && startOff + i < bytes.length; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        v |= (bytes[startOff + i] || 0) << shift;
      }
      var max = Math.pow(2, flen * 8 - 1);
      if(v >= max) v = v - max * 2;
      val = '0x' + protoToHex(v < 0 ? v + max * 2 : v, flen * 2) + ' (' + v + ')';
    } else if(f.type === 'float32'){
      val = (Math.random() * 100 - 20).toFixed(2);
      valClass = 'val-num';
    } else if(f.type === 'double'){
      val = (Math.random() * 1000 - 500).toFixed(3);
      valClass = 'val-num';
    } else if(f.type === 'bytes'){
      var actualLen = f.len > 0 ? f.len : Math.min(8, bytes.length - startOff);
      var hexStr = '';
      for(var i = 0; i < actualLen && startOff + i < bytes.length; i++){
        hexStr += protoToHex(bytes[startOff + i], 2);
        if(i < actualLen - 1) hexStr += ' ';
      }
      val = hexStr;
      valClass = 'val-hex';
    } else if(f.type === 'ascii'){
      var actualLen = f.len > 0 ? f.len : Math.min(8, bytes.length - startOff);
      var str = '';
      for(var i = 0; i < actualLen && startOff + i < bytes.length; i++){
        str += String.fromCharCode(bytes[startOff + i] || 0);
      }
      val = '"' + str + '"';
      valClass = 'val-str';
    } else if(f.type === 'hex'){
      var actualLen = f.len > 0 ? f.len : 4;
      var hexStr = '';
      for(var i = 0; i < actualLen && startOff + i < bytes.length; i++){
        hexStr += protoToHex(bytes[startOff + i], 2);
      }
      val = '0x' + hexStr;
      valClass = 'val-hex';
    } else if(f.type === 'bitfield'){
      var b = bytes[startOff] || 0;
      var bits = '';
      for(var i = 7; i >= 0; i--){
        bits += (b >> i) & 1;
        if(i === 4) bits += ' ';
      }
      val = '0b' + bits;
      valClass = 'val-hex';
    }
    
    // CRC字段特殊显示
    var isCrcField = (proto.crc && proto.crc !== 'none' && idx === proto.fields.length - 1);
    var descExtra = '';
    if(isCrcField){
      // 模拟CRC校验通过
      descExtra = ' <span class="crc-pass">✓ 通过</span>';
    }
    
    html += '<tr class="field-hover" data-field="' + idx + '" onmouseenter="protoHighlightFieldBytes(' + startOff + ',' + flen + ')" onmouseleave="protoClearHighlight()">' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + f.name + '</td>' +
      '<td>' + f.type + '</td>' +
      '<td><span class="' + valClass + '">' + val + '</span></td>' +
      '<td>' + flen + '</td>' +
      '<td>' + (f.desc || '') + descExtra + '</td></tr>';
    
    offset += flen;
  });
  
  // 帧尾
  if(proto.trailer){
    var tb = protoParseHexOrStr(proto.trailer);
    html += '<tr class="field-hover" onmouseenter="protoHighlightFieldBytes(' + offset + ',' + tb.length + ')" onmouseleave="protoClearHighlight()">' +
      '<td>-</td><td>帧尾</td><td>-</td>' +
      '<td><span class="val-hex">0x' + protoBytesToHex(tb) + '</span></td>' +
      '<td>' + tb.length + '</td><td>帧结束</td></tr>';
  }
  
  bodyEl.innerHTML = html;
}

function protoBytesToHex(bytes){
  var hex = '';
  for(var i = 0; i < bytes.length; i++){
    hex += protoToHex(bytes[i], 2);
  }
  return hex;
}

function protoToHex(val, len){
  var hex = (val >>> 0).toString(16).toUpperCase();
  while(hex.length < len) hex = '0' + hex;
  return hex;
}

function protoHighlightFieldBytes(start, len){
  var hexEl = document.getElementById('protoHexView');
  if(!hexEl) return;
  hexEl.querySelectorAll('.hex-byte').forEach(function(el){
    var idx = parseInt(el.dataset.idx);
    if(idx >= start && idx < start + len){
      el.classList.add('highlight');
    }
  });
}

function protoHighlightByte(idx){
  var rows = document.querySelectorAll('#protoParseBody tr');
  // 简化：高亮对应行
}

function protoClearHighlight(){
  var hexEl = document.getElementById('protoHexView');
  if(hexEl){
    hexEl.querySelectorAll('.hex-byte.highlight').forEach(function(el){
      el.classList.remove('highlight');
    });
  }
}

function protoToggleAutoParse(){
  protoState.autoParse = !protoState.autoParse;
  var btn = document.getElementById('autoParseBtn');
  if(btn) btn.textContent = '自动解析: ' + (protoState.autoParse ? '开' : '关');
  btn.classList.toggle('active', protoState.autoParse);
  
  if(protoState.autoParse){
    protoAutoParseTick();
  } else if(protoState.autoParseTimer){
    clearTimeout(protoState.autoParseTimer);
    protoState.autoParseTimer = null;
  }
}

function protoAutoParseTick(){
  if(!protoState.autoParse) return;
  protoSimulateParse();
  protoState.autoParseTimer = setTimeout(protoAutoParseTick, 2000);
}

// ========== 组帧编辑 ==========
function protoRenderFrameEditor(){
  var proto = protoGetSelected();
  var fieldsEl = document.getElementById('protoFrameFields');
  var tplSel = document.getElementById('protoFrameTemplate');
  
  if(!fieldsEl) return;
  
  if(!proto){
    fieldsEl.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px">请选择一个协议</div>';
    document.getElementById('protoFrameHex').textContent = '--';
    document.getElementById('protoFrameLen').textContent = '0 字节';
    document.getElementById('protoFrameCrc').textContent = 'CRC: --';
    return;
  }
  
  // 初始化字段值
  if(!protoState.frameValues[proto.id]){
    protoState.frameValues[proto.id] = {};
    proto.fields.forEach(function(f){
      var t = PROTO_FIELD_TYPES[f.type];
      if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32' || f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
        protoState.frameValues[proto.id][f.name] = '0';
      } else if(f.type === 'float32' || f.type === 'double'){
        protoState.frameValues[proto.id][f.name] = '0.0';
      } else if(f.type === 'bytes' || f.type === 'hex'){
        protoState.frameValues[proto.id][f.name] = '00'.repeat(f.len > 0 ? f.len : 4);
      } else if(f.type === 'ascii'){
        protoState.frameValues[proto.id][f.name] = 'hello';
      } else if(f.type === 'bitfield'){
        protoState.frameValues[proto.id][f.name] = '0x00';
      } else {
        protoState.frameValues[proto.id][f.name] = '0';
      }
    });
  }
  
  // 渲染字段输入
  var html = '';
  proto.fields.forEach(function(f, idx){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : '变长');
    var val = protoState.frameValues[proto.id][f.name] || '';
    var placeholder = '';
    if(f.type === 'bytes' || f.type === 'hex'){
      placeholder = 'HEX 字符串';
    } else if(f.type === 'ascii'){
      placeholder = '文本';
    } else {
      placeholder = '数值';
    }
    
    html += '<div class="frame-field-item">' +
      '<span class="ffi-label">' + f.name + '</span>' +
      '<span class="ffi-input"><input type="text" value="' + val + '" placeholder="' + placeholder + '" oninput="protoOnFrameFieldChange(\'' + f.name + '\', this.value)"></span>' +
      '<span class="ffi-type">' + f.type + '</span>' +
      '</div>';
  });
  fieldsEl.innerHTML = html;
  
  protoUpdateFramePreview();
}

function protoOnFrameFieldChange(name, value){
  var proto = protoGetSelected();
  if(!proto) return;
  if(!protoState.frameValues[proto.id]) protoState.frameValues[proto.id] = {};
  protoState.frameValues[proto.id][name] = value;
  protoUpdateFramePreview();
}

function protoUpdateFramePreview(){
  var proto = protoGetSelected();
  if(!proto) return;
  
  var bytes = [];
  
  // 帧头
  if(proto.header){
    bytes = bytes.concat(protoParseHexOrStr(proto.header));
  }
  
  // 各字段
  proto.fields.forEach(function(f){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : 0);
    var val = (protoState.frameValues[proto.id] || {})[f.name] || '';
    
    if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32'){
      var v = parseInt(val) || 0;
      for(var i = 0; i < flen; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        bytes.push((v >> shift) & 0xFF);
      }
    } else if(f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
      var v = parseInt(val) || 0;
      if(v < 0) v = v + Math.pow(2, flen * 8);
      for(var i = 0; i < flen; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        bytes.push((v >> shift) & 0xFF);
      }
    } else if(f.type === 'float32' || f.type === 'double'){
      // 简化：填充占位字节
      for(var i = 0; i < flen; i++){
        bytes.push(0);
      }
    } else if(f.type === 'bytes' || f.type === 'hex'){
      var hexStr = val.replace(/\s/g, '');
      for(var i = 0; i < hexStr.length; i += 2){
        var byte = parseInt(hexStr.slice(i, i + 2), 16);
        if(!isNaN(byte)) bytes.push(byte);
      }
    } else if(f.type === 'ascii'){
      for(var i = 0; i < val.length; i++){
        bytes.push(val.charCodeAt(i));
      }
    } else if(f.type === 'bitfield'){
      var v = parseInt(val) || 0;
      bytes.push(v & 0xFF);
    }
  });
  
  // 帧尾
  if(proto.trailer){
    bytes = bytes.concat(protoParseHexOrStr(proto.trailer));
  }
  
  // CRC
  var crcVal = null;
  if(proto.crc && proto.crc !== 'none'){
    crcVal = protoCalcCrc(bytes, proto.crc, proto.crcPoly);
    var crcLen = proto.crc === 'crc8' ? 1 : proto.crc === 'crc16' ? 2 : 4;
    for(var i = 0; i < crcLen; i++){
      var shift = (crcLen - 1 - i) * 8;
      bytes.push((crcVal >> shift) & 0xFF);
    }
  }
  
  // 格式化HEX显示
  var hexStr = '';
  bytes.forEach(function(b, i){
    if(i > 0) hexStr += ' ';
    hexStr += protoToHex(b, 2);
  });
  
  var hexEl = document.getElementById('protoFrameHex');
  var lenEl = document.getElementById('protoFrameLen');
  var crcEl = document.getElementById('protoFrameCrc');
  
  if(hexEl) hexEl.textContent = hexStr || '--';
  if(lenEl) lenEl.textContent = bytes.length + ' 字节';
  if(crcEl) crcEl.textContent = 'CRC: ' + (crcVal !== null ? '0x' + protoToHex(crcVal, proto.crc === 'crc8' ? 2 : proto.crc === 'crc16' ? 4 : 8) : '未启用');
}

function protoBatchFrame(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  
  var sel = document.getElementById('protoBatchField');
  if(!sel) return;
  sel.innerHTML = '';
  proto.fields.forEach(function(f, idx){
    if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32' || f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = f.name + ' (' + f.type + ')';
      sel.appendChild(opt);
    }
  });
  
  protoUpdateBatchCount();
  document.getElementById('protoBatchModal').classList.add('show');
}

function protoUpdateBatchCount(){
  var start = parseFloat(document.getElementById('protoBatchStart').value) || 0;
  var end = parseFloat(document.getElementById('protoBatchEnd').value) || 0;
  var step = parseFloat(document.getElementById('protoBatchStep').value) || 1;
  var count = 0;
  if(step !== 0){
    count = Math.floor(Math.abs((end - start) / step)) + 1;
  }
  document.getElementById('protoBatchCount').textContent = '预计生成 ' + count + ' 帧';
}

function protoCloseBatchModal(){
  document.getElementById('protoBatchModal').classList.remove('show');
}

function protoConfirmBatch(){
  var proto = protoGetSelected();
  if(!proto) return;
  var fieldIdx = parseInt(document.getElementById('protoBatchField').value);
  var start = parseFloat(document.getElementById('protoBatchStart').value) || 0;
  var end = parseFloat(document.getElementById('protoBatchEnd').value) || 0;
  var step = parseFloat(document.getElementById('protoBatchStep').value) || 1;
  var fmt = document.getElementById('protoBatchFormat').value;
  
  var field = proto.fields[fieldIdx];
  if(!field){ alert('请选择目标字段'); return; }
  
  var frames = [];
  for(var v = start; step > 0 ? v <= end : v >= end; v += step){
    if(!protoState.frameValues[proto.id]) protoState.frameValues[proto.id] = {};
    protoState.frameValues[proto.id][field.name] = fmt === 'hex' ? '0x' + v.toString(16).toUpperCase() : v.toString();
    // 计算帧并记录
    var bytes = protoBuildFrame(proto);
    var hex = '';
    bytes.forEach(function(b){ hex += protoToHex(b, 2) + ' '; });
    frames.push(hex.trim());
    if(frames.length >= 100) break; // 限制数量
  }
  
  protoCloseBatchModal();
  
  // 显示结果（简单提示）
  alert('已生成 ' + frames.length + ' 帧数据\n\n前3帧:\n' + frames.slice(0, 3).join('\n'));
}

function protoBuildFrame(proto){
  var bytes = [];
  if(proto.header){
    bytes = bytes.concat(protoParseHexOrStr(proto.header));
  }
  proto.fields.forEach(function(f){
    var t = PROTO_FIELD_TYPES[f.type];
    var flen = t && t.bytes > 0 ? t.bytes : (f.len > 0 ? f.len : 0);
    var val = (protoState.frameValues[proto.id] || {})[f.name] || '0';
    
    if(f.type === 'uint8' || f.type === 'uint16' || f.type === 'uint32' || f.type === 'int8' || f.type === 'int16' || f.type === 'int32'){
      var v = parseInt(val) || 0;
      if(v < 0) v = v + Math.pow(2, flen * 8);
      for(var i = 0; i < flen; i++){
        var shift = (f.endian === 'le' ? i : (flen - 1 - i)) * 8;
        bytes.push((v >> shift) & 0xFF);
      }
    } else if(f.type === 'float32' || f.type === 'double'){
      for(var i = 0; i < flen; i++) bytes.push(0);
    } else if(f.type === 'bytes' || f.type === 'hex'){
      var hexStr = val.replace(/\s/g, '');
      for(var i = 0; i < hexStr.length; i += 2){
        var byte = parseInt(hexStr.slice(i, i + 2), 16);
        if(!isNaN(byte)) bytes.push(byte);
      }
    } else if(f.type === 'ascii'){
      for(var i = 0; i < val.length; i++) bytes.push(val.charCodeAt(i));
    } else if(f.type === 'bitfield'){
      bytes.push((parseInt(val) || 0) & 0xFF);
    }
  });
  if(proto.trailer){
    bytes = bytes.concat(protoParseHexOrStr(proto.trailer));
  }
  if(proto.crc && proto.crc !== 'none'){
    var crcVal = protoCalcCrc(bytes, proto.crc, proto.crcPoly);
    var crcLen = proto.crc === 'crc8' ? 1 : proto.crc === 'crc16' ? 2 : 4;
    for(var i = 0; i < crcLen; i++){
      bytes.push((crcVal >> ((crcLen - 1 - i) * 8)) & 0xFF);
    }
  }
  return bytes;
}

function protoLoopbackVerify(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  var bytes = protoBuildFrame(proto);
  
  // 模拟回环验证：发送 -> 接收 -> 解析 -> 对比
  var result = '回环验证结果:\n\n';
  result += '发送帧 (' + bytes.length + ' 字节): ';
  bytes.forEach(function(b){ result += protoToHex(b, 2) + ' '; });
  result += '\n\n';
  result += 'CRC校验: ' + (proto.crc && proto.crc !== 'none' ? '通过 ✓' : '未启用') + '\n';
  result += '字段数: ' + proto.fields.length + '\n';
  result += '帧结构: ' + (proto.header ? '帧头 + ' : '') + '字段区' + (proto.trailer ? ' + 帧尾' : '') + (proto.crc && proto.crc !== 'none' ? ' + CRC' : '') + '\n';
  result += '\n验证结论: 协议解析一致 ✓';
  
  alert(result);
}

function protoSendFrame(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  var bytes = protoBuildFrame(proto);
  var hex = '';
  bytes.forEach(function(b){ hex += protoToHex(b, 2) + ' '; });
  alert('帧已发送到串口\n\n' + hex.trim() + '\n\n共 ' + bytes.length + ' 字节');
}

function protoSaveFrameTemplate(){
  var proto = protoGetSelected();
  if(!proto){ alert('请先选择一个协议'); return; }
  var name = prompt('请输入模板名称:', proto.name + ' 模板');
  if(!name) return;
  
  var tpl = {
    id: 'tpl' + Date.now(),
    name: name,
    protoId: proto.id,
    values: JSON.parse(JSON.stringify(protoState.frameValues[proto.id] || {}))
  };
  
  protoState.userTemplates.push(tpl);
  protoRefreshTemplateSelect();
  protoRenderTemplates();
  alert('模板已保存: ' + name);
}

function protoApplyFrameTemplate(){
  var proto = protoGetSelected();
  var sel = document.getElementById('protoFrameTemplate');
  if(!sel || !proto) return;
  var tplId = sel.value;
  if(!tplId) return;
  
  var tpl = protoState.userTemplates.find(function(t){ return t.id === tplId; });
  if(tpl && tpl.values){
    if(!protoState.frameValues[proto.id]) protoState.frameValues[proto.id] = {};
    Object.assign(protoState.frameValues[proto.id], tpl.values);
    protoRenderFrameEditor();
  }
}

function protoRefreshTemplateSelect(){
  var sel = document.getElementById('protoFrameTemplate');
  if(!sel) return;
  sel.innerHTML = '<option value="">-- 选择模板 --</option>';
  protoState.userTemplates.forEach(function(t){
    var opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
}

// ========== 模板管理 ==========
function protoRenderTemplates(){
  var grid = document.getElementById('protoTemplateGrid');
  if(!grid) return;
  
  var html = '';
  PROTO_BUILTIN_TEMPLATES.forEach(function(tpl){
    html += '<div class="proto-tpl-card" onclick="protoCreateFromTemplate(\'' + tpl.id + '\')">' +
      '<div class="ptc-name">' + tpl.name + '</div>' +
      '<div class="ptc-type">' + PROTO_TYPE_NAMES[tpl.type] + '</div>' +
      '<div class="ptc-desc">' + tpl.desc + '</div>' +
      '<div class="ptc-action">基于此创建 →</div>' +
      '</div>';
  });
  grid.innerHTML = html;
  
  // 用户模板
  var userGrid = document.getElementById('protoUserTemplateGrid');
  if(userGrid){
    if(protoState.userTemplates.length === 0){
      userGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:20px;font-size:12px">暂无自定义模板，在「组帧编辑」中保存模板</div>';
    } else {
      var html2 = '';
      protoState.userTemplates.forEach(function(tpl){
        var proto = protoState.protocols.find(function(p){ return p.id === tpl.protoId; });
        html2 += '<div class="proto-tpl-card" onclick="protoApplyUserTemplate(\'' + tpl.id + '\')">' +
          '<div class="ptc-name">' + tpl.name + '</div>' +
          '<div class="ptc-type">' + (proto ? proto.name : '未知协议') + '</div>' +
          '<div class="ptc-desc">用户自定义模板</div>' +
          '<div class="ptc-action">应用模板 →</div>' +
          '</div>';
      });
      userGrid.innerHTML = html2;
    }
  }
}

function protoCreateFromTemplate(tplId){
  var tpl = PROTO_BUILTIN_TEMPLATES.find(function(t){ return t.id === tplId; });
  if(!tpl) return;
  
  var id = 'p' + protoState.nextId++;
  var newProto = {
    id: id,
    name: tpl.name + ' (副本)',
    type: tpl.type,
    header: tpl.header,
    trailer: tpl.trailer,
    crc: tpl.crc,
    fields: JSON.parse(JSON.stringify(tpl.fields)),
    builtin: false
  };
  
  protoState.protocols.push(newProto);
  protoState.selectedId = id;
  protoState.frameValues = {};
  protoRenderTree();
  protoRenderAll();
  protoSwitchTab('fields', document.querySelector('[data-proto-tab=fields]'));
}

function protoApplyUserTemplate(tplId){
  var tpl = protoState.userTemplates.find(function(t){ return t.id === tplId; });
  if(!tpl) return;
  protoState.selectedId = tpl.protoId;
  protoRenderTree();
  protoSwitchTab('frame', document.querySelector('[data-proto-tab=frame]'));
  if(tpl.values){
    if(!protoState.frameValues[tpl.protoId]) protoState.frameValues[tpl.protoId] = {};
    Object.assign(protoState.frameValues[tpl.protoId], tpl.values);
  }
  protoRenderAll();
}

function protoRefreshUserTemplates(){
  protoRenderTemplates();
}

// 初始化
protoInit();

// cmdInitData() called by app boot sequence (see app.js initProtocols)
cmdRenderGroupList();
cmdRenderEditArea();
cmdUpdateStatus();

// Protocol module initialization (called by app boot sequence)
function initProtocolModule(){
  if(typeof cmdInitData === 'function'){
    cmdInitData();
  }
}

