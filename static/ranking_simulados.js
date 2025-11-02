document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const formFiltro = document.getElementById('form-filtro-simulado');
    const selectSimulado = document.getElementById('filtro-simulado');
    
    // O botão "Ver Ranking" é o 'submit' do formulário
    // Este é o NOVO botão que adicionamos no HTML
    const btnIniciarCronometro = document.getElementById('btn-iniciar-cronometro'); 

    // Área de exibição do ranking
    const listaRanking = document.getElementById('lista-ranking-simulado');
    const rankingTitulo = document.getElementById('ranking-titulo');

    // --- Funções ---

    // 1. Carregar a lista de simulados no dropdown
    // (Esta função está correta como no seu código)
    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            selectSimulado.innerHTML = '<option value="">Selecione o simulado</option>';
            simulados.forEach(simulado => {
                const option = document.createElement('option');
                option.value = simulado.id;
                option.dataset.nome = simulado.nome_display; // Guarda o nome
                option.textContent = `${simulado.nome_display} - ${simulado.data}`;
                selectSimulado.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // 2. Lógica do formulário de filtro (Botão "Ver Ranking")
    // (Esta função também está correta como no seu código)
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

    // 3. Lógica do novo botão "Iniciar Cronômetro"
    // (Esta era a parte que faltava integrar)
    btnIniciarCronometro.addEventListener('click', () => {
        const simuladoId = selectSimulado.value;
        if (!simuladoId) {
            alert('Por favor, selecione um simulado para iniciar o cronômetro.');
            return;
        }
        // Redireciona o usuário para a nova página do cronômetro
        window.location.href = `/iniciar-simulado/${simuladoId}`;
    });

    // --- Inicialização ---
    carregarSimulados(); // Carrega a lista de simulados ao abrir a página
});