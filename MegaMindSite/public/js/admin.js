document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const buttonsAdd = document.querySelectorAll('.btn-add');
    const modal = document.getElementById('modal-form');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalFields = document.getElementById('modal-fields');
    const formRegistro = document.getElementById('form-registro');

    const corpoUsuarios = document.getElementById('corpo-usuarios');
    const corpoQuestoes = document.getElementById('corpo-questoes');
    const corpoConteudo = document.getElementById('corpo-conteudo');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const listaQuestoes = document.getElementById('lista-questoes');
    const listaConteudos = document.getElementById('lista-conteudos');

    let activeEdit = null;
    let activeType = null;

    const dataStore = {
        usuarios: [],
        questoes: [],
        conteudos: []
    };

    function activateTab(targetId) {
        const targetContent = document.getElementById(targetId);
        if (!targetContent) return;

        tabButtons.forEach((button) => {
            const isActive = button.dataset.target === targetId;
            button.classList.toggle('ativo', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        tabContents.forEach((content) => {
            content.classList.toggle('ativo', content.id === targetId);
        });
    }

    function createCell(text) {
        const td = document.createElement('td');
        td.textContent = text;
        return td;
    }

    function updateTable(type) {
        let targetBody;
        let items = dataStore[type];
        let emptyMessage = 'Nenhum item adicionado';

        if (type === 'usuarios') {
            targetBody = corpoUsuarios;
            emptyMessage = 'Nenhum usuário cadastrado';
        } else if (type === 'questoes') {
            targetBody = corpoQuestoes;
            emptyMessage = 'Nenhuma questão adicionada';
        } else {
            targetBody = corpoConteudo;
            emptyMessage = 'Nenhum conteúdo adicionado';
        }

        targetBody.innerHTML = '';
        if (!items.length) {
            const row = document.createElement('tr');
            row.className = 'sem-dados';
            const cell = document.createElement('td');
            const columns = type === 'questoes' ? 8 : type === 'usuarios' ? 4 : 5;
            cell.colSpan = columns;
            cell.textContent = emptyMessage;
            row.appendChild(cell);
            targetBody.appendChild(row);
            return;
        }

        items.forEach((item, index) => {
            const row = document.createElement('tr');
            if (type === 'usuarios') {
                row.appendChild(createCell(item.nome));
                row.appendChild(createCell(item.email));
                row.appendChild(createCell(item.senha.replace(/./g, '•')));
                row.appendChild(createActions(type, index));
            } else if (type === 'questoes') {
                row.appendChild(createCell(item.enunciado));
                row.appendChild(createCell(item.alternativas.a));
                row.appendChild(createCell(item.alternativas.b));
                row.appendChild(createCell(item.alternativas.c));
                row.appendChild(createCell(item.alternativas.d));
                row.appendChild(createCell(item.alternativas.e));
                row.appendChild(createCell(item.correta.toUpperCase()));
                row.appendChild(createActions(type, index));
            } else {
                row.appendChild(createCell(item.resumo));
                row.appendChild(createCell(item.videos[0] || '-'));
                row.appendChild(createCell(item.videos[1] || '-'));
                row.appendChild(createCell(item.videos[2] || '-'));
                row.appendChild(createActions(type, index));
            }
            targetBody.appendChild(row);
        });
    }

    function createActions(type, index) {
        const td = document.createElement('td');
        td.className = 'acoes-coluna';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn-secundario btn-pequeno';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => openModal(type, index));

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.className = 'btn-danger btn-pequeno';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => {
            dataStore[type].splice(index, 1);
            updateTable(type);
            updatePreview(type);
        });

        td.appendChild(btnEditar);
        td.appendChild(btnExcluir);
        return td;
    }

    function renderPreview(type) {
        const container = type === 'usuarios' ? listaUsuarios : type === 'questoes' ? listaQuestoes : listaConteudos;
        const items = dataStore[type];
        container.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'sem-dados';
            empty.textContent = type === 'usuarios'
                ? 'Ainda não há usuários adicionados.'
                : type === 'questoes'
                    ? 'Ainda não há questões adicionadas.'
                    : 'Ainda não há conteúdos adicionados.';
            container.appendChild(empty);
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'preview-card';

            if (type === 'usuarios') {
                card.innerHTML = `<strong>${item.nome}</strong><span>${item.email}</span><span>Senha: ${item.senha.replace(/./g, '•')}</span>`;
            } else if (type === 'questoes') {
                card.innerHTML = `<strong>Questão ${index + 1}</strong><p>${item.enunciado}</p><span>Correta: ${item.correta.toUpperCase()}</span>`;
            } else {
                const videos = item.videos.filter(Boolean).map((url, pos) => `<a href="${url}" target="_blank">Vídeo ${pos + 1}</a>`).join(' · ');
                card.innerHTML = `<strong>Conteúdo ${index + 1}</strong><p>${item.resumo}</p><span>${videos || 'Sem links'}</span>`;
            }

            container.appendChild(card);
        });
    }

    function updatePreview(type) {
        renderPreview(type);
        if (type === 'usuarios') renderPreview('usuarios');
        if (type === 'questoes') renderPreview('questoes');
        if (type === 'conteudos') renderPreview('conteudos');
    }

    function openModal(type, index = null) {
        activeType = type;
        activeEdit = index;
        const isEdit = index !== null;
        const item = isEdit ? dataStore[type][index] : null;

        modalTitle.textContent = isEdit ? `Editar ${type === 'usuarios' ? 'Usuário' : type === 'questoes' ? 'Questão' : 'Conteúdo'}` : `Adicionar ${type === 'usuarios' ? 'Usuário' : type === 'questoes' ? 'Questão' : 'Conteúdo'}`;
        modalSubtitle.textContent = isEdit ? 'Atualize os dados no formulário abaixo.' : 'Preencha os campos para adicionar um novo item.';
        modalFields.innerHTML = '';

        if (type === 'usuarios') {
            modalFields.appendChild(createInputField('nome', 'Nome', item?.nome || ''));
            modalFields.appendChild(createInputField('email', 'E-mail', item?.email || ''));
            modalFields.appendChild(createInputField('senha', 'Senha', item?.senha || '', 'password'));
        } else if (type === 'questoes') {
            modalFields.appendChild(createTextareaField('enunciado', 'Enunciado', item?.enunciado || ''));
            ['a', 'b', 'c', 'd', 'e'].forEach((alternativa) => {
                modalFields.appendChild(createInputField(`alt_${alternativa}`, `Alternativa ${alternativa.toUpperCase()}`, item?.alternativas?.[alternativa] || ''));
            });
            modalFields.appendChild(createSelectField('correta', 'Alternativa correta', ['a','b','c','d','e'], item?.correta || 'a'));
        } else {
            modalFields.appendChild(createTextareaField('resumo', 'Resumo breve', item?.resumo || ''));
            modalFields.appendChild(createInputField('video1', 'Link vídeo 1', item?.videos?.[0] || ''));
            modalFields.appendChild(createInputField('video2', 'Link vídeo 2', item?.videos?.[1] || ''));
            modalFields.appendChild(createInputField('video3', 'Link vídeo 3', item?.videos?.[2] || ''));
        }

        modal.style.display = 'block';
    }

    function createInputField(name, label, value = '', type = 'text') {
        const wrapper = document.createElement('div');
        wrapper.className = 'grupo-form';

        const labelEl = document.createElement('label');
        labelEl.className = 'label-form';
        labelEl.textContent = label;
        labelEl.setAttribute('for', name);

        const input = document.createElement('input');
        input.className = 'input-form';
        input.type = type;
        input.name = name;
        input.id = name;
        input.value = value;

        wrapper.appendChild(labelEl);
        wrapper.appendChild(input);
        return wrapper;
    }

    function createTextareaField(name, label, value = '') {
        const wrapper = document.createElement('div');
        wrapper.className = 'grupo-form';

        const labelEl = document.createElement('label');
        labelEl.className = 'label-form';
        labelEl.textContent = label;
        labelEl.setAttribute('for', name);

        const textarea = document.createElement('textarea');
        textarea.className = 'textarea-form';
        textarea.name = name;
        textarea.id = name;
        textarea.rows = 4;
        textarea.value = value;

        wrapper.appendChild(labelEl);
        wrapper.appendChild(textarea);
        return wrapper;
    }

    function createSelectField(name, label, options, value) {
        const wrapper = document.createElement('div');
        wrapper.className = 'grupo-form';

        const labelEl = document.createElement('label');
        labelEl.className = 'label-form';
        labelEl.textContent = label;
        labelEl.setAttribute('for', name);

        const select = document.createElement('select');
        select.className = 'input-form';
        select.name = name;
        select.id = name;

        options.forEach((optionValue) => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue.toUpperCase();
            option.selected = optionValue === value;
            select.appendChild(option);
        });

        wrapper.appendChild(labelEl);
        wrapper.appendChild(select);
        return wrapper;
    }

    function closeModal() {
        modal.style.display = 'none';
        formRegistro.reset();
        activeEdit = null;
        activeType = null;
    }

    buttonsAdd.forEach((button) => {
        button.addEventListener('click', () => {
            openModal(button.dataset.type);
        });
    });

    tabButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const targetId = event.currentTarget.dataset.target;
            if (!targetId) return;
            activateTab(targetId);
            window.history.replaceState(null, '', `#${targetId}`);
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    formRegistro.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!activeType) return;

        const formData = new FormData(formRegistro);
        const values = Object.fromEntries(formData.entries());
        let item;

        if (activeType === 'usuarios') {
            item = {
                nome: values.nome.trim(),
                email: values.email.trim(),
                senha: values.senha.trim()
            };
        } else if (activeType === 'questoes') {
            item = {
                enunciado: values.enunciado.trim(),
                alternativas: {
                    a: values.alt_a.trim(),
                    b: values.alt_b.trim(),
                    c: values.alt_c.trim(),
                    d: values.alt_d.trim(),
                    e: values.alt_e.trim()
                },
                correta: values.correta
            };
        } else {
            item = {
                resumo: values.resumo.trim(),
                videos: [values.video1.trim(), values.video2.trim(), values.video3.trim()]
            };
        }

        if (activeEdit !== null) {
            dataStore[activeType][activeEdit] = item;
        } else {
            dataStore[activeType].push(item);
        }

        updateTable(activeType);
        renderPreview(activeType);
        closeModal();
    });

    const hash = window.location.hash.replace('#', '');
    const initialTab = document.getElementById(hash) ? hash : (tabButtons[0] && tabButtons[0].dataset.target);
    if (initialTab) activateTab(initialTab);

    ['usuarios', 'questoes', 'conteudos'].forEach((type) => {
        updateTable(type);
        renderPreview(type);
    });
});
