function setTipo(nuevoTipo) {
    document.querySelectorAll('.toggle-group button').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(`btn-${nuevoTipo.toLowerCase()}`).classList.add('active-tab');
    document.getElementById('tipo-hidden').value = nuevoTipo;
    actualizarKatex();
}