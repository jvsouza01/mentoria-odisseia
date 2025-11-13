document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const formFiltro = document.getElementById('form-filtro-simulado');
    const selectSimulado = document.getElementById('filtro-simulado');
    const btnIniciarCronometro = document.getElementById('btn-iniciar-cronometro'); 
    const listaRanking = document.getElementById('lista-ranking-simulado');
    const rankingTitulo = document.getElementById('ranking-titulo');

    // --- Funções ---

    // 1. Carregar a lista de simulados no dropdown
    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            selectSimulado.innerHTML = '<option value="">Selecione o simulado</option>';
            simulados.forEach(simulado => {
                const option = document.createElement('option');
                option.value = simulado.id;
                option.dataset.nome = simulado.nome_display; 
                option.textContent = `${simulado.nome_display} - ${simulado.data}`;
                selectSimulado.appendChild(option);
            });
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
            // A API agora retorna os dados de tempo
            const response = await fetch(`/api/simulados/${simuladoId}/ranking`);
            const ranking = await response.json();

            listaRanking.innerHTML = '';
            if (ranking.length === 0) {
                listaRanking.innerHTML = '<li>Nenhuma nota lançada para este simulado ainda.</li>';
            } else {
                
                // --- CONSTRUÇÃO DO RANKING INTERATIVO ---
                ranking.forEach((item, index) => {
                    // 1. Cria o item <li>
                    const li = document.createElement('li');
                    
                    // 2. Cria o cabeçalho clicável
                    const header = document.createElement('div');
                    header.className = 'ranking-item-header';
                    header.innerHTML = `<strong>${index + 1}. ${item.aluno_nome}</strong> - Nota: ${item.nota.toFixed(2)}`;
                    
                    // 3. Cria a div de detalhes (escondida)
                    const details = document.createElement('div');
                    details.className = 'ranking-item-details';

                    // 4. Verifica se temos dados de tempo para exibir
                    const temTempoTotal = item.tempo_total_gasto;
                    const temTempoMateria = item.tempos_por_materia && item.tempos_por_materia !== 'None';
                    
                    if (temTempoTotal || temTempoMateria) {
                        let detailsHTML = '';
                        
                        if (temTempoTotal) {
                            detailsHTML += `<p><strong>Tempo Total:</strong> ${item.tempo_total_gasto} min</p>`;
                        }

                        if (temTempoMateria) {
                            try {
                                // O backend envia como string, precisamos parsear
                                const tempos = JSON.parse(item.tempos_por_materia);
                                detailsHTML += `<p><strong>Tempos por Matéria:</strong></p><ul>`;
                                // Loop para mostrar cada matéria e seu tempo
                                for (const [materia, tempo] of Object.entries(tempos)) {
                                    detailsHTML += `<li>${materia}: ${tempo} min</li>`;
                                }
                                detailsHTML += `</ul>`;
                            } catch (e) {
                                console.error("Erro ao parsear tempos_por_materia:", item.tempos_por_materia, e);
                            }
                        }
                        details.innerHTML = detailsHTML;
                        
                        // 5. Adiciona o clique para expandir
                        li.addEventListener('click', () => {
                            li.classList.toggle('expanded');
                            details.classList.toggle('show');
                        });
                        
                    } else {
                        // Se não há tempos, adiciona classe para remover a seta
                        header.classList.add('no-details');
                    }

                    // 6. Monta o <li> final
                    li.appendChild(header);
                    if (temTempoTotal || temTempoMateria) {
                         li.appendChild(details);
                    }
                    listaRanking.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            listaRanking.innerHTML = '<li>Ocorreu um erro ao carregar o ranking.</li>';
        }
    });

    // 3. Lógica do botão "Iniciar Cronômetro" (REMOVIDA)
    // (Vamos remover este botão no próximo passo, por enquanto deixamos o listener)
    btnIniciarCronometro.addEventListener('click', () => {
        const simuladoId = selectSimulado.value;
        if (!simuladoId) {
            alert('Por favor, selecione um simulado para iniciar o cronômetro.');
            return;
        }
        // Redireciona o usuário para a nova página do cronômetro
        // Esta funcionalidade será removida/alterada
        alert('Funcionalidade de cronômetro será movida!');
        // window.location.href = `/iniciar-simulado/${simuladoId}`;
    });

    // --- Inicialização ---
    carregarSimulados(); // Carrega a lista de simulados ao abrir a página
});