// Elementos do DOM
const contactForm = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const contactsList = document.getElementById('contacts-list');
const emptyList = document.getElementById('empty-list');
const searchInput = document.getElementById('search');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// Estado da aplicação
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let currentContactId = null;
let contactToDelete = null;

// Formatador de telefone
function formatPhoneNumber(phone) {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Verifica o tamanho para aplicar o formato correto
    if (cleaned.length === 11) {
        // Formato para celular: (XX) XXXXX-XXXX
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        // Formato para telefone fixo: (XX) XXXX-XXXX
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    // Retorna o número sem formatação se não se encaixar nos padrões acima
    return phone;
}

// Inicializar aplicação
function init() {
    renderContacts();
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Form de contato
    contactForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    
    // Busca
    searchInput.addEventListener('input', filterContacts);
    
    // Modal de exclusão
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

// Manipular envio do formulário
function handleFormSubmit(event) {
    event.preventDefault();
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || !phone) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    // Formatando o telefone
    const formattedPhone = formatPhoneNumber(phone);
    
    if (currentContactId !== null) {
        // Modo de edição
        updateContact(currentContactId, name, formattedPhone);
    } else {
        // Modo de adição
        addContact(name, formattedPhone);
    }
    
    resetForm();
    saveContacts();
    renderContacts();
}

// Adicionar novo contato
function addContact(name, phone) {
    const newContact = {
        id: Date.now().toString(),
        name,
        phone
    };
    
    contacts.push(newContact);
}

// Atualizar contato existente
function updateContact(id, name, phone) {
    const index = contacts.findIndex(contact => contact.id === id);
    if (index !== -1) {
        contacts[index] = {
            ...contacts[index],
            name,
            phone
        };
    }
}

// Salvar contatos no localStorage
function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// Renderizar lista de contatos
function renderContacts(filteredContacts = null) {
    const contactsToRender = filteredContacts || contacts;
    
    // Limpar lista atual
    while (contactsList.firstChild !== emptyList) {
        contactsList.removeChild(contactsList.firstChild);
    }
    
    // Mostrar mensagem de lista vazia se não houver contatos
    if (contactsToRender.length === 0) {
        emptyList.style.display = 'flex';
        return;
    }
    
    // Esconder mensagem de lista vazia
    emptyList.style.display = 'none';
    
    // Ordenar contatos por nome
    const sortedContacts = [...contactsToRender].sort((a, b) => 
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
    
    // Adicionar cada contato à lista
    sortedContacts.forEach(contact => {
        const contactElement = createContactElement(contact);
        contactsList.insertBefore(contactElement, emptyList);
    });
}

// Criar elemento de contato
function createContactElement(contact) {
    const template = document.getElementById('contact-template');
    const contactNode = document.importNode(template.content, true);
    
    const contactItem = contactNode.querySelector('.contact-item');
    const nameElement = contactNode.querySelector('.contact-name');
    const phoneElement = contactNode.querySelector('.contact-phone');
    const editBtn = contactNode.querySelector('.edit-btn');
    const deleteBtn = contactNode.querySelector('.delete-btn');
    
    // Definir ID do contato
    contactItem.dataset.id = contact.id;
    
    // Preencher informações
    nameElement.textContent = contact.name;
    phoneElement.textContent = contact.phone;
    
    // Configurar botões
    editBtn.addEventListener('click', () => editContact(contact.id));
    deleteBtn.addEventListener('click', () => openDeleteModal(contact.id));
    
    return contactNode;
}

// Filtrar contatos
function filterContacts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderContacts();
        return;
    }
    
    const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) || 
        contact.phone.replace(/\D/g, '').includes(searchTerm)
    );
    
    renderContacts(filtered);
}

// Editar contato
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    // Preencher formulário com dados do contato
    nameInput.value = contact.name;
    phoneInput.value = contact.phone;
    
    // Mudar estado do formulário
    currentContactId = id;
    formTitle.textContent = 'Editar Contato';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar';
    cancelBtn.style.display = 'flex';
    
    // Rolar para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Abrir modal de exclusão
function openDeleteModal(id) {
    contactToDelete = id;
    deleteModal.style.display = 'flex';
}

// Fechar modal de exclusão
function closeDeleteModal() {
    deleteModal.style.display = 'none';
    contactToDelete = null;
}

// Confirmar exclusão de contato
function confirmDelete() {
    if (contactToDelete) {
        deleteContact(contactToDelete);
        closeDeleteModal();
    }
}

// Excluir contato
function deleteContact(id) {
    contacts = contacts.filter(contact => contact.id !== id);
    saveContacts();
    renderContacts();
}

// Resetar formulário
function resetForm() {
    contactForm.reset();
    currentContactId = null;
    formTitle.textContent = 'Adicionar Novo Contato';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
    cancelBtn.style.display = 'none';
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);