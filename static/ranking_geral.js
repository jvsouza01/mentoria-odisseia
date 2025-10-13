document.addEventListener('DOMContentLoaded', () => {
    const rankingQtdList = document.getElementById('ranking-quantidade-completo');
    const rankingPercList = document.getElementById('ranking-percentual-completo');

    async function carregarRankingsGerais() {
        try {
            // A CORREÇÃO ESTÁ AQUI: Chamando a API com o nome novo
            const response = await fetch('/api/rankings/geral');
            const rankings = await response.json();

            rankingQtdList.innerHTML = '';
            rankingPercList.innerHTML = '';

            rankings.quantidade.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.nome} - ${item.total} questões`;
                rankingQtdList.appendChild(li);
            });

            rankings.percentual.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                rankingPercList.appendChild(li);
            });

        } catch (error) {
            console.error('Erro ao carregar rankings gerais:', error);
        }
    }

    carregarRankingsGerais();
});