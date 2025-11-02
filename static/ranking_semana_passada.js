// Garante que as bibliotecas jsPDF e html2canvas estejam carregadas
const { jsPDF } = window.jspdf;
// html2canvas é adicionado globalmente

document.addEventListener('DOMContentLoaded', () => {
    // IDs para as Listas (Demais Colocações)
    const rankingQtdPassadaLista = document.getElementById('ranking-quantidade-passada-lista');
    const rankingPercPassadaLista = document.getElementById('ranking-percentual-passada-lista');
    
    // Seletores para o botão de PDF e o card completo
    const btnPdfSemanaPassada = document.getElementById('btn-pdf-semana-passada');
    const cardParaImprimir = document.getElementById('card-semana-passada');

    // Função para buscar o ranking da SEMANA PASSADA e preencher o HTML
    async function carregarRankingSemanaPassada() {
        try {
            const response = await fetch('/api/rankings/semana-passada');
            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rankings = await response.json();
            
            // --- Lógica para Ranking de Quantidade ---
            // Limpa o pódio de Quantidade (Define valores padrão)
            ['1', '2', '3'].forEach(rank => {
                const nameEl = document.getElementById(`podium-qtd-passada-${rank}-name`);
                const scoreEl = document.getElementById(`podium-qtd-passada-${rank}-score`);
                if (nameEl) nameEl.textContent = '---';
                if (scoreEl) scoreEl.textContent = '--- Questões';
            });
            rankingQtdPassadaLista.innerHTML = ''; // Limpa a lista de demais colocações

            if (rankings.quantidade && rankings.quantidade.length > 0) {
                const top3Qtd = rankings.quantidade.slice(0, 3);
                const restoQtd = rankings.quantidade.slice(3);

                // Preenche o pódio de Quantidade
                top3Qtd.forEach((item, index) => {
                    const rank = index + 1;
                    const nameEl = document.getElementById(`podium-qtd-passada-${rank}-name`);
                    const scoreEl = document.getElementById(`podium-qtd-passada-${rank}-score`);
                    if (nameEl) nameEl.textContent = item.nome;
                    if (scoreEl) scoreEl.textContent = `${item.total} Questões`;
                });

                // Preenche a lista do restante (4º em diante)
                if (restoQtd.length > 0) {
                    restoQtd.forEach((item, index) => {
                        const li = document.createElement('li');
                        li.textContent = `${index + 4}. ${item.nome} - ${item.total} questões`;
                        rankingQtdPassadaLista.appendChild(li);
                    });
                }
            } else {
                rankingQtdPassadaLista.innerHTML = '<li>Nenhum registro encontrado para esta semana.</li>';
            }

            // --- Lógica para Ranking de Percentual ---
            // Limpa o pódio de Percentual
            ['1', '2', '3'].forEach(rank => {
                const nameEl = document.getElementById(`podium-perc-passada-${rank}-name`);
                const scoreEl = document.getElementById(`podium-perc-passada-${rank}-score`);
                if (nameEl) nameEl.textContent = '---';
                if (scoreEl) scoreEl.textContent = '--- %';
            });
            rankingPercPassadaLista.innerHTML = ''; // Limpa a lista

            if (rankings.percentual && rankings.percentual.length > 0) {
                const top3Perc = rankings.percentual.slice(0, 3);
                const restoPerc = rankings.percentual.slice(3);

                // Preenche o pódio de Percentual
                top3Perc.forEach((item, index) => {
                    const rank = index + 1;
                    const nameEl = document.getElementById(`podium-perc-passada-${rank}-name`);
                    const scoreEl = document.getElementById(`podium-perc-passada-${rank}-score`);
                    if (nameEl) nameEl.textContent = item.nome;
                    if (scoreEl) scoreEl.textContent = `${parseFloat(item.percentual).toFixed(2)}%`;
                });

                // Preenche a lista do restante (4º em diante)
                if (restoPerc.length > 0) {
                    restoPerc.forEach((item, index) => {
                        const li = document.createElement('li');
                        li.textContent = `${index + 4}. ${item.nome} - ${parseFloat(item.percentual).toFixed(2)}%`;
                        rankingPercPassadaLista.appendChild(li);
                    });
                }
            } else {
                rankingPercPassadaLista.innerHTML = '<li>Nenhum registro encontrado (ou mínimo não atingido).</li>';
            }

        } catch (error) {
            console.error('Erro ao carregar ranking da semana passada:', error);
            rankingQtdPassadaLista.innerHTML = '<li>Erro ao carregar ranking.</li>';
            rankingPercPassadaLista.innerHTML = '<li>Erro ao carregar ranking.</li>';
        }
    }

    // --- Função para Gerar o PDF (Código idêntico ao anterior) ---
    function gerarPDF() {
        console.log('Iniciando geração de PDF para Ranking Semana Passada...');
        btnPdfSemanaPassada.style.display = 'none'; // Esconde o botão

        html2canvas(cardParaImprimir, {
            scale: 2,
            backgroundColor: null,
            onclone: (documentClone) => {
                // Força o fundo escuro do card no print do PDF
                documentClone.getElementById('card-semana-passada').style.backgroundColor = 'var(--card-dark)';
            }
        }).then(canvas => {
            btnPdfSemanaPassada.style.display = 'block'; // Mostra o botão
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('ranking_semana_passada.pdf');
        }).catch(err => {
            console.error('Erro ao gerar PDF para Ranking Semana Passada:', err);
            btnPdfSemanaPassada.style.display = 'block'; // Garante que o botão reapareça
        });
    }

    // Adiciona o listener ao botão de PDF
    btnPdfSemanaPassada.addEventListener('click', gerarPDF);

    // Carrega os rankings ao carregar a página
    carregarRankingSemanaPassada();
});