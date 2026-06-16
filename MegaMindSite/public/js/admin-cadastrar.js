const cadastroConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

const appCadastro = firebase.apps.find((app) => app.name === "cadastroAdmin") || firebase.initializeApp(cadastroConfig, "cadastroAdmin");
const authCadastro = appCadastro.auth();
const dbCadastro = firebase.firestore();

const formAdmin = document.getElementById("form-cadastro-admin");
const corpoTabela = document.getElementById("corpo-tabela");

function dataFormatada(valor) {
  if (!valor) return "-";
  const data = valor.toDate ? valor.toDate() : new Date(valor);
  return data.toLocaleDateString("pt-BR");
}

function limparFormularioAdmin() {
  formAdmin.reset();
  document.querySelectorAll("[data-toggle-senha]").forEach((botao) => {
    botao.textContent = "Ver";
  });
}

function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

function definirCarregando(ativo) {
  const botao = formAdmin?.querySelector("button[type='submit']");
  if (!botao) return;
  botao.disabled = ativo;
  botao.textContent = ativo ? "Cadastrando..." : "Cadastrar Admin";
}

function statusAdmin(adm) {
  const status = adm.status || "ativo";
  return status === "bloqueado" ? "Bloqueado" : "Ativo";
}

async function carregarAdmins() {
  if (!corpoTabela) return;
  corpoTabela.innerHTML = '<tr class="sem-dados"><td colspan="5">Carregando administradores...</td></tr>';

  try {
    const snapshot = await dbCadastro.collection("usuarios").where("admin", "==", true).get();

    if (snapshot.empty) {
      corpoTabela.innerHTML = '<tr class="sem-dados"><td colspan="5">Nenhum administrador cadastrado</td></tr>';
      return;
    }

    corpoTabela.innerHTML = "";
    const admins = [];
    snapshot.forEach((doc) => admins.push({ id: doc.id, ...doc.data() }));
    admins.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

    admins.forEach((adm) => {
      const tr = document.createElement("tr");
      const status = statusAdmin(adm);
      tr.innerHTML = `
        <td>${adm.nome || "-"}</td>
        <td>${adm.email || "-"}</td>
        <td>${adm.cargo || "Administrador"}</td>
        <td>${dataFormatada(adm.criado_em)}</td>
        <td><span class="badge-status ${status === "Ativo" ? "badge-respondido" : "badge-arquivado"}">${status}</span></td>
      `;
      corpoTabela.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar ADMs:", error);
    corpoTabela.innerHTML = '<tr class="sem-dados"><td colspan="5">Erro ao carregar administradores.</td></tr>';
  }
}

async function cadastrarAdmin(event) {
  event.preventDefault();

  const nome = document.getElementById("nome-admin").value.trim();
  const email = normalizarEmail(document.getElementById("email-admin").value);
  const senha = document.getElementById("senha-admin").value.trim();
  const confirmacao = document.getElementById("confirmacao-admin").value.trim();
  const cargo = document.getElementById("cargo-admin").value;

  if (!nome || !email || !senha || !confirmacao || !cargo) {
    alert("Preencha todos os campos.");
    return;
  }

  if (senha !== confirmacao) {
    alert("As senhas não conferem.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha precisa ter pelo menos 6 caracteres.");
    return;
  }

  try {
    definirCarregando(true);
    await authCadastro.setPersistence(firebase.auth.Auth.Persistence.NONE);
    const cred = await authCadastro.createUserWithEmailAndPassword(email, senha);

    await dbCadastro.collection("usuarios").doc(cred.user.uid).set({
      nome,
      email,
      cargo,
      admin: true,
      tipo: "admin",
      status: "ativo",
      criadoPor: window.adminAtual?.uid || "",
      criadoPorEmail: window.adminAtual?.email || "",
      criado_em: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await authCadastro.signOut();
    limparFormularioAdmin();
    await carregarAdmins();
    alert("Administrador cadastrado com sucesso!");
  } catch (error) {
    console.error("Erro ao cadastrar ADM:", error);
    if (error.code === "auth/email-already-in-use") alert("Este e-mail já está cadastrado.");
    else if (error.code === "auth/weak-password") alert("A senha está fraca. Use pelo menos 6 caracteres.");
    else if (error.code === "permission-denied") alert("Sem permissão no Firestore. Confira se as rules permitem escrita para admins.");
    else alert("Erro ao cadastrar ADM: " + error.message);
  } finally {
    definirCarregando(false);
  }
}

if (formAdmin) formAdmin.addEventListener("submit", cadastrarAdmin);
document.addEventListener("admin-autorizado", carregarAdmins);

document.querySelectorAll("[data-toggle-senha]").forEach((botao) => {
  botao.addEventListener("click", () => {
    const input = document.getElementById(botao.dataset.toggleSenha);
    if (!input) return;
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    botao.textContent = mostrar ? "Ocultar" : "Ver";
  });
});
