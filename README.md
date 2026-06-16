# Programacion Lineal - Solver

Aplicacion web para resolver problemas de **Programacion Lineal** paso a paso, mostrando cada iteracion con tablas de pivoteo detalladas.

### [Usar la aplicacion](https://fterreno.pythonanywhere.com)

---

## Funcionalidades

- **Metodo Simplex** y **Base Artificial** (Gran M)
- Problemas de **maximizacion** y **minimizacion**
- Iteraciones detalladas con tablas de pivoteo
- Manejo automatico de variables de holgura, exceso y artificiales
- Vista previa del modelo en notacion matematica (KaTeX)
- Representacion grafica para modelos de 2 variables

## Como usar

1. Elegir el tipo de optimizacion: **Maximo** o **Minimo**
2. Ingresar la **funcion objetivo**, por ejemplo: `3x1 + 2x2`
3. Ingresar las **restricciones**, una por linea:
   ```
   2x1 + x2 <= 10
   x1 + 3x2 >= 15
   ```
4. Seleccionar el **metodo de resolucion** (Simplex o Base Artificial)
5. Hacer clic en **Calcular Solucion Optima**

## Ejemplo

**Funcion objetivo:**
```
3x1 + 5x2
```

**Restricciones:**
```
x1 <= 4
2x2 <= 12
3x1 + 5x2 <= 25
```

**Tipo:** Maximo | **Metodo:** Simplex

## Ejecucion local

```bash
# Clonar el repositorio
git clone https://github.com/fterreno/programacion-lineal.git
cd programacion-lineal

# Crear entorno virtual e instalar dependencias
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Ejecutar
python main.py
```

O directamente con PowerShell:
```powershell
.\run.ps1
```

La app se levanta en `http://localhost:5000`.

## Tecnologias

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JavaScript, KaTeX
- **Hosting:** PythonAnywhere
