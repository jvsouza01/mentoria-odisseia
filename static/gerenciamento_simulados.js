document.addEventListener('DOMContentLoaded', () => {
    const formAddEmpresa = document.getElementById('form-add-empresa');
    const inputEmpresaNome = document.getElementById('empresa-nome');
    const listaEmpresas = document.getElementById('lista-empresas');

    // Função para buscar e exibir as empresas existentes
    async function carregarEmpresas() {
        try {
            const response = await fetch('/api/empresas');
            const empresas = await response.json();
            
            listaEmpresas.innerHTML = ''; // Limpa a lista
            if (empresas.length === 0) {
                listaEmpresas.innerHTML = '<li>Nenhuma empresa cadastrada.</li>';
            } else {
                empresas.forEach(empresa => {
                    const li = document.createElement('li');
                    li.textContent = empresa.nome;
                    listaEmpresas.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
            listaEmpresas.innerHTML = '<li>Erro ao carregar empresas.</li>';
        }
    }

    // Lógica para o formulário de adicionar empresa
    formAddEmpresa.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeEmpresa = inputEmpresaNome.value.trim();
        if (!nomeEmpresa) return;

        try {
            const response = await fetch('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeEmpresa })
            });

            const result = await response.json();

            if (response.ok) {
                inputEmpresaNome.value = ''; // Limpa o campo
                await carregarEmpresas(); // Atualiza a lista na tela
                alert('Empresa salva com sucesso!');
            } else {
                // Mostra a mensagem de erro que veio do servidor
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
            alert('Ocorreu um erro de comunicação com o servidor.');
        }
    });

    // Carrega a lista de empresas ao abrir a página
    carregarEmpresas();
});