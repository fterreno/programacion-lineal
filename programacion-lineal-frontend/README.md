# Programación Lineal — Frontend

Aplicación web de página única (SPA) desarrollada con React 19 y TypeScript que permite al usuario ingresar un modelo de Programación Lineal en texto plano, enviarlo al backend para su resolución y visualizar cada tableau del proceso Simplex junto con la región factible en 2D.

---

## Lenguajes y Tecnologías

**Lenguaje:** TypeScript 5.9 — tipado estricto habilitado en su totalidad (`strict`, `noUnusedLocals`, `noUnusedParameters`). Todos los modelos de dominio y DTOs son interfaces tipadas que replican exactamente el contrato del backend.

**React 19** — biblioteca principal de UI. La aplicación no utiliza un router externo; la navegación entre páginas se maneja con un estado discriminado (`EstadoPagina`) en el componente raíz `App`.

**Vite 7 con plugin React (SWC)** — servidor de desarrollo y bundler de producción. SWC reemplaza a Babel para transpilación, reduciendo los tiempos de arranque y recarga en caliente.

**Axios 1.x** — cliente HTTP que gestiona la comunicación con el backend. Centralizado en `ProgramacionLinealService`, que encapsula el parseo de la entrada del usuario y la construcción del payload antes del envío.

**KaTeX 0.16 + react-katex** — renderizado de expresiones matemáticas en formato LaTeX. Convierte la entrada en texto plano a notación matemática tipográfica en tiempo real mientras el usuario escribe.

**Plotly.js (dist-min) + react-plotly.js** — visualización del gráfico de región factible. La distribución minificada reduce el tamaño del bundle. Dado que la librería carece de tipos oficiales, el proyecto incluye una declaración manual en `react-plotly.d.ts`.

**Framer Motion 12** — animaciones de entrada para cada tableau Simplex. Cada iteración aparece con una transición de opacidad y desplazamiento vertical al ser cargada.

**ESLint 9** con `typescript-eslint`, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh` — análisis estático del código durante el desarrollo.

---

## Estructura del Proyecto

```text
programacion-lineal-frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── react-plotly.d.ts
    ├── service/
    │   └── ProgramacionLinealService.tsx
    ├── models/
    │   ├── domain/
    │   │   ├── Termino.tsx
    │   │   ├── Restriccion.tsx
    │   │   ├── FuncionObjetivo.tsx
    │   │   ├── Tipo.tsx
    │   │   ├── MetodoTipo.tsx
    │   │   ├── Operador.tsx
    │   │   ├── ProblemaPL.tsx
    │   │   └── MatrizSimplex.tsx
    │   └── dtos/
    │       ├── SolicitudProblema.tsx
    │       └── SolicitudRespuesta.tsx
    └── boundaries/
        ├── landingPage/
        │   ├── LandingPage.tsx
        │   └── LandingPage.module.css
        └── solutionPage/
            ├── SolutionPage.tsx
            ├── SolutionPage.module.css
            └── components/
                ├── SimplexTableau.tsx
                └── FeasibilityGraph.tsx
```

### Responsabilidades por capa

**`service/`** — Única capa que conoce la URL del backend. `ProgramacionLinealService` recibe los textos crudos del formulario, los parsea a estructuras tipadas mediante expresiones regulares, construye el DTO de solicitud y realiza el `POST`. Toda la lógica de conversión de cadenas a objetos de dominio vive aquí, aislada de los componentes visuales.

**`models/domain/`** — Espejo tipado del modelo de dominio del backend. Cada archivo exporta una interfaz o un objeto constante (`as const`) que actúa simultáneamente como tipo y como enum de valores en tiempo de ejecución. `MatrizSimplex` es la estructura más compleja: representa un tableau completo con todas sus filas (Cj, etiquetas, Zj, Cj-Zj), columnas (CB, base, VLD) y la indicación del pivote para la siguiente iteración.

**`models/dtos/`** — Contratos de entrada y salida de la API. `SolicitudProblema` es lo que el frontend envía; `SolicitudRespuesta` es lo que recibe. La separación respecto a `domain/` hace explícito qué estructuras cruzan la red y cuáles son solo internas.

**`boundaries/landingPage/`** — Página de entrada al flujo. Contiene el formulario completo de configuración del modelo: selección del tipo de optimización, entrada de la función objetivo, selección del método y área de restricciones. También gestiona la previsualización LaTeX en tiempo real y el estado de carga durante la llamada al backend.

**`boundaries/solutionPage/`** — Página de resultados. Orquesta la visualización progresiva de las iteraciones y decide el layout según la cantidad de variables de decisión detectadas: dos columnas si el problema es graficable (exactamente 2 variables), columna única en caso contrario.

**`boundaries/solutionPage/components/`** — Componentes de presentación puros que no realizan llamadas ni gestionan estado propio. `SimplexTableau` recibe un único `MatrizSimplex` y lo renderiza como tabla HTML con resaltado de celdas según el rol de cada variable en la iteración (pivote, entrante, saliente). `FeasibilityGraph` recibe las restricciones y la solución básica factible actual, calcula algebraicamente los vértices de la región factible e invoca Plotly para dibujar las líneas de restricción, el polígono relleno y el punto BFS.

---

## Comunicación con el Backend

### Flujo de datos

El usuario ingresa la función objetivo y las restricciones como texto plano. Al enviar el formulario, el servicio parsea esas cadenas, construye un objeto `SolicitudProblema` y lo envía al backend. La respuesta (`SolicitudRespuesta`) contiene el problema resuelto con la lista completa de iteraciones, que `SolutionPage` consume para renderizar cada tableau de forma progresiva.

```text
LandingPage
    │
    │  Input: "5x1 + 4x2" / "6x1 + 4x2 <= 24" / metodo: simplex / tipo: MAX
    ▼
ProgramacionLinealService.ResolverProblemaPL()
    │
    │  1. ConvertirTermino()  →  Termino[]
    │  2. ConvertirRestricciones()  →  Restriccion[]
    │  3. axios.post("/api/pl/resolver", SolicitudProblema)
    ▼
Backend (Spring Boot :8080)
    │
    │  Resuelve → devuelve SolicitudRespuesta
    ▼
App.tsx  →  setEstadoPagina({ pagina: 'solucion', respuesta })
    │
    ▼
SolutionPage
    ├── SimplexTableau (× n iteraciones, carga progresiva)
    └── FeasibilityGraph (solo si variables_decision.length === 2)
```

### Objeto enviado — `SolicitudProblema`

El servicio construye este objeto a partir del texto ingresado por el usuario. La conversión de la cadena de texto a `Termino[]` utiliza la expresión regular `/^([+-]?\d*\.?\d*)?([a-zA-Z]\d*)?(?:\^(\d+))?$/` aplicada término a término. Los operadores de restricción (`<=`, `>=`, `=`, sus variantes) se normalizan mediante `mapeo_operador` antes de construir cada `Restriccion`.

```typescript
// Tipos involucrados en la solicitud

interface SolicitudProblema {
  metodo_tipo: "simplex" | "base_artificial";
  problema: ProblemaPL;
}

interface ProblemaPL {
  funcion_objetivo: FuncionObjetivo;
  restricciones:    Restriccion[];
  iteraciones?:     MatrizSimplex[];   // null al enviar
}

interface FuncionObjetivo {
  tipo:    "MAX" | "MIN";
  termino: Termino[];
}

interface Restriccion {
  funcion_restricciones: Termino[];
  operador:              "menor_igual" | "mayor_igual" | "igual" | "menor" | "mayor";
  valor_lado_derecho:    number;
}

interface Termino {
  coeficiente: number;   // Coeficiente numérico del término
  variable:    string;   // Nombre de la variable ("x1", "x2", "")
  exponente:   number;   // Potencia de la variable (0 para constantes)
}
```

### Objeto recibido — `SolicitudRespuesta`

El backend devuelve el modelo enriquecido con la lista `iteraciones`, donde cada elemento es un tableau Simplex completo. `SolutionPage` calcula el valor óptimo Z* y los valores de las variables de decisión directamente desde el último elemento de esa lista.

```typescript
interface SolicitudRespuesta {
  mensaje:              string;      // Mensaje de estado del backend
  problema_solucionado: ProblemaPL;  // Problema con iteraciones resueltas
}

interface MatrizSimplex {
  fila_cj:              number[];    // Coeficientes de la función objetivo (fila superior)
  fila_etiqueta:        string[];    // Encabezados de columna: ["x1", "x2", "S1", ...]
  matriz_restricciones: number[][];  // Cuerpo principal del tableau
  fila_zj:              number[];    // Productos escalares CB × columna
  fila_cj_zj:           number[];    // Costos reducidos (criterio de optimalidad)
  columna_cb:           number[];    // Coeficientes de la base actual
  columna_base:         string[];    // Variables en la base actual
  columna_vld:          number[];    // Términos independientes (VLD / RHS)
  variable_entrada:     string | null;  // Variable que entra al pivoteo; null si óptimo
  variable_salida:      string | null;  // Variable que sale del pivoteo; null si óptimo
}
```

`variable_entrada === null` en el último elemento de `iteraciones` es la señal que usa `SolutionPage` para determinar que se alcanzó la solución óptima y mostrar la sección de resultados finales con Z* y los valores BFS.

### Manejo de errores

Los errores de comunicación y de validación se distinguen en dos niveles. El primer nivel ocurre en el servicio: si la función objetivo o las restricciones están vacías, `ResolverProblemaPL` lanza un `Error` antes de realizar cualquier petición HTTP. El segundo nivel ocurre durante la llamada a Axios: si el backend responde con un código de error (por ejemplo, al detectar una solución no acotada o un modelo inválido), el bloque `catch` captura la excepción y extrae el mensaje mediante `error.message`.

En ambos casos, `LandingPage` recibe el mensaje de error a través del `catch` de `ManejarEnvio` y lo almacena en el estado `error: string | null`, que se renderiza como un bloque destacado sobre el botón de envío. El estado de carga (`cargando`) se desactiva en el bloque `finally`, garantizando que el botón quede habilitado independientemente del resultado.

---

## Ejecución local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build
```

El backend debe estar corriendo en `http://localhost:8080` antes de usar la aplicación. La URL está definida como constante en `src/service/ProgramacionLinealService.tsx`.

---

## Autores

Terreno Monla, Florencia Sofia — Universidad Tecnológica Nacional
