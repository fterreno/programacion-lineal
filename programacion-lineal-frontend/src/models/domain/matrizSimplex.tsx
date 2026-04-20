export interface MatrizSimplex {
    f_cj: number[];
    f_etiqueta: string[];
    m_restricciones: number[][];
    f_zj: number[];
    f_cjZj: number[];
    c_cb: number[];
    c_base: string[];
    c_vld: number[];
    variableEntrada: string | null;
    variableSalida: string | null;
}
