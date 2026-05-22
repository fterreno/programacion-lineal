
function convertirAKaTeX(input) {
    if (!input) return '';
    return input
        .replace(/x(\d+)/g, 'x_{$1}')
        .replace(/\^(\d+)/g, '^{$1}')
        .replace(/<=/g, '\\le ')
        .replace(/>=/g, '\\ge ');
}

function actualizarKatex() {
    const fo = document.querySelector('[name="funcion-objetivo"]').value.trim();
    const restricciones = document.querySelector('[name="restricciones"]').value.trim();
    const bloque = document.getElementById('katex-block');
    const output = document.getElementById('katex-output');

    if (!fo) { bloque.style.display = 'none'; return; }

    const lineas = restricciones
        ? restricciones.split('\n').map(convertirAKaTeX).join(' \\\\ ')
        : '';

    const latex = `
        \\begin{aligned}
          &\\text{${document.querySelector('.toggle-group .active-tab')?.value === 'MAX' ? 'Max' : 'Min'}}\\ Z = ${convertirAKaTeX(fo)} \\\\
          ${lineas ? `&\\text{S.A.} \\\\ &\\begin{cases} ${lineas} \\end{cases}` : ''}
        \\end{aligned}
    `;

    try {
        katex.render(latex, output, { displayMode: true, throwOnError: false });
        bloque.style.display = 'block';
    } catch (e) {
        bloque.style.display = 'none';
    }
}