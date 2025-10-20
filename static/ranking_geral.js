document.addEventListener('DOMContentLoaded', () => {
    // IDs para o Ranking Geral (All-Time)
    const rankingQtdGeral = document.getElementById('ranking-quantidade-geral');
    const rankingPercGeral = document.getElementById('ranking-percentual-geral');
    
    // IDs para o Ranking da Semana Passada
    const rankingQtdPassada = document.getElementById('ranking-quantidade-passada');
    const rankingPercPassada = document.getElementById('ranking-percentual-passada');

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

    // NOVA FUNÇÃO para buscar o ranking da SEMANA PASSADA
    async function carregarRankingSemanaPassada() {
        try {
            const response = await fetch('/api/rankings/semana-passada');
            const rankings = await response.json();

            rankingQtdPassada.innerHTML = '';
            rankingPercPassada.innerHTML = '';

            if (rankings.quantidade.length === 0) {
                rankingQtdPassada.innerHTML = '<li>Nenhum dado registrado na semana passada.</li>';
            } else {
                rankings.quantidade.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 1}. ${item.nome} - ${item.total} questões`;
                    rankingQtdPassada.appendChild(li);
                });
            }
            
            if (rankings.percentual.length === 0) {
                rankingPercPassada.innerHTML = '<li>Nenhum dado registrado na semana passada (ou mínimo de 20q não atingido).</li>';
            } else {
                rankings.percentual.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 1}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                    rankingPercPassada.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar ranking da semana passada:', error);
        }
    }

    // Carrega os dois rankings quando a página é aberta
    carregarRankingGeral();
    carregarRankingSemanaPassada();
});