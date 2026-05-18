from flask import Blueprint, jsonify, render_template, request, redirect, url_for, send_from_directory, current_app
import os

bp = Blueprint("main", __name__)

@bp.route("/")
def index():
    return render_template("pagina-inicio.html")

@bp.route("/resolverpl")
def index():
    return

@bp.route("/resultado")
def index():
    return render_template("pagina-inicio.html")