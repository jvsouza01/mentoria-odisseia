document.addEventListener('DOMContentLoaded', () => {
    const alunoSelect = document.getElementById('aluno-select');
    const registroForm = document.getElementById('registro-form');
    const rankingQtdList = document.getElementById('ranking-quantidade');
    const rankingPercList = document.getElementById('ranking-percentual');
    const ultimosLancamentosList = document.getElementById('ultimos-lancamentos');

    // Função para buscar a lista de alunos da nossa API
    async function carregarAlunos() {
        try {
            const response = await fetch('/api/alunos');
            const alunos = await response.json();
            alunoSelect.innerHTML = '<option value="">Selecione um aluno</option>';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome;
                alunoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
        }
    }

    // Função para buscar os dados dos rankings DA SEMANA e exibi-los
    // Função para buscar os dados dos rankings DA SEMANA e exibi-los
    async function carregarRankings() {
        try {
            const response = await fetch('/api/rankings');
            if (!response.ok) { // Verifica se a API respondeu com sucesso
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rankings = await response.json(); // Ex: { quantidade: [...], percentual: [...] }

            // --- Lógica para Ranking de Quantidade ---
            const rankingQtdList = document.getElementById('ranking-quantidade');
            // Limpa o pódio de Quantidade (Define valores padrão)
            ['1', '2', '3'].forEach(rank => {
                const nameEl = document.getElementById(`podium-qtd-${rank}-name`);
                const scoreEl = document.getElementById(`podium-qtd-${rank}-score`);
                if (nameEl) nameEl.textContent = '---';
                if (scoreEl) scoreEl.textContent = rank === '1' ? '--- Qtd' : '--- Qtd'; // Ajuste conforme necessário
            });
            rankingQtdList.innerHTML = ''; // Limpa a lista de demais colocações

            if (rankings.quantidade && rankings.quantidade.length > 0) {
                const top3Qtd = rankings.quantidade.slice(0, 3);
                const restoQtd = rankings.quantidade.slice(3);

                // Preenche o pódio de Quantidade
                top3Qtd.forEach((item, index) => {
                    const rank = index + 1;
                    const nameEl = document.getElementById(`podium-qtd-${rank}-name`);
                    const scoreEl = document.getElementById(`podium-qtd-${rank}-score`);
                    if (nameEl) nameEl.textContent = item.nome;
                    if (scoreEl) scoreEl.textContent = `${item.total} Qtd`;
                });

                // Preenche a lista do restante (4º em diante)
                if (restoQtd.length > 0) {
                    restoQtd.forEach((item, index) => {
                        const li = document.createElement('li');
                        // Garante que o número está correto (index do slice(3) + 4)
                        li.textContent = `${index + 4}. ${item.nome} - ${item.total} questões`;
                        rankingQtdList.appendChild(li);
                    });
                } else if (top3Qtd.length >= 3) {
                     // Se tem top 3 mas não tem mais ninguém
                     // rankingQtdList.innerHTML = '<li>-- Fim da lista --</li>'; // Opcional
                }

            } else {
                rankingQtdList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda.</li>';
            }

            // --- Lógica para Ranking de Percentual --- (Similar à de Quantidade)
            const rankingPercList = document.getElementById('ranking-percentual');
             // Limpa o pódio de Percentual
            ['1', '2', '3'].forEach(rank => {
                const nameEl = document.getElementById(`podium-perc-${rank}-name`);
                const scoreEl = document.getElementById(`podium-perc-${rank}-score`);
                if (nameEl) nameEl.textContent = '---';
                if (scoreEl) scoreEl.textContent = '--- %';
            });
            rankingPercList.innerHTML = ''; // Limpa a lista

            if (rankings.percentual && rankings.percentual.length > 0) {
                const top3Perc = rankings.percentual.slice(0, 3);
                const restoPerc = rankings.percentual.slice(3);

                // Preenche o pódio de Percentual
                top3Perc.forEach((item, index) => {
                    const rank = index + 1;
                    const nameEl = document.getElementById(`podium-perc-${rank}-name`);
                    const scoreEl = document.getElementById(`podium-perc-${rank}-score`);
                    if (nameEl) nameEl.textContent = item.nome;
                    if (scoreEl) scoreEl.textContent = `${parseFloat(item.percentual).toFixed(2)}%`;
                });

                // Preenche a lista do restante (4º em diante)
                 if (restoPerc.length > 0) {
                    restoPerc.forEach((item, index) => {
                        const li = document.createElement('li');
                        li.textContent = `${index + 4}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                        rankingPercList.appendChild(li);
                    });
                 } else if (top3Perc.length >=3) {
                     // rankingPercList.innerHTML = '<li>-- Fim da lista --</li>'; // Opcional
                 }

            } else {
                rankingPercList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda (ou mínimo não atingido).</li>';
            }

        } catch (error) {
            console.error('Erro ao carregar rankings:', error);
            // Limpa tudo em caso de erro para evitar dados inconsistentes
             document.getElementById('ranking-quantidade').innerHTML = '<li>Erro ao carregar ranking.</li>';
             document.getElementById('ranking-percentual').innerHTML = '<li>Erro ao carregar ranking.</li>';
             // Limpar pódios também se desejar
        }
    }
    
    // Função para carregar os últimos lançamentos
    async function carregarUltimosLancamentos() {
        try {
            const response = await fetch('/api/registros/recentes');
            const registros = await response.json();
            ultimosLancamentosList.innerHTML = ''; // Limpa a lista

            registros.forEach(r => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${r.aluno_nome}: ${r.acertos} acertos de ${r.questoes} questões
                    <button class="delete-btn" data-id="${r.id}">Apagar</button>
                `;
                ultimosLancamentosList.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao carregar últimos lançamentos:', error);
        }
    }

    // Função para recarregar todos os dados da página
    async function recarregarTudo() {
        await carregarRankings();
        await carregarUltimosLancamentos();
    }

    // Lógica para o envio do formulário
    registroForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(registroForm);
        const dados = {
            aluno_id: formData.get('aluno_id'),
            quantidade: formData.get('quantidade'),
            acertos: formData.get('acertos')
        };
        if (parseInt(dados.acertos) > parseInt(dados.quantidade)) {
            alert('O número de acertos não pode ser maior que a quantidade de questões.');
            return;
        }
        try {
            const response = await fetch('/api/registros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (response.ok) {
                registroForm.reset();
                await recarregarTudo(); // Recarrega rankings e lançamentos
            } else {
                alert('Falha ao salvar o registro.');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
        }
    });

    // Lógica para escutar cliques nos botões de apagar
    ultimosLancamentosList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const registroId = event.target.dataset.id;
            
            if (confirm('Tem certeza que deseja apagar este registro?')) {
                try {
                    const response = await fetch(`/api/registros/${registroId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await recarregarTudo(); // Se apagou, recarrega tudo
                    } else {
                        alert('Falha ao apagar o registro.');
                    }
                } catch (error) {
                    console.error('Erro ao apagar registro:', error);
                }
            }
        }
    });

    // Carrega os dados iniciais quando a página é aberta
    carregarAlunos();
    recarregarTudo();
});