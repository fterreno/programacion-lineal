export interface MatrizSimplex {
    fila_cj: number[];
    fila_etiqueta: string[];
    matriz_restricciones: number[][];
    fila_zj: number[];
    fila_cj_zj: number[];
    columna_cb: number[];
    columna_base: string[];
    columna_vld: number[];
    variable_entrada: string | null;
    variable_salida: string | null;
}
