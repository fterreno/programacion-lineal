import json
from enum import Enum

from flask import Blueprint, render_template, request
from entidades.tipo import Tipo
from entidades.metodo_tipo import MetodoTipo
from boundary.parsers.parser_pl import parsear_funcion_objetivo, parsear_restricciones, parsear_problema
from controller.resolutor_pl import ResolutorPL

bp = Blueprint("main", __name__)


def _serializar(obj):
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, list):
        return [_serializar(i) for i in obj]
    if hasattr(obj, '__dict__'):
        return {k: _serializar(v) for k, v in obj.__dict__.items()}
    return obj


@bp.route("/")
def index():
    return render_template("pagina-inicio.html", tipos=Tipo, metodos_tipos=MetodoTipo)


@bp.route("/resolver", methods=["POST"])
def resolver():
    funcion_objetivo = request.form.get("funcion-objetivo", "").strip()
    restricciones = request.form.get("restricciones", "").strip() # se debe impedir cargar variables con s o a!!
    tipo = request.form.get("tipo", "").strip()
    metodo_tipo = request.form.get("metodo-tipo", "").strip()

    if not all([funcion_objetivo, metodo_tipo, restricciones, tipo]):
        return {"error": "Todos los campos son obligatorios"}, 400

    try:
        problema = parsear_problema(
            metodo_tipo,
            parsear_funcion_objetivo(funcion_objetivo, Tipo[tipo]),
            parsear_restricciones(restricciones)
        )
        resolutor = ResolutorPL()
        respuesta = resolutor.resolver(problema)
    except ValueError as e:
        return {"error": str(e)}, 422

    return render_template("solucion.html", respuesta_json=json.dumps(_serializar(respuesta)))