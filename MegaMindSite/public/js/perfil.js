// ═══════════════════════════════════════════════
//  perfil.js — MegaMind
//  Gerencia: perfil, modo escuro, metas
// ═══════════════════════════════════════════════

const KEYS = {
  avatar: 'megamind_avatar',
  name:   'megamind_nome',
  handle: 'megamind_handle',
  email:  'megamind_email',
  dark:   'megamind_dark',
  metas:  'megamind_metas',
};

// ───────────────────────────────────────────────
// UTILITÁRIOS
// ───────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('mm-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function salvar(key, val) {
  try { localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val); } catch {}
}

function carregar(key) {
  return localStorage.getItem(key);
}

// ───────────────────────────────────────────────
// MODO ESCURO — aplica em TODAS as páginas
// ───────────────────────────────────────────────
function aplicarModoEscuro(ativo) {
  document.documentElement.classList.toggle('dark-mode', ativo);
  document.querySelectorAll('.toggle-dark').forEach(el => {
    el.classList.toggle('ativo', ativo);
  });
}

function inicializarModoEscuro() {
  const ativo = carregar(KEYS.dark) === 'true';
  aplicarModoEscuro(ativo);

  document.querySelectorAll('.toggle-dark').forEach(el => {
    el.addEventListener('click', () => {
      const novoEstado = !document.documentElement.classList.contains('dark-mode');
      salvar(KEYS.dark, novoEstado);
      aplicarModoEscuro(novoEstado);
    });
  });
}

// ───────────────────────────────────────────────
// PERFIL — carrega dados em todas as páginas
// ───────────────────────────────────────────────
function carregarPerfil() {
  const avatar = carregar(KEYS.avatar);
  const nome   = carregar(KEYS.name);
  const email  = carregar(KEYS.email);

  document.querySelectorAll('#avatar-img, .mm-avatar-img').forEach(img => {
    if (avatar) img.src = avatar;
  });

  document.querySelectorAll('.js-student-name').forEach(el => {
    if (nome) el.textContent = nome;
  });

  document.querySelectorAll('.js-student-handle').forEach(el => {
    if (email) el.textContent = email;
  });
}

// ───────────────────────────────────────────────
// INICIAIS DO AVATAR
// ───────────────────────────────────────────────
function gerarIniciais(nome) {
  const parts = (nome || '').trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'NE';
}

// ───────────────────────────────────────────────
// MODAL — EDITAR PERFIL
// ───────────────────────────────────────────────
function inicializarModalPerfil() {
  const btn = document.getElementById('edit-profile-btn');
  if (!btn) return;

  const modal = document.createElement('div');
  modal.id = 'mm-modal-perfil';
  modal.innerHTML = `
    <div class="mm-backdrop"></div>
    <div class="mm-box" role="dialog" aria-modal="true" aria-labelledby="mm-modal-title">
      <button class="mm-close" id="mm-close-perfil" aria-label="Fechar">&#x2715;</button>
      <h2 id="mm-modal-title">Editar Perfil</h2>

      <div class="mm-avatar-wrap">
        <div class="mm-avatar-circle" id="mm-avatar-trigger">
          <img id="mm-avatar-preview" src="img/logo.png" alt="Prévia"
            style="display:none; width:100%; height:100%; object-fit:cover; border-radius:50%;">
          <span class="mm-avatar-iniciais" id="mm-avatar-iniciais">NE</span>
          <div class="mm-avatar-overlay">
            <span>Trocar foto</span>
          </div>
        </div>
        <input type="file" id="mm-file-input" accept="image/*">
      </div>

      <p class="mm-avatar-hint">Clique no avatar para trocar a foto</p>

      <div class="mm-field">
        <label for="mm-input-name">Nome de usuário</label>
        <input type="text" id="mm-input-name" maxlength="40" placeholder="Seu nome">
      </div>

      <div class="mm-actions">
        <button class="mm-btn-cancel" id="mm-cancel-perfil">Cancelar</button>
        <button class="mm-btn-save"   id="mm-save-perfil">Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const backdrop = modal.querySelector('.mm-backdrop');
  const preview  = modal.querySelector('#mm-avatar-preview');
  const iniciais = modal.querySelector('#mm-avatar-iniciais');
  const fileInp  = modal.querySelector('#mm-file-input');
  const trigger  = modal.querySelector('#mm-avatar-trigger');
  const nameInp  = modal.querySelector('#mm-input-name');
  let tempAvatar = null;

  nameInp.addEventListener('input', () => {
    if (!tempAvatar) {
      iniciais.textContent = gerarIniciais(nameInp.value);
    }
  });

  function openModal() {
    const av   = carregar(KEYS.avatar);
    const nome = carregar(KEYS.name) || '';

    if (av) {
      preview.src = av;
      preview.style.display = 'block';
      iniciais.style.display = 'none';
    } else {
      preview.style.display = 'none';
      iniciais.style.display = 'block';
      iniciais.textContent = gerarIniciais(nome);
    }

    nameInp.value = nome;
    tempAvatar = null;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openModal);
  modal.querySelector('#mm-close-perfil').addEventListener('click', closeModal);
  modal.querySelector('#mm-cancel-perfil').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  trigger.addEventListener('click', () => fileInp.click());

  fileInp.addEventListener('change', function () {
    const file = this.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = e => {
      tempAvatar = e.target.result;
      preview.src = tempAvatar;
      preview.style.display = 'block';
      iniciais.style.display = 'none';
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  modal.querySelector('#mm-save-perfil').addEventListener('click', async () => {
    const n = nameInp.value.trim();

    if (n) {
      salvar(KEYS.name, n);
      salvar(KEYS.handle, n.split(' ')[0].toLowerCase());

      try {
        const auth = window._mmAuth;
        const db = window._mmDb;
        const docFn = window._mmDoc;
        const updateFn = window._mmUpdateDoc;

        if (auth && db && docFn && updateFn && auth.currentUser) {
          const ref = docFn(db, "usuarios", auth.currentUser.uid);
          await updateFn(ref, { nome: n });
        }
      } catch (err) {
        console.warn("Não foi possível salvar no Firestore:", err);
      }
    }

    if (tempAvatar) salvar(KEYS.avatar, tempAvatar);

    carregarPerfil();
    closeModal();
    showToast('✅ Perfil atualizado!');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

// ───────────────────────────────────────────────
// METAS — agora redireciona para página
// ───────────────────────────────────────────────
function inicializarModalMetas() {
  const btn = document.getElementById('btn-metas');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.location.href = 'metaDiaria.html';
  });
}

// ───────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inicializarModoEscuro();
  carregarPerfil();
  inicializarModalPerfil();
  inicializarModalMetas();
});