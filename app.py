import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, func, Date
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO DE DADOS ---
db_url = os.environ.get("DATABASE_URL")
if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = 'sqlite:///local.db' # Fallback

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True}

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
    aluno = db.relationship('Alunos', backref=db.backref('registros_questoes', lazy=True))

class Empresas(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class Simulados(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)
    numero = db.Column(db.Integer, nullable=True)
    nome_especifico = db.Column(db.String(100), nullable=True)
    categoria = db.Column(db.String(50), nullable=False)
    data_realizacao = db.Column(db.Date, nullable=False)
    empresa = db.relationship('Empresas', backref=db.backref('simulados', lazy=True))

# --- MODELO 'ResultadosSimulados' ATUALIZADO ---
class ResultadosSimulados(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    simulado_id = db.Column(db.Integer, db.ForeignKey('simulados.id'), nullable=False)
    nota = db.Column(db.Float, nullable=False)
    
    # NOVAS COLUNAS (OPCIONAIS)
    tempo_total_gasto = db.Column(db.Integer, nullable=True) # Em minutos
    tempos_por_materia = db.Column(db.Text, nullable=True) # JSON como string
    
    aluno = db.relationship('Alunos', backref=db.backref('resultados_simulados', lazy=True))
    simulado = db.relationship('Simulados', backref=db.backref('resultados_simulados', lazy=True))

# --- TABELA 'TemposSimulado' FOI REMOVIDA ---
# (Não precisamos mais dela)

# --- ROTA DE SETUP ---
@app.route('/_iniciar_banco_de_dados_uma_vez')
def iniciar_banco():
    try:
        # 1. APAGA TUDO (FORÇA UMA REINSTALAÇÃO LIMPA)
        db.drop_all()
        
        # 2. Cria todas as tabelas (AGORA COM A ESTRUTURA CORRETA)
        db.create_all()
        
        # 3. Popula a lista de ALUNOS
        lista_alunos_final = [
            'Alan vitor', 'Andressa', 'Dann Silva', 'Davy', 'Dias', 'Dhomini', 
            'Eduardo', 'Eliaquim', 'Ell Souza', 'Ezequias', 'Flavia Andrade', 
            'Hélio', 'Ingrid', 'Isaac', 'Jonathan Estevam', 'Jovino', 'JP', 
            'Leonardo', 'Liu', 'Marcela', 'Marco Antônio', 'Marcos Vinicius', 
            'Mariana', 'Matheus Silva', 'MV', 'Nelson', 'Rafael', 'Rodrigo', 
            'Samuel', 'Santiago', 'Silva', 'Vinicius Felipe', 'Vithor', 'Yan'
        ]
        
        alunos_adicionados = 0
        for nome_aluno in lista_alunos_final:
            if not Alunos.query.filter_by(nome=nome_aluno).first():
                db.session.add(Alunos(nome=nome_aluno))
                alunos_adicionados += 1
        
        # 4. Popula a lista de EMPRESAS
        lista_de_empresas = ["Quad", "rumo", "projeto missão", "projeto caveira"]
        empresas_adicionadas = 0
        for nome_empresa in lista_de_empresas:
            if not Empresas.query.filter_by(nome=nome_empresa).first():
                db.session.add(Empresas(nome=nome_empresa))
                empresas_adicionadas += 1

        db.session.commit()
        
        return f"Banco de dados REINICIADO! Tabelas criadas. {alunos_adicionados} alunos adicionados. {empresas_adicionadas} empresas adicionadas.", 200
            
    except Exception as e:
        db.session.rollback()
        return f"Ocorreu um erro ao reiniciar o banco: {e}", 500


# --- FUNÇÃO HELPER DE FUSO HORÁRIO (Não muda) ---
def get_start_of_week():
    # ... (código da função não muda) ...
    today_utc = datetime.utcnow()
    today_brt = today_utc - timedelta(hours=3)
    days_since_sunday = (today_brt.weekday() - 6 + 7) % 7
    start_of_week_brt = today_brt - timedelta(days=days_since_sunday)
    start_of_week_brt_midnight = start_of_week_brt.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week_utc = start_of_week_brt_midnight + timedelta(hours=3)
    return start_of_week_utc

# --- ROTAS PRINCIPAIS (Não mudam) ---
@app.route('/')
def index(): return render_template('index.html')

@app.route('/registrar-questoes')
def registrar_questoes(): return render_template('registrar_questoes.html')

@app.route('/historico-questoes')
def historico_questoes(): return render_template('historico_questoes.html')

@app.route('/ranking-semana-passada')
def ranking_semana_passada(): return render_template('ranking_semana_passada.html')

@app.route('/ranking-geral')
def ranking_geral(): return render_template('ranking_geral.html')

# --- ROTAS DE API DE QUESTÕES (Não mudam) ---
@app.route('/api/alunos', methods=['GET'])
def get_alunos():
    # ... (código não muda) ...
    alunos = Alunos.query.order_by(Alunos.nome).all()
    return jsonify([{'id': aluno.id, 'nome': aluno.nome} for aluno in alunos])

@app.route('/api/registros', methods=['POST'])
def add_registro():
    # ... (código não muda) ...
    dados = request.get_json()
    novo_registro = RegistrosQuestoes(aluno_id=dados['aluno_id'], quantidade_questoes=dados['quantidade'], acertos=dados['acertos'])
    db.session.add(novo_registro)
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/registros/recentes', methods=['GET'])
def get_registros_recentes():
    # ... (código não muda) ...
    registros = RegistrosQuestoes.query.order_by(RegistrosQuestoes.id.desc()).limit(10).all()
    lista_registros = [{'id': r.id, 'aluno_nome': r.aluno.nome, 'questoes': r.quantidade_questoes, 'acertos': r.acertos} for r in registros]
    return jsonify(lista_registros)

@app.route('/api/registros/<int:registro_id>', methods=['DELETE'])
def delete_registro(registro_id):
    # ... (código não muda) ...
    registro = RegistrosQuestoes.query.get_or_404(registro_id)
    db.session.delete(registro)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Registro apagado.'})

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    # ... (código não muda) ...
    start_of_week = get_start_of_week()
    conn = db.session.connection()
    params = {'start_date': start_of_week}
    query_qtd = text('SELECT a.nome, SUM(r.quantidade_questoes) as total FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro >= :start_date GROUP BY a.nome ORDER BY total DESC LIMIT 10')
    ranking_quantidade = conn.execute(query_qtd, params).mappings().all()
    query_perc = text('SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro >= :start_date GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20 ORDER BY percentual DESC LIMIT 10')
    ranking_percentual = conn.execute(query_perc, params).mappings().all()
    return jsonify({'quantidade': [dict(row) for row in ranking_quantidade], 'percentual': [dict(row) for row in ranking_percentual]})

@app.route('/api/rankings/geral', methods=['GET'])
def get_rankings_gerais():
    # ... (código não muda) ...
    conn = db.session.connection()
    query_qtd = text('SELECT a.nome, SUM(r.quantidade_questoes) as total FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id GROUP BY a.nome ORDER BY total DESC')
    ranking_quantidade = conn.execute(query_qtd).mappings().all()
    query_perc = text('SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 0 ORDER BY percentual DESC')
    ranking_percentual = conn.execute(query_perc).mappings().all()
    return jsonify({'quantidade': [dict(row) for row in ranking_quantidade], 'percentual': [dict(row) for row in ranking_percentual]})

@app.route('/api/rankings/semana-passada', methods=['GET'])
def get_rankings_semana_passada():
    # ... (código não muda) ...
    start_of_current_week = get_start_of_week()
    end_of_last_week = start_of_current_week - timedelta(seconds=1)
    start_of_last_week = start_of_current_week - timedelta(days=7)
    conn = db.session.connection()
    params = {'start': start_of_last_week, 'end': end_of_last_week}
    query_qtd = text(f'SELECT a.nome, SUM(r.quantidade_questoes) as total FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro BETWEEN :start AND :end GROUP BY a.nome ORDER BY total DESC LIMIT 20')
    ranking_quantidade = conn.execute(query_qtd, params).mappings().all()
    query_perc = text(f'SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id WHERE r.data_registro BETWEEN :start AND :end GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20 ORDER BY percentual DESC LIMIT 20')
    ranking_percentual = conn.execute(query_perc, params).mappings().all()
    return jsonify({'quantidade': [dict(row) for row in ranking_quantidade], 'percentual': [dict(row) for row in ranking_percentual]})

# --- ROTAS DE GERENCIAMENTO DE SIMULADOS (Não mudam) ---
@app.route('/gerenciar-simulados')
def gerenciar_simulados(): return render_template('gerenciamento_simulados.html')

@app.route('/api/empresas', methods=['GET'])
def get_empresas():
    # ... (código não muda) ...
    empresas = Empresas.query.order_by(Empresas.nome).all()
    return jsonify([{'id': e.id, 'nome': e.nome} for e in empresas])

@app.route('/api/empresas', methods=['POST'])
def add_empresa():
    # ... (código não muda) ...
    dados = request.get_json()
    if 'nome' not in dados or dados['nome'].strip() == '': return jsonify({'status': 'erro', 'mensagem': 'O nome da empresa é obrigatório.'}), 400
    existe = Empresas.query.filter_by(nome=dados['nome'].strip()).first()
    if existe: return jsonify({'status': 'erro', 'mensagem': 'Essa empresa já existe.'}), 409
    nova_empresa = Empresas(nome=dados['nome'].strip())
    db.session.add(nova_empresa)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'empresa': {'id': nova_empresa.id, 'nome': nova_empresa.nome}}), 201

@app.route('/api/simulados', methods=['GET'])
def get_simulados():
    # ... (código não muda) ...
    simulados = db.session.query(Simulados, Empresas.nome).join(Empresas).order_by(Simulados.data_realizacao.desc()).all()
    lista_simulados = []
    for simulado, empresa_nome in simulados:
        nome_display = f"Nº {simulado.numero}" if simulado.numero else simulado.nome_especifico
        lista_simulados.append({'id': simulado.id, 'nome_display': f"{empresa_nome} - {nome_display} ({simulado.categoria})", 'data': simulado.data_realizacao.strftime('%d/%m/%Y')})
    return jsonify(lista_simulados)

@app.route('/api/simulados', methods=['POST'])
def add_simulado():
    # ... (código não muda) ...
    dados = request.get_json()
    if not all(k in dados for k in ['empresa_id', 'categoria', 'data_realizacao']): return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos.'}), 400
    if not dados.get('numero') and not dados.get('nome_especifico'): return jsonify({'status': 'erro', 'mensagem': 'É preciso fornecer o número ou um nome específico.'}), 400
    novo_simulado = Simulados(empresa_id=dados['empresa_id'], numero=dados.get('numero'), nome_especifico=dados.get('nome_especifico'), categoria=dados['categoria'], data_realizacao=datetime.strptime(dados['data_realizacao'], '%Y-%m-%d').date())
    db.session.add(novo_simulado)
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

# --- ROTA 'add_resultado' ATUALIZADA ---
@app.route('/api/resultados', methods=['POST'])
def add_resultado():
    """Adiciona a nota e, opcionalmente, os tempos de um aluno em um simulado."""
    dados = request.get_json()
    
    # Validação dos dados obrigatórios
    if not all(k in dados for k in ['aluno_id', 'simulado_id', 'nota']):
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos (aluno, simulado ou nota).'}), 400

    # Verifica se já não existe um resultado para este aluno neste simulado
    existe = ResultadosSimulados.query.filter_by(aluno_id=dados['aluno_id'], simulado_id=dados['simulado_id']).first()
    if existe:
        return jsonify({'status': 'erro', 'mensagem': 'Este aluno já possui uma nota para este simulado. Apague a anterior se quiser corrigir.'}), 409

    # Pega os dados opcionais
    tempo_total = dados.get('tempo_total_gasto') # .get() retorna None se a chave não existir
    tempos_materias = dados.get('tempos_por_materia')

    novo_resultado = ResultadosSimulados(
        aluno_id=dados['aluno_id'],
        simulado_id=dados['simulado_id'],
        nota=dados['nota'],
        # Salva os dados opcionais (serão None se não forem enviados)
        tempo_total_gasto=tempo_total,
        tempos_por_materia=str(tempos_materias) if tempos_materias else None
    )
    db.session.add(novo_resultado)
    db.session.commit()
    
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/resultados/recentes', methods=['GET'])
def get_resultados_recentes():
    # ... (código não muda) ...
    resultados = ResultadosSimulados.query.order_by(ResultadosSimulados.id.desc()).limit(15).all()
    lista_resultados = []
    for r in resultados:
        nome_simulado = f"Nº {r.simulado.numero}" if r.simulado.numero else r.simulado.nome_especifico
        nome_display = f"{r.simulado.empresa.nome} - {nome_simulado} ({r.simulado.categoria})"
        lista_resultados.append({'id': r.id, 'aluno_nome': r.aluno.nome, 'simulado_nome': nome_display, 'nota': r.nota})
    return jsonify(lista_resultados)

@app.route('/api/resultados/<int:resultado_id>', methods=['DELETE'])
def delete_resultado(resultado_id):
    # ... (código não muda) ...
    resultado = ResultadosSimulados.query.get_or_404(resultado_id)
    db.session.delete(resultado)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Nota apagada com sucesso.'})

# --- ROTAS DE RANKING DE SIMULADOS (Não muda, mas será atualizada no futuro) ---
@app.route('/ranking-simulados')
def ranking_simulados(): return render_template('ranking_simulados.html')

@app.route('/api/simulados/<int:simulado_id>/ranking', methods=['GET'])
def get_ranking_por_simulado(simulado_id):
    """Retorna o ranking de notas para um simulado específico, INCLUINDO TEMPOS."""
    
    # A consulta agora busca o objeto 'ResultadosSimulados' inteiro e o nome do Aluno
    resultados = db.session.query(
            ResultadosSimulados,
            Alunos.nome
        ).join(Alunos).filter(
            ResultadosSimulados.simulado_id == simulado_id
        ).order_by(
            ResultadosSimulados.nota.desc()
        ).all()

    # Monta um JSON mais rico com os novos dados
    ranking = []
    for resultado, nome in resultados:
        ranking.append({
            'aluno_nome': nome,
            'nota': resultado.nota,
            'tempo_total_gasto': resultado.tempo_total_gasto, # Envia o tempo total
            'tempos_por_materia': resultado.tempos_por_materia   # Envia o JSON dos tempos
        })
    
    return jsonify(ranking)

# --- ROTAS DE CONSULTA INDIVIDUAL (Não muda) ---
@app.route('/consulta-desempenho')
def consulta_desempenho(): return render_template('consulta_desempenho.html')

@app.route('/api/consulta/desempenho', methods=['GET'])
def get_consulta_desempenho():
    # ... (código não muda) ...
    aluno_id = request.args.get('aluno_id')
    data_inicio_str = request.args.get('inicio')
    data_fim_str = request.args.get('fim')
    if not aluno_id or not data_inicio_str or not data_fim_str: return jsonify({'erro': 'Parâmetros aluno_id, inicio e fim são obrigatórios.'}), 400
    try:
        data_inicio = datetime.strptime(data_inicio_str + ' 00:00:00', '%Y-%m-%d %H:%M:%S')
        data_fim = datetime.strptime(data_fim_str + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
        resumo = db.session.query(func.sum(RegistrosQuestoes.quantidade_questoes).label('total_questoes'), func.sum(RegistrosQuestoes.acertos).label('total_acertos')).filter(RegistrosQuestoes.aluno_id == aluno_id, RegistrosQuestoes.data_registro >= data_inicio, RegistrosQuestoes.data_registro <= data_fim).first()
        total_questoes = resumo.total_questoes if resumo and resumo.total_questoes else 0
        total_acertos = resumo.total_acertos if resumo and resumo.total_acertos else 0
        percentual_total = (total_acertos * 100.0 / total_questoes) if total_questoes > 0 else 0
        dados_diarios_query = db.session.query(func.date(RegistrosQuestoes.data_registro).label('dia'), func.sum(RegistrosQuestoes.quantidade_questoes).label('questoes_dia'), func.sum(RegistrosQuestoes.acertos).label('acertos_dia')).filter(RegistrosQuestoes.aluno_id == aluno_id, RegistrosQuestoes.data_registro >= data_inicio, RegistrosQuestoes.data_registro <= data_fim).group_by(func.date(RegistrosQuestoes.data_registro)).order_by(func.date(RegistrosQuestoes.data_registro)).all()
        dados_diarios_formatados = []
        for row in dados_diarios_query:
            dia_data = row.dia; questoes = row.questoes_dia; acertos = row.acertos_dia
            percentual_dia = (acertos * 100.0 / questoes) if questoes > 0 else 0
            dados_diarios_formatados.append({'data': dia_data.strftime('%Y-%m-%d'), 'questoes': questoes, 'acertos': acertos, 'percentual': round(percentual_dia, 2)})
        aluno = Alunos.query.get(aluno_id)
        nome_aluno = aluno.nome if aluno else "Aluno não encontrado"
        return jsonify({'aluno_nome': nome_aluno, 'data_inicio': data_inicio_str, 'data_fim': data_fim_str, 'total_questoes': total_questoes, 'total_acertos': total_acertos, 'percentual_total': round(percentual_total, 2), 'dados_diarios': dados_diarios_formatados})
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao consultar o banco de dados: {e}'}), 500
