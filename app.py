import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime, timedelta

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO DE DADOS (não muda) ---
db_url = os.environ.get("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELOS DO BANCO DE DADOS (não muda) ---
class Alunos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class RegistrosQuestoes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    quantidade_questoes = db.Column(db.Integer, nullable=False)
    acertos = db.Column(db.Integer, nullable=False)
    data_registro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    aluno = db.relationship('Alunos', backref=db.backref('registros', lazy=True))

# --- FUNÇÃO HELPER PARA CALCULAR O INÍCIO DA SEMANA ---
def get_start_of_week():
    """Calcula a data do último sábado à meia-noite."""
    today = datetime.utcnow()
    # O dia da semana do Python é 0=Segunda, 5=Sábado, 6=Domingo
    # Queremos voltar para o último sábado (weekday == 5)
    days_since_saturday = (today.weekday() - 5 + 7) % 7
    start_of_week = today - timedelta(days=days_since_saturday)
    return start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

# --- ROTAS DA APLICAÇÃO ---

@app.route('/')
def index():
    return render_template('index.html')

# (As rotas de alunos e de adicionar/apagar registros não mudam)
@app.route('/api/alunos', methods=['GET'])
def get_alunos():
    alunos = Alunos.query.order_by(Alunos.nome).all()
    return jsonify([{'id': aluno.id, 'nome': aluno.nome} for aluno in alunos])

@app.route('/api/registros', methods=['POST'])
def add_registro():
    dados = request.get_json()
    novo_registro = RegistrosQuestoes(
        aluno_id=dados['aluno_id'],
        quantidade_questoes=dados['quantidade'],
        acertos=dados['acertos']
    )
    db.session.add(novo_registro)
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/registros/recentes', methods=['GET'])
def get_registros_recentes():
    registros = RegistrosQuestoes.query.order_by(RegistrosQuestoes.id.desc()).limit(10).all()
    lista_registros = []
    for r in registros:
        lista_registros.append({
            'id': r.id,
            'aluno_nome': r.aluno.nome,
            'questoes': r.quantidade_questoes,
            'acertos': r.acertos
        })
    return jsonify(lista_registros)

@app.route('/api/registros/<int:registro_id>', methods=['DELETE'])
def delete_registro(registro_id):
    registro = RegistrosQuestoes.query.get_or_404(registro_id)
    db.session.delete(registro)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Registro apagado.'})


# ROTA MODIFICADA: Agora mostra o ranking DA SEMANA
@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    start_of_week = get_start_of_week()
    conn = db.session.connection()
    
    # Adicionamos a condição "WHERE r.data_registro >= :start_date"
    query_qtd = text('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        WHERE r.data_registro >= :start_date
        GROUP BY a.nome ORDER BY total DESC LIMIT 10
    ''')
    ranking_quantidade = conn.execute(query_qtd, {'start_date': start_of_week}).mappings().all()
    
    query_perc = text('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        WHERE r.data_registro >= :start_date
        GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20
        ORDER BY percentual DESC LIMIT 10
    ''')
    ranking_percentual = conn.execute(query_perc, {'start_date': start_of_week}).mappings().all()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })


# --- ROTAS PARA A PÁGINA DE RANKING GERAL (ALL-TIME) ---

# Renomeamos a rota para refletir que é o ranking geral
@app.route('/ranking-geral')
def ranking_geral():
    return render_template('ranking_geral.html')

# Renomeamos a API para refletir que são os dados gerais
@app.route('/api/rankings/geral', methods=['GET'])
def get_rankings_gerais():
    conn = db.session.connection()
    
    # Esta é a consulta original, sem filtro de data
    query_qtd = text('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome ORDER BY total DESC
    ''')
    ranking_quantidade = conn.execute(query_qtd).mappings().all()
    
    query_perc = text('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 0
        ORDER BY percentual DESC
    ''')
    ranking_percentual = conn.execute(query_perc).mappings().all()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })