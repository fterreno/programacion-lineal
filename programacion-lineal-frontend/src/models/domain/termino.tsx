export interface Termino {
    coeficiente: number;
    variable: string | null; // null si es un término constante
    exponente: number;
}