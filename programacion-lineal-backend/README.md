# Programación Lineal — Backend

API REST desarrollada con Spring Boot que resuelve problemas de Programación Lineal mediante el algoritmo Simplex. Recibe un modelo matemático desde el frontend, lo procesa iterativamente y devuelve cada matriz del proceso de optimización.

---

## Lenguajes y Tecnologías

**Lenguaje:** Java 17

**Framework principal:** Spring Boot 4.0.1 — gestiona el ciclo de vida de la aplicación, inyección de dependencias y exposición del servidor HTTP embebido (Tomcat en puerto `8080`).

**Spring Web MVC** — habilita el modelo REST con `@RestController`, manejo de `@RequestBody` / `@ResponseBody` y deserialización automática de JSON mediante Jackson.

**Project Lombok** — reduce el código boilerplate mediante anotaciones como `@Data`, `@Getter` y `@AllArgsConstructor`. Es excluido del artefacto final por el plugin de Maven.

**Jackson Databind** (incluido en Spring Web) — serializa y deserializa los objetos de dominio a JSON, incluyendo la conversión de enums mediante `@JsonProperty`.

**Maven** — gestiona el ciclo de construcción, las dependencias y la generación del artefacto ejecutable `.jar`.

---

## Estructura del Proyecto

```
programacion-lineal-backend/
├── src/
│   ├── main/
│   │   ├── java/terreno/programacionlinealbackend/
│   │   │   ├── ProgramacionLinealBackendApplication.java
│   │   │   ├── controller/
│   │   │   │   └── ProgramacionLinealController.java
│   │   │   ├── models/
│   │   │   │   ├── DTOs/
│   │   │   │   │   ├── SolicitudProblema.java
│   │   │   │   │   └── SolicitudRespuesta.java
│   │   │   │   └── domain/
│   │   │   │       ├── FuncionObjetivo.java
│   │   │   │       ├── MatrizSimplex.java
│   │   │   │       ├── MetodoTipo.java
│   │   │   │       ├── Operador.java
│   │   │   │       ├── ProblemaPL.java
│   │   │   │       ├── Restriccion.java
│   │   │   │       ├── Termino.java
│   │   │   │       └── Tipo.java
│   │   │   └── strategy/
│   │   │       ├── MetodosPL.java
│   │   │       ├── MetodoSimplex.java
│   │   │       └── MetodoBaseArtificial.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/terreno/programacionlinealbackend/
│           └── ProgramacionLinealBackendApplicationTests.java
└── pom.xml
```

### Responsabilidades por capa

**`controller/`** — Punto de entrada HTTP. `ProgramacionLinealController` recibe la solicitud del frontend, selecciona el algoritmo correcto mediante un `switch` sobre `MetodoTipo` y delega la resolución a la estrategia correspondiente. Configura CORS para permitir peticiones desde `http://localhost:5173`.

**`models/DTOs/`** — Contratos de comunicación con el exterior. `SolicitudProblema` define exactamente qué acepta la API (método de resolución + modelo matemático), y `SolicitudRespuesta` define qué devuelve (mensaje de estado + problema con todas sus iteraciones resueltas). Estas clases actúan como frontera entre la red y el dominio interno.

**`models/domain/`** — Representación completa del dominio matemático. `ProblemaPL` es la clase central: orquesta la validación del modelo, la canonización de restricciones (adición de variables de holgura, normalización de términos independientes negativos) y la ejecución del método pivote. `MatrizSimplex` encapsula un tableau completo con su lógica de cálculo de filas Zj, Cj−Zj y selección de variables. El resto de clases (`FuncionObjetivo`, `Restriccion`, `Termino`) representan las partes constitutivas del modelo con sus propias validaciones y transformaciones.

**`strategy/`** — Implementaciones intercambiables del algoritmo. `MetodosPL` define la interfaz común con un único método `resolver(ProblemaPL)`. `MetodoSimplex` implementa el algoritmo Simplex Primal en dos fases: inicialización de la base factible y ciclo iterativo hasta optimalidad. `MetodoBaseArtificial` está reservado para problemas con restricciones de igualdad o `≥` que requieren variables artificiales.

---

## Comunicación con el Frontend

### Flujo de datos

El frontend envía un `POST` a `/api/pl/resolver` con el modelo matemático serializado como JSON. El backend valida la estructura, canoniza el problema, ejecuta el algoritmo y responde con el problema completo incluyendo cada iteración del tableau. El frontend renderiza cada `MatrizSimplex` de la lista `iteraciones` de forma progresiva.

```
Frontend (React)
    │
    │  POST /api/pl/resolver
    │  Content-Type: application/json
    │  Body: SolicitudProblema
    ▼
ProgramacionLinealController
    │
    │  switch (metodo_tipo)
    ▼
MetodoSimplex.resolver(ProblemaPL)
    │
    │  1. validar()
    │  2. agregarVariablesHolgura()
    │  3. generarMatrizInicial()
    │  4. while (!esSolucion) → variableEntrada → variableSalida → actualizarMatriz
    ▼
SolicitudRespuesta  ──────►  Frontend
```

### Objeto de solicitud — `SolicitudProblema`

El frontend envía un único objeto JSON con dos campos: el método de resolución seleccionado y el modelo matemático completo.

```json
{
  "metodo_tipo": "simplex",
  "problema": {
    "funcion_objetivo": {
      "tipo": "MAX",
      "termino": [
        { "coeficiente": 5, "variable": "x1", "exponente": 1 },
        { "coeficiente": 4, "variable": "x2", "exponente": 1 }
      ]
    },
    "restricciones": [
      {
        "funcion_restricciones": [
          { "coeficiente": 6, "variable": "x1", "exponente": 1 },
          { "coeficiente": 4, "variable": "x2", "exponente": 1 }
        ],
        "operador": "menor_igual",
        "valor_lado_derecho": 24
      }
    ]
  }
}
```

`metodo_tipo` acepta los valores `"simplex"` o `"base_artificial"`. Cada `Termino` describe un monómio: `coeficiente × variable^exponente`. El campo `valor_lado_derecho` corresponde al término independiente (RHS) de la restricción.

### Objeto de respuesta — `SolicitudRespuesta`

El backend devuelve el modelo enriquecido con todas las iteraciones del proceso de resolución. Cada elemento de `iteraciones` representa un tableau completo del método Simplex.

```json
{
  "mensaje": "Método Simplex ejecutado correctamente.",
  "problema_solucionado": {
    "funcion_objetivo": { ... },
    "restricciones": [ ... ],
    "iteraciones": [
      {
        "fila_cj":             [5, 4, 0, 0],
        "fila_etiqueta":       ["x1", "x2", "S1", "S2"],
        "columna_cb":          [0, 0],
        "columna_base":        ["S1", "S2"],
        "columna_vld":         [24, 6],
        "matriz_restricciones": [[6, 4, 1, 0], [1, 2, 0, 1]],
        "fila_zj":             [0, 0, 0, 0],
        "fila_cj_zj":          [5, 4, 0, 0],
        "variable_entrada":    "x1",
        "variable_salida":     "S2"
      }
    ]
  }
}
```

`fila_etiqueta` define el orden de las columnas del tableau. `columna_base` y `columna_vld` describen la solución básica factible actual. `variable_entrada` y `variable_salida` identifican el pivote hacia la siguiente iteración; en el tableau final ambos campos son `null`, indicando que se alcanzó la solución óptima.

### Manejo de errores

El backend no utiliza clases de excepción personalizadas. Ante cualquier condición inválida lanza `IllegalArgumentException` o `IllegalStateException` con un mensaje descriptivo. Spring Boot serializa automáticamente estas excepciones como respuestas HTTP con código `500` y un cuerpo JSON de error estándar.

Las condiciones de error más relevantes son: función objetivo vacía o con términos inválidos, variables de la función objetivo ausentes en las restricciones, solución no acotada (todas las razones mínimas son no positivas), y restricciones de igualdad enviadas al método Simplex estándar (que requieren el método de Base Artificial).

---

## Ejecución local

```bash
# Compilar y ejecutar
./mvnw spring-boot:run

# La API queda disponible en:
# http://localhost:8080/api/pl/resolver
```

El servidor acepta peticiones CORS únicamente desde `http://localhost:5173` (servidor de desarrollo del frontend).

---

## Autores

Terreno Monla, Florencia Sofia — Universidad Tecnológica Nacional
