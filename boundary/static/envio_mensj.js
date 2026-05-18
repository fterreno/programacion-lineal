
async function manejarEnvio() {
    const btn = document.getElementById('btn-calcular');
    const fo = document.getElementById('funcion-objetivo').value.trim();
    const restricciones = document.getElementById('restricciones').value.trim();
    const metodoTipo = document.getElementById('metodo-tipo').value;

    if (!fo || !restricciones) {
        alert('Por favor completá la función objetivo y las restricciones.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Calculando...';

    try {
        const respuesta = await fetch('/api/pl/resolver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                funcion_objetivo: fo,
                restricciones: restricciones,
                metodo_tipo: metodoTipo,
                tipo: tipo
            })
        });

        if (!respuesta.ok) {
            const err = await respuesta.json();
            alert(`Error: ${err.message || 'Error desconocido'}`);
            return;
        }

        const datos = await respuesta.json();
        console.log('Respuesta:', datos);

    } catch (err) {
        alert(`Error de conexión: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Calcular Solución Óptima';
    }
}