// perfil.js — Gerenciamento de foto de perfil e nome

const AVATAR_KEY  = 'megamind_avatar';
const NAME_KEY    = 'megamind_nome';
const HANDLE_KEY  = 'megamind_handle';

/* ─── Utilitários ─── */
function showToast(msg) {
    const toast = document.getElementById('avatar-toast');
    if (!toast) return;
    if (msg) toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ─── Carrega dados salvos em todos os elementos da página ─── */
function carregarPerfil() {
    const savedAvatar  = localStorage.getItem(AVATAR_KEY);
    const savedName    = localStorage.getItem(NAME_KEY);
    const savedHandle  = localStorage.getItem(HANDLE_KEY);

    // Atualiza todas as imagens de avatar na página
    document.querySelectorAll('#avatar-img, .student-avatar-img').forEach(img => {
        if (savedAvatar) img.src = savedAvatar;
    });

    // Atualiza todos os elementos de nome
    document.querySelectorAll('.student-name, .js-student-name').forEach(el => {
        if (savedName) el.textContent = savedName;
    });

    // Atualiza handle (só na página de perfil)
    document.querySelectorAll('.js-student-handle').forEach(el => {
        if (savedHandle) el.textContent = '@' + savedHandle;
    });
}

/* ─── Modal de edição (perfil.html) ─── */
function inicializarModalEdicao() {
    const btn = document.getElementById('edit-profile-btn');
    if (!btn) return;

    // Cria o modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-backdrop"></div>
        <div class="edit-modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button class="edit-modal-close" id="modal-close" aria-label="Fechar">&#x2715;</button>
            <h2 id="modal-title">Editar Perfil</h2>

            <div class="modal-avatar-wrap">
                <div class="modal-avatar-circle" id="modal-avatar-trigger" title="Clique para trocar a foto">
                    <img id="modal-avatar-preview" src="img/logo.png" alt="Foto de perfil">
                    <div class="modal-avatar-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>Trocar foto</span>
                    </div>
                </div>
                <input type="file" id="modal-avatar-input" accept="image/*" style="display:none">
            </div>

            <div class="modal-field">
                <label for="modal-name">Nome</label>
                <input type="text" id="modal-name" maxlength="40" placeholder="Seu nome completo">
            </div>

            <div class="modal-field">
                <label for="modal-handle">Nome de usuário</label>
                <div class="modal-handle-wrap">
                    <span class="handle-at">@</span>
                    <input type="text" id="modal-handle" maxlength="20" placeholder="seunome">
                </div>
            </div>

            <div class="modal-actions">
                <button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>
                <button class="modal-btn-save"   id="modal-save">Salvar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Elementos do modal
    const backdrop   = modal.querySelector('.edit-modal-backdrop');
    const preview    = modal.querySelector('#modal-avatar-preview');
    const fileInput  = modal.querySelector('#modal-avatar-input');
    const trigger    = modal.querySelector('#modal-avatar-trigger');
    const nameInput  = modal.querySelector('#modal-name');
    const handleInp  = modal.querySelector('#modal-handle');
    const btnClose   = modal.querySelector('#modal-close');
    const btnCancel  = modal.querySelector('#modal-cancel');
    const btnSave    = modal.querySelector('#modal-save');

    let tempAvatar = null; // guarda data URL antes de salvar

    // Abre o modal
    function openModal() {
        const savedAvatar = localStorage.getItem(AVATAR_KEY);
        const savedName   = localStorage.getItem(NAME_KEY)   || '';
        const savedHandle = localStorage.getItem(HANDLE_KEY) || '';

        if (savedAvatar) preview.src = savedAvatar;
        nameInput.value   = savedName;
        handleInp.value   = savedHandle;
        tempAvatar        = null;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        nameInput.focus();
    }

    // Fecha o modal
    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Troca de foto dentro do modal
    trigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            tempAvatar = e.target.result;
            preview.src = tempAvatar;
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    // Salva as alterações
    btnSave.addEventListener('click', () => {
        const newName   = nameInput.value.trim();
        const newHandle = handleInp.value.trim().replace(/^@/, '');

        if (newName)   localStorage.setItem(NAME_KEY,   newName);
        if (newHandle) localStorage.setItem(HANDLE_KEY, newHandle);
        if (tempAvatar) {
            try { localStorage.setItem(AVATAR_KEY, tempAvatar); } catch {}
        }

        carregarPerfil(); // atualiza a página imediatamente
        closeModal();
        showToast('✅ Perfil atualizado!');
    });

    // Fecha com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    inicializarModalEdicao();
});
