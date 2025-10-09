import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text # Import 'text' para rodar SQL puro quando precisarmos
from datetime import datetime

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO DE DADOS cfg ---
# Pega a URL do banco de dados da variável de ambiente que vamos criar no Render
db_url = os.environ.get("DATABASE_URL")
# O Render usa 'postgres://', mas o SQLAlchemy espera 'postgresql://'. Fazemos a troca.
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- MODELOS DO BANCO DE DADOS (A estrutura das nossas tabelas em Python) ---
class Alunos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class RegistrosQuestoes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    quantidade_questoes = db.Column(db.Integer, nullable=False)
    acertos = db.Column(db.Integer, nullable=False)
    data_registro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# --- ROTAS DA APLICAÇÃO ---
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
    # Para queries complexas como essa, usar SQL puro ainda é uma ótima opção.
    
    # Ranking de Quantidade
    query_qtd = text('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome ORDER BY total DESC LIMIT 5
    ''')
    # Usamos .all() para compatibilidade com a nova versão do SQLAlchemy
    ranking_quantidade = db.session.execute(query_qtd).mappings().all()
    
    # Ranking de Percentual
    query_perc = text('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20
        ORDER BY percentual DESC LIMIT 5
    ''')
    # Usamos .mappings().all() para obter uma lista de dicionários
    ranking_percentual = db.session.execute(query_perc).mappings().all()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })

# ... (seu código anterior, incluindo a definição da classe RegistrosQuestoes) ...

# --- ROTA SECRETA PARA INICIAR O BANCO DE DADOS ---
# ATENÇÃO: USAR APENAS UMA VEZ E DEPOIS REMOVER POR SEGURANÇA
@app.route('/_iniciar_banco_de_dados_uma_vez')
def iniciar_banco():
    try:
        # Garante que todas as tabelas existam
        db.create_all()
        
        # Lista completa de alunos que devem existir no banco
        lista_de_alunos = [
            'Vithor', 'Andressa', 'Mariana', 'Rodrigo', 'Dhomini', 
            'Isaac', 'Marco Antonio', 'Leonardo', 'Nelson', 'Santiago'
        ]
        
        alunos_adicionados = 0
        
        # Itera sobre a lista de nomes
        for nome_aluno in lista_de_alunos:
            # Verifica se o aluno já existe no banco de dados
            existe = Alunos.query.filter_by(nome=nome_aluno).first()
            
            # Se não existe, adiciona o novo aluno
            if not existe:
                novo_aluno = Alunos(nome=nome_aluno)
                db.session.add(novo_aluno)
                alunos_adicionados += 1
        
        # Salva todas as novas adições no banco de uma vez
        db.session.commit()
        
        return f"Verificação concluída. {alunos_adicionados} novos alunos foram adicionados. O banco agora está atualizado!", 200
            
    except Exception as e:
        # Retorna uma mensagem de erro se algo der errado
        return f"Ocorreu um erro: {e}", 500

# --- ROTAS DA APLICAÇÃO ---
# ... (o resto do seu código com @app.route('/') etc. continua aqui) ...
# --- ROTA SECRETA PARA LIMPAR ALUNOS DE TESTE ---
# ATENÇÃO: USAR APENAS UMA VEZ E DEPOIS REMOVER POR SEGURANÇA
@app.route('/_limpar_alunos_de_teste')
def limpar_alunos_teste():
    try:
        # Nomes exatos dos alunos que queremos apagar
        nomes_para_apagar = ['João Victor', 'Maria Clara', 'Pedro Henrique']
        
        # Encontra todos os alunos cujos nomes estão na lista e os apaga
        alunos_apagados = Alunos.query.filter(Alunos.nome.in_(nomes_para_apagar)).delete(synchronize_session=False)
        
        # Salva a alteração (a exclusão) no banco de dados
        db.session.commit()
        
        if alunos_apagados > 0:
            return f"{alunos_apagados} aluno(s) de teste foram removidos com sucesso!", 200
        else:
            return "Nenhum aluno de teste encontrado para remover.", 200

    except Exception as e:
        return f"Ocorreu um erro ao limpar os alunos: {e}", 500