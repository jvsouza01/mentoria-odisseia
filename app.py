import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, Date
from datetime import datetime, timedelta

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO DE DADOS ---
db_url = os.environ.get("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELOS DO BANCO DE DADOS ---
class Alunos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class RegistrosQuestoes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    quantidade_questoes = db.Column(db.Integer, nullable=False)
    acertos = db.Column(db.Integer, nullable=False)
    data_registro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    aluno = db.relationship('Alunos', backref=db.backref('registros_questoes', lazy=True)) # Alterado backref

# --- NOVOS MODELOS PARA A FUNCIONALIDADE DE SIMULADOS ---
class Empresas(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class Simulados(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)
    numero = db.Column(db.Integer, nullable=True) # Pode ser nulo para nomes especiais
    nome_especifico = db.Column(db.String(100), nullable=True) # Ex: "Simulado de Véspera"
    categoria = db.Column(db.String(50), nullable=False) # 'Soldado' ou 'Oficial'
    data_realizacao = db.Column(db.Date, nullable=False)
    empresa = db.relationship('Empresas', backref=db.backref('simulados', lazy=True))

class ResultadosSimulados(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    simulado_id = db.Column(db.Integer, db.ForeignKey('simulados.id'), nullable=False)
    nota = db.Column(db.Float, nullable=False)
    aluno = db.relationship('Alunos', backref=db.backref('resultados_simulados', lazy=True)) # Alterado backref
    simulado = db.relationship('Simulados', backref=db.backref('resultados_simulados', lazy=True)) # Alterado backref


# --- ROTA PARA CONFIGURAR O BANCO DE DADOS ---
# (Manteremos esta rota para criar as novas tabelas)
@app.route('/_iniciar_banco_de_dados_uma_vez')
def iniciar_banco():
    try:
        db.create_all()
        return "Tabelas verificadas/criadas com sucesso!", 200
    except Exception as e:
        return f"Ocorreu um erro ao criar as tabelas: {e}", 500

# (Todo o resto do seu código de rotas continua aqui, sem alterações por enquanto)
# ... (função get_start_of_week, rotas /, /api/alunos, /api/registros, etc.) ...
def get_start_of_week():
    today = datetime.utcnow()
    days_since_sunday = (today.weekday() - 6 + 7) % 7
    start_of_week = today - timedelta(days=days_since_sunday)
    return start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/alunos', methods=['GET'])
def get_alunos():
    alunos = Alunos.query.order_by(Alunos.nome).all()
    return jsonify([{'id': aluno.id, 'nome': aluno.nome} for aluno in alunos])

@app.route('/api/registros', methods=['POST'])
def add_registro():
    dados = request.get_json()
    novo_registro = RegistrosQuestoes(aluno_id=dados['aluno_id'], quantidade_questoes=dados['quantidade'], acertos=dados['acertos'])
    db.session.add(novo_registro)
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/registros/recentes', methods=['GET'])
def get_registros_recentes():
    registros = RegistrosQuestoes.query.order_by(RegistrosQuestoes.id.desc()).limit(10).all()
    lista_registros = [{'id': r.id, 'aluno_nome': r.aluno.nome, 'questoes': r.quantidade_questoes, 'acertos': r.acertos} for r in registros]
    return jsonify(lista_registros)

@app.route('/api/registros/<int:registro_id>', methods=['DELETE'])
def delete_registro(registro_id):
    registro = RegistrosQuestoes.query.get_or_404(registro_id)
    db.session.delete(registro)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Registro apagado.'})

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    start_of_week = get_start_of_week()
    conn = db.session.connection()
    query_qtd = text('SELECT a.nome, SUM(r.quantidade_questoes) as total FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro >= :start_date GROUP BY a.nome ORDER BY total DESC LIMIT 10')
    ranking_quantidade = conn.execute(query_qtd, {'start_date': start_of_week}).mappings().all()
    query_perc = text('SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro >= :start_date GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20 ORDER BY percentual DESC LIMIT 10')
    ranking_percentual = conn.execute(query_perc, {'start_date': start_of_week}).mappings().all()
    return jsonify({'quantidade': [dict(row) for row in ranking_quantidade], 'percentual': [dict(row) for row in ranking_percentual]})

@app.route('/ranking-geral')
def ranking_geral():
    return render_template('ranking_geral.html')

@app.route('/api/rankings/geral', methods=['GET'])
def get_rankings_gerais():
    conn = db.session.connection()
    query_qtd = text('SELECT a.nome, SUM(r.quantidade_questoes) as total FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id GROUP BY a.nome ORDER BY total DESC')
    ranking_quantidade = conn.execute(query_qtd).mappings().all()
    query_perc = text('SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 0 ORDER BY percentual DESC')
    ranking_percentual = conn.execute(query_perc).mappings().all()
    return jsonify({'quantidade': [dict(row) for row in ranking_quantidade], 'percentual': [dict(row) for row in ranking_percentual]})