const faleFirebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (!firebase.apps.length) firebase.initializeApp(faleFirebaseConfig);
const faleAuth = firebase.auth();
const faleDb = firebase.firestore();

let usuarioAtual = null;

function formatarDataFale(valor) {
  if (!valor) return "";
  const data = valor.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function setStatusFale(texto) {
  const el = document.getElementById("fale-status");
  if (el) el.textContent = texto;
}

function mostrarToastFale(texto) {
  const toast = document.getElementById("mm-toast");
  if (!toast) return alert(texto);
  toast.textContent = texto;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function ordenarDuvidasPorData(duvidas) {
  return duvidas.sort((a, b) => {
    const dataA = a.data?.toDate ? a.data.toDate().getTime() : 0;
    const dataB = b.data?.toDate ? b.data.toDate().getTime() : 0;
    return dataA - dataB;
  });
}

function renderizarHistorico(duvidas) {
  const historico = document.getElementById("fale-historico");
  if (!historico) return;

  if (!duvidas.length) {
    historico.innerHTML = '<div class="fale-empty">Você ainda não enviou nenhuma dúvida.</div>';
    return;
  }

  const itens = [];
  duvidas.forEach((item) => {
    itens.push(`
      <article class="msg aluno">
        <div class="msg-bolha">
          <span class="msg-label">Você</span>
          <p>${item.pergunta || ""}</p>
          <small>${formatarDataFale(item.data)}</small>
        </div>
      </article>
      ${item.resposta ? `
      <article class="msg admin">
        <div class="msg-bolha">
          <span class="msg-label">MegaMind</span>
          <p>${item.resposta}</p>
          <small>${formatarDataFale(item.dataResposta)}</small>
        </div>
      </article>` : `
      <article class="msg admin aguardando">
        <div class="msg-bolha">
          <span class="msg-label">MegaMind</span>
          <p>Aguardando resposta do administrador.</p>
        </div>
      </article>`}
    `);
  });

  historico.innerHTML = itens.join("");
  historico.scrollTop = historico.scrollHeight;
}

function carregarHistoricoFale() {
  if (!usuarioAtual) return;
  faleDb.collection("duvidas")
    .where("userId", "==", usuarioAtual.uid)
    .limit(30)
    .onSnapshot((snapshot) => {
      const duvidas = [];
      snapshot.forEach((doc) => duvidas.push({ id: doc.id, ...doc.data() }));
      renderizarHistorico(ordenarDuvidasPorData(duvidas));
    }, (error) => {
      console.error("Erro ao carregar dúvidas:", error);
      document.getElementById("fale-historico").innerHTML = '<div class="fale-empty">Erro ao carregar histórico.</div>';
    });
}

async function enviarDuvida(event) {
  event.preventDefault();
  const campo = document.getElementById("campo-duvida");
  const botao = document.getElementById("btn-enviar-duvida");
  const texto = campo.value.trim();
  if (!texto) return mostrarToastFale("Escreva sua dúvida antes de enviar.");

  try {
    botao.disabled = true;
    await faleDb.collection("duvidas").add({
      email: usuarioAtual.email || "",
      userId: usuarioAtual.uid,
      pergunta: texto,
      resposta: "",
      status: "pendente",
      data: firebase.firestore.FieldValue.serverTimestamp(),
      dataResposta: null
    });
    campo.value = "";
    mostrarToastFale("Dúvida enviada com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar dúvida:", error);
    mostrarToastFale("Erro ao enviar dúvida: " + error.message);
  } finally {
    botao.disabled = false;
  }
}

faleAuth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  usuarioAtual = user;
  setStatusFale("Conectado");
  carregarHistoricoFale();
});

document.getElementById("form-duvida").addEventListener("submit", enviarDuvida);
