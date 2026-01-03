import axios from 'axios';
import type { Termino } from '../models/domain/termino';
import type { Restriccion } from '../models/domain/restriccion';
import type { SolicitudProblema } from '../models/DTOs/solicitudProblema';
import type { Tipo } from '../models/domain/tipo';
import type { FuncionObjetivo } from '../models/domain/funcionObjetivo';
import type { MetodoTipo } from '../models/domain/metodoTipo';
import type { Operador } from '../models/domain/operador';

const API_URL = 'http://localhost:8080/api/pl';

// -------------------- PARSERS --------------------

// Parsear función objetivo a FuncionObjetivo
const convertirTermino = (terminos_string: string): Termino[] => {
  const terminos: Termino[] = [];

  // Sin espacios y aseguramos que cada término tenga explícitamente un signo. Luego divide cada termino en un array
  const terminos_array = terminos_string.replace(/\s+/g, "").replace(/(^|(?<=[+-]))(?=[^+-])/g, '+').split(/(?=[+-])/);
  const expresion_regular = /^([+-]?\d*\.?\d*)?([a-zA-Z]\d*)?(?:\^(\d+))?$/;

  terminos_array.forEach((elemento) => {
    const termino_seccion = elemento.match(expresion_regular);
    if (termino_seccion) {
      let [, coeficiente_str, variable, exponente_str] = termino_seccion;

      // Determinar coeficiente
      let coeficiente: number;
      if (!coeficiente_str || coeficiente_str === '+' || coeficiente_str === '-') {
        coeficiente = coeficiente_str === '-' ? -1 : 1;
      } else {
        coeficiente = parseFloat(coeficiente_str);
        if (isNaN(coeficiente)) {
          throw new Error(`Coeficiente inválido en término: "${elemento}"`);
        }
      }

      // Determinar exponente
      const exponente = variable ? (exponente_str ? parseInt(exponente_str) : 1) : 0;

      terminos.push({
        coeficiente: coeficiente,
        variable: variable || null,
        exponente,
      });
    }
  });
  return terminos;
};

const convertirRestricciones = (restriccion_string: string): Restriccion[] => {
  const restricciones: Restriccion[] = [];

  restriccion_string.split('\n').forEach((linea_str) => {
    if (!linea_str.trim()) return;

    // Normalizar operadores alternativos
    let linea = linea_str.replace(/\s+/g, ""); // quitar espacios
    linea = linea.replace("=>", ">=").replace("=<", "<=");

    // Detecta operador
    const operador_expresion = linea.match(/^(.+?)(<=|>=|=|<|>)(.+)$/);
    if (!operador_expresion) {
      console.warn(`Restricción ignorada, formato inválido: "${linea_str}"`);
      return;
    }

    let [, lado_izquierdo, operador_str, lado_derecho] = operador_expresion;

    const operador_normalizado: Operador = operador_str as Operador;

    // Convertir lado derecho a número (acepta negativos)
    const limite_float = parseFloat(lado_derecho);
    if (isNaN(limite_float)) {
      throw new Error(`Valor inválido en el lado derecho de la restricción: "${lado_derecho}". Recordar que en el lado derecho se debe encontrar la exprecion que no posee variables.`);
    }

    restricciones.push({
      limite: limite_float,
      operador: operador_normalizado,
      vld: convertirTermino(lado_izquierdo),
    });
  });

  return restricciones;
};

// -------------------- SERVICE --------------------

export const resolverProblemaPL = async (
  funcion_str: string,
  restricciones_str: string,
  metodoTipo: MetodoTipo,
  tipo: Tipo
) => {
  if (!funcion_str.trim()) throw new Error('Función objetivo vacía');
  if (!restricciones_str.trim()) throw new Error('Restriccion vacía');

  const funcion: FuncionObjetivo = {
    tipo: tipo,
    termino: convertirTermino(funcion_str)
  }

  const solicitud: SolicitudProblema = {
    metodoTipo: metodoTipo,
    problema: {
      funcionObjetivo: funcion,
      restricciones: convertirRestricciones(restricciones_str),
    },
  };

  try {
    const response = await axios.post(`${API_URL}/resolver`, solicitud, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`No se pudo resolver el problema: ${error.message || error}`);
  }
  
};