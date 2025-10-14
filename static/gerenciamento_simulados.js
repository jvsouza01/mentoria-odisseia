document.addEventListener('DOMContentLoaded', () => {
    // Formulários
    const formAddEmpresa = document.getElementById('form-add-empresa');
    const formAddSimulado = document.getElementById('form-add-simulado');
    const formAddResultado = document.getElementById('form-add-resultado');

    // Listas de exibição
    const listaEmpresas = document.getElementById('lista-empresas');
    const listaSimulados = document.getElementById('lista-simulados');
    
    // Selects (Dropdowns)
    const selectSimuladoEmpresa = document.getElementById('simulado-empresa');
    const selectResultadoAluno = document.getElementById('resultado-aluno');
    const selectResultadoSimulado = document.getElementById('resultado-simulado');

    // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---
    
    async function carregarAlunos() {
        try {
            const response = await fetch('/api/alunos');
            const alunos = await response.json();
            selectResultadoAluno.innerHTML = '<option value="">Selecione o aluno</option>';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome;
                selectResultadoAluno.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            selectResultadoAluno.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    async function carregarEmpresas() {
        try {
            const response = await fetch('/api/empresas');
            const empresas = await response.json();
            
            listaEmpresas.innerHTML = '';
            selectSimuladoEmpresa.innerHTML = '<option value="">Selecione a empresa</option>';

            if (empresas.length === 0) {
                listaEmpresas.innerHTML = '<li>Nenhuma empresa cadastrada.</li>';
            } else {
                empresas.forEach(empresa => {
                    const li = document.createElement('li');
                    li.textContent = empresa.nome;
                    listaEmpresas.appendChild(li);

                    const option = document.createElement('option');
                    option.value = empresa.id;
                    option.textContent = empresa.nome;
                    selectSimuladoEmpresa.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
        }
    }

    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            listaSimulados.innerHTML = '';
            selectResultadoSimulado.innerHTML = '<option value="">Selecione o simulado</option>';

            if (simulados.length === 0) {
                listaSimulados.innerHTML = '<li>Nenhum simulado cadastrado.</li>';
            } else {
                simulados.forEach(simulado => {
                    const li = document.createElement('li');
                    li.textContent = `${simulado.nome_display} - ${simulado.data}`;
                    listaSimulados.appendChild(li);

                    const option = document.createElement('option');
                    option.value = simulado.id;
                    option.textContent = simulado.nome_display;
                    selectResultadoSimulado.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // --- LÓGICA DOS FORMULÁRIOS ---

    formAddEmpresa.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeEmpresa = document.getElementById('empresa-nome').value.trim();
        if (!nomeEmpresa) return;

        try {
            const response = await fetch('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeEmpresa })
            });
            const result = await response.json();

            if (response.ok) {
                formAddEmpresa.reset();
                await carregarEmpresas();
                alert('Empresa salva com sucesso!');
            } else {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
        }
    });

    formAddSimulado.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dados = {
            empresa_id: document.getElementById('simulado-empresa').value,
            numero: document.getElementById('simulado-numero').value || null,
            nome_especifico: document.getElementById('simulado-nome').value.trim() || null,
            categoria: document.getElementById('simulado-categoria').value,
            data_realizacao: document.getElementById('simulado-data').value,
        };

        try {
            const response = await fetch('/api/simulados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();

            if (response.ok) {
                formAddSimulado.reset();
                await carregarSimulados();
                alert('Simulado salvo com sucesso!');
            } else {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao salvar simulado:', error);
        }
    });

    formAddResultado.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dados = {
            aluno_id: document.getElementById('resultado-aluno').value,
            simulado_id: document.getElementById('resultado-simulado').value,
            nota: document.getElementById('resultado-nota').value
        };

        try {
            const response = await fetch('/api/resultados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();

            if (response.ok) {
                formAddResultado.reset();
                alert('Nota lançada com sucesso!');
            } else {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao lançar nota:', error);
        }
    });

    // Carrega todos os dados iniciais ao abrir a página
    function carregarTudo() {
        carregarAlunos();
        carregarEmpresas();
        carregarSimulados();
    }
    carregarTudo();
});