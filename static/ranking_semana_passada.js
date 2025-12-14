document.addEventListener('DOMContentLoaded', async () => {
    
    // Função para carregar os dados
    async function carregarRanking() {
        try {
            const response = await fetch('/api/rankings/semana-passada');
            const data = await response.json();

            // --- 1. Preencher Batalha de Times ---
            if (data.batalha) {
                document.getElementById('bat-alpha-qtd').innerText = data.batalha.Alpha.questoes;
                document.getElementById('bat-alpha-perc').innerText = data.batalha.Alpha.precisao + '%';
                
                document.getElementById('bat-omega-qtd').innerText = data.batalha.Omega.questoes;
                document.getElementById('bat-omega-perc').innerText = data.batalha.Omega.precisao + '%';
                
                document.getElementById('bat-vencedor').innerText = data.batalha.vencedor;
            }

            // --- 2. Preencher Pódios Individuais ---
            preencherPodio('qtd-passada', data.quantidade, 'Questões', 'total');
            preencherPodio('perc-passada', data.percentual, '%', 'percentual');

            // --- 3. Preencher Listas (Demais colocados) ---
            preencherLista('ranking-quantidade-passada-lista', data.quantidade, 'Questões', 'total');
            preencherLista('ranking-percentual-passada-lista', data.percentual, '%', 'percentual');

        } catch (error) {
            console.error("Erro ao carregar ranking:", error);
        }
    }

    // Função Auxiliar: Preencher Pódio (Top 3)
    function preencherPodio(prefixo, lista, unidade, campoValor) {
        // Limpa
        [1, 2, 3].forEach(i => {
            document.getElementById(`podium-${prefixo}-${i}-name`).innerText = '---';
            document.getElementById(`podium-${prefixo}-${i}-score`).innerText = `--- ${unidade}`;
        });

        if (lista.length > 0) { // 1º Lugar
            const p1 = lista[0];
            document.getElementById(`podium-${prefixo}-1-name`).innerText = p1.nome;
            let val1 = p1[campoValor];
            if(unidade === '%') val1 = parseFloat(val1).toFixed(2);
            document.getElementById(`podium-${prefixo}-1-score`).innerText = `${val1} ${unidade}`;
        }
        if (lista.length > 1) { // 2º Lugar
            const p2 = lista[1];
            document.getElementById(`podium-${prefixo}-2-name`).innerText = p2.nome;
            let val2 = p2[campoValor];
            if(unidade === '%') val2 = parseFloat(val2).toFixed(2);
            document.getElementById(`podium-${prefixo}-2-score`).innerText = `${val2} ${unidade}`;
        }
        if (lista.length > 2) { // 3º Lugar
            const p3 = lista[2];
            document.getElementById(`podium-${prefixo}-3-name`).innerText = p3.nome;
            let val3 = p3[campoValor];
            if(unidade === '%') val3 = parseFloat(val3).toFixed(2);
            document.getElementById(`podium-${prefixo}-3-score`).innerText = `${val3} ${unidade}`;
        }
    }

    // Função Auxiliar: Preencher Lista (Do 4º em diante)
    function preencherLista(elementId, lista, unidade, campoValor) {
        const ol = document.getElementById(elementId);
        ol.innerHTML = '';

        // Começa do índice 3 (que é o 4º colocado)
        for (let i = 3; i < lista.length; i++) {
            const item = lista[i];
            let valor = item[campoValor];
            if(unidade === '%') valor = parseFloat(valor).toFixed(2);

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${i + 1}. ${item.nome}</span>
                <strong>${valor} ${unidade}</strong>
            `;
            ol.appendChild(li);
        }
    }

    // --- Lógica do PDF ---
    document.getElementById('btn-pdf-semana-passada').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const elemento = document.getElementById('card-semana-passada');
        const botao = document.getElementById('btn-pdf-semana-passada');

        // Esconde o botão temporariamente para não sair na foto
        botao.style.display = 'none';

        html2canvas(elemento, {
            backgroundColor: "#1e1e1e", 
            scale: 2 
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); 
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Ajusta proporção para caber na folha
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, imgHeight);
            pdf.save("Ranking_Semana_Passada_Odisseia.pdf");

            // Mostra o botão de volta
            botao.style.display = 'block';
        });
    });

    carregarRanking();
});