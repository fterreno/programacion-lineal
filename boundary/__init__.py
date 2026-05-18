from flask import Flask

def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="static")

    # registrar el blueprint
    from .rutas.main import bp as main_bp
    app.register_blueprint(main_bp)

    return app