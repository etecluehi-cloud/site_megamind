const adminFaleConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (window.firebase && !firebase.apps.length) firebase.initializeApp(adminFaleConfig);
const adminFaleDb = firebase.firestore();

let duvidasAdmin = [];
let duvidaSelecionadaId = null;

function dataAdmin(valor) {
  if (!valor) return "-";
  const data = valor.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function badgeDuvida(status) {
  const valor = status || "pendente";
  const classe = valor === "respondido" ? "badge-respondido" : valor === "arquivado" ? "badge-arquivado" : "badge-novo";
  const texto = valor === "respondido" ? "Respondida" : valor === "arquivado" ? "Arquivada" : "Pendente";
  return `<span class="badge-status ${classe}">${texto}</span>`;
}

function filtrarDuvidas() {
  const busca = (document.getElementById("filtro-busca")?.value || "").toLowerCase().trim();
  const status = document.getElementById("filtro-status")?.value || "";
  return duvidasAdmin.filter((item) => {
    const texto = `${item.email || ""} ${item.pergunta || ""} ${item.resposta || ""}`.toLowerCase();
    return (!busca || texto.includes(busca)) && (!status || (item.status || "pendente") === status);
  });
}

function renderizarListaDuvidas() {
  const lista = document.getElementById("lista-duvidas-admin");
  if (!lista) return;
  const itens = filtrarDuvidas();

  if (!itens.length) {
    lista.innerHTML = '<div class="sem-dados painel-vazio">Nenhuma dúvida encontrada.</div>';
    return;
  }

  lista.innerHTML = itens.map((item) => `
    <button class="duvida-admin-item ${item.id === duvidaSelecionadaId ? "ativo" : ""}" type="button" data-id="${item.id}">
      <div>
        <strong>${item.email || "Aluno"}</strong>
        <p>${item.pergunta || "Sem pergunta"}</p>
      </div>
      <div class="duvida-admin-meta">
        ${badgeDuvida(item.status)}
        <small>${dataAdmin(item.data)}</small>
      </div>
    </button>
  `).join("");

  document.querySelectorAll(".duvida-admin-item").forEach((botao) => {
    botao.addEventListener("click", () => selecionarDuvida(botao.dataset.id));
  });
}

function selecionarDuvida(id) {
  duvidaSelecionadaId = id;
  renderizarListaDuvidas();
  renderizarPainelDuvida();
}

function renderizarPainelDuvida() {
  const painel = document.getElementById("painel-duvida-admin");
  const item = duvidasAdmin.find((duvida) => duvida.id === duvidaSelecionadaId);
  if (!painel || !item) {
    if (painel) painel.innerHTML = '<div class="painel-vazio">Selecione uma dúvida para visualizar e responder.</div>';
    return;
  }

  painel.innerHTML = `
    <div class="fale-admin-chat-header">
      <div>
        <h2>${item.email || "Aluno"}</h2>
        <p>Enviada em ${dataAdmin(item.data)}</p>
      </div>
      ${badgeDuvida(item.status)}
    </div>

    <div class="fale-admin-mensagens">
      <article class="msg aluno"><div class="msg-bolha"><span class="msg-label">Aluno</span><p>${item.pergunta || ""}</p></div></article>
      ${item.resposta ? `<article class="msg admin"><div class="msg-bolha"><span class="msg-label">MegaMind</span><p>${item.resposta}</p><small>${dataAdmin(item.dataResposta)}</small></div></article>` : ""}
    </div>

    <form id="form-resposta-admin" class="resposta-admin-form">
      <label for="resposta-admin">Resposta do administrador</label>
      <textarea id="resposta-admin" class="textarea-form" rows="5" placeholder="Digite sua resposta...">${item.resposta || ""}</textarea>
      <div class="modal-acoes">
        <button class="btn-primario" type="submit">Enviar resposta</button>
        <button class="btn-neutro" type="button" id="btn-arquivar-duvida">Arquivar</button>
        <button class="btn-danger" type="button" id="btn-excluir-duvida">Excluir</button>
      </div>
    </form>
  `;

  document.getElementById("form-resposta-admin").addEventListener("submit", responderDuvida);
  document.getElementById("btn-arquivar-duvida").addEventListener("click", arquivarDuvida);
  document.getElementById("btn-excluir-duvida").addEventListener("click", excluirDuvida);
}

async function responderDuvida(event) {
  event.preventDefault();
  const texto = document.getElementById("resposta-admin").value.trim();
  if (!texto) return alert("Digite uma resposta antes de enviar.");

  try {
    await adminFaleDb.collection("duvidas").doc(duvidaSelecionadaId).set({
      resposta: texto,
      status: "respondido",
      dataResposta: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    alert("Erro ao responder: " + error.message);
  }
}

async function arquivarDuvida() {
  if (!confirm("Deseja arquivar esta dúvida?")) return;
  await adminFaleDb.collection("duvidas").doc(duvidaSelecionadaId).set({ status: "arquivado" }, { merge: true });
}

async function excluirDuvida() {
  if (!confirm("Deseja excluir esta dúvida?")) return;
  await adminFaleDb.collection("duvidas").doc(duvidaSelecionadaId).delete();
  duvidaSelecionadaId = null;
  renderizarPainelDuvida();
}

function carregarDuvidasAdmin() {
  adminFaleDb.collection("duvidas")
    .orderBy("data", "desc")
    .onSnapshot((snapshot) => {
      duvidasAdmin = [];
      snapshot.forEach((doc) => duvidasAdmin.push({ id: doc.id, ...doc.data() }));
      renderizarListaDuvidas();
      if (duvidaSelecionadaId) renderizarPainelDuvida();
    }, (error) => {
      console.error("Erro ao carregar dúvidas:", error);
      document.getElementById("lista-duvidas-admin").innerHTML = '<div class="sem-dados painel-vazio">Erro ao carregar dúvidas.</div>';
    });
}

document.getElementById("filtro-busca").addEventListener("input", renderizarListaDuvidas);
document.getElementById("filtro-status").addEventListener("change", renderizarListaDuvidas);
carregarDuvidasAdmin();
