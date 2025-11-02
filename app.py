import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, Date
from datetime import datetime, timedelta
from sqlalchemy import func 

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
@app.route('/_iniciar_banco_de_dados_uma_vez')
def iniciar_banco():
    try:
        # Garante que todas as tabelas existam
        db.create_all()
        
        # LISTA COMPLETA E ATUALIZADA DE ALUNOS 
        lista_de_alunos = [
            'Alan vitor', 'Andressa', 'Dann Silva', 'Davy', 'Dias', 
            'Dhomini', 'Eduardo', 'Eliaquim', 'Ell Souza', 'Ezequias', 
            'Flavia Andrade', 'Hélio', 'Ingrid', 'Isaac', 'Jonathan Estevam', 
            'Jovino', 'JP', 'Leonardo', 'Liu', 'Marcela', 'Marco Antônio', 
            'Marcos Vinicius', 'Mariana', 'Matheus Silva', 'MV', 'Nelson', 
            'Rafael', 
            'Rodrigo', 'Santiago', 'Silva', 'Vinicius Felipe', 
            'Vithor', 'V.S', 'Yan'
        ]
        
        alunos_adicionados = 0
        
        # Itera sobre a lista de nomes
        for nome_aluno in lista_de_alunos:
            # Verifica se o aluno já existe no banco de dados
            existe = Alunos.query.filter_by(nome=nome_aluno).first()
            
            
            if not existe:
                novo_aluno = Alunos(nome=nome_aluno)
                db.session.add(novo_aluno)
                alunos_adicionados += 1
        
        # Salva todas as novas adições no banco de uma vez
        db.session.commit()
        
        return f"Verificação concluída. {alunos_adicionados} novos alunos foram adicionados. O banco agora está atualizado!", 200
            
    except Exception as e:
        
        return f"Ocorreu um erro: {e}", 500


def get_start_of_week():
    """Calcula a data do último domingo 00:00 BRT (GMT-3)."""
    
    today_utc = datetime.utcnow()
    
    today_brt = today_utc - timedelta(hours=3)
    
    days_since_sunday = (today_brt.weekday() - 6 + 7) % 7
    start_of_week_brt = today_brt - timedelta(days=days_since_sunday)
    start_of_week_brt_midnight = start_of_week_brt.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week_utc = start_of_week_brt_midnight + timedelta(hours=3)
    
    return start_of_week_utc

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

# --- ROTAS PARA GERENCIAMENTO DE SIMULADOS ---

@app.route('/gerenciar-simulados')
def gerenciar_simulados():
    """Serve a página de gerenciamento de simulados."""
    return render_template('gerenciamento_simulados.html')

@app.route('/api/empresas', methods=['GET'])
def get_empresas():
    """Retorna uma lista de todas as empresas cadastradas."""
    empresas = Empresas.query.order_by(Empresas.nome).all()
    return jsonify([{'id': e.id, 'nome': e.nome} for e in empresas])

@app.route('/api/empresas', methods=['POST'])
def add_empresa():
    """Adiciona uma nova empresa."""
    dados = request.get_json()
    # Verifica se o nome foi enviado e se não está vazio
    if 'nome' not in dados or dados['nome'].strip() == '':
        return jsonify({'status': 'erro', 'mensagem': 'O nome da empresa é obrigatório.'}), 400
    
    # Verifica se a empresa já existe
    existe = Empresas.query.filter_by(nome=dados['nome'].strip()).first()
    if existe:
        return jsonify({'status': 'erro', 'mensagem': 'Essa empresa já existe.'}), 409 # 409 = Conflito
        
    nova_empresa = Empresas(nome=dados['nome'].strip())
    db.session.add(nova_empresa)
    db.session.commit()
    
    return jsonify({'status': 'sucesso', 'empresa': {'id': nova_empresa.id, 'nome': nova_empresa.nome}}), 201

@app.route('/api/simulados', methods=['GET'])
def get_simulados():
    """Retorna uma lista de todos os simulados cadastrados."""
    
    simulados = db.session.query(Simulados, Empresas.nome).join(Empresas).order_by(Simulados.data_realizacao.desc()).all()
    
    lista_simulados = []
    for simulado, empresa_nome in simulados:
        nome_display = f"Nº {simulado.numero}" if simulado.numero else simulado.nome_especifico
        lista_simulados.append({
            'id': simulado.id,
            'nome_display': f"{empresa_nome} - {nome_display} ({simulado.categoria})",
            'data': simulado.data_realizacao.strftime('%d/%m/%Y')
        })
    return jsonify(lista_simulados)

@app.route('/api/simulados', methods=['POST'])
def add_simulado():
    """Adiciona um novo simulado."""
    dados = request.get_json()
    
    # Validação dos dados recebidos
    if not all(k in dados for k in ['empresa_id', 'categoria', 'data_realizacao']):
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos.'}), 400
    if not dados.get('numero') and not dados.get('nome_especifico'):
        return jsonify({'status': 'erro', 'mensagem': 'É preciso fornecer o número ou um nome específico.'}), 400

    novo_simulado = Simulados(
        empresa_id=dados['empresa_id'],
        numero=dados.get('numero'),
        nome_especifico=dados.get('nome_especifico'),
        categoria=dados['categoria'],
        data_realizacao=datetime.strptime(dados['data_realizacao'], '%Y-%m-%d').date()
    )
    db.session.add(novo_simulado)
    db.session.commit()
    
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/resultados', methods=['POST'])
def add_resultado():
    """Adiciona a nota de um aluno em um simulado."""
    dados = request.get_json()
    
    # Validação
    if not all(k in dados for k in ['aluno_id', 'simulado_id', 'nota']):
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos.'}), 400

    # Verifica se já não existe um resultado para este aluno neste simulado
    existe = ResultadosSimulados.query.filter_by(aluno_id=dados['aluno_id'], simulado_id=dados['simulado_id']).first()
    if existe:
        return jsonify({'status': 'erro', 'mensagem': 'Este aluno já possui uma nota para este simulado.'}), 409

    novo_resultado = ResultadosSimulados(
        aluno_id=dados['aluno_id'],
        simulado_id=dados['simulado_id'],
        nota=dados['nota']
    )
    db.session.add(novo_resultado)
    db.session.commit()
    
    return jsonify({'status': 'sucesso'}), 201

# --- ROTAS PARA A PÁGINA DE RANKING DE SIMULADOS ---

@app.route('/ranking-simulados')
def ranking_simulados():
    """Serve a página de visualização dos rankings de simulados."""
    return render_template('ranking_simulados.html')

@app.route('/api/simulados/<int:simulado_id>/ranking', methods=['GET'])
def get_ranking_por_simulado(simulado_id):
    """Retorna o ranking de notas para um simulado específico."""
    resultados = db.session.query(
            ResultadosSimulados.nota,
            Alunos.nome
        ).join(Alunos).filter(
            ResultadosSimulados.simulado_id == simulado_id
        ).order_by(
            ResultadosSimulados.nota.desc()
        ).all()

    # Transforma o resultado em uma lista de dicionários
    ranking = [{'aluno_nome': nome, 'nota': nota} for nota, nome in resultados]
    
    return jsonify(ranking)

@app.route('/api/resultados/recentes', methods=['GET'])
def get_resultados_recentes():
    """Retorna uma lista das 15 últimas notas lançadas."""
    resultados = ResultadosSimulados.query.order_by(ResultadosSimulados.id.desc()).limit(15).all()
    
    lista_resultados = []
    for r in resultados:
        # Monta um nome descritivo para o simulado
        nome_simulado = f"Nº {r.simulado.numero}" if r.simulado.numero else r.simulado.nome_especifico
        nome_display = f"{r.simulado.empresa.nome} - {nome_simulado} ({r.simulado.categoria})"
        
        lista_resultados.append({
            'id': r.id,
            'aluno_nome': r.aluno.nome,
            'simulado_nome': nome_display,
            'nota': r.nota
        })
    return jsonify(lista_resultados)

@app.route('/api/resultados/<int:resultado_id>', methods=['DELETE'])
def delete_resultado(resultado_id):
    """Apaga uma nota de simulado específica pelo seu ID."""
    resultado = ResultadosSimulados.query.get_or_404(resultado_id)
    
    db.session.delete(resultado)
    db.session.commit()
    
    return jsonify({'status': 'sucesso', 'mensagem': 'Nota apagada com sucesso.'})
# --- ROTA PARA O RANKING DA SEMANA PASSADA ---

@app.route('/api/rankings/semana-passada', methods=['GET'])
def get_rankings_semana_passada():
    """Calcula e retorna os rankings da semana anterior (Domingo a Sábado)."""
    
    # Pega o início da semana ATUAL (Domingo, 00:00)
    start_of_current_week = get_start_of_week() 
    
    # O fim da semana passada é 1 segundo antes do início da semana atual
    end_of_last_week = start_of_current_week - timedelta(seconds=1)
    
    # O início da semana passada é 7 dias antes do início da semana atual
    start_of_last_week = start_of_current_week - timedelta(days=7)

    conn = db.session.connection()
    
    # Criamos o filtro de data
    date_filter = "WHERE r.data_registro BETWEEN :start AND :end"
    params = {'start': start_of_last_week, 'end': end_of_last_week}
    
    query_qtd = text(f'''
        SELECT a.nome, SUM(r.quantidade_questoes) as total
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        {date_filter}
        GROUP BY a.nome ORDER BY total DESC LIMIT 20
    ''')
    ranking_quantidade = conn.execute(query_qtd, params).mappings().all()
    
    query_perc = text(f'''
        SELECT a.nome, (SUM(r.acertos) * 100.0 / SUM(r.quantidade_questoes)) as percentual
        FROM registros_questoes r JOIN alunos a ON a.id = r.aluno_id
        {date_filter}
        GROUP BY a.nome HAVING SUM(r.quantidade_questoes) > 20
        ORDER BY percentual DESC LIMIT 20
    ''')
    ranking_percentual = conn.execute(query_perc, params).mappings().all()

    return jsonify({
        'quantidade': [dict(row) for row in ranking_quantidade],
        'percentual': [dict(row) for row in ranking_percentual]
    })

# ROTA PARA REGISTRO DE QUESTÕES

@app.route('/registrar-questoes')
def registrar_questoes():
    """Serve a página dedicada ao registro de desempenho (questões)."""
    return render_template('registrar_questoes.html')

# --- ROTAS PARA CONSULTA DE DESEMPENHO INDIVIDUAL ---

@app.route('/consulta-desempenho')
def consulta_desempenho():
    """Serve a página de consulta de desempenho individual."""
    return render_template('consulta_desempenho.html')

@app.route('/api/consulta/desempenho', methods=['GET'])
def get_consulta_desempenho():
    """Busca o desempenho de um aluno em um período específico, incluindo dados diários."""
    print("\n--- 🕵️‍♂️ Iniciando Consulta de Desempenho ---")
    
    aluno_id = request.args.get('aluno_id')
    data_inicio_str = request.args.get('inicio')
    data_fim_str = request.args.get('fim')
    print(f"--- Parâmetros Recebidos: aluno_id={aluno_id}, inicio={data_inicio_str}, fim={data_fim_str} ---")

    if not aluno_id or not data_inicio_str or not data_fim_str:
        print("--- ⚠️ Erro: Parâmetros faltando. ---")
        return jsonify({'erro': 'Parâmetros aluno_id, inicio e fim são obrigatórios.'}), 400

    try:
        data_inicio = datetime.strptime(data_inicio_str + ' 00:00:00', '%Y-%m-%d %H:%M:%S')
        data_fim = datetime.strptime(data_fim_str + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
        print(f"--- 🗓️ Período de Busca Definido: De {data_inicio} até {data_fim} ---")

        # --- Cálculo do Resumo Total ---
        resumo = db.session.query(
            func.sum(RegistrosQuestoes.quantidade_questoes).label('total_questoes'),
            func.sum(RegistrosQuestoes.acertos).label('total_acertos')
        ).filter(
            RegistrosQuestoes.aluno_id == aluno_id,
            RegistrosQuestoes.data_registro >= data_inicio,
            RegistrosQuestoes.data_registro <= data_fim
        ).first()
        total_questoes = resumo.total_questoes if resumo and resumo.total_questoes else 0
        total_acertos = resumo.total_acertos if resumo and resumo.total_acertos else 0
        percentual_total = (total_acertos * 100.0 / total_questoes) if total_questoes > 0 else 0
        print(f"--- 🔢 Resumo Total Calculado: Questoes={total_questoes}, Acertos={total_acertos} ---")

        # --- Cálculo dos Dados Diários para o Gráfico ---
        print("--- 📊 Buscando dados diários no banco... ---")
        dados_diarios_query = db.session.query(
            func.date(RegistrosQuestoes.data_registro).label('dia'),
            func.sum(RegistrosQuestoes.quantidade_questoes).label('questoes_dia'),
            func.sum(RegistrosQuestoes.acertos).label('acertos_dia')
        ).filter(
            RegistrosQuestoes.aluno_id == aluno_id,
            RegistrosQuestoes.data_registro >= data_inicio,
            RegistrosQuestoes.data_registro <= data_fim
        ).group_by(
            func.date(RegistrosQuestoes.data_registro)
        ).order_by(
            func.date(RegistrosQuestoes.data_registro)
        ).all()
        
        # IMPRIMINDO O RESULTADO BRUTO DO BANCO
        print(f"--- 📦 Resultado BRUTO da query diária (Banco): {dados_diarios_query} ---")

        dados_diarios_formatados = []
        for row in dados_diarios_query:
             # Acessando por índice ou label dependendo de como SQLAlchemy retorna
            dia_data = row.dia
            questoes = row.questoes_dia
            acertos = row.acertos_dia
            percentual_dia = (acertos * 100.0 / questoes) if questoes > 0 else 0
            dados_diarios_formatados.append({
                'data': dia_data.strftime('%Y-%m-%d'),
                'questoes': questoes,
                'acertos': acertos,
                'percentual': round(percentual_dia, 2)
            })
            
        print(f"--- ✨ Dados Diários Formatados (para JSON): {dados_diarios_formatados} ---")

        aluno = Alunos.query.get(aluno_id)
        nome_aluno = aluno.nome if aluno else "Aluno não encontrado"

        print("--- ✅ Consulta concluída com sucesso. Enviando JSON. ---")
        return jsonify({
            'aluno_nome': nome_aluno,
            'data_inicio': data_inicio_str,
            'data_fim': data_fim_str,
            'total_questoes': total_questoes,
            'total_acertos': total_acertos,
            'percentual_total': round(percentual_total, 2),
            'dados_diarios': dados_diarios_formatados 
        })

    except ValueError:
        print("--- ⚠️ Erro: Formato de data inválido. ---")
        return jsonify({'erro': 'Formato de data inválido. Use YYYY-MM-DD.'}), 400
    except Exception as e:
        print(f"--- ❌ ERRO INESPERADO na consulta: {e} ---")
        db.session.rollback() # Importante reverter a sessão em caso de erro
        return jsonify({'erro': 'Erro ao consultar o banco de dados.'}), 500
    
    