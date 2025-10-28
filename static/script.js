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
            const rankings = await response.json(); // Ex: { quantidade: [...], percentual: [...] }

            // --- Lógica para Ranking de Quantidade ---
            const rankingQtdList = document.getElementById('ranking-quantidade');
            const top3Qtd = rankings.quantidade.slice(0, 3); // Pega os 3 primeiros
            const restoQtd = rankings.quantidade.slice(3); // Pega do 4º em diante

            // Limpa pódio e lista
            document.getElementById('podium-qtd-1-name').textContent = '---';
            document.getElementById('podium-qtd-1-score').textContent = '--- Qtd';
            // ... (limpar também #2 e #3 de forma similar)
            document.getElementById('podium-qtd-2-name').textContent = '---';
            document.getElementById('podium-qtd-2-score').textContent = '--- Qtd';
            document.getElementById('podium-qtd-3-name').textContent = '---';
            document.getElementById('podium-qtd-3-score').textContent = '--- Qtd';
            rankingQtdList.innerHTML = '';

            // Preenche o pódio de Quantidade
            top3Qtd.forEach((item, index) => {
                const rank = index + 1;
                document.getElementById(`podium-qtd-${rank}-name`).textContent = item.nome;
                document.getElementById(`podium-qtd-${rank}-score`).textContent = `${item.total} Qtd`;
            });

            // Preenche a lista do restante (4º em diante)
            if (restoQtd.length === 0 && top3Qtd.length === 0){
                 rankingQtdList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda.</li>';
            } else {
                restoQtd.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 4}. ${item.nome} - ${item.total} questões`; // Começa a contar do 4º
                    rankingQtdList.appendChild(li);
                });
            }


            // --- Lógica para Ranking de Percentual --- (Similar à de Quantidade)
            const rankingPercList = document.getElementById('ranking-percentual');
            const top3Perc = rankings.percentual.slice(0, 3);
            const restoPerc = rankings.percentual.slice(3);

             // Limpa pódio e lista
            document.getElementById('podium-perc-1-name').textContent = '---';
            document.getElementById('podium-perc-1-score').textContent = '--- %';
             // ... (limpar também #2 e #3)
            document.getElementById('podium-perc-2-name').textContent = '---';
            document.getElementById('podium-perc-2-score').textContent = '--- %';
            document.getElementById('podium-perc-3-name').textContent = '---';
            document.getElementById('podium-perc-3-score').textContent = '--- %';
            rankingPercList.innerHTML = '';


            // Preenche o pódio de Percentual
            top3Perc.forEach((item, index) => {
                const rank = index + 1;
                document.getElementById(`podium-perc-${rank}-name`).textContent = item.nome;
                document.getElementById(`podium-perc-${rank}-score`).textContent = `${parseFloat(item.percentual).toFixed(2)}%`;
            });

            // Preenche a lista do restante (4º em diante)
             if (restoPerc.length === 0 && top3Perc.length === 0){
                 rankingPercList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda (ou mínimo não atingido).</li>';
            } else {
                restoPerc.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 4}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`; // Começa do 4º
                    rankingPercList.appendChild(li);
                });
            }

        } catch (error) {
            console.error('Erro ao carregar rankings:', error);
            // Poderíamos adicionar mensagens de erro nos pódios/listas aqui
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