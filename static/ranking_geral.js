document.addEventListener('DOMContentLoaded', () => {
    const rankingQtdList = document.getElementById('ranking-quantidade-completo');
    const rankingPercList = document.getElementById('ranking-percentual-completo');

    async function carregarRankingsCompletos() {
        try {
            const response = await fetch('/api/rankings/completo');
            const rankings = await response.json();

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
                li.textContent = `${index + 1}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                rankingPercList.appendChild(li);
            });

        } catch (error) {
            console.error('Erro ao carregar rankings completos:', error);
        }
    }

    carregarRankingsCompletos();
});