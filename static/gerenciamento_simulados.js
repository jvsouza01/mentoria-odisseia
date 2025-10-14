document.addEventListener('DOMContentLoaded', () => {
    // Formulários
    const formAddEmpresa = document.getElementById('form-add-empresa');
    const formAddSimulado = document.getElementById('form-add-simulado');
    const formAddResultado = document.getElementById('form-add-resultado');

    // Listas de exibição
    const listaEmpresas = document.getElementById('lista-empresas');
    const listaSimulados = document.getElementById('lista-simulados');
    const listaUltimasNotas = document.getElementById('lista-ultimas-notas'); // Nova lista
    
    // Selects (Dropdowns)
    const selectSimuladoEmpresa = document.getElementById('simulado-empresa');
    const selectResultadoAluno = document.getElementById('resultado-aluno');
    const selectResultadoSimulado = document.getElementById('resultado-simulado');

    // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---
    
    async function carregarAlunos() { /* ... código existente, sem alteração ... */ }
    async function carregarEmpresas() { /* ... código existente, sem alteração ... */ }
    async function carregarSimulados() { /* ... código existente, sem alteração ... */ }

    // NOVA FUNÇÃO para carregar as últimas notas lançadas
    async function carregarUltimasNotas() {
        try {
            const response = await fetch('/api/resultados/recentes');
            const resultados = await response.json();
            
            listaUltimasNotas.innerHTML = '';
            if (resultados.length === 0) {
                listaUltimasNotas.innerHTML = '<li>Nenhuma nota lançada recentemente.</li>';
            } else {
                resultados.forEach(r => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${r.aluno_nome} - <strong>Nota ${r.nota.toFixed(2)}</strong> em "${r.simulado_nome}"</span>
                        <button class="delete-btn" data-id="${r.id}">Apagar</button>
                    `;
                    listaUltimasNotas.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar últimas notas:', error);
        }
    }

    // --- LÓGICA DOS FORMULÁRIOS ---

    formAddEmpresa.addEventListener('submit', async (event) => { /* ... código existente ... */ });
    formAddSimulado.addEventListener('submit', async (event) => { /* ... código existente ... */ });

    formAddResultado.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dados = { /* ... código existente ... */ };

        try {
            // ... (fetch para POST /api/resultados) ...
            if (response.ok) {
                formAddResultado.reset();
                await carregarUltimasNotas(); // ATUALIZA A LISTA APÓS LANÇAR
                alert('Nota lançada com sucesso!');
            } else { /* ... */ }
        } catch (error) { /* ... */ }
    });

    // NOVO EVENT LISTENER para a lista de últimas notas
    listaUltimasNotas.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const resultadoId = event.target.dataset.id;
            
            if (confirm('Tem certeza que deseja apagar esta nota? A ação não pode ser desfeita.')) {
                try {
                    const response = await fetch(`/api/resultados/${resultadoId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        await carregarUltimasNotas(); // ATUALIZA A LISTA APÓS APAGAR
                    } else {
                        alert('Falha ao apagar a nota.');
                    }
                } catch (error) {
                    console.error('Erro ao apagar nota:', error);
                }
            }
        }
    });

    // Carrega todos os dados iniciais ao abrir a página
    function carregarTudo() {
        carregarAlunos();
        carregarEmpresas();
        carregarSimulados();
        carregarUltimasNotas(); // Adiciona o carregamento das notas
    }
    carregarTudo();
});