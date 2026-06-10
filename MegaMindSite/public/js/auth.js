// IMPORTAÇÕES DO FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

// INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Chave do localStorage — igual ao perfil.js
const KEYS = {
  name:   'megamind_nome',
  handle: 'megamind_handle',
  email:  'megamind_email',
};

// Expõe auth e db globalmente para que perfil.js possa usar
window._mmAuth = auth;
window._mmDb   = db;
window._mmDoc  = doc;
window._mmUpdateDoc = updateDoc;

//
// CADASTRO
//
window.cadastrar = async function () {
  const nome  = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!nome || !email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

    // Salva no Firestore
    await setDoc(doc(db, "usuarios", userCredential.user.uid), {
      nome:  nome,
      email: email
    });

    alert("Cadastro realizado com sucesso!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro no cadastro:", error);

    if (error.code === "auth/email-already-in-use") {
      alert("E-mail já cadastrado.");
    } else if (error.code === "auth/invalid-email") {
      alert("E-mail inválido.");
    } else if (error.code === "auth/weak-password") {
      alert("Senha fraca (mínimo 6 caracteres).");
    } else {
      alert("Erro: " + error.message);
    }
  }
};

//
// LOGIN
//
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha e-mail e senha.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "home.html";
  } catch (error) {
    console.error("Erro no login:", error);

    if (error.code === "auth/user-not-found") {
      alert("Usuário não encontrado.");
    } else if (error.code === "auth/wrong-password") {
      alert("Senha incorreta.");
    } else if (error.code === "auth/invalid-email") {
      alert("E-mail inválido.");
    } else {
      alert("Erro: " + error.message);
    }
  }
};

//
// RECUPERAR SENHA
//
window.recuperarSenha = async function () {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Digite seu e-mail.");
    return;
  }

  try {
    const actionCodeSettings = {
      url: "https://megamindapp-4e60c.web.app/resetar-senha.html",
      handleCodeInApp: false
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);

    alert("Se o e-mail existir, o link de recuperação foi enviado.");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao recuperar senha:", error);

    if (error.code === "auth/invalid-email") {
      alert("E-mail inválido.");
    } else {
      alert("Erro: " + error.message);
    }
  }
};

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIO — sincroniza dados do Firestore → localStorage
//  Regra: localStorage tem prioridade se já estiver preenchido
//  (significa que o usuário editou o nome no app).
//  Firestore só é usado na primeira carga (localStorage vazio).
// ─────────────────────────────────────────────────────────────
async function sincronizarUsuario(user) {
  try {
    // E-mail sempre vem do Firebase Auth
    localStorage.setItem(KEYS.email, user.email);

    // Se o localStorage já tem um nome salvo, mantém ele
    const nomeSalvo = localStorage.getItem(KEYS.name);
    if (nomeSalvo) {
      if (!localStorage.getItem(KEYS.handle)) {
        localStorage.setItem(KEYS.handle, nomeSalvo.split(" ")[0].toLowerCase());
      }
      return { nome: nomeSalvo, email: user.email };
    }

    // Primeiro acesso: busca no Firestore
    const docRef  = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    let nome = null;
    if (docSnap.exists()) {
      nome = docSnap.data().nome || null;
    }

    // Fallback: parte do e-mail
    if (!nome) nome = user.email.split("@")[0];

    // Salva no localStorage para as próximas páginas
    localStorage.setItem(KEYS.name, nome);
    localStorage.setItem(KEYS.handle, nome.split(" ")[0].toLowerCase());

    return { nome, email: user.email };

  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    const nomeFallback = localStorage.getItem(KEYS.name) || "Aluno";
    return { nome: nomeFallback, email: user.email };
  }
}

// ─────────────────────────────────────────────────────────────
//  HOME.HTML — exibe saudação com nome do usuário
//  Mostra imediatamente do localStorage; confirma com Firebase
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const bemVindo = document.getElementById("bemvindo");
  if (!bemVindo) return;

  // Exibe o nome salvo instantaneamente (sem esperar Firebase)
  const nomeCached = localStorage.getItem(KEYS.name);
  if (nomeCached) bemVindo.textContent = nomeCached;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const { nome } = await sincronizarUsuario(user);
    bemVindo.textContent = nome;
  });
});

// ─────────────────────────────────────────────────────────────
//  PERFIL.HTML — preenche nome e e-mail
//  Mostra imediatamente do localStorage; confirma com Firebase
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const nomePerfil  = document.querySelector(".js-student-name");
  const emailPerfil = document.querySelector(".js-student-handle");
  if (!nomePerfil || !emailPerfil) return;

  // Exibe instantaneamente do localStorage
  const nomeCached  = localStorage.getItem(KEYS.name);
  const emailCached = localStorage.getItem(KEYS.email);
  if (nomeCached)  nomePerfil.textContent  = nomeCached;
  if (emailCached) emailPerfil.textContent = emailCached;

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