from flask import Blueprint, jsonify, render_template, request, redirect, url_for

bp = Blueprint("main", __name__)

@bp.route("/")
def index():
    return render_template("pagina-inicio.html")
