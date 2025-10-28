document.addEventListener('DOMContentLoaded', () => {
    // Função para buscar os dados dos rankings DA SEMANA e exibi-los
    async function carregarRankings() {
        try {
            const response = await fetch('/api/rankings');
            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rankings = await response.json();

            // --- Lógica para Ranking de Quantidade ---
            const rankingQtdList = document.getElementById('ranking-quantidade');
            ['1', '2', '3'].forEach(rank => { /* ... Limpar pódio Qtd ... */ });
            rankingQtdList.innerHTML = '';

            if (rankings.quantidade && rankings.quantidade.length > 0) {
                const top3Qtd = rankings.quantidade.slice(0, 3);
                const restoQtd = rankings.quantidade.slice(3);

                top3Qtd.forEach((item, index) => { /* ... Preencher pódio Qtd ... */ });
                restoQtd.forEach((item, index) => { /* ... Preencher lista Qtd ... */ });

            } else {
                rankingQtdList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda.</li>';
            }

            // --- Lógica para Ranking de Percentual ---
            const rankingPercList = document.getElementById('ranking-percentual');
             ['1', '2', '3'].forEach(rank => { /* ... Limpar pódio Perc ... */ });
            rankingPercList.innerHTML = '';

            if (rankings.percentual && rankings.percentual.length > 0) {
                const top3Perc = rankings.percentual.slice(0, 3);
                const restoPerc = rankings.percentual.slice(3);

                top3Perc.forEach((item, index) => { /* ... Preencher pódio Perc ... */ });
                restoPerc.forEach((item, index) => { /* ... Preencher lista Perc ... */ });

            } else {
                rankingPercList.innerHTML = '<li>Nenhum registro encontrado para esta semana ainda (ou mínimo não atingido).</li>';
            }

        } catch (error) {
            console.error('Erro ao carregar rankings:', error);
            document.getElementById('ranking-quantidade').innerHTML = '<li>Erro ao carregar ranking.</li>';
            document.getElementById('ranking-percentual').innerHTML = '<li>Erro ao carregar ranking.</li>';
        }
    }

    // Carrega os rankings ao abrir a página
    carregarRankings();
});