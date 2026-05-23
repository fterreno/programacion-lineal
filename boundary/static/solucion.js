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
    ════════════════════════════════════════════ */
    function construirGrafico(bfs, indiceIter) {
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

        /* fondo */
        svg.appendChild(el('rect', { x: 0, y: 0, width: SIZE, height: SIZE, fill: 'rgba(0,0,0,0.38)', rx: 8 }));

        /* grid */
        var N = 5;
        for (var g = 0; g <= N; g++) {
            var gx = mg.l + (g / N) * pw;
            var gy = mg.t + (g / N) * ph;
            svg.appendChild(el('line', { x1: gx, y1: mg.t,      x2: gx,       y2: mg.t + ph, stroke: '#1c1c1c', 'stroke-width': 0.5 }));
            svg.appendChild(el('line', { x1: mg.l, y1: gy,      x2: mg.l + pw, y2: gy,       stroke: '#1c1c1c', 'stroke-width': 0.5 }));
        }

        /* ejes */
        svg.appendChild(el('line', { x1: px(0), y1: py(0), x2: px(maxX), y2: py(0),   stroke: '#444', 'stroke-width': 1 }));
        svg.appendChild(el('line', { x1: px(0), y1: py(0), x2: px(0),    y2: py(maxY), stroke: '#444', 'stroke-width': 1 }));

        /* marcas en ejes */
        for (var t = 0; t <= N; t++) {
            var xv = (t / N) * maxX, yv = (t / N) * maxY;
            svg.appendChild(el('text', { x: px(xv), y: py(0) + 14, 'text-anchor': 'middle', fill: '#555', 'font-size': 9, 'font-family': 'Inter,sans-serif' }, Number(xv.toFixed(1)).toString()));
            if (t > 0) {
                svg.appendChild(el('text', { x: px(0) - 5, y: py(yv) + 3, 'text-anchor': 'end', fill: '#555', 'font-size': 9, 'font-family': 'Inter,sans-serif' }, Number(yv.toFixed(1)).toString()));
            }
        }

        /* etiquetas ejes */
        svg.appendChild(el('text', { x: mg.l + pw / 2, y: SIZE - 5, 'text-anchor': 'middle', fill: '#888', 'font-size': 11, 'font-family': 'Inter,sans-serif' }, 'x₁'));
        var lx2 = el('text', { x: 12, y: mg.t + ph / 2, 'text-anchor': 'middle', fill: '#888', 'font-size': 11, 'font-family': 'Inter,sans-serif', transform: 'rotate(-90,12,' + (mg.t + ph / 2) + ')' }, 'x₂');
        svg.appendChild(lx2);

        /* polígono región factible */
        if (verts.length >= 3) {
            svg.appendChild(el('polygon', {
                points: verts.map(function (v) { return px(v[0]) + ',' + py(v[1]); }).join(' '),
                fill: 'rgba(255,255,255,0.05)', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': 1
            }));
        }

        /* líneas de restricciones */
        _restricciones.forEach(function (r, i) {
            var a1 = coef(r, 'x1'), a2 = coef(r, 'x2'), b = r.valor_lado_derecho;
            var color = 'hsl(' + ((i * 67 + 200) % 360) + ',60%,55%)';
            var pts = null;

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
                    stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': '4,3'
                }));
            }
        });

        /* etiquetas de intersecciones */
        todasIntersecciones(maxX, maxY).forEach(function (pt) {
            var x = pt[0], y = pt[1];
            var bx = px(x), by = py(y);
            var nearRight  = x > maxX * 0.78;
            var nearBottom = y < maxY * 0.08;
            var ox = nearRight  ? -6 : 6;
            var oy = nearBottom ? -14 : 12;
            var anchor = nearRight ? 'end' : 'start';

            svg.appendChild(el('circle', { cx: bx, cy: by, r: 3, fill: 'rgba(255,255,255,0.5)' }));
            var tLabel = el('text', {
                x: bx + ox, y: by + oy,
                'text-anchor': anchor,
                fill: 'rgba(210,220,216,0.9)',
                'font-size': 9, 'font-family': 'Inter,sans-serif',
                'paint-order': 'stroke',
                stroke: 'rgba(15,25,20,0.9)', 'stroke-width': 2.5, 'stroke-linejoin': 'round'
            }, '(' + Number(x.toFixed(2)) + ', ' + Number(y.toFixed(2)) + ')');
            svg.appendChild(tLabel);
        });

        /* punto BFS */
        var bpx = px(bfs.x1), bpy = py(bfs.x2);
        svg.appendChild(el('circle', { cx: bpx, cy: bpy, r: 5, fill: '#fff', stroke: '#000', 'stroke-width': 1 }));
        var bLabel = el('text', {
            x: bpx, y: bpy - 10,
            'text-anchor': 'middle', fill: '#fff',
            'font-size': 11, 'font-family': 'Inter,sans-serif',
            'paint-order': 'stroke',
            stroke: 'rgba(15,25,20,0.8)', 'stroke-width': 2, 'stroke-linejoin': 'round'
        }, 'Iter ' + indiceIter);
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

        var h3 = document.createElement('h3');
        h3.textContent = esOptima ? 'Solución Óptima' : titulo;

        header.appendChild(badge);
        header.appendChild(h3);
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

        /* ── leyenda pivote ─────────────────── */
        if (!esOptima && variable_entrada && variable_salida) {
            var legend = document.createElement('div');
            legend.className = 'sol-pivot-legend';
            legend.innerHTML =
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-green"></span>Entra: <strong>' + variable_entrada + '</strong></span>' +
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-red"></span>Sale: <strong>' + variable_salida + '</strong></span>' +
                '<span class="sol-legend-item"><span class="sol-legend-dot sol-dot-amber"></span>Pivote</span>';
            card.appendChild(legend);
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
       LAYOUT CON GRÁFICO
    ════════════════════════════════════════════ */
    function renderConGrafico(root) {
        var iter    = _iteraciones[_indice];
        var esUlt   = _indice === _iteraciones.length - 1;
        var esEmpateAqui = esUlt && _empate !== null;
        var esOpt   = esUlt && !esEmpateAqui && (iter.variable_entrada === null || iter.variable_entrada === undefined);
        var z       = iter.columna_cb.reduce(function (s, cb, i) { return s + cb * iter.columna_vld[i]; }, 0);
        var bfs     = { x1: valorBFS('x1', iter), x2: valorBFS('x2', iter) };

        root.className = 'sol-split';
        root.innerHTML = '';

        /* columna izquierda */
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

        /* botones prev/next */
        var nav = document.createElement('div');
        nav.className = 'sol-nav-buttons';

        var btnAnt = document.createElement('button');
        btnAnt.className = 'sol-btn-step';
        btnAnt.textContent = '← Anterior';
        if (_indice === 0) btnAnt.disabled = true;
        btnAnt.addEventListener('click', function () {
            _direccion = 'up';
            _indice = Math.max(_indice - 1, 0);
            renderConGrafico(root);
        });

        var hint = document.createElement('span');
        hint.className = 'sol-scroll-hint';
        hint.textContent = 'Iteración ' + (_indice + 1) + ' de ' + _iteraciones.length;

        var btnSig = document.createElement('button');
        btnSig.className = 'sol-btn-step';
        btnSig.textContent = 'Siguiente →';
        if (esUlt) btnSig.disabled = true;
        btnSig.addEventListener('click', function () {
            _direccion = 'down';
            _indice = Math.min(_indice + 1, _iteraciones.length - 1);
            renderConGrafico(root);
        });

        nav.appendChild(btnAnt);
        nav.appendChild(hint);
        nav.appendChild(btnSig);
        left.appendChild(nav);

        /* columna derecha (gráfico) */
        var graphPanel = document.createElement('div');
        graphPanel.className = 'sol-graph-panel';

        var graphCard = document.createElement('div');
        graphCard.className = 'sol-graph-card';

        var h4 = document.createElement('h4');
        h4.textContent = 'Región Factible';
        graphCard.appendChild(h4);
        graphCard.appendChild(construirGrafico(bfs, _indice));
        graphPanel.appendChild(graphCard);

        root.appendChild(left);
        root.appendChild(graphPanel);
    }

    /* ════════════════════════════════════════════
       LAYOUT SIN GRÁFICO
    ════════════════════════════════════════════ */
    function renderSinGrafico(root) {
        var ultima = _iteraciones[_iteraciones.length - 1];
        var zOpt   = ultima.columna_cb.reduce(function (s, cb, i) { return s + cb * ultima.columna_vld[i]; }, 0);

        root.className = 'sol-single';
        root.innerHTML = '';

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
                    var last = col.lastElementChild;
                    if (last) last.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            });
            col.appendChild(hint);
        }

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
