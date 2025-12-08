document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const formFiltro = document.getElementById('form-filtro-simulado');
    const selectSimulado = document.getElementById('filtro-simulado');
    
    // Área de exibição do ranking
    const listaRanking = document.getElementById('lista-ranking-simulado');
    const rankingTitulo = document.getElementById('ranking-titulo');

    // --- Funções ---

    // 1. Carregar a lista de simulados no dropdown
    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            selectSimulado.innerHTML = '<option value="">Selecione o simulado</option>';
            
            if (simulados.length === 0) {
                 const option = document.createElement('option');
                 option.text = "Nenhum simulado cadastrado";
                 selectSimulado.appendChild(option);
            } else {
                simulados.forEach(simulado => {
                    const option = document.createElement('option');
                    option.value = simulado.id;
                    option.dataset.nome = simulado.nome_display; 
                    option.textContent = `${simulado.nome_display} - ${simulado.data}`;
                    selectSimulado.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // 2. Lógica do formulário de filtro (Botão "Ver Ranking")
    formFiltro.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário
        const simuladoId = selectSimulado.value;
        
        if (!simuladoId) {
            alert('Por favor, selecione um simulado.');
            return;
        }

        const selectedOption = selectSimulado.options[selectSimulado.selectedIndex];
        rankingTitulo.textContent = `Ranking: ${selectedOption.dataset.nome}`;
        listaRanking.innerHTML = '<li>Carregando ranking...</li>';

        try {
            // Busca o ranking na API
            const response = await fetch(`/api/simulados/${simuladoId}/ranking`);
            const ranking = await response.json();

            listaRanking.innerHTML = '';
            
            if (ranking.length === 0) {
                listaRanking.innerHTML = '<li>Nenhuma nota lançada para este simulado ainda.</li>';
            } else {
                // Monta a lista
                ranking.forEach((item, index) => {
                    const li = document.createElement('li');
                    
                    // Como removemos os tempos detalhados, voltamos ao layout simples
                    // Se quiser adicionar de volta a visualização de tempos no futuro, 
                    // a lógica viria aqui. Por enquanto, mostramos Nome e Nota.
                    
                    li.innerHTML = `<strong>${index + 1}. ${item.aluno_nome}</strong> - Nota: ${item.nota.toFixed(2)}`;
                    listaRanking.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            listaRanking.innerHTML = '<li>Ocorreu um erro ao carregar o ranking.</li>';
        }
    });

    // --- Inicialização ---
    carregarSimulados(); 
});