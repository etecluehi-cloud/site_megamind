const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const form = document.getElementById("form-login-adm");
const mensagem = document.getElementById("mensagem-login-adm");

function setMensagem(texto, tipo = "info") {
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.className = "mensagem-login-adm " + tipo;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email-adm").value.trim();
  const senha = document.getElementById("senha-adm").value.trim();

  if (!email || !senha) {
    setMensagem("Preencha e-mail e senha.", "erro");
    return;
  }

  try {
    setMensagem("Verificando acesso...", "info");
    const cred = await auth.signInWithEmailAndPassword(email, senha);
    const doc = await db.collection("usuarios").doc(cred.user.uid).get();
    const dados = doc.exists ? doc.data() : {};

    if (dados.admin !== true) {
      await auth.signOut();
      setMensagem("Este login não é de administrador.", "erro");
      return;
    }

    window.location.href = "adm-home.html";
  } catch (error) {
    console.error("Erro no login ADM:", error);
    setMensagem("E-mail, senha ou permissão de ADM inválidos.", "erro");
  }
});
