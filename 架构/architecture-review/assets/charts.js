(function() {
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();
    var bg2 = style.getPropertyValue('--bg2').trim();
    var danger = style.getPropertyValue('--danger').trim();
    var warn = style.getPropertyValue('--warn').trim();

    // --- Chart 1: Quality Radar ---
    var radarEl = document.getElementById('chart-radar');
    if (radarEl) {
        var radar = echarts.init(radarEl, null, { renderer: 'svg' });
        radar.setOption({
            animation: false,
            tooltip: {
                trigger: 'item',
                appendToBody: true,
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink }
            },
            radar: {
                indicator: [
                    { name: '命名规范', max: 10 },
                    { name: '内存管理', max: 10 },
                    { name: '线程安全', max: 10 },
                    { name: '错误处理', max: 10 },
                    { name: '代码复用', max: 10 },
                    { name: '可测试性', max: 10 }
                ],
                center: ['50%', '55%'],
                radius: '68%',
                axisName: {
                    color: ink,
                    fontSize: 13,
                    fontWeight: 600
                },
                splitLine: {
                    lineStyle: { color: rule, width: 1 }
                },
                splitArea: {
                    areaStyle: {
                        color: ['rgba(122,162,247,0.02)', 'rgba(122,162,247,0.05)']
                    }
                },
                axisLine: {
                    lineStyle: { color: rule }
                }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: [3, 5, 6, 6, 7, 1],
                    name: '当前评分',
                    areaStyle: {
                        color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                            { offset: 0, color: 'rgba(122,162,247,0.25)' },
                            { offset: 1, color: 'rgba(122,162,247,0.05)' }
                        ])
                    },
                    lineStyle: {
                        color: accent,
                        width: 2
                    },
                    itemStyle: {
                        color: accent,
                        borderColor: accent,
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        color: ink,
                        fontSize: 13,
                        fontWeight: 700,
                        formatter: function(params) {
                            return params.value;
                        }
                    }
                }]
            }]
        });
        window.addEventListener('resize', function() { radar.resize(); });
    }

    // --- Chart 2: Issue Priority Scatter ---
    var scatterEl = document.getElementById('chart-scatter');
    if (scatterEl) {
        var scatter = echarts.init(scatterEl, null, { renderer: 'svg' });
        scatter.setOption({
            animation: false,
            tooltip: {
                trigger: 'item',
                appendToBody: true,
                backgroundColor: bg2,
                borderColor: rule,
                textStyle: { color: ink, fontSize: 13 },
                formatter: function(params) {
                    return '<b>' + params.data[3] + '</b><br/>影响: ' + params.data[0] + '/10<br/>难度: ' + params.data[1] + '/10<br/>优先级: ' + params.data[4];
                }
            },
            grid: {
                left: 60,
                right: 30,
                top: 30,
                bottom: 50
            },
            xAxis: {
                name: '影响程度 →',
                nameLocation: 'middle',
                nameGap: 30,
                nameTextStyle: { color: muted, fontSize: 12 },
                min: 0,
                max: 11,
                splitLine: { lineStyle: { color: rule, type: 'dashed' } },
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted }
            },
            yAxis: {
                name: '↑ 实施难度',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: { color: muted, fontSize: 12 },
                min: 0,
                max: 11,
                splitLine: { lineStyle: { color: rule, type: 'dashed' } },
                axisLine: { lineStyle: { color: rule } },
                axisLabel: { color: muted }
            },
            series: [
                {
                    name: 'P0 紧急',
                    type: 'scatter',
                    symbolSize: 22,
                    data: [
                        [9, 2, 'P0', '缓冲区覆盖丢包', 'P0'],
                        [9, 2.5, 'P0', '缺少断线检测', 'P0']
                    ],
                    itemStyle: { color: danger, opacity: 0.85, borderColor: danger, borderWidth: 1 },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) { return params.data[3]; },
                        color: ink,
                        fontSize: 11,
                        offset: [6, 0]
                    }
                },
                {
                    name: 'P1 高',
                    type: 'scatter',
                    symbolSize: 18,
                    data: [
                        [8, 6, 'P1', '拆分 God Class', 'P1'],
                        [5, 1.5, 'P1', '方法重命名', 'P1'],
                        [6, 2, 'P1', '参数持久化', 'P1'],
                        [3, 0.5, 'P1', '版本号硬编码', 'P1']
                    ],
                    itemStyle: { color: warn, opacity: 0.85, borderColor: warn, borderWidth: 1 },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) { return params.data[3]; },
                        color: ink,
                        fontSize: 11,
                        offset: [6, 0]
                    }
                },
                {
                    name: 'P2 中',
                    type: 'scatter',
                    symbolSize: 16,
                    data: [
                        [5, 4, 'P2', '写超时确认', 'P2'],
                        [1, 0.5, 'P2', '移除 patch::to_string', 'P2'],
                        [2, 2, 'P2', 'SIGNAL/SLOT 现代化', 'P2'],
                        [4, 2, 'P2', '智能指针替代', 'P2'],
                        [6, 4, 'P2', '编码选择', 'P2'],
                        [5, 1.5, 'P2', 'DTR/RTS 控制', 'P2']
                    ],
                    itemStyle: { color: accent, opacity: 0.85, borderColor: accent, borderWidth: 1 },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) { return params.data[3]; },
                        color: ink,
                        fontSize: 11,
                        offset: [6, 0]
                    }
                },
                {
                    name: 'P3 低',
                    type: 'scatter',
                    symbolSize: 14,
                    data: [
                        [7, 5, 'P3', '单元测试', 'P3'],
                        [5, 8, 'P3', '多会话支持', 'P3'],
                        [4, 7, 'P3', '数据波形图', 'P3']
                    ],
                    itemStyle: { color: accent2, opacity: 0.85, borderColor: accent2, borderWidth: 1 },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) { return params.data[3]; },
                        color: ink,
                        fontSize: 11,
                        offset: [6, 0]
                    }
                }
            ],
            legend: {
                show: true,
                bottom: 0,
                textStyle: { color: muted, fontSize: 12 },
                itemWidth: 14,
                itemHeight: 14
            }
        });
        window.addEventListener('resize', function() { scatter.resize(); });
    }
})();
