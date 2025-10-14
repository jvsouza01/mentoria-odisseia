document.addEventListener('DOMContentLoaded', () => {
    const formFiltro = document.getElementById('form-filtro-simulado');
    const selectSimulado = document.getElementById('filtro-simulado');
    const listaRanking = document.getElementById('lista-ranking-simulado');
    const rankingTitulo = document.getElementById('ranking-titulo');

    // Função para carregar a lista de simulados no dropdown
    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            selectSimulado.innerHTML = '<option value="">Selecione o simulado</option>';
            simulados.forEach(simulado => {
                const option = document.createElement('option');
                option.value = simulado.id;
                // Guarda o nome do simulado no próprio elemento para usar no título
                option.dataset.nome = simulado.nome_display; 
                option.textContent = `${simulado.nome_display} - ${simulado.data}`;
                selectSimulado.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // Lógica do formulário de filtro
    formFiltro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const simuladoId = selectSimulado.value;
        if (!simuladoId) {
            alert('Por favor, selecione um simulado.');
            return;
        }

        // Pega o nome do simulado que guardamos no dataset
        const selectedOption = selectSimulado.options[selectSimulado.selectedIndex];
        rankingTitulo.textContent = `Ranking: ${selectedOption.dataset.nome}`;
        listaRanking.innerHTML = '<li>Carregando ranking...</li>';

        try {
            const response = await fetch(`/api/simulados/${simuladoId}/ranking`);
            const ranking = await response.json();

            listaRanking.innerHTML = '';
            if (ranking.length === 0) {
                listaRanking.innerHTML = '<li>Nenhuma nota lançada para este simulado ainda.</li>';
            } else {
                ranking.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 1}. ${item.aluno_nome} - Nota: ${item.nota.toFixed(2)}`;
                    listaRanking.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            listaRanking.innerHTML = '<li>Ocorreu um erro ao carregar o ranking.</li>';
        }
    });

    // Carrega a lista de simulados ao abrir a página
    carregarSimulados();
});