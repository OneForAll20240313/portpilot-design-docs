// assets/charts.js  — 产品功能清单 v3 图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent  = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink    = style.getPropertyValue('--ink').trim();
  var muted  = style.getPropertyValue('--muted').trim();
  var rule   = style.getPropertyValue('--rule').trim();
  var bg2    = style.getPropertyValue('--bg2').trim();

  // --- 图1：各工具串口功能覆盖广度（横向对比） ---
  var c1 = document.getElementById('chart-coverage');
  if (c1) {
    var chart1 = echarts.init(c1, null, { renderer: 'svg' });
    chart1.setOption({
      animation: false,
      grid: { left: 10, right: 40, top: 14, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', appendToBody: true },
      xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'category', inverse: true,
        data: ['串口猎人', 'MobaXterm', 'SecureCRT', 'SSCOM', 'QCOM', 'cutecom', 'picocom', 'minicom'],
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 12 } },
      series: [{
        type: 'bar', barWidth: '55%',
        data: [100, 88, 92, 84, 78, 70, 55, 62],
        itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: muted, formatter: '{c}%' }
      }]
    });
    window.addEventListener('resize', function () { chart1.resize(); });
  }

  // --- 图2：功能域覆盖（雷达） ---
  var c2 = document.getElementById('chart-radar');
  if (c2) {
    var chart2 = echarts.init(c2, null, { renderer: 'svg' });
    var indicators = [
      { name: '收发/显示', max: 100 },
      { name: '协议框架', max: 100 },
      { name: '命令自动化', max: 100 },
      { name: '可视化扩展', max: 100 },
      { name: '多设备', max: 100 },
      { name: 'Web/TUI', max: 100 }
    ];
    chart2.setOption({
      animation: false,
      tooltip: { appendToBody: true },
      radar: {
        indicator: indicators,
        radius: '62%',
        axisName: { color: ink, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      color: [accent, accent2, muted],
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{
        type: 'radar',
        data: [
          { value: [100, 100, 100, 100, 85, 95], name: 'SuperConnect 目标', areaStyle: { color: accent, opacity: 0.18 } },
          { value: [90, 40, 55, 30, 40, 20], name: '典型 GUI 助手', areaStyle: { color: accent2, opacity: 0.12 } },
          { value: [70, 15, 45, 10, 20, 15], name: 'minicom/picocom', areaStyle: { color: muted, opacity: 0.10 } }
        ]
      }]
    });
    window.addEventListener('resize', function () { chart2.resize(); });
  }
})();