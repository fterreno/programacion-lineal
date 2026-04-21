import axios from 'axios';
import type { Termino } from '../models/domain/Termino';
import type { Restriccion } from '../models/domain/Restriccion';
import type { SolicitudProblema } from '../models/dtos/SolicitudProblema';
import type { SolicitudRespuesta } from '../models/dtos/SolicitudRespuesta';
import type { Tipo } from '../models/domain/Tipo';
import type { FuncionObjetivo } from '../models/domain/FuncionObjetivo';
import type { MetodoTipo } from '../models/domain/MetodoTipo';
import { mapeo_operador } from '../models/domain/Operador';

export class ErrorPL extends Error {
  titulo: string;
  constructor(titulo: string, descripcion: string) {
    super(descripcion);
    this.titulo = titulo;
    this.name = 'ErrorPL';
  }
}

const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/pl';

const ConvertirTermino = (terminos_string: string): Termino[] => {
  const terminos: Termino[] = [];

  const terminos_array = terminos_string.replace(/\s+/g, "").split(/(?=[+-])/);
  const expresion_regular = /^([+-]?\d*\.?\d*)?([a-zA-Z]\d*)?(?:\^(\d+))?$/;

  terminos_array.forEach((elemento) => {
    const termino_seccion = elemento.match(expresion_regular);
    if (termino_seccion) {
      let [, coeficiente_str, variable, exponente_str] = termino_seccion;

      let coeficiente: number;
      if (!coeficiente_str || coeficiente_str === '+' || coeficiente_str === '-') {
        coeficiente = coeficiente_str === '-' ? -1 : 1;
      } else {
        coeficiente = parseFloat(coeficiente_str);
        if (isNaN(coeficiente)) {
          throw new Error(`Coeficiente inválido.`);
        }
      }

      const exponente = variable ? (exponente_str ? parseInt(exponente_str) : 1) : 0;

      terminos.push({
        coeficiente: coeficiente,
        variable: variable || "",
        exponente,
      });
    }
  });
  return terminos;
};

const ConvertirRestricciones = (restriccion_string: string): Restriccion[] => {
  const restricciones: Restriccion[] = [];

  restriccion_string.split('\n').forEach((linea_str) => {
    if (!linea_str.trim()) return;

    let linea = linea_str.replace(/\s+/g, "");
    linea = linea.replace("=>", ">=").replace("=<", "<=");

    const operador_expresion = linea.match(/^(.+?)(<=|>=|=|<|>|=<|=>)(.+)$/);
    if (!operador_expresion) {
      throw new Error(`Restricción ignorada, formato inválido.`);
    }

    let [, lado_izquierdo, operador_str, lado_derecho] = operador_expresion;

    const operador_normalizado = mapeo_operador[operador_str];
    if (!operador_normalizado) throw new Error(`Restricción ignorada, operador inválido.`);

    const lado_derecho_float = parseFloat(lado_derecho);
    if (isNaN(lado_derecho_float)) {
      throw new Error(`Restricción ignorada, lado derecho inválido.`);
    }

    restricciones.push({
      valor_lado_derecho: lado_derecho_float,
      operador: operador_normalizado,
      funcion_restricciones: ConvertirTermino(lado_izquierdo),
    });
  });

  return restricciones;
};

export const ResolverProblemaPL = async (
  funcion_str: string,
  restricciones_str: string,
  metodo_tipo: MetodoTipo,
  tipo: Tipo
): Promise<SolicitudRespuesta> => {
  if (!funcion_str.trim()) throw new Error('Función objetivo vacía');
  if (!restricciones_str.trim()) throw new Error('Restriccion vacía');

  const funcion_objetivo: FuncionObjetivo = {
    tipo: tipo,
    termino: ConvertirTermino(funcion_str),
  };

  const solicitud: SolicitudProblema = {
    metodo_tipo: metodo_tipo,
    problema: {
      funcion_objetivo: funcion_objetivo,
      restricciones: ConvertirRestricciones(restricciones_str),
    },
  };

  try {
    const respuesta = await axios.post(`${URL_API}/resolver`, solicitud, {
      headers: { 'Content-Type': 'application/json' },
    });
    return respuesta.data;
  } catch (error: any) {
    const datos = error.response?.data;
    if (datos?.titulo && datos?.descripcion) {
      throw new ErrorPL(datos.titulo, datos.descripcion);
    }
    throw new ErrorPL('Error de conexión', error.message || 'No se pudo conectar con el servidor');
  }
};
