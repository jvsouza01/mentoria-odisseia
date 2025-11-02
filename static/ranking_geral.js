document.addEventListener('DOMContentLoaded', () => {
    // IDs para o Ranking Geral (All-Time)
    const rankingQtdGeral = document.getElementById('ranking-quantidade-geral');
    const rankingPercGeral = document.getElementById('ranking-percentual-geral');

    // Função para buscar o ranking GERAL (All-Time)
    async function carregarRankingGeral() {
        try {
            const response = await fetch('/api/rankings/geral');
            const rankings = await response.json();

            rankingQtdGeral.innerHTML = '';
            rankingPercGeral.innerHTML = '';

            rankings.quantidade.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.nome} - ${item.total} questões`;
                rankingQtdGeral.appendChild(li);
            });
            
            rankings.percentual.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                rankingPercGeral.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao carregar ranking geral:', error);
        }
    }
    
    // Função da semana passada e do PDF foram REMOVIDAS
    
    carregarRankingGeral(); // Carrega o ranking ao abrir a página
});