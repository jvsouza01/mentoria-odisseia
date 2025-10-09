from flask import Flask, render_template, jsonify, request
import sqlite3
from datetime import datetime

app = Flask(__name__)

# --- ROTA PRINCIPAL ---
@app.route('/')
def index():
    return render_template('index.html')

# --- API: ROTAS DE DADOS ---

# Rota para buscar a lista de todos os alunos
@app.route('/api/alunos', methods=['GET'])
def get_alunos():
    conn = sqlite3.connect('mentoria.db')
    conn.row_factory = sqlite3.Row # Permite acessar colunas pelo nome
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alunos ORDER BY nome')
    alunos = cursor.fetchall()
    conn.close()
    # Transforma os resultados em uma lista de dicionários
    return jsonify([dict(aluno) for aluno in alunos])

# Rota para adicionar um novo registro de questões
@app.route('/api/registros', methods=['POST'])
def add_registro():
    dados = request.get_json()
    
    aluno_id = dados['aluno_id']
    quantidade = dados['quantidade']
    acertos = dados['acertos']
    data_hoje = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = sqlite3.connect('mentoria.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO registros_questoes (aluno_id, quantidade_questoes, acertos, data_registro) VALUES (?, ?, ?, ?)',
        (aluno_id, quantidade, acertos, data_hoje)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'sucesso'}), 201

# Rota para buscar os rankings
@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    conn = sqlite3.connect('mentoria.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Ranking 1: Quantidade de questões
    cursor.execute('''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r
        JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome
        ORDER BY total DESC
        LIMIT 5
    ''')
    ranking_quantidade = cursor.fetchall()

    # Ranking 2: Percentual de acertos (com mínimo de 20 questões para ser justo)
    cursor.execute('''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r
        JOIN alunos a ON a.id = r.aluno_id
        GROUP BY a.nome
        HAVING SUM(r.quantidade_questoes) > 20
        ORDER BY percentual DESC
        LIMIT 5
    ''')
    ranking_percentual = cursor.fetchall()
    conn.close()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })


if __name__ == '__main__':
    app.run(debug=True)