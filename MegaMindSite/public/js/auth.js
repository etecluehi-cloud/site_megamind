// importações do firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// configuração do firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

// inicialização
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// chave do localStorage — igual ao perfil.js
const KEYS = {
  name:   'megamind_nome',
  handle: 'megamind_handle',
  email:  'megamind_email',
  uid:    'megamind_uid',
};

// expõe auth e db globalmente para que perfil.js possa usar
window._mmAuth             = auth;
window._mmDb               = db;
window._mmDoc              = doc;
window._mmUpdateDoc        = updateDoc;

// expõe funções de senha para perfil.js usar no modal de trocar senha
window._mmEmailAuthProvider = EmailAuthProvider;
window._mmReauthenticate    = reauthenticateWithCredential;
window._mmUpdatePassword    = updatePassword;

function limparDadosUsuarioLocal() {
  localStorage.removeItem(KEYS.name);
  localStorage.removeItem(KEYS.handle);
  localStorage.removeItem(KEYS.email);
  localStorage.removeItem(KEYS.uid);
  localStorage.removeItem('megamind_avatar');
}

window.logout = async function () {
  limparDadosUsuarioLocal();
  try {
    await signOut(auth);
  } finally {
    window.location.href = "index.html";
  }
};

// verificador de força de senha
window.verificarSenha = function () {
    const senha = document.getElementById("senha").value;
    const container = document.getElementById("forcaContainer");

    if (!container) return;
    container.style.display = senha.length > 0 ? "block" : "none";

    const criterios = {
        tamanho:   senha.length >= 8,
        maiuscula: /[A-Z]/.test(senha),
        numero:    /[0-9]/.test(senha),
        simbolo:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)
    };

    atualizarCriterio("c-tamanho",   criterios.tamanho,   "Mínimo 8 caracteres");
    atualizarCriterio("c-maiuscula", criterios.maiuscula, "Uma letra maiúscula");
    atualizarCriterio("c-numero",    criterios.numero,    "Um número");
    atualizarCriterio("c-simbolo",   criterios.simbolo,   "Um símbolo (!@#$...)");

    const pontos = Object.values(criterios).filter(Boolean).length;

    const cores  = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71"];
    const labels = ["Fraca", "Razoável", "Boa", "Forte"];
    const barras = ["barra1", "barra2", "barra3", "barra4"];

    barras.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.style.background = i < pontos ? cores[pontos - 1] : "#ddd";
    });

    const label = document.getElementById("forcaLabel");
    if (label) {
        if (pontos > 0) {
            label.textContent = labels[pontos - 1];
            label.style.color = cores[pontos - 1];
        } else {
            label.textContent = "";
        }
    }
};

function atualizarCriterio(id, ok, texto) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (ok ? "OK - " : "Falta - ") + texto;
    el.classList.toggle("ok", ok);
}

function senhaEhForte(senha) {
  return (
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)
  );
}

// cadastro
window.cadastrar = async function () {
  const nome  = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!nome || !email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  if (!senhaEhForte(senha)) {
    alert("Crie uma senha mais forte seguindo os critérios indicados.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

    await setDoc(doc(db, "usuarios", userCredential.user.uid), {
      nome:   nome,
      email:  email,
      status: "ativo",
      admin:  false,
      tipo:   "aluno"
    });

    alert("Cadastro realizado com sucesso!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro no cadastro:", error);

    if      (error.code === "auth/email-already-in-use") alert("E-mail já cadastrado.");
    else if (error.code === "auth/invalid-email")        alert("E-mail inválido.");
    else if (error.code === "auth/weak-password")        alert("Senha fraca (mínimo 6 caracteres).");
    else                                                  alert("Erro: " + error.message);
  }
};

// login
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha e-mail e senha.");
    return;
  }

  try {
    const cred        = await signInWithEmailAndPassword(auth, email, senha);
    const usuarioRef  = doc(db, "usuarios", cred.user.uid);
    const usuarioSnap = await getDoc(usuarioRef);
    const dadosUsuario = usuarioSnap.exists() ? usuarioSnap.data() : {};

    if (dadosUsuario.status === "bloqueado" || dadosUsuario.status === "excluido") {
      await signOut(auth);
      alert("Seu acesso está bloqueado. Entre em contato com o suporte.");
      return;
    }

    window.location.href = "home.html";
  } catch (error) {
    console.error("Erro no login:", error);

    if      (error.code === "auth/user-not-found") alert("Usuário não encontrado.");
    else if (error.code === "auth/wrong-password") alert("Senha incorreta.");
    else if (error.code === "auth/invalid-email")  alert("E-mail inválido.");
    else                                            alert("Erro: " + error.message);
  }
};

// recuperar senha
window.recuperarSenha = async function () {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Digite seu e-mail.");
    return;
  }

  try {
    const actionCodeSettings = {
      url: "https://megamindapp-4e60c.web.app/reset.html",
      handleCodeInApp: false
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    alert("Se o e-mail existir, o link de recuperação foi enviado.");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao recuperar senha:", error);

    if (error.code === "auth/invalid-email") alert("E-mail inválido.");
    else                                      alert("Erro: " + error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITÁRIO — sincroniza dados do Firestore → localStorage
// ─────────────────────────────────────────────────────────────────────────────
function limparCacheDeOutroUsuario(uidAtual) {
  const uidSalvo = localStorage.getItem(KEYS.uid);
  if (uidSalvo && uidSalvo !== uidAtual) {
    localStorage.removeItem(KEYS.name);
    localStorage.removeItem(KEYS.handle);
    localStorage.removeItem(KEYS.email);
    localStorage.removeItem('megamind_avatar');
  }
  localStorage.setItem(KEYS.uid, uidAtual);
}

async function sincronizarUsuario(user) {
  limparCacheDeOutroUsuario(user.uid);

  try {
    const docRef  = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    let nome = null;
    if (docSnap.exists()) {
      nome = docSnap.data().nome || null;
    }

    if (!nome) nome = user.email.split("@")[0];

    localStorage.setItem(KEYS.name,   nome);
    localStorage.setItem(KEYS.handle, nome.split(" ")[0].toLowerCase());
    localStorage.setItem(KEYS.email,  user.email);

    return { nome, email: user.email };

  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    const nomeFallback = user.email ? user.email.split("@")[0] : "Aluno";
    localStorage.setItem(KEYS.name, nomeFallback);
    localStorage.setItem(KEYS.email, user.email || "");
    return { nome: nomeFallback, email: user.email || "" };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
//  HOME.HTML — exibe saudação com nome do usuário
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const bemVindo = document.getElementById("bemvindo");
  if (!bemVindo) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const { nome } = await sincronizarUsuario(user);
    bemVindo.textContent = nome;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PERFIL.HTML — preenche nome e e-mail
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const nomePerfil  = document.querySelector(".js-student-name");
  const emailPerfil = document.querySelector(".js-student-handle");
  if (!nomePerfil || !emailPerfil) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const { nome, email } = await sincronizarUsuario(user);
    nomePerfil.textContent  = nome;
    emailPerfil.textContent = email;
  });
});