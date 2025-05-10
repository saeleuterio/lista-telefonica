// Elementos do DOM
const nomeInput = document.getElementById('nome');
const telefoneInput = document.getElementById('telefone');
const indiceEdicaoInput = document.getElementById('indice-edicao');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const arquivoWordInput = document.getElementById('arquivo-word');
const btnImportar = document.getElementById('btn-importar');
const pesquisaInput = document.getElementById('pesquisa');
const corpoTabela = document.getElementById('corpo-tabela');

// Array para armazenar os contatos
let contatos = [];

// Carregar contatos do localStorage ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarContatos();
    atualizarTabela();
    
    // Adicionar evento de pesquisa
    pesquisaInput.addEventListener('input', () => {
        atualizarTabela();
    });
});

// Evento de salvar contato
btnSalvar.addEventListener('click', () => {
    salvarContato();
});

// Evento de cancelar edição
btnCancelar.addEventListener('click', () => {
    cancelarEdicao();
});

// Evento de importar contatos de arquivo Word
btnImportar.addEventListener('click', () => {
    importarContatosDoWord();
});

// Função para carregar contatos do localStorage
function carregarContatos() {
    const contatosSalvos = localStorage.getItem('listaContatos');
    if (contatosSalvos) {
        contatos = JSON.parse(contatosSalvos);
    }
}

// Função para salvar contatos no localStorage
function salvarNoStorage() {
    localStorage.setItem('listaContatos', JSON.stringify(contatos));
}

// Função para salvar um novo contato ou atualizar um existente
function salvarContato() {
    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    
    // Validação dos campos
    if (!nome || !telefone) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    const indiceEdicao = indiceEdicaoInput.value;
    
    // Se estiver no modo de edição
    if (indiceEdicao !== '') {
        contatos[indiceEdicao] = { nome, telefone };
    } else {
        // Adicionar novo contato
        contatos.push({ nome, telefone });
    }
    
    // Ordenar contatos por nome
    ordenarContatos();
    
    // Salvar no localStorage
    salvarNoStorage();
    
    // Limpar formulário
    limparFormulario();
    
    // Atualizar tabela
    atualizarTabela();
}

// Função para ordenar contatos por nome
function ordenarContatos() {
    contatos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Função para limpar o formulário
function limparFormulario() {
    nomeInput.value = '';
    telefoneInput.value = '';
    indiceEdicaoInput.value = '';
    btnSalvar.textContent = 'Salvar';
    btnCancelar.style.display = 'none';
}

// Função para atualizar a tabela de contatos
function atualizarTabela() {
    corpoTabela.innerHTML = '';
    
    const termoPesquisa = pesquisaInput.value.toLowerCase();
    
    // Filtrar contatos conforme pesquisa
    const contatosFiltrados = contatos.filter(contato => 
        contato.nome.toLowerCase().includes(termoPesquisa) || 
        contato.telefone.includes(termoPesquisa)
    );
    
    // Mostrar mensagem se não houver contatos
    if (contatosFiltrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" style="text-align: center;">Nenhum contato encontrado</td>`;
        corpoTabela.appendChild(tr);
        return;
    }
    
    // Adicionar cada contato na tabela
    contatosFiltrados.forEach((contato, indice) => {
        const indiceOriginal = contatos.indexOf(contato);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${contato.nome}</td>
            <td>${contato.telefone}</td>
            <td class="acoes">
                <button class="btn-editar" onclick="editarContato(${indiceOriginal})">Editar</button>
                <button class="btn-apagar" onclick="apagarContato(${indiceOriginal})">Apagar</button>
            </td>
        `;
        
        corpoTabela.appendChild(tr);
    });
}

// Função para editar um contato
function editarContato(indice) {
    const contato = contatos[indice];
    
    nomeInput.value = contato.nome;
    telefoneInput.value = contato.telefone;
    indiceEdicaoInput.value = indice;
    
    btnSalvar.textContent = 'Atualizar';
    btnCancelar.style.display = 'inline-block';
    
    nomeInput.focus();
}

// Função para cancelar a edição
function cancelarEdicao() {
    limparFormulario();
}

// Função para apagar um contato
function apagarContato(indice) {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
        contatos.splice(indice, 1);
        salvarNoStorage();
        atualizarTabela();
    }
}

// Função para importar contatos de um arquivo Word (.doc/.docx)
function importarContatosDoWord() {
    const arquivoInput = document.getElementById('arquivo-word');
    const arquivo = arquivoInput.files[0];
    
    if (!arquivo) {
        alert('Por favor, selecione um arquivo Word (.doc ou .docx)');
        return;
    }
    
    // Verificar extensão do arquivo
    const extensao = arquivo.name.split('.').pop().toLowerCase();
    if (extensao !== 'doc' && extensao !== 'docx') {
        alert('Por favor, selecione um arquivo Word (.doc ou .docx)');
        return;
    }
    
    // Mostrar feedback ao usuário
    btnImportar.textContent = 'Importando...';
    btnImportar.disabled = true;
    
    // Ler o arquivo
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
        const arrayBuffer = loadEvent.target.result;
        
        // Processar o arquivo usando mammoth.js
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                const texto = result.value;
                processarTextoParaContatos(texto);
                btnImportar.textContent = 'Importar Contatos do Word';
                btnImportar.disabled = false;
                arquivoInput.value = '';
            })
            .catch(function(error) {
                console.error(error);
                alert('Erro ao processar o arquivo: ' + error.message);
                btnImportar.textContent = 'Importar Contatos do Word';
                btnImportar.disabled = false;
            });
    };
    
    reader.readAsArrayBuffer(arquivo);
}

// Função para processar o texto extraído e encontrar contatos
function processarTextoParaContatos(texto) {
    // Dividir o texto em linhas
    const linhas = texto.split(/\r?\n/).filter(linha => linha.trim() !== '');
    
    // Padrões para reconhecer nomes e números de telefone
    const contatosEncontrados = [];
    const contatosAdicionados = 0;
    
    // Método 1: Tentar encontrar padrões de nome: telefone
    const padraoNomeTelefone = /^([^:]+):\s*(\(\d+\)\s*\d+[\-\s]*\d+|[\d\-\+\(\)\s]{7,})$/;
    
    // Método 2: Reconhecer números de telefone independentes
    const padraoTelefone = /(\(\d{2,3}\)\s*\d{4,5}[\-\s]*\d{4}|\d{8,11}|\d{4,5}[\-\s]\d{4})/g;
    
    // Primeiro, tenta encontrar padrões bem formatados (nome: telefone)
    for (let linha of linhas) {
        const match = linha.match(padraoNomeTelefone);
        if (match) {
            const nome = match[1].trim();
            const telefone = match[2].trim();
            contatosEncontrados.push({ nome, telefone });
        } else {
            // Se a linha contém um telefone, mas não corresponde ao padrão nome: telefone
            const telefones = linha.match(padraoTelefone);
            if (telefones) {
                // Tentamos encontrar um possível nome (o texto antes do telefone)
                const telefone = telefones[0];
                const possivelNome = linha.split(telefone)[0].trim();
                
                // Se parece um nome válido (não vazio e não apenas números/símbolos)
                const nome = possivelNome && !/^[\d\W]+$/.test(possivelNome) 
                    ? possivelNome 
                    : `Contato ${contatosEncontrados.length + 1}`;
                
                contatosEncontrados.push({ nome, telefone });
            }
        }
    }
    
    // Se não encontrou contatos com os métodos anteriores, tenta um método mais agressivo
    if (contatosEncontrados.length === 0) {
        let contador = 1;
        texto.match(padraoTelefone)?.forEach(telefone => {
            contatosEncontrados.push({
                nome: `Contato ${contador}`,
                telefone: telefone
            });
            contador++;
        });
    }
    
    // Adiciona os contatos encontrados à lista
    if (contatosEncontrados.length > 0) {
        // Verificar duplicatas antes de adicionar
        const novasEntradas = contatosEncontrados.filter(novoContato => {
            return !contatos.some(contatoExistente => 
                contatoExistente.telefone === novoContato.telefone
            );
        });
        
        contatos = [...contatos, ...novasEntradas];
        ordenarContatos();
        salvarNoStorage();
        atualizarTabela();
        
        alert(`Importação concluída: ${novasEntradas.length} contatos importados. ${contatosEncontrados.length - novasEntradas.length} contatos estavam duplicados e foram ignorados.`);
    } else {
        alert('Nenhum contato foi encontrado no arquivo.');
    }
}