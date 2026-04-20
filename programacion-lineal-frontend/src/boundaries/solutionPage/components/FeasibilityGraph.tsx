import Plot from 'react-plotly.js';
import type { Restriccion } from '../../../models/domain/Restriccion';

interface FeasibilityGraphProps {
    restricciones: Restriccion[];
    bfs_actual: { x1: number; x2: number };
    indice_iteracion: number;
}

const ObtenerCoeficiente = (restriccion: Restriccion, nombre_variable: string): number =>
    restriccion.funcion_restricciones.find(t => t.variable === nombre_variable)?.coeficiente ?? 0;

const ResolverSistemaLineal = (
    a1: number, b1: number, c1: number,
    a2: number, b2: number, c2: number
): [number, number] | null => {
    const determinante = a1 * b2 - a2 * b1;
    if (Math.abs(determinante) < 1e-10) return null;
    return [(c1 * b2 - c2 * b1) / determinante, (a1 * c2 - a2 * c1) / determinante];
};

const EsFactible = (x: number, y: number, restricciones: Restriccion[]): boolean => {
    if (x < -1e-9 || y < -1e-9) return false;
    return restricciones.every(r => {
        const a1 = ObtenerCoeficiente(r, 'x1');
        const a2 = ObtenerCoeficiente(r, 'x2');
        const lado_izquierdo = a1 * x + a2 * y;
        const lado_derecho = r.valor_lado_derecho;
        switch (r.operador) {
            case 'menor_igual': return lado_izquierdo <= lado_derecho + 1e-9;
            case 'mayor_igual': return lado_izquierdo >= lado_derecho - 1e-9;
            case 'igual':       return Math.abs(lado_izquierdo - lado_derecho) < 1e-9;
            default:            return true;
        }
    });
};

const OrdenarPorAngulo = (puntos: [number, number][]): [number, number][] => {
    if (puntos.length === 0) return [];
    const centro_x = puntos.reduce((s, p) => s + p[0], 0) / puntos.length;
    const centro_y = puntos.reduce((s, p) => s + p[1], 0) / puntos.length;
    return [...puntos].sort((a, b) =>
        Math.atan2(a[1] - centro_y, a[0] - centro_x) - Math.atan2(b[1] - centro_y, b[0] - centro_x)
    );
};

const ConstruirVerticesFactibles = (restricciones: Restriccion[]): [number, number][] => {
    const candidatos: [number, number][] = [];

    type Linea = { a: number; b: number; c: number };
    const lineas: Linea[] = restricciones.map(r => ({
        a: ObtenerCoeficiente(r, 'x1'),
        b: ObtenerCoeficiente(r, 'x2'),
        c: r.valor_lado_derecho,
    }));
    lineas.push({ a: 1, b: 0, c: 0 });
    lineas.push({ a: 0, b: 1, c: 0 });

    for (let i = 0; i < lineas.length; i++) {
        for (let j = i + 1; j < lineas.length; j++) {
            const punto = ResolverSistemaLineal(
                lineas[i].a, lineas[i].b, lineas[i].c,
                lineas[j].a, lineas[j].b, lineas[j].c
            );
            if (punto && EsFactible(punto[0], punto[1], restricciones)) {
                candidatos.push(punto);
            }
        }
    }

    return OrdenarPorAngulo(candidatos);
};

const FeasibilityGraph = ({ restricciones, bfs_actual, indice_iteracion }: FeasibilityGraphProps) => {
    const vertices = ConstruirVerticesFactibles(restricciones);

    const todos_x = vertices.map(v => v[0]).concat(bfs_actual.x1);
    const todos_y = vertices.map(v => v[1]).concat(bfs_actual.x2);
    const max_x = Math.max(...todos_x, 1) * 1.25;
    const max_y = Math.max(...todos_y, 1) * 1.25;

    const trazas_restricciones = restricciones.map((r, indice) => {
        const a1 = ObtenerCoeficiente(r, 'x1');
        const a2 = ObtenerCoeficiente(r, 'x2');
        const b = r.valor_lado_derecho;
        let valores_x: number[], valores_y: number[];

        if (Math.abs(a2) > 1e-10) {
            valores_x = [0, max_x];
            valores_y = valores_x.map(x => (b - a1 * x) / a2);
        } else if (Math.abs(a1) > 1e-10) {
            const x_constante = b / a1;
            valores_x = [x_constante, x_constante];
            valores_y = [0, max_y];
        } else {
            return null;
        }

        return {
            x: valores_x,
            y: valores_y,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `R${indice + 1}`,
            line: { color: `hsl(${(indice * 67 + 200) % 360}, 60%, 55%)`, width: 1.5, dash: 'dot' as const },
        };
    }).filter((t): t is NonNullable<typeof t> => t !== null);

    const traza_region = vertices.length > 0 ? {
        x: [...vertices.map(v => v[0]), vertices[0][0]],
        y: [...vertices.map(v => v[1]), vertices[0][1]],
        type: 'scatter' as const,
        mode: 'lines' as const,
        fill: 'toself' as const,
        fillcolor: 'rgba(255, 255, 255, 0.05)',
        line: { color: 'rgba(255,255,255,0.2)', width: 1 },
        name: 'Región factible',
        showlegend: false,
    } : null;

    const traza_bfs = {
        x: [bfs_actual.x1],
        y: [bfs_actual.x2],
        type: 'scatter' as const,
        mode: 'markers+text' as const,
        marker: { color: '#ffffff', size: 10, symbol: 'circle' as const, line: { color: '#000', width: 1 } },
        text: [`Iter ${indice_iteracion}`],
        textposition: 'top center' as const,
        textfont: { color: '#fff', size: 11 },
        name: 'SBF actual',
    };

    const trazas = [
        ...(traza_region ? [traza_region] : []),
        ...trazas_restricciones,
        traza_bfs,
    ];

    const disposicion = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(10,10,10,0.6)',
        font: { color: '#888', family: 'Inter, sans-serif', size: 11 },
        xaxis: {
            title: 'x₁',
            gridcolor: '#1a1a1a',
            zerolinecolor: '#333',
            range: [0, max_x],
            tickfont: { color: '#555' },
        },
        yaxis: {
            title: 'x₂',
            gridcolor: '#1a1a1a',
            zerolinecolor: '#333',
            range: [0, max_y],
            tickfont: { color: '#555' },
        },
        legend: {
            font: { color: '#555', size: 10 },
            bgcolor: 'rgba(0,0,0,0)',
        },
        margin: { t: 10, r: 10, b: 45, l: 45 },
    };

    return (
        <Plot
            data={trazas}
            layout={disposicion}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler
        />
    );
};

export default FeasibilityGraph;
