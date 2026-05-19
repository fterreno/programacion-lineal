from flask import Blueprint, jsonify, render_template, request
from entidades.tipo import Tipo
from entidades.metodo_tipo import MetodoTipo
from boundary.parsers.parser_pl import parsear_funcion_objetivo, parsear_restricciones

from controller.resolutor_pl import ResolutorPL

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    return render_template("pagina-inicio.html", tipos=Tipo, metodos_tipos=MetodoTipo)


@bp.route("/resolver", methods=["POST"])
def resolver():
    funcion_objetivo = request.form.get("funcion-objetivo", "").strip()
    restricciones = request.form.get("restricciones", "").strip()
    tipo = request.form.get("tipo", "").strip()
    metodo_tipo = request.form.get("metodo-tipo", "").strip()
    

    if not all([funcion_objetivo, metodo_tipo, restricciones, tipo]):
        return {"error": "Todos los campos son obligatorios"}, 400
    else:
        funcion_objetivo = parsear_funcion_objetivo(funcion_objetivo, tipo)
        restricciones = parsear_restricciones(restricciones)

    ResolutorPL.resolver(funcion_objetivo, restricciones, metodo_tipo)

    return jsonify({"message": "OK"}), 200
