/* solucion.js — Página de resultados Simplex (vanilla JS) */
(function (w) {
    'use strict';

    /* ════════════════════════════════════════════
       ESTADO
    ════════════════════════════════════════════ */
    var _iteraciones = [];
    var _restricciones = [];
    var _indice = 0;
    var _direccion = 'down';   // 'down' | 'up'
    var _visibles = 1;         // modo sin gráfico: cuántas iteraciones mostrar
    var _vars = [];            // variables de decisión (no S, no A)
    var _conGrafico = false;
    var _empate = null;        // objeto {tipo, candidatos} o null
    var _elecciones = [];      // elecciones acumuladas hasta este momento

    /* ════════════════════════════════════════════
       UTILIDADES NUMÉRICAS
    ════════════════════════════════════════════ */
    function fmt(n) {
        return Number(n.toFixed(4)).toString();
    }

    function valorBFS(nombre, iter) {
        var i = iter.columna_base.indexOf(nombre);
        return i === -1 ? 0 : iter.columna_vld[i];
    }

    /* Color de restricción — fórmula única usada tanto en el SVG como en la leyenda */
    function colorRestriccion(i) {
        return 'hsl(' + ((i * 67 + 200) % 360) + ',65%,40%)';
    }

    /* ════════════════════════════════════════════
       MATEMÁTICAS DEL GRÁFICO
    ════════════════════════════════════════════ */
    function coef(r, nombre) {
        var t = r.funcion_restricciones.find(function (t) { return t.variable === nombre; });
        return t ? t.coeficiente : 0;
    }

    function resolverSistema(a1, b1, c1, a2, b2, c2) {
        var d = a1 * b2 - a2 * b1;
        if (Math.abs(d) < 1e-10) return null;
        return [(c1 * b2 - c2 * b1) / d, (a1 * c2 - a2 * c1) / d];
    }

    function esFeasible(x, y) {
        if (x < -1e-9 || y < -1e-9) return false;
        return _restricciones.every(function (r) {
            var lhs = coef(r, 'x1') * x + coef(r, 'x2') * y;
            var rhs = r.valor_lado_derecho;
            var op = r.operador;
            /* acepta el valor del enum Python ("<=", ">=", "=") y los alias TypeScript */
            var esLE = op === '<=' || op === 'menor_igual' || op === 'MENOR_IGUAL' || op === '<'  || op === 'MENOR';
            var esGE = op === '>=' || op === 'mayor_igual' || op === 'MAYOR_IGUAL' || op === '>'  || op === 'MAYOR';
            if (esLE) return lhs <= rhs + 1e-9;
            if (esGE) return lhs >= rhs - 1e-9;
            return Math.abs(lhs - rhs) < 1e-9;
        });
    }

    function ordenarAngulo(pts) {
        if (!pts.length) return [];
        var cx = pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length;
        var cy = pts.reduce(function (s, p) { return s + p[1]; }, 0) / pts.length;
        return pts.slice().sort(function (a, b) {
            return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx);
        });
    }

    function verticesFactibles() {
        var lineas = _restricciones.map(function (r) {
            return { a: coef(r, 'x1'), b: coef(r, 'x2'), c: r.valor_lado_derecho };
        });
        lineas.push({ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 });

        var cands = [];
        for (var i = 0; i < lineas.length; i++) {
            for (var j = i + 1; j < lineas.length; j++) {
                var p = resolverSistema(
                    lineas[i].a, lineas[i].b, lineas[i].c,
                    lineas[j].a, lineas[j].b, lineas[j].c
                );
                if (p && esFeasible(p[0], p[1])) cands.push(p);
            }
        }
        return ordenarAngulo(cands);
    }

    function todasIntersecciones(maxX, maxY) {
        var lineas = _restricciones.map(function (r) {
            return { a: coef(r, 'x1'), b: coef(r, 'x2'), c: r.valor_lado_derecho };
        });
        lineas.push({ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 });

        var res = [];
        for (var i = 0; i < lineas.length; i++) {
            for (var j = i + 1; j < lineas.length; j++) {
                var p = resolverSistema(
                    lineas[i].a, lineas[i].b, lineas[i].c,
                    lineas[j].a, lineas[j].b, lineas[j].c
                );
                if (p && p[0] >= -1e-9 && p[1] >= -1e-9 && p[0] <= maxX + 1e-9 && p[1] <= maxY + 1e-9) {
                    res.push([Math.max(0, p[0]), Math.max(0, p[1])]);
                }
            }
        }
        /* deduplicar */
        return res.filter(function (p, i) {
            return !res.slice(0, i).some(function (q) {
                return Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6;
            });
        });
    }

    /* ════════════════════════════════════════════
       GRÁFICO SVG
       Tema blanco: región factible en azul suave,
       restricciones en HSL, función objetivo en
       dorado discontinuo, punto óptimo en dorado
       con tooltip SVG al hacer hover.
    ════════════════════════════════════════════ */
    function construirGrafico(bfs, indiceIter, zValue, c1, c2) {
        var SIZE = 400;
        var mg = { t: 20, r: 20, b: 44, l: 52 };
        var pw = SIZE - mg.l - mg.r;
        var ph = SIZE - mg.t - mg.b;

        var verts = verticesFactibles();

        var cxArr = [], cyArr = [];
        _restricciones.forEach(function (r) {
            var a1 = coef(r, 'x1'), a2 = coef(r, 'x2'), b = r.valor_lado_derecho;
            if (Math.abs(a1) > 1e-10 && b / a1 >= 0) cxArr.push(b / a1);
            if (Math.abs(a2) > 1e-10 && b / a2 >= 0) cyArr.push(b / a2);
        });

        var allX = verts.map(function (v) { return v[0]; }).concat([bfs.x1].concat(cxArr));
        var allY = verts.map(function (v) { return v[1]; }).concat([bfs.x2].concat(cyArr));
        var maxX = Math.max.apply(null, allX.concat([1])) * 1.25;
        var maxY = Math.max.apply(null, allY.concat([1])) * 1.25;

        function px(x) { return mg.l + (x / maxX) * pw; }
        function py(y) { return mg.t + ph - (y / maxY) * ph; }

        var NS = 'http://www.w3.org/2000/svg';
        function el(tag, attrs, txt) {
            var e = document.createElementNS(NS, tag);
            if (attrs) {
                Object.keys(attrs).forEach(function (k) { e.setAttribute(k, String(attrs[k])); });
            }
            if (txt !== undefined) e.textContent = txt;
            return e;
        }

        var svg = el('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, width: '100%' });
        svg.style.display = 'block';
        svg.style.aspectRatio = '1';

        /* Fondo blanco */
        svg.appendChild(el('rect', { x: 0, y: 0, width: SIZE, height: SIZE, fill: '#FAFAF9', rx: 8 }));

        /* Grid — cream muy suave sobre blanco */
        var N = 5;
        for (var g = 0; g <= N; g++) {
            var gx = mg.l + (g / N) * pw;
            var gy = mg.t + (g / N) * ph;
            svg.appendChild(el('line', { x1: gx, y1: mg.t,       x2: gx,        y2: mg.t + ph, stroke: '#EDE8DF', 'stroke-width': 0.8 }));
            svg.appendChild(el('line', { x1: mg.l, y1: gy,       x2: mg.l + pw, y2: gy,        stroke: '#EDE8DF', 'stroke-width': 0.8 }));
        }

        /* Ejes — navy */
        svg.appendChild(el('line', { x1: px(0), y1: py(0), x2: px(maxX), y2: py(0),    stroke: '#1B2A4A', 'stroke-width': 1.2 }));
        svg.appendChild(el('line', { x1: px(0), y1: py(0), x2: px(0),    y2: py(maxY), stroke: '#1B2A4A', 'stroke-width': 1.2 }));

        /* Marcas en ejes — texto oscuro sobre blanco */
        for (var t = 0; t <= N; t++) {
            var xv = (t / N) * maxX, yv = (t / N) * maxY;
            svg.appendChild(el('text', { x: px(xv), y: py(0) + 14, 'text-anchor': 'middle', fill: '#4A5568', 'font-size': 9, 'font-family': 'Inter,sans-serif' }, Number(xv.toFixed(1)).toString()));
            if (t > 0) {
                svg.appendChild(el('text', { x: px(0) - 5, y: py(yv) + 3, 'text-anchor': 'end', fill: '#4A5568', 'font-size': 9, 'font-family': 'Inter,sans-serif' }, Number(yv.toFixed(1)).toString()));
            }
        }

        /* Etiquetas ejes — gris medio */
        svg.appendChild(el('text', { x: mg.l + pw / 2, y: SIZE - 5, 'text-anchor': 'middle', fill: '#6B7280', 'font-size': 11, 'font-family': 'Inter,sans-serif' }, 'x₁'));
        var lx2 = el('text', { x: 12, y: mg.t + ph / 2, 'text-anchor': 'middle', fill: '#6B7280', 'font-size': 11, 'font-family': 'Inter,sans-serif', transform: 'rotate(-90,12,' + (mg.t + ph / 2) + ')' }, 'x₂');
        svg.appendChild(lx2);

        /* Polígono región factible — azul suave */
        if (verts.length >= 3) {
            svg.appendChild(el('polygon', {
                points: verts.map(function (v) { return px(v[0]) + ',' + py(v[1]); }).join(' '),
                fill: 'rgba(59, 130, 246, 0.10)', stroke: 'rgba(59, 130, 246, 0.38)', 'stroke-width': 1.5
            }));
        }

        /* Líneas de restricciones — colores HSL sobre blanco (más oscuros que en tema dark) */
        _restricciones.forEach(function (r, i) {
            var color = colorRestriccion(i);
            var pts = null;

            var a1 = coef(r, 'x1'), a2 = coef(r, 'x2'), b = r.valor_lado_derecho;
            if (Math.abs(a2) > 1e-10) {
                var yi = b / a2;
                var xi = Math.abs(a1) > 1e-10 ? b / a1 : null;
                pts = (xi !== null && xi >= 0 && yi >= 0)
                    ? [[0, yi], [xi, 0]]
                    : [[0, Math.max(0, yi)], [maxX, (b - a1 * maxX) / a2]];
            } else if (Math.abs(a1) > 1e-10) {
                var xk = b / a1;
                pts = [[xk, 0], [xk, maxY]];
            }

            if (pts) {
                svg.appendChild(el('line', {
                    x1: px(pts[0][0]), y1: py(pts[0][1]),
                    x2: px(pts[1][0]), y2: py(pts[1][1]),
                    stroke: color, 'stroke-width': 1.6, 'stroke-dasharray': '5,3.5'
                }));
            }
        });

        /* Función objetivo Z* — línea dorada discontinua */
        if (Math.abs(c1) > 1e-10 || Math.abs(c2) > 1e-10) {
            var objPts = null;
            if (Math.abs(c2) > 1e-10) {
                /* y-intercept en x1=0, x-intercept en x2=0 */
                var y0Obj = zValue / c2;
                var x0Obj = Math.abs(c1) > 1e-10 ? zValue / c1 : maxX;
                var y1Obj = Math.abs(c1) > 1e-10 ? 0 : (zValue - c1 * maxX) / c2;
                objPts = [[0, y0Obj], [x0Obj, y1Obj]];
            } else if (Math.abs(c1) > 1e-10) {
                var xVObj = zValue / c1;
                objPts = [[xVObj, 0], [xVObj, maxY]];
            }
            if (objPts) {
                svg.appendChild(el('line', {
                    x1: px(objPts[0][0]), y1: py(objPts[0][1]),
                    x2: px(objPts[1][0]), y2: py(objPts[1][1]),
                    stroke: '#C8A96E', 'stroke-width': 1.8, 'stroke-dasharray': '6,4',
                    opacity: 0.9
                }));
            }
        }

        /* Etiquetas de intersecciones — texto navy sobre blanco */
        todasIntersecciones(maxX, maxY).forEach(function (pt) {
            var x = pt[0], y = pt[1];
            var bx = px(x), by = py(y);
            var nearRight  = x > maxX * 0.78;
            var nearBottom = y < maxY * 0.08;
            var ox = nearRight  ? -6 : 6;
            var oy = nearBottom ? -14 : 12;
            var anchor = nearRight ? 'end' : 'start';

            svg.appendChild(el('circle', { cx: bx, cy: by, r: 3, fill: 'rgba(27, 42, 74, 0.35)' }));
            var tLabel = el('text', {
                x: bx + ox, y: by + oy,
                'text-anchor': anchor,
                fill: '#1B2A4A',
                'font-size': 9, 'font-family': 'Inter,sans-serif',
                'paint-order': 'stroke',
                stroke: '#FAFAF9', 'stroke-width': 2.5, 'stroke-linejoin': 'round'
            }, '(' + Number(x.toFixed(2)) + ', ' + Number(y.toFixed(2)) + ')');
            svg.appendChild(tLabel);
        });

        /* Punto óptimo — círculo dorado con halo + tooltip SVG al hacer hover */
        var bpx = px(bfs.x1), bpy = py(bfs.x2);
        var tooltip = 'Óptimo · x₁ = ' + fmt(bfs.x1) + ' · x₂ = ' + fmt(bfs.x2) + ' · Z* = ' + fmt(zValue);

        /* Halo dorado exterior */
        svg.appendChild(el('circle', { cx: bpx, cy: bpy, r: 11, fill: 'rgba(200, 169, 110, 0.18)', stroke: 'none' }));

        /* Punto dorado */
        var bCircle = el('circle', { cx: bpx, cy: bpy, r: 6, fill: '#C8A96E', stroke: '#1B2A4A', 'stroke-width': 1.5 });
        bCircle.appendChild(el('title', null, tooltip));
        svg.appendChild(bCircle);

        /* Área invisible más grande para facilitar el hover */
        var hitArea = el('circle', { cx: bpx, cy: bpy, r: 16, fill: 'transparent', cursor: 'pointer' });
        hitArea.appendChild(el('title', null, tooltip));
        svg.appendChild(hitArea);

        /* Etiqueta "Iter X" sobre el punto */
        var bLabel = el('text', {
            x: bpx, y: bpy - 12,
            'text-anchor': 'middle', fill: '#1B2A4A',
            'font-size': 10, 'font-family': 'Inter,sans-serif', 'font-weight': 600,
            'paint-order': 'stroke',
            stroke: '#FAFAF9', 'stroke-width': 2.5, 'stroke-linejoin': 'round'
        }, indiceIter === 0 ? 'Inicial' : 'Iter ' + indiceIter);
        svg.appendChild(bLabel);

        return svg;
    }

    /* ════════════════════════════════════════════
       CONSTRUCTOR DE TABLEAU
    ════════════════════════════════════════════ */
    function construirTableau(iter, indice, esOptima) {
        var fila_cj            = iter.fila_cj;
        var fila_etiqueta      = iter.fila_etiqueta;
        var matriz             = iter.matriz_restricciones;
        var fila_zj            = iter.fila_zj;
        var fila_cjzj          = iter.fila_cj_zj;
        var columna_cb         = iter.columna_cb;
        var columna_base       = iter.columna_base;
        var columna_vld        = iter.columna_vld;
        var variable_entrada   = iter.variable_entrada;
        var variable_salida    = iter.variable_salida;

        var colEnt  = variable_entrada ? fila_etiqueta.indexOf(variable_entrada) : -1;
        var filaSal = variable_salida  ? columna_base.indexOf(variable_salida)   : -1;
        var valorZ  = columna_cb.reduce(function (s, cb, i) { return s + cb * columna_vld[i]; }, 0);
        var titulo  = indice === 0 ? 'Matriz Inicial' : 'Iteración ' + indice;

        function claseCelda(fi, col) {
            var ent = col === colEnt, sal = fi === filaSal;
            if (ent && sal) return 'cell-pivot';
            if (ent) return 'cell-entering';
            if (sal) return 'cell-leaving';
            return '';
        }

        var card = document.createElement('div');
        card.className = 'sol-tableau-card';

        /* ── encabezado ─────────────────────── */
        var header = document.createElement('div');
        header.className = 'sol-tableau-header';

        var badge = document.createElement('span');
        badge.className = 'sol-iter-badge' + (esOptima ? ' sol-iter-badge--optima' : '');
        badge.textContent = esOptima ? 'Óptimo' : titulo;

        header.appendChild(badge);
        card.appendChild(header);

        /* ── tabla ──────────────────────────── */
        var wrapper = document.createElement('div');
        wrapper.className = 'sol-table-wrapper';

        var table = document.createElement('table');
        table.className = 'sol-simplex-table';

        /* thead */
        var thead = document.createElement('thead');

        /* fila Cj */
        var trCj = document.createElement('tr');
        [document.createElement('th'), document.createElement('th'), document.createElement('th')].forEach(function (th) { trCj.appendChild(th); });
        trCj.children[0].textContent = 'Cj';
        fila_cj.forEach(function (cj, j) {
            var th = document.createElement('th');
            if (j === colEnt) th.className = 'cell-entering';
            th.textContent = fmt(cj);
            trCj.appendChild(th);
        });
        thead.appendChild(trCj);

        /* fila etiquetas */
        var trEtq = document.createElement('tr');
        var thCB = document.createElement('th'); thCB.textContent = 'CB';
        var thBase = document.createElement('th'); thBase.textContent = 'Base';
        var thVLD = document.createElement('th'); thVLD.textContent = 'VLD';
        [thCB, thBase, thVLD].forEach(function (th) { trEtq.appendChild(th); });
        fila_etiqueta.forEach(function (e, j) {
            var th = document.createElement('th');
            if (j === colEnt) th.className = 'cell-entering';
            th.textContent = e;
            trEtq.appendChild(th);
        });
        thead.appendChild(trEtq);
        table.appendChild(thead);

        /* tbody */
        var tbody = document.createElement('tbody');

        /* filas de restricciones */
        matriz.forEach(function (fila, i) {
            var tr = document.createElement('tr');

            var tdCb = document.createElement('td'); tdCb.className = 'sol-label-cell' + (i === filaSal ? ' cell-leaving' : ''); tdCb.textContent = fmt(columna_cb[i]);
            var tdBase = document.createElement('td'); tdBase.className = 'sol-label-cell' + (i === filaSal ? ' cell-leaving' : ''); tdBase.textContent = columna_base[i];
            var tdVld = document.createElement('td'); tdVld.className = 'sol-label-cell' + (i === filaSal ? ' cell-leaving' : ''); tdVld.textContent = fmt(columna_vld[i]);
            [tdCb, tdBase, tdVld].forEach(function (td) { tr.appendChild(td); });

            fila.forEach(function (val, j) {
                var td = document.createElement('td');
                var cls = claseCelda(i, j);
                if (cls) td.className = cls;
                td.textContent = fmt(val);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        /* fila Zj */
        var trZj = document.createElement('tr');
        trZj.className = 'sol-zj-row';
        var tdZ1 = document.createElement('td'); tdZ1.className = 'sol-label-cell';
        var tdZ2 = document.createElement('td'); tdZ2.className = 'sol-label-cell'; tdZ2.textContent = 'Zj';
        var tdZ3 = document.createElement('td'); tdZ3.className = 'sol-label-cell'; tdZ3.textContent = fmt(valorZ);
        [tdZ1, tdZ2, tdZ3].forEach(function (td) { trZj.appendChild(td); });
        fila_zj.forEach(function (zj) {
            var td = document.createElement('td'); td.textContent = fmt(zj); trZj.appendChild(td);
        });
        tbody.appendChild(trZj);

        /* fila Cj-Zj */
        var trCjZj = document.createElement('tr');
        trCjZj.className = 'sol-cjzj-row';
        var tdCZ1 = document.createElement('td'); tdCZ1.className = 'sol-label-cell';
        var tdCZ2 = document.createElement('td'); tdCZ2.className = 'sol-label-cell'; tdCZ2.textContent = 'Cj − Zj';
        var tdCZ3 = document.createElement('td'); tdCZ3.className = 'sol-label-cell';
        [tdCZ1, tdCZ2, tdCZ3].forEach(function (td) { trCjZj.appendChild(td); });
        fila_cjzj.forEach(function (val, j) {
            var td = document.createElement('td');
            if (j === colEnt) td.className = 'cell-entering';
            td.textContent = fmt(val);
            trCjZj.appendChild(td);
        });
        tbody.appendChild(trCjZj);

        table.appendChild(tbody);
        wrapper.appendChild(table);
        card.appendChild(wrapper);

        /* ── leyenda de pivote (iteraciones intermedias) ── */
        if (!esOptima && variable_entrada && variable_salida) {
            var legend = document.createElement('div');
            legend.className = 'sol-pivot-legend';
            legend.innerHTML =
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-green"></span>Entra: <strong>' + variable_entrada + '</strong></span>' +
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-red"></span>Sale: <strong>' + variable_salida + '</strong></span>' +
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-amber"></span>Pivote</span>';
            card.appendChild(legend);
        }

        /* ── leyenda de optimalidad (última iteración óptima) ── */
        if (esOptima) {
            var optLegend = document.createElement('div');
            optLegend.className = 'sol-optima-legend';

            var icon = document.createElement('span');
            icon.className = 'sol-optima-legend-icon';
            icon.textContent = '✓';

            var txt = document.createElement('span');
            txt.innerHTML = 'Todos los C<sub>j</sub>−Z<sub>j</sub> ≤ 0 para las variables no básicas — criterio de optimalidad alcanzado.';

            optLegend.appendChild(icon);
            optLegend.appendChild(txt);
            card.appendChild(optLegend);
        }

        return card;
    }

    /* ════════════════════════════════════════════
       SECCIÓN ÓPTIMA
    ════════════════════════════════════════════ */
    function crearSeccionOptima(iter, z) {
        var div = document.createElement('div');
        div.className = 'sol-optimal anim-fade-scale';

        var badge = document.createElement('div');
        badge.className = 'sol-optimal-badge';
        badge.textContent = 'SOLUCIÓN ÓPTIMA ENCONTRADA';

        var zp = document.createElement('p');
        zp.className = 'sol-optimal-z';
        zp.innerHTML = '<span>Z* =</span>' + fmt(z);

        var bfsDiv = document.createElement('div');
        bfsDiv.className = 'sol-bfs-values';
        _vars.forEach(function (v) {
            var item = document.createElement('div');
            item.className = 'sol-bfs-item';
            item.innerHTML = '<strong>' + v + '</strong> = ' + fmt(valorBFS(v, iter));
            bfsDiv.appendChild(item);
        });

        div.appendChild(badge);
        div.appendChild(zp);
        div.appendChild(bfsDiv);
        return div;
    }

    /* ════════════════════════════════════════════
       PANEL DE EMPATE
    ════════════════════════════════════════════ */
    function construirEmpateUI() {
        var div = document.createElement('div');
        div.className = 'sol-empate anim-fade-scale';

        var label = document.createElement('p');
        label.className = 'sol-empate-label';
        label.textContent = _empate.tipo === 'entrada'
            ? 'Empate en variable de entrada — elegí cuál entra:'
            : 'Empate en variable de salida — elegí cuál sale:';
        div.appendChild(label);

        var btns = document.createElement('div');
        btns.className = 'sol-empate-btns';
        _empate.candidatos.forEach(function (v) {
            var btn = document.createElement('button');
            btn.className = 'sol-empate-btn';
            btn.textContent = v;
            btn.addEventListener('click', function () {
                btn.classList.add('sol-empate-btn--activo');
                btn.disabled = true;
                continuarConEleccion(v);
            });
            btns.appendChild(btn);
        });
        div.appendChild(btns);

        return div;
    }

    function continuarConEleccion(variable) {
        var fd = w.__FORM_DATA__;
        var nuevasElecciones = _elecciones.concat([variable]);

        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '/resolver';
        form.style.display = 'none';

        var campos = {
            'funcion-objetivo': fd['funcion-objetivo'],
            'restricciones':    fd['restricciones'],
            'tipo':             fd['tipo'],
            'metodo-tipo':      fd['metodo-tipo'],
            'elecciones':       JSON.stringify(nuevasElecciones)
        };

        Object.keys(campos).forEach(function (k) {
            var input = document.createElement('input');
            input.type  = 'hidden';
            input.name  = k;
            input.value = campos[k];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }


    /* ════════════════════════════════════════════
       NAVEGACIÓN MOBILE — barra Anterior / Siguiente
       Solo visible en pantallas ≤600px (CSS la oculta
       en desktop). Sustituye al sidebar en mobile.
    ════════════════════════════════════════════ */
    function crearNavMobile(activeIdx, total, onNavegar) {
        var nav = document.createElement('div');
        nav.className = 'sol-mobile-nav';

        var btnPrev = document.createElement('button');
        btnPrev.className = 'sol-mobile-nav-btn';
        btnPrev.textContent = '← Anterior';
        btnPrev.disabled = activeIdx === 0;
        btnPrev.addEventListener('click', function () { onNavegar(activeIdx - 1); });

        var indicator = document.createElement('span');
        indicator.className = 'sol-mobile-nav-indicator';
        var label = activeIdx === 0 ? 'Inicial' : 'Iteración ' + activeIdx;
        indicator.textContent = label + ' (' + (activeIdx + 1) + '/' + total + ')';

        var btnNext = document.createElement('button');
        btnNext.className = 'sol-mobile-nav-btn';
        btnNext.textContent = 'Siguiente →';
        btnNext.disabled = activeIdx === total - 1;
        btnNext.addEventListener('click', function () { onNavegar(activeIdx + 1); });

        nav.appendChild(btnPrev);
        nav.appendChild(indicator);
        nav.appendChild(btnNext);
        return nav;
    }

    /* ════════════════════════════════════════════
       SIDEBAR DE ITERACIONES
       Panel lateral navy con un nodo por iteración.
       activeIdx  — nodo que aparece resaltado.
       onNavegar(i) — callback al hacer click en nodo i.
    ════════════════════════════════════════════ */
    function crearSidebar(activeIdx, onNavegar) {
        var aside = document.createElement('aside');
        aside.className = 'sol-iter-sidebar';

        /* inner sticky: el contenido queda visible al hacer scroll */
        var inner = document.createElement('div');
        inner.className = 'sol-sidebar-inner';

        var titulo = document.createElement('div');
        titulo.className = 'sol-sidebar-title';
        titulo.textContent = 'Iteraciones';
        inner.appendChild(titulo);

        if (_iteraciones.length === 0) {
            aside.appendChild(inner);
            return aside;
        }

        _iteraciones.forEach(function (iter, i) {
            var esUlt    = i === _iteraciones.length - 1;
            var esOpt    = esUlt && !_empate && (iter.variable_entrada === null || iter.variable_entrada === undefined);
            var esInicial = i === 0;

            var node = document.createElement('div');
            var clases = 'sol-iter-node';
            if (i === activeIdx)                       clases += ' sol-iter-node--active';
            else if (!_conGrafico && i > activeIdx)    clases += ' sol-iter-node--future';
            if (esOpt)                                 clases += ' sol-iter-node--optima';
            if (esInicial)                             clases += ' sol-iter-node--inicial';
            node.className = clases;

            /* dot: checkmark verde para el óptimo, número para el resto */
            var dot = document.createElement('span');
            dot.className = 'sol-node-dot';
            dot.textContent = esOpt ? '✓' : String(i);

            /* etiqueta: "Inicial", "Óptimo" o "Iteración N" */
            var label = document.createElement('span');
            label.className = 'sol-node-label';
            label.textContent = esInicial ? 'Inicial' : (esOpt ? 'Óptimo' : 'Iteración ' + i);

            node.appendChild(dot);
            node.appendChild(label);
            node.addEventListener('click', function () { onNavegar(i); });

            inner.appendChild(node);
        });

        /* ── Panel de resumen óptimo al pie del sidebar ── */
        var ultimaIter = _iteraciones[_iteraciones.length - 1];
        var esSolucionOptima = ultimaIter && !_empate &&
            (ultimaIter.variable_entrada === null || ultimaIter.variable_entrada === undefined);

        if (esSolucionOptima) {
            var zOpt = ultimaIter.columna_cb.reduce(function (s, cb, i) {
                return s + cb * ultimaIter.columna_vld[i];
            }, 0);

            var summary = document.createElement('div');
            summary.className = 'sol-sidebar-summary';

            /* Estado */
            var estadoDiv = document.createElement('div');
            estadoDiv.className = 'sol-sidebar-summary-estado';
            estadoDiv.textContent = '✓ Solución Óptima';
            summary.appendChild(estadoDiv);

            /* Iteraciones */
            var iterLabel = document.createElement('div');
            iterLabel.className = 'sol-sidebar-summary-label';
            iterLabel.textContent = 'Iteraciones';
            summary.appendChild(iterLabel);

            var iterVal = document.createElement('div');
            iterVal.className = 'sol-sidebar-summary-value';
            iterVal.textContent = String(_iteraciones.length - 1);
            summary.appendChild(iterVal);

            /* Z* */
            var zLabel = document.createElement('div');
            zLabel.className = 'sol-sidebar-summary-label';
            zLabel.textContent = 'Z⨯';
            summary.appendChild(zLabel);

            var zVal = document.createElement('div');
            zVal.className = 'sol-sidebar-summary-value';
            zVal.textContent = fmt(zOpt);
            summary.appendChild(zVal);

            /* Variables de decisión */
            if (_vars.length > 0) {
                var varsLabel = document.createElement('div');
                varsLabel.className = 'sol-sidebar-summary-label';
                varsLabel.textContent = 'Variables';
                summary.appendChild(varsLabel);

                var varsDiv = document.createElement('div');
                varsDiv.className = 'sol-sidebar-summary-vars';
                _vars.forEach(function (v) {
                    var varEl = document.createElement('div');
                    varEl.className = 'sol-sidebar-summary-var';
                    varEl.innerHTML = '<strong>' + v + '</strong> = ' + fmt(valorBFS(v, ultimaIter));
                    varsDiv.appendChild(varEl);
                });
                summary.appendChild(varsDiv);
            }

            inner.appendChild(summary);
        }

        aside.appendChild(inner);
        return aside;
    }


    /* ════════════════════════════════════════════
       LAYOUT CON GRÁFICO
    ════════════════════════════════════════════ */
    function renderConGrafico(root) {
        var iter         = _iteraciones[_indice];
        var esUlt        = _indice === _iteraciones.length - 1;
        var esEmpateAqui = esUlt && _empate !== null;
        var esOpt        = esUlt && !esEmpateAqui && (iter.variable_entrada === null || iter.variable_entrada === undefined);
        var z            = iter.columna_cb.reduce(function (s, cb, i) { return s + cb * iter.columna_vld[i]; }, 0);
        var bfs          = { x1: valorBFS('x1', iter), x2: valorBFS('x2', iter) };

        root.className = 'sol-with-sidebar sol-with-graph';
        root.innerHTML = '';

        /* sidebar */
        root.appendChild(crearSidebar(_indice, function (idx) {
            _direccion = idx > _indice ? 'down' : 'up';
            _indice = idx;
            renderConGrafico(root);
        }));

        /* columna central — tableau */
        var left = document.createElement('div');
        left.className = 'sol-scroll-area';

        var tw = document.createElement('div');
        tw.className = 'anim-slide-' + _direccion;
        tw.appendChild(construirTableau(iter, _indice, esOpt));
        left.appendChild(tw);

        if (esOpt) {
            var opt = crearSeccionOptima(iter, z);
            opt.style.marginTop = '1.5rem';
            left.appendChild(opt);
        }

        if (esEmpateAqui) {
            left.appendChild(construirEmpateUI());
        }

        /* navegación mobile — visible solo en ≤600px via CSS */
        left.appendChild(crearNavMobile(_indice, _iteraciones.length, function (idx) {
            _direccion = idx > _indice ? 'down' : 'up';
            _indice = idx;
            renderConGrafico(root);
        }));

        root.appendChild(left);

        /* columna derecha — gráfico */
        var graphPanel = document.createElement('div');
        graphPanel.className = 'sol-graph-panel';

        var graphCard = document.createElement('div');
        graphCard.className = 'sol-graph-card';

        /* Header del gráfico: título + leyenda de restricciones + función objetivo */
        var graphHdr = document.createElement('div');
        graphHdr.className = 'sol-graph-header';

        var h4 = document.createElement('h4');
        h4.textContent = 'Región Factible';
        graphHdr.appendChild(h4);

        var legendaGrafico = document.createElement('div');
        legendaGrafico.className = 'sol-graph-constraint-legend';

        _restricciones.forEach(function (r, i) {
            var color = colorRestriccion(i);
            var item = document.createElement('span');
            item.className = 'sol-graph-legend-item';

            var linea = document.createElement('span');
            linea.className = 'sol-graph-legend-line';
            linea.style.background = color;

            item.appendChild(linea);
            item.appendChild(document.createTextNode('R' + (i + 1)));
            legendaGrafico.appendChild(item);
        });

        /* Entrada de la función objetivo Z* en la leyenda */
        var objLegItem = document.createElement('span');
        objLegItem.className = 'sol-graph-legend-item';

        var objLinea = document.createElement('span');
        objLinea.className = 'sol-graph-legend-line sol-graph-legend-line--dashed';

        objLegItem.appendChild(objLinea);
        objLegItem.appendChild(document.createTextNode('Z*'));
        legendaGrafico.appendChild(objLegItem);

        graphHdr.appendChild(legendaGrafico);
        graphCard.appendChild(graphHdr);

        /* Coeficientes de la función objetivo para trazar la línea Z* */
        var c1 = 0, c2 = 0;
        if (_iteraciones.length > 0) {
            var fila0  = _iteraciones[0];
            var ix1    = fila0.fila_etiqueta.indexOf('x1');
            var ix2    = fila0.fila_etiqueta.indexOf('x2');
            if (ix1 !== -1) c1 = fila0.fila_cj[ix1];
            if (ix2 !== -1) c2 = fila0.fila_cj[ix2];
        }

        graphCard.appendChild(construirGrafico(bfs, _indice, z, c1, c2));
        graphPanel.appendChild(graphCard);

        root.appendChild(graphPanel);
    }

    /* ════════════════════════════════════════════
       LAYOUT SIN GRÁFICO
    ════════════════════════════════════════════ */
    function renderSinGrafico(root) {
        var ultima = _iteraciones[_iteraciones.length - 1];
        var zOpt   = ultima.columna_cb.reduce(function (s, cb, i) { return s + cb * ultima.columna_vld[i]; }, 0);

        root.className = 'sol-with-sidebar';
        root.innerHTML = '';

        /* sidebar */
        root.appendChild(crearSidebar(_visibles - 1, function (idx) {
            if (idx + 1 > _visibles) {
                _visibles = idx + 1;
            }
            renderSinGrafico(root);
            setTimeout(function () {
                var newCol = root.querySelector('.sol-matrices-col');
                if (!newCol) return;
                var cards = newCol.querySelectorAll('.sol-tableau-card');
                var target = cards[Math.min(idx, cards.length - 1)];
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
        }));

        /* columna de matrices apiladas */
        var col = document.createElement('div');
        col.className = 'sol-matrices-col';

        _iteraciones.slice(0, _visibles).forEach(function (iter, i) {
            var esUltIter = i === _iteraciones.length - 1;
            var esOpt     = esUltIter && !_empate && (iter.variable_entrada === null || iter.variable_entrada === undefined);
            var wrap = document.createElement('div');
            wrap.className = 'anim-slide-down';
            wrap.appendChild(construirTableau(iter, i, esOpt));
            col.appendChild(wrap);
        });

        if (_visibles >= _iteraciones.length) {
            if (_empate) {
                col.appendChild(construirEmpateUI());
            } else {
                col.appendChild(crearSeccionOptima(ultima, zOpt));
            }
        } else {
            var hint = document.createElement('p');
            hint.className = 'sol-scroll-hint sol-scroll-hint--clickable';
            hint.textContent = 'Ver iteración ' + (_visibles + 1) + ' de ' + _iteraciones.length + ' ↓';
            hint.addEventListener('click', function () {
                _visibles++;
                renderSinGrafico(root);
                setTimeout(function () {
                    var newCol = root.querySelector('.sol-matrices-col');
                    if (newCol) {
                        var last = newCol.lastElementChild;
                        if (last) last.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 60);
            });
            col.appendChild(hint);
        }

        /* navegación mobile — Anterior/Siguiente sobre _visibles */
        col.appendChild(crearNavMobile(_visibles - 1, _iteraciones.length, function (idx) {
            _visibles = idx + 1;
            renderSinGrafico(root);
        }));

        root.appendChild(col);
    }

    /* ════════════════════════════════════════════
       PUNTO DE ENTRADA
    ════════════════════════════════════════════ */
    function inicializar(data) {
        _empate      = data.empate || null;
        _elecciones  = (w.__FORM_DATA__ && w.__FORM_DATA__.elecciones) || [];
        _iteraciones = (data.problema_solucionado.iteraciones) || [];
        _restricciones = (data.problema_solucionado.restricciones) || [];
        // Tras un empate re-suelto, abrir en la última iteración; en el primer submit, desde el inicio.
        var esResubmit = _elecciones.length > 0;
        _indice   = esResubmit ? _iteraciones.length - 1 : 0;
        _visibles = esResubmit ? _iteraciones.length : 1;
        _vars = (_iteraciones.length > 0 ? _iteraciones[0].fila_etiqueta : []).filter(function (l) {
            return !l.startsWith('S') && !l.startsWith('A');
        });
        _conGrafico = _vars.length === 2;

        var root = document.getElementById('sol-main');
        if (!root) return;

        if (_conGrafico) renderConGrafico(root);
        else renderSinGrafico(root);
    }

    /* arranque automático si los datos ya están en el global */
    document.addEventListener('DOMContentLoaded', function () {
        if (w.__SOLUCION__) inicializar(w.__SOLUCION__);
    });

    w.SolucionPage = { inicializar: inicializar };

})(window);
