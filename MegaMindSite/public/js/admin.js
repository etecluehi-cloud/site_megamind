const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = window.firebase ? firebase.firestore() : null;
const auth = window.firebase ? firebase.auth() : null;

const CATALOGOS_QUESTOES = {
  questoes_matematica: [
    { id: "geometria_plana", nome: "Geometria Plana" },
    { id: "geometria_espacial", nome: "Geometria Espacial" },
    { id: "funcoes", nome: "Funções" },
    { id: "estatistica", nome: "Estatística" },
    { id: "probabilidade", nome: "Probabilidade" },
    { id: "analise_combinatoria", nome: "Análise Combinatória" },
    { id: "razao_proporcao", nome: "Razão e Proporção" },
    { id: "regra_de_tres", nome: "Regra de Três" },
    { id: "porcentagem", nome: "Porcentagem" },
    { id: "matematica_financeira", nome: "Matemática Financeira" },
    { id: "trigonometria", nome: "Trigonometria" },
    { id: "matrizes", nome: "Matrizes" },
    { id: "sistemas_lineares", nome: "Sistemas Lineares" }
  ],
  questoes_portugues: [
    { id: "leitura_interpretacao", nome: "Interpretação de Texto" },
    { id: "figuras_linguagem", nome: "Figuras de Linguagem" },
    { id: "funcoes_linguagem", nome: "Funções da Linguagem" },
    { id: "variacao_linguistica", nome: "Variação Linguística" },
    { id: "generos_textuais", nome: "Gêneros Textuais" },
    { id: "linguagem_verbal_nao_verbal", nome: "Linguagem Verbal e Não Verbal" },
    { id: "intertextualidade", nome: "Intertextualidade" },
    { id: "denotacao_conotacao", nome: "Denotação e Conotação" },
    { id: "literatura", nome: "Literatura" },
    { id: "gramatica", nome: "Gramática" }
  ]
};

let questoesCarregadas = [];

function usuarioLogado() {
  return window.adminAtual || (auth && auth.currentUser);
}

function avisarSemLogin() {
  mostrarStatus("Faça login como ADM", "erro");
  alert("Você precisa entrar pelo Login ADM para adicionar ou excluir questões.");
}

function textoCurto(texto, limite = 150) {
  if (!texto) return "Sem enunciado";
  return texto.length > limite ? texto.slice(0, limite).trim() + "..." : texto;
}

function criarIdQuestao() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function mostrarStatus(mensagem, tipo = "info") {
  const status = document.getElementById("status-firestore");
  if (!status) return;

  status.textContent = mensagem;
  status.className = "badge-status";
  status.classList.add(tipo === "ok" ? "badge-respondido" : tipo === "erro" ? "badge-danger-adm" : "badge-arquivado");
}

function configurarTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  function ativar(targetId) {
    if (!document.getElementById(targetId)) return;

    tabButtons.forEach((button) => {
      const ativo = button.dataset.target === targetId;
      button.classList.toggle("ativo", ativo);
      button.setAttribute("aria-selected", ativo ? "true" : "false");
    });

    tabContents.forEach((content) => {
      content.classList.toggle("ativo", content.id === targetId);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const targetId = event.currentTarget.dataset.target;
      if (!targetId) return;
      ativar(targetId);
      window.history.replaceState(null, "", "#" + targetId);
    });
  });

  const hash = window.location.hash.replace("#", "");
  const initialTab = document.getElementById(hash) ? hash : (tabButtons[0] && tabButtons[0].dataset.target);
  if (initialTab) ativar(initialTab);
}

function getMateriaSelecionada() {
  return document.getElementById("materia-questao").value;
}

function getConteudoSelecionado() {
  return document.getElementById("conteudo-questao").value;
}

function getNomeConteudo(colecao, conteudoId) {
  const item = (CATALOGOS_QUESTOES[colecao] || []).find((conteudo) => conteudo.id === conteudoId);
  return item ? item.nome : conteudoId;
}

function preencherConteudos() {
  const materia = document.getElementById("materia-questao");
  const conteudo = document.getElementById("conteudo-questao");
  if (!materia || !conteudo) return;

  conteudo.innerHTML = (CATALOGOS_QUESTOES[materia.value] || [])
    .map((item) => `<option value="${item.id}">${item.nome}</option>`)
    .join("");
}

function montarLinhaQuestao(questao, index) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${index + 1}</td>
    <td>
      <strong>${textoCurto(questao.enunciado, 130)}</strong>
      <div class="questao-opcoes-resumo">A) ${textoCurto(questao.alternativa_a, 45)} | B) ${textoCurto(questao.alternativa_b, 45)}</div>
    </td>
    <td><span class="badge-resposta">${questao.resposta_correta || "-"}</span></td>
    <td><button class="btn-danger btn-tabela-excluir" type="button" data-index="${index}">Excluir</button></td>
  `;
  return tr;
}

function renderizarQuestoes(questoes) {
  const tbody = document.getElementById("corpo-questoes");
  const resumo = document.getElementById("resumo-questoes");
  if (!tbody) return;

  const colecao = getMateriaSelecionada();
  const conteudoId = getConteudoSelecionado();
  const nomeConteudo = getNomeConteudo(colecao, conteudoId);

  tbody.innerHTML = "";
  if (!questoes.length) {
    tbody.innerHTML = '<tr class="sem-dados"><td colspan="4">Nenhuma questão cadastrada neste conteúdo.</td></tr>';
  } else {
    questoes.forEach((questao, index) => tbody.appendChild(montarLinhaQuestao(questao, index)));
  }

  if (resumo) resumo.textContent = `${nomeConteudo}: ${questoes.length} questão(ões) cadastrada(s).`;

  document.querySelectorAll(".btn-tabela-excluir").forEach((botao) => {
    botao.addEventListener("click", () => excluirQuestao(Number(botao.dataset.index)));
  });
}

async function carregarQuestoes() {
  const tbody = document.getElementById("corpo-questoes");
  if (!db) {
    mostrarStatus("Firebase não carregou", "erro");
    if (tbody) tbody.innerHTML = '<tr class="sem-dados"><td colspan="4">Erro ao carregar Firebase.</td></tr>';
    return;
  }

  const colecao = getMateriaSelecionada();
  const conteudoId = getConteudoSelecionado();
  if (!colecao || !conteudoId) return;

  if (tbody) tbody.innerHTML = '<tr class="sem-dados"><td colspan="4">Carregando questões...</td></tr>';
  mostrarStatus("Carregando...");

  try {
    const snapshot = await db.collection(colecao).doc(conteudoId).get();
    const dados = snapshot.exists ? snapshot.data() : {};
    questoesCarregadas = Array.isArray(dados.questoes) ? dados.questoes : [];
    renderizarQuestoes(questoesCarregadas);
    mostrarStatus("Conectado ao Firestore", "ok");
    atualizarTotalQuestoes();
  } catch (error) {
    console.error(error);
    mostrarStatus("Erro ao carregar", "erro");
    if (tbody) tbody.innerHTML = '<tr class="sem-dados"><td colspan="4">Erro: ' + error.message + '</td></tr>';
  }
}

function lerQuestaoDoFormulario() {
  return {
    id: criarIdQuestao(),
    enunciado: document.getElementById("enunciado-questao").value.trim(),
    alternativa_a: document.getElementById("alternativa-a").value.trim(),
    alternativa_b: document.getElementById("alternativa-b").value.trim(),
    alternativa_c: document.getElementById("alternativa-c").value.trim(),
    alternativa_d: document.getElementById("alternativa-d").value.trim(),
    alternativa_e: document.getElementById("alternativa-e").value.trim(),
    resposta_correta: document.getElementById("resposta-correta").value,
    criado_em: new Date().toISOString()
  };
}

function validarQuestao(questao) {
  return questao.enunciado && questao.alternativa_a && questao.alternativa_b && questao.alternativa_c && questao.alternativa_d && questao.alternativa_e && questao.resposta_correta;
}

async function salvarQuestao(event) {
  event.preventDefault();
  if (!db) return mostrarStatus("Firebase não carregou", "erro");
  if (!usuarioLogado()) return avisarSemLogin();

  const questao = lerQuestaoDoFormulario();
  if (!validarQuestao(questao)) {
    alert("Preencha todos os campos da questão.");
    return;
  }

  const botaoSalvar = document.getElementById("btn-salvar-questao");
  const colecao = getMateriaSelecionada();
  const conteudoId = getConteudoSelecionado();
  const docRef = db.collection(colecao).doc(conteudoId);

  try {
    if (botaoSalvar) botaoSalvar.disabled = true;
    mostrarStatus("Salvando...");

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const dados = snapshot.exists ? snapshot.data() : {};
      const questoes = Array.isArray(dados.questoes) ? dados.questoes : [];
      questoes.push(questao);
      transaction.set(docRef, { questoes }, { merge: true });
    });

    document.getElementById("form-questao").reset();
    preencherConteudos();
    await carregarQuestoes();
    mostrarStatus("Questão adicionada", "ok");
    alert("Questão adicionada com sucesso!");
  } catch (error) {
    console.error(error);
    mostrarStatus("Erro ao salvar", "erro");
    alert("Erro ao salvar questão: " + error.message);
  } finally {
    if (botaoSalvar) botaoSalvar.disabled = false;
  }
}

async function excluirQuestao(index) {
  if (!db) return mostrarStatus("Firebase não carregou", "erro");
  if (!usuarioLogado()) return avisarSemLogin();

  const questao = questoesCarregadas[index];
  if (!questao) return;
  if (!confirm("Tem certeza que deseja excluir esta questão?")) return;

  const colecao = getMateriaSelecionada();
  const conteudoId = getConteudoSelecionado();
  const docRef = db.collection(colecao).doc(conteudoId);

  try {
    mostrarStatus("Excluindo...");

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists) return;

      const dados = snapshot.data();
      const questoes = Array.isArray(dados.questoes) ? dados.questoes : [];
      const novasQuestoes = questao.id
        ? questoes.filter((item) => item.id !== questao.id)
        : questoes.filter((_, posicao) => posicao !== index);

      transaction.update(docRef, { questoes: novasQuestoes });
    });

    await carregarQuestoes();
    mostrarStatus("Questão excluída", "ok");
  } catch (error) {
    console.error(error);
    mostrarStatus("Erro ao excluir", "erro");
    alert("Erro ao excluir questão: " + error.message);
  }
}

async function atualizarTotalQuestoes() {
  const totalEl = document.getElementById("stat-total-questoes");
  if (!db || !totalEl) return;

  let total = 0;
  try {
    for (const colecao of Object.keys(CATALOGOS_QUESTOES)) {
      const snapshot = await db.collection(colecao).get();
      snapshot.forEach((doc) => {
        const dados = doc.data();
        if (Array.isArray(dados.questoes)) total += dados.questoes.length;
      });
    }
    totalEl.textContent = total;
  } catch (error) {
    console.warn("Não foi possível contar as questões:", error);
  }
}

function configurarGerenciadorQuestoes() {
  const materia = document.getElementById("materia-questao");
  const conteudo = document.getElementById("conteudo-questao");
  const form = document.getElementById("form-questao");
  const limpar = document.getElementById("btn-limpar-questao");
  const recarregar = document.getElementById("btn-recarregar-questoes");

  if (!materia || !conteudo || !form) return;

  preencherConteudos();
  carregarQuestoes();

  materia.addEventListener("change", () => {
    preencherConteudos();
    carregarQuestoes();
  });

  conteudo.addEventListener("change", carregarQuestoes);
  form.addEventListener("submit", salvarQuestao);

  if (limpar) {
    limpar.addEventListener("click", () => {
      form.reset();
      preencherConteudos();
      carregarQuestoes();
    });
  }

  if (recarregar) recarregar.addEventListener("click", carregarQuestoes);
}


let usuariosCarregados = [];

function getCadastroUsuarioAuth() {
  const nomeApp = "cadastroUsuarioComum";
  const appExistente = firebase.apps.find((app) => app.name === nomeApp);
  const appCadastro = appExistente || firebase.initializeApp(firebaseConfig, nomeApp);
  return appCadastro.auth();
}

function formatarDataUsuario(valor) {
  if (!valor) return "-";
  const data = valor.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-BR");
}

function badgeUsuario(status) {
  const valor = status || "ativo";
  const classe = valor === "ativo" ? "badge-respondido" : valor === "bloqueado" ? "badge-danger-adm" : "badge-arquivado";
  const texto = valor === "ativo" ? "Ativo" : valor === "bloqueado" ? "Bloqueado" : "Excluído";
  return `<span class="badge-status ${classe}">${texto}</span>`;
}

function renderizarUsuarios() {
  const tbody = document.getElementById("corpo-usuarios");
  const busca = (document.getElementById("busca-usuario")?.value || "").toLowerCase().trim();
  const filtro = document.getElementById("filtro-status-usuario")?.value || "";
  if (!tbody) return;

  const usuarios = usuariosCarregados.filter((usuario) => {
    const status = usuario.status || "ativo";
    const texto = `${usuario.nome || ""} ${usuario.email || ""}`.toLowerCase();
    return (!busca || texto.includes(busca)) && (!filtro || status === filtro);
  });

  if (!usuarios.length) {
    tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = usuarios.map((usuario) => {
    const status = usuario.status || "ativo";
    const bloqueioTexto = status === "bloqueado" ? "Desbloquear" : "Bloquear";
    return `
      <tr>
        <td>${usuario.nome || "-"}</td>
        <td>${usuario.email || "-"}</td>
        <td>${badgeUsuario(status)}</td>
        <td>${formatarDataUsuario(usuario.criado_em)}</td>
        <td class="acoes-usuario">
          <button class="btn-neutro btn-acao-usuario" type="button" data-acao="toggle" data-id="${usuario.id}">${bloqueioTexto}</button>
          <button class="btn-danger btn-acao-usuario" type="button" data-acao="excluir" data-id="${usuario.id}">Excluir</button>
        </td>
      </tr>`;
  }).join("");

  document.querySelectorAll(".btn-acao-usuario").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (botao.dataset.acao === "toggle") alternarBloqueioUsuario(botao.dataset.id);
      if (botao.dataset.acao === "excluir") excluirUsuarioComum(botao.dataset.id);
    });
  });
}

async function carregarUsuarios() {
  const tbody = document.getElementById("corpo-usuarios");
  if (!db || !tbody) return;
  tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Carregando usuários...</td></tr>';

  try {
    const snapshot = await db.collection("usuarios").get();
    usuariosCarregados = [];
    snapshot.forEach((doc) => {
      const dados = doc.data();
      if (dados.admin === true || dados.tipo === "admin") return;
      usuariosCarregados.push({ id: doc.id, status: "ativo", ...dados });
    });
    usuariosCarregados.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    renderizarUsuarios();
    atualizarTotalUsuarios();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Erro ao carregar usuários.</td></tr>';
  }
}

async function cadastrarUsuarioComum(event) {
  event.preventDefault();
  if (!usuarioLogado()) return avisarSemLogin();

  const nome = document.getElementById("nome-usuario").value.trim();
  const email = document.getElementById("email-usuario").value.trim();
  const senha = document.getElementById("senha-usuario").value.trim();
  const status = document.getElementById("status-usuario").value;
  const botao = document.getElementById("btn-salvar-usuario");

  if (!nome || !email || !senha || !status) return alert("Preencha todos os campos do usuário.");
  if (senha.length < 6) return alert("A senha precisa ter pelo menos 6 caracteres.");

  try {
    if (botao) botao.disabled = true;
    const authCadastro = getCadastroUsuarioAuth();
    const cred = await authCadastro.createUserWithEmailAndPassword(email, senha);
    await db.collection("usuarios").doc(cred.user.uid).set({
      nome,
      email,
      status,
      admin: false,
      tipo: "aluno",
      criado_em: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await authCadastro.signOut();
    document.getElementById("form-usuario").reset();
    document.getElementById("form-usuario-card").hidden = true;
    await carregarUsuarios();
    alert("Usuário cadastrado com sucesso!");
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    if (error.code === "auth/email-already-in-use") alert("Este e-mail já está cadastrado.");
    else alert("Erro ao cadastrar usuário: " + error.message);
  } finally {
    if (botao) botao.disabled = false;
  }
}

async function alternarBloqueioUsuario(id) {
  const usuario = usuariosCarregados.find((item) => item.id === id);
  if (!usuario) return;
  const novoStatus = usuario.status === "bloqueado" ? "ativo" : "bloqueado";
  if (!confirm(`Deseja ${novoStatus === "bloqueado" ? "bloquear" : "desbloquear"} este usuário?`)) return;

  try {
    await db.collection("usuarios").doc(id).set({ status: novoStatus, atualizado_em: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await carregarUsuarios();
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    alert("Erro ao alterar status do usuário: " + error.message);
  }
}

async function excluirUsuarioComum(id) {
  if (!confirm("Deseja excluir este usuário da lista? Ele será marcado como excluído e não poderá entrar no site.")) return;
  try {
    await db.collection("usuarios").doc(id).set({ status: "excluido", excluido_em: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await carregarUsuarios();
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    alert("Erro ao excluir usuário: " + error.message);
  }
}

function atualizarTotalUsuarios() {
  const totalEl = document.getElementById("stat-total-usuarios");
  if (totalEl) totalEl.textContent = usuariosCarregados.filter((usuario) => (usuario.status || "ativo") !== "excluido").length;
}

function configurarGerenciadorUsuarios() {
  const form = document.getElementById("form-usuario");
  const card = document.getElementById("form-usuario-card");
  const mostrar = document.getElementById("btn-mostrar-form-usuario");
  const cancelar = document.getElementById("btn-cancelar-usuario");
  const busca = document.getElementById("busca-usuario");
  const filtro = document.getElementById("filtro-status-usuario");
  if (!form) return;

  carregarUsuarios();
  form.addEventListener("submit", cadastrarUsuarioComum);
  if (mostrar) mostrar.addEventListener("click", () => { card.hidden = false; });
  if (cancelar) cancelar.addEventListener("click", () => { form.reset(); card.hidden = true; });
  if (busca) busca.addEventListener("input", renderizarUsuarios);
  if (filtro) filtro.addEventListener("change", renderizarUsuarios);
}

let conteudosCarregados = [];

function slugConteudo(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatarDataConteudo(valor) {
  if (!valor) return "-";
  const data = valor.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-BR");
}

function badgeConteudo(status) {
  const valor = status || "ativo";
  const classe = valor === "ativo" ? "badge-respondido" : valor === "revisao" ? "badge-arquivado" : "badge-danger-adm";
  const texto = valor === "ativo" ? "Ativo" : valor === "revisao" ? "Revisão" : "Inativo";
  return `<span class="badge-status ${classe}">${texto}</span>`;
}

function renderizarConteudos() {
  const tbody = document.getElementById("corpo-conteudo");
  const busca = (document.getElementById("busca-conteudo")?.value || "").toLowerCase().trim();
  const filtroTipo = document.getElementById("filtro-tipo-conteudo")?.value || "";
  const filtroStatus = document.getElementById("filtro-status-conteudo")?.value || "";
  if (!tbody) return;

  const conteudos = conteudosCarregados.filter((conteudo) => {
    const status = conteudo.status || "ativo";
    const tipo = conteudo.tipo || "geral";
    const texto = `${conteudo.id} ${conteudo.titulo || ""} ${conteudo.resumo || ""}`.toLowerCase();
    return (!busca || texto.includes(busca)) && (!filtroTipo || tipo === filtroTipo) && (!filtroStatus || status === filtroStatus);
  });

  if (!conteudos.length) {
    tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Nenhum conteúdo encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = conteudos.map((conteudo) => `
    <tr>
      <td>
        <strong>${conteudo.titulo || conteudo.id}</strong>
        <div class="questao-opcoes-resumo">ID: ${conteudo.id}</div>
      </td>
      <td>${conteudo.tipo || "geral"}</td>
      <td>${badgeConteudo(conteudo.status)}</td>
      <td>${formatarDataConteudo(conteudo.criado_em)}</td>
      <td class="acoes-usuario">
        <button class="btn-neutro btn-acao-conteudo" type="button" data-acao="editar" data-id="${conteudo.id}">Editar</button>
        <button class="btn-danger btn-acao-conteudo" type="button" data-acao="excluir" data-id="${conteudo.id}">Excluir</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".btn-acao-conteudo").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (botao.dataset.acao === "editar") preencherFormularioConteudo(botao.dataset.id);
      if (botao.dataset.acao === "excluir") excluirConteudo(botao.dataset.id);
    });
  });
}

async function carregarConteudos() {
  const tbody = document.getElementById("corpo-conteudo");
  if (!db || !tbody) return;
  tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Carregando conteúdos...</td></tr>';

  try {
    const snapshot = await db.collection("conteudo").get();
    conteudosCarregados = [];
    snapshot.forEach((doc) => conteudosCarregados.push({ id: doc.id, status: "ativo", tipo: "geral", ...doc.data() }));
    conteudosCarregados.sort((a, b) => (a.titulo || a.id).localeCompare(b.titulo || b.id));
    renderizarConteudos();
  } catch (error) {
    console.error("Erro ao carregar conteúdos:", error);
    tbody.innerHTML = '<tr class="sem-dados"><td colspan="5">Erro ao carregar conteúdos.</td></tr>';
  }
}

function lerConteudoDoFormulario() {
  return {
    id: document.getElementById("id-conteudo").value.trim(),
    titulo: document.getElementById("titulo-conteudo").value.trim(),
    tipo: document.getElementById("tipo-conteudo").value,
    status: document.getElementById("status-conteudo").value,
    resumo: document.getElementById("resumo-conteudo").value.trim(),
    videoId: document.getElementById("video-conteudo-1").value.trim(),
    videoId2: document.getElementById("video-conteudo-2").value.trim(),
    videoId3: document.getElementById("video-conteudo-3").value.trim()
  };
}

function preencherFormularioConteudo(id) {
  const conteudo = conteudosCarregados.find((item) => item.id === id);
  const card = document.getElementById("form-conteudo-card");
  if (!conteudo || !card) return;

  card.hidden = false;
  document.getElementById("id-conteudo").value = conteudo.id;
  document.getElementById("titulo-conteudo").value = conteudo.titulo || "";
  document.getElementById("tipo-conteudo").value = conteudo.tipo || "geral";
  document.getElementById("status-conteudo").value = conteudo.status || "ativo";
  document.getElementById("resumo-conteudo").value = conteudo.resumo || "";
  document.getElementById("video-conteudo-1").value = conteudo.videoId || conteudo.videoId1 || "";
  document.getElementById("video-conteudo-2").value = conteudo.videoId2 || "";
  document.getElementById("video-conteudo-3").value = conteudo.videoId3 || "";
}

async function salvarConteudo(event) {
  event.preventDefault();
  if (!usuarioLogado()) return avisarSemLogin();

  const conteudo = lerConteudoDoFormulario();
  if (!conteudo.titulo || !conteudo.id || !conteudo.resumo || !conteudo.videoId) {
    alert("Preencha título, ID, resumo e pelo menos o vídeo 1.");
    return;
  }

  const id = slugConteudo(conteudo.id);
  if (!id) return alert("Digite um ID válido para o conteúdo.");

  const botao = document.getElementById("btn-salvar-conteudo");
  try {
    if (botao) botao.disabled = true;
    const ref = db.collection("conteudo").doc(id);
    const snap = await ref.get();
    await ref.set({
      titulo: conteudo.titulo,
      tipo: conteudo.tipo,
      status: conteudo.status,
      resumo: conteudo.resumo,
      videoId: conteudo.videoId,
      videoId2: conteudo.videoId2,
      videoId3: conteudo.videoId3,
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp(),
      criado_em: snap.exists ? (snap.data().criado_em || firebase.firestore.FieldValue.serverTimestamp()) : firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    document.getElementById("form-conteudo").reset();
    document.getElementById("form-conteudo-card").hidden = true;
    await carregarConteudos();
    alert("Conteúdo salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar conteúdo:", error);
    alert("Erro ao salvar conteúdo: " + error.message);
  } finally {
    if (botao) botao.disabled = false;
  }
}

async function excluirConteudo(id) {
  if (!confirm("Deseja excluir este conteúdo do Firestore?")) return;
  try {
    await db.collection("conteudo").doc(id).delete();
    await carregarConteudos();
  } catch (error) {
    console.error("Erro ao excluir conteúdo:", error);
    alert("Erro ao excluir conteúdo: " + error.message);
  }
}

function configurarGerenciadorConteudos() {
  const form = document.getElementById("form-conteudo");
  const card = document.getElementById("form-conteudo-card");
  const mostrar = document.getElementById("btn-mostrar-form-conteudo");
  const cancelar = document.getElementById("btn-cancelar-conteudo");
  const titulo = document.getElementById("titulo-conteudo");
  const id = document.getElementById("id-conteudo");
  const busca = document.getElementById("busca-conteudo");
  const filtroTipo = document.getElementById("filtro-tipo-conteudo");
  const filtroStatus = document.getElementById("filtro-status-conteudo");
  if (!form) return;

  carregarConteudos();
  form.addEventListener("submit", salvarConteudo);
  if (mostrar) mostrar.addEventListener("click", () => { card.hidden = false; });
  if (cancelar) cancelar.addEventListener("click", () => { form.reset(); card.hidden = true; });
  if (titulo && id) titulo.addEventListener("input", () => { if (!id.dataset.editado) id.value = slugConteudo(titulo.value); });
  if (id) id.addEventListener("input", () => { id.dataset.editado = "true"; id.value = slugConteudo(id.value); });
  if (busca) busca.addEventListener("input", renderizarConteudos);
  if (filtroTipo) filtroTipo.addEventListener("change", renderizarConteudos);
  if (filtroStatus) filtroStatus.addEventListener("change", renderizarConteudos);
}
document.addEventListener("DOMContentLoaded", () => {
  configurarTabs();
  configurarGerenciadorQuestoes();
  configurarGerenciadorUsuarios();
  configurarGerenciadorConteudos();

  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) mostrarStatus("Logada no Firebase", "ok");
      else mostrarStatus("Sem login no Firebase", "erro");
    });
  }
});


