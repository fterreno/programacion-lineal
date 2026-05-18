let tipo = 'MAX';

function setTipo(nuevoTipo) {
    tipo = nuevoTipo;
    document.getElementById('btn-max').classList.toggle('active-tab', tipo === 'MAX');
    document.getElementById('btn-min').classList.toggle('active-tab', tipo === 'MIN');
    actualizarKatex();
}