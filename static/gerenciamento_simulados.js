document.addEventListener('DOMContentLoaded', () => {
    // Formulário de Empresas
    const formAddEmpresa = document.getElementById('form-add-empresa');
    const inputEmpresaNome = document.getElementById('empresa-nome');
    const listaEmpresas = document.getElementById('lista-empresas');

    // Formulário de Simulados
    const formAddSimulado = document.getElementById('form-add-simulado');
    const selectSimuladoEmpresa = document.getElementById('simulado-empresa');
    const listaSimulados = document.getElementById('lista-simulados');

    // Função para carregar e exibir as empresas existentes
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
                    // Adiciona na lista de exibição
                    const li = document.createElement('li');
                    li.textContent = empresa.nome;
                    listaEmpresas.appendChild(li);

                    // Adiciona no dropdown do formulário de simulado
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

    // Função para carregar e exibir os simulados existentes
    async function carregarSimulados() {
        try {
            const response = await fetch('/api/simulados');
            const simulados = await response.json();
            
            listaSimulados.innerHTML = '';
            if (simulados.length === 0) {
                listaSimulados.innerHTML = '<li>Nenhum simulado cadastrado.</li>';
            } else {
                simulados.forEach(simulado => {
                    const li = document.createElement('li');
                    li.textContent = `${simulado.nome_display} - ${simulado.data}`;
                    listaSimulados.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // Lógica para o formulário de adicionar empresa
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
            alert('Ocorreu um erro de comunicação com o servidor.');
        }
    });

    // Lógica para o formulário de adicionar simulado
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
                await carregarSimulados(); // Atualiza a lista de simulados na tela
                alert('Simulado salvo com sucesso!');
            } else {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao salvar simulado:', error);
            alert('Ocorreu um erro de comunicação com o servidor.');
        }
    });

    // Carrega os dados iniciais ao abrir a página
    carregarEmpresas();
    carregarSimulados();
});