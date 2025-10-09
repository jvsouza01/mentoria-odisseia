document.addEventListener('DOMContentLoaded', () => {
    const alunoSelect = document.getElementById('aluno-select');
    const registroForm = document.getElementById('registro-form');
    const rankingQtdList = document.getElementById('ranking-quantidade');
    const rankingPercList = document.getElementById('ranking-percentual');

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

    // Função para buscar os dados dos rankings e exibi-los na tela
    async function carregarRankings() {
        try {
            const response = await fetch('/api/rankings');
            const rankings = await response.json();

            // Limpa as listas antes de preencher
            rankingQtdList.innerHTML = '';
            rankingPercList.innerHTML = '';

            // Preenche o ranking de quantidade
            rankings.quantidade.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.nome} - ${item.total} questões`;
                rankingQtdList.appendChild(li);
            });

            // Preenche o ranking de percentual
            rankings.percentual.forEach((item, index) => {
                const li = document.createElement('li');
                // toFixed(2) para formatar com 2 casas decimais
                li.textContent = `${index + 1}. ${item.nome} - ${item.percentual.toFixed(2)}%`;
                rankingPercList.appendChild(li);
            });

        } catch (error) {
            console.error('Erro ao carregar rankings:', error);
        }
    }

    // Função para lidar com o envio do formulário
    registroForm.addEventListener('submit', async (event) => {
        // Previne o recarregamento padrão da página
        event.preventDefault();

        const formData = new FormData(registroForm);
        const dados = {
            aluno_id: formData.get('aluno_id'),
            quantidade: formData.get('quantidade'),
            acertos: formData.get('acertos')
        };
        
        // Validação simples
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
                // Se o registro foi salvo com sucesso
                registroForm.reset(); // Limpa o formulário
                await carregarRankings(); // Atualiza os rankings na tela
            } else {
                alert('Falha ao salvar o registro.');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
        }
    });

    // Carrega os dados iniciais quando a página é aberta
    carregarAlunos();
    carregarRankings();
});