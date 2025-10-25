document.addEventListener('DOMContentLoaded', () => {
    const formConsulta = document.getElementById('form-consulta');
    const selectAluno = document.getElementById('consulta-aluno');
    const inputDataInicio = document.getElementById('consulta-data-inicio');
    const inputDataFim = document.getElementById('consulta-data-fim');
    const divResultado = document.getElementById('resultado-consulta');
    const resultadoTitulo = document.getElementById('resultado-titulo');
    const canvasGrafico = document.getElementById('graficoDesempenho');
    let graficoDesempenho = null; // Variável para guardar a instância do gráfico

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

    // Função para renderizar o gráfico
    function renderizarGrafico(dadosDiarios) {
        const ctx = canvasGrafico.getContext('2d');

        // Destruir gráfico anterior se existir (para atualizações)
        if (graficoDesempenho) {
            graficoDesempenho.destroy();
        }

        // Prepara os dados para o Chart.js
        const labels = dadosDiarios.map(d => new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')); // Formata a data dd/mm/yyyy
        const dadosQuestoes = dadosDiarios.map(d => d.questoes);
        const dadosPercentual = dadosDiarios.map(d => d.percentual);

        graficoDesempenho = new Chart(ctx, {
            type: 'line', // Tipo de gráfico: linha
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Questões Feitas',
                        data: dadosQuestoes,
                        borderColor: '#20c997', // Verde principal
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        tension: 0.1,
                        yAxisID: 'y', // Usa o eixo Y da esquerda
                        pointBackgroundColor: '#20c997', // Cor do ponto
                        pointRadius: 4 // Tamanho do ponto
                    },
                    {
                        label: '% Acerto',
                        data: dadosPercentual,
                        borderColor: '#dc3545', // Vermelho para contraste
                        backgroundColor: 'rgba(220, 53, 69, 0.2)',
                        tension: 0.1,
                        yAxisID: 'y1', // Usa o eixo Y da direita
                        pointBackgroundColor: '#dc3545',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permite ajustar a altura
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0' // Cor do texto da legenda
                        }
                    },
                    tooltip: { // Configuração das dicas ao passar o mouse
                         titleColor: '#ffffff',
                         bodyColor: '#e0e0e0',
                         backgroundColor: '#1e1e1e', // Fundo escuro
                         borderColor: '#333333',
                         borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Data', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' }, // Cor dos labels do eixo X
                        grid: { color: '#333333' } // Cor das linhas de grade
                    },
                    y: { // Eixo Y da esquerda (para Questões)
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Nº de Questões', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0', stepSize: 10 }, // Ajuste o stepSize conforme necessário
                        beginAtZero: true,
                        grid: { color: '#333333' }
                    },
                    y1: { // Eixo Y da direita (para Percentual)
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '% Acerto', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0', stepSize: 10 },
                        min: 0,
                        max: 100,
                        grid: { drawOnChartArea: false } // Evita sobreposição de grades
                    }
                }
            }
        });
    }

    // Lógica do formulário de consulta
    formConsulta.addEventListener('submit', async (event) => {
        event.preventDefault();

        const alunoId = selectAluno.value;
        const dataInicio = inputDataInicio.value;
        const dataFim = inputDataFim.value;

        // Validação básica
        if (!alunoId || !dataInicio || !dataFim) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        if (new Date(dataFim) < new Date(dataInicio)) {
            alert('A data final não pode ser anterior à data inicial.');
            return;
        }

        resultadoTitulo.textContent = 'Resultado da Consulta';
        divResultado.innerHTML = '<p>Consultando...</p>';
        // Limpa o gráfico anterior enquanto busca
        if (graficoDesempenho) graficoDesempenho.destroy();
        canvasGrafico.style.height = '0px'; // Esconde o canvas

        try {
            const url = `/api/consulta/desempenho?aluno_id=${alunoId}&inicio=${dataInicio}&fim=${dataFim}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                // Formata as datas para exibição (dd/mm/yyyy) - Adiciona T00:00:00 para evitar problemas de fuso
                const dataInicioFormatada = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR');
                const dataFimFormatada = new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR');

                resultadoTitulo.textContent = `Resultado para ${data.aluno_nome}`;
                // Exibe o resumo em texto
                divResultado.innerHTML = `
                    <p><strong>Período:</strong> ${dataInicioFormatada} até ${dataFimFormatada}</p>
                    <p><strong>Total de Questões Feitas:</strong> ${data.total_questoes}</p>
                    <p><strong>Total de Acertos:</strong> ${data.total_acertos}</p>
                    <p><strong>Percentual de Acerto (Total):</strong> ${data.percentual_total}%</p>
                `;

                // Renderiza o gráfico se houver dados diários
                if (data.dados_diarios && data.dados_diarios.length > 0) {
                     canvasGrafico.style.height = '400px'; // Define altura do gráfico
                    renderizarGrafico(data.dados_diarios);
                } else {
                    divResultado.innerHTML += '<p>Nenhum dado encontrado neste período para gerar o gráfico.</p>';
                }

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