import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime

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
    # Adicionamos um relacionamento para facilitar a busca do nome do aluno
    aluno = db.relationship('Alunos', backref=db.backref('registros', lazy=True))


# --- ROTAS DA APLICAÇÃO ---
@app.route('/')
def index():
    return render_template('index.html')

# (As rotas /api/alunos, /api/registros, /api/rankings continuam as mesmas...)
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

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    # Adicionamos prints para ver o que está acontecendo nos logs do Render
    print("--- Iniciando get_rankings ---")
    
    conn = db.session.connection() # Usamos uma conexão para garantir que estamos na mesma sessão
    
    # Ranking de Quantidade
    query_qtd = text('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome ORDER BY total DESC LIMIT 10
    ''')
    ranking_quantidade = conn.execute(query_qtd).mappings().all()
    print(f"Resultado do ranking de quantidade: {ranking_quantidade}")

    # Ranking de Percentual
    query_perc = text('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20
        ORDER BY percentual DESC LIMIT 10
    ''')
    ranking_percentual = conn.execute(query_perc).mappings().all()
    print(f"Resultado do ranking de percentual: {ranking_percentual}")
    
    # Prepara a resposta final
    json_response = {
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    }
    print(f"JSON final a ser enviado: {json_response}")
    print("--- Finalizando get_rankings ---")

    return jsonify(json_response)

# --- NOVAS ROTAS PARA GERENCIAMENTO ---

# NOVA ROTA para buscar os 10 últimos lançamentos
@app.route('/api/registros/recentes', methods=['GET'])
def get_registros_recentes():
    # Busca os 10 últimos registros, ordenando pelo ID decrescente
    registros = RegistrosQuestoes.query.order_by(RegistrosQuestoes.id.desc()).limit(10).all()
    
    # Cria uma lista de dicionários com as informações que queremos mostrar
    lista_registros = []
    for r in registros:
        lista_registros.append({
            'id': r.id,
            'aluno_nome': r.aluno.nome,
            'questoes': r.quantidade_questoes,
            'acertos': r.acertos
        })
    return jsonify(lista_registros)

# NOVA ROTA para apagar um lançamento específico
@app.route('/api/registros/<int:registro_id>', methods=['DELETE'])
def delete_registro(registro_id):
    # Encontra o registro pelo ID ou retorna um erro 404 se não encontrar
    registro = RegistrosQuestoes.query.get_or_404(registro_id)
    
    # Apaga o registro do banco de dados
    db.session.delete(registro)
    db.session.commit()
    
    return jsonify({'status': 'sucesso', 'mensagem': 'Registro apagado.'})

# --- ROTAS PARA A PÁGINA DE RANKING COMPLETO ---

# Rota para servir a nova página HTML
@app.route('/ranking-completo')
def ranking_completo():
    return render_template('ranking_completo.html')

# Rota de API para fornecer os dados dos rankings completos
@app.route('/api/rankings/completo', methods=['GET'])
def get_rankings_completos():
    conn = db.session.connection()
    
    # Ranking de Quantidade (sem LIMIT)
    query_qtd = text('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome ORDER BY total DESC
    ''')
    ranking_quantidade = conn.execute(query_qtd).mappings().all()
    
    # Ranking de Percentual (sem LIMIT e sem o HAVING, para que todos apareçam)
    query_perc = text('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome
        HAVING SUM(r.quantidade_questoes) > 0
        ORDER BY percentual DESC
    ''')
    ranking_percentual = conn.execute(query_perc).mappings().all()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })