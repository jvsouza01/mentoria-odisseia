document.addEventListener('DOMContentLoaded', () => {
    console.log("Script de Ranking de Simulados carregado!"); // Log para confirmar que o script rodou

    // --- Seletores ---
    const formFiltro = document.getElementById('form-filtro-simulado');
    const selectSimulado = document.getElementById('filtro-simulado');
    const listaRanking = document.getElementById('lista-ranking-simulado');
    const rankingTitulo = document.getElementById('ranking-titulo');

    // Verifica se os elementos existem antes de continuar
    if (!formFiltro || !selectSimulado || !listaRanking) {
        console.error("Erro Crítico: Elementos do HTML não encontrados. Verifique os IDs.");
        return;
    }

    // --- 1. Carregar lista de simulados ---
    async function carregarSimulados() {
        try {
            console.log("Buscando lista de simulados...");
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

    // --- 2. Buscar e Exibir o Ranking ---
    formFiltro.addEventListener('submit', async (event) => {
        event.preventDefault(); // IMPEDE o recarregamento da página
        console.log("Botão clicado! Buscando ranking...");

        const simuladoId = selectSimulado.value;
        if (!simuladoId) {
            alert('Por favor, selecione um simulado.');
            return;
        }

        // Atualiza título e limpa lista
        const selectedOption = selectSimulado.options[selectSimulado.selectedIndex];
        rankingTitulo.textContent = `Ranking: ${selectedOption.dataset.nome}`;
        listaRanking.innerHTML = '<li>Carregando ranking...</li>';

        try {
            const response = await fetch(`/api/simulados/${simuladoId}/ranking`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const ranking = await response.json();
            console.log("Dados recebidos:", ranking); // Veja os dados no console

            listaRanking.innerHTML = '';
            
            if (ranking.length === 0) {
                listaRanking.innerHTML = '<li>Nenhuma nota lançada para este simulado ainda.</li>';
            } else {
                // Monta a lista
                ranking.forEach((item, index) => {
                    const li = document.createElement('li');
                    
                    // Cabeçalho do item (Nome e Nota)
                    const header = document.createElement('div');
                    header.className = 'ranking-item-header';
                    header.innerHTML = `<strong>${index + 1}. ${item.aluno_nome}</strong> - Nota: ${item.nota.toFixed(2)}`;
                    
                    li.appendChild(header);

                    // Detalhes de Tempo (Se houver)
                    if (item.tempo_total_gasto || (item.tempos_por_materia && item.tempos_por_materia !== 'None')) {
                        header.style.cursor = 'pointer'; // Indica que é clicável
                        
                        // Adiciona seta via CSS class se quiser, ou texto simples
                        header.innerHTML += ' <span style="font-size:0.8em">▼</span>';

                        const details = document.createElement('div');
                        details.className = 'ranking-item-details';
                        details.style.display = 'none'; // Começa escondido
                        details.style.marginTop = '10px';
                        details.style.paddingLeft = '20px';
                        details.style.borderLeft = '2px solid var(--primary-green)';

                        let detailsHTML = '';
                        if (item.tempo_total_gasto) {
                            detailsHTML += `<p>Tempo Total: ${item.tempo_total_gasto} min</p>`;
                        }
                        if (item.tempos_por_materia && item.tempos_por_materia !== 'None') {
                            try {
                                const tempos = JSON.parse(item.tempos_por_materia); // Converte string JSON para objeto
                                detailsHTML += '<ul>';
                                for (const [materia, tempo] of Object.entries(tempos)) {
                                    if(tempo) detailsHTML += `<li>${materia}: ${tempo} min</li>`;
                                }
                                detailsHTML += '</ul>';
                            } catch(e) { console.error("Erro parsing JSON", e); }
                        }
                        details.innerHTML = detailsHTML;
                        li.appendChild(details);

                        // Clique para expandir
                        li.addEventListener('click', () => {
                            details.style.display = details.style.display === 'none' ? 'block' : 'none';
                        });
                    }

                    listaRanking.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar ranking:', error);
            listaRanking.innerHTML = '<li>Ocorreu um erro ao carregar o ranking. Veja o console.</li>';
        }
    });

    // Inicializa
    carregarSimulados();
});