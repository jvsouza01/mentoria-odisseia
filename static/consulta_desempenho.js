document.addEventListener('DOMContentLoaded', () => {
    const formConsulta = document.getElementById('form-consulta');
    const selectAluno = document.getElementById('consulta-aluno');
    const inputDataInicio = document.getElementById('consulta-data-inicio');
    const inputDataFim = document.getElementById('consulta-data-fim');
    const divResultado = document.getElementById('resultado-consulta');
    const resultadoTitulo = document.getElementById('resultado-titulo');

    // Função para carregar alunos no dropdown
    async function carregarAlunos() {
        try {
            const response = await fetch('/api/alunos');
            const alunos = await response.json();
            selectAluno.innerHTML = '<option value="">Selecione o aluno</option>';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome;
                selectAluno.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            selectAluno.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // Lógica do formulário de consulta
    formConsulta.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const alunoId = selectAluno.value;
        const dataInicio = inputDataInicio.value;
        const dataFim = inputDataFim.value;

        if (!alunoId || !dataInicio || !dataFim) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Validação simples para garantir que a data fim não seja anterior à data início
        if (new Date(dataFim) < new Date(dataInicio)) {
            alert('A data final não pode ser anterior à data inicial.');
            return;
        }

        resultadoTitulo.textContent = 'Resultado da Consulta';
        divResultado.innerHTML = '<p>Consultando...</p>';

        try {
            // Monta a URL da API com os parâmetros de query
            const url = `/api/consulta/desempenho?aluno_id=${alunoId}&inicio=${dataInicio}&fim=${dataFim}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                // Formata as datas para exibição (dd/mm/yyyy)
                const dataInicioFormatada = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR');
                const dataFimFormatada = new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR');
                
                resultadoTitulo.textContent = `Resultado para ${data.aluno_nome}`;
                divResultado.innerHTML = `
                    <p><strong>Período:</strong> ${dataInicioFormatada} até ${dataFimFormatada}</p>
                    <p><strong>Total de Questões Feitas:</strong> ${data.total_questoes}</p>
                    <p><strong>Total de Acertos:</strong> ${data.total_acertos}</p>
                    <p><strong>Percentual de Acerto:</strong> ${data.percentual}%</p>
                `;
            } else {
                divResultado.innerHTML = `<p>Erro: ${data.erro}</p>`;
            }
        } catch (error) {
            console.error('Erro ao consultar desempenho:', error);
            divResultado.innerHTML = '<p>Ocorreu um erro de comunicação ao buscar os dados.</p>';
        }
    });

    // Carrega a lista de alunos ao abrir a página
    carregarAlunos();
});