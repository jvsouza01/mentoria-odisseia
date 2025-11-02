// Precisamos das bibliotecas que foram carregadas no HTML
const { jsPDF } = window.jspdf;
// html2canvas é adicionado globalmente

document.addEventListener('DOMContentLoaded', () => {
    // IDs para o Ranking da Semana Passada
    const rankingQtdPassada = document.getElementById('ranking-quantidade-passada');
    const rankingPercPassada = document.getElementById('ranking-percentual-passada');
    
    // Botão de PDF
    const btnPdfSemanaPassada = document.getElementById('btn-pdf-semana-passada');
    const cardParaImprimir = document.getElementById('card-semana-passada');

    // Função para buscar o ranking da SEMANA PASSADA
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

    // Função para gerar o PDF (código idêntico ao anterior)
    function gerarPDF() {
        btnPdfSemanaPassada.style.display = 'none';
        html2canvas(cardParaImprimir, {
            scale: 2, backgroundColor: null,
            onclone: (documentClone) => {
                documentClone.getElementById('card-semana-passada').style.backgroundColor = 'var(--card-dark)';
            }
        }).then(canvas => {
            btnPdfSemanaPassada.style.display = 'block';
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('ranking_semana_passada.pdf');
        }).catch(err => {
            console.error('Erro ao gerar PDF:', err);
            btnPdfSemanaPassada.style.display = 'block';
        });
    }

    btnPdfSemanaPassada.addEventListener('click', gerarPDF);
    carregarRankingSemanaPassada(); // Carrega o ranking ao abrir a página
});