const adminGuardFirebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(adminGuardFirebaseConfig);
}

const admAuth = firebase.auth();
const admDb = firebase.firestore();

function irParaLoginAdm() {
  window.location.href = "adm-login.html";
}

window.sairAdm = async function () {
  await admAuth.signOut();
  window.location.href = "adm-login.html";
};

admAuth.onAuthStateChanged(async (user) => {
  if (!user) {
    irParaLoginAdm();
    return;
  }

  try {
    const doc = await admDb.collection("usuarios").doc(user.uid).get();
    const dados = doc.exists ? doc.data() : {};

    if (dados.admin === true) {
      window.adminAtual = { uid: user.uid, email: user.email, ...dados };
      document.dispatchEvent(new CustomEvent("admin-autorizado", { detail: window.adminAtual }));
      return;
    }

    await admAuth.signOut();
    alert("Este usuário não tem permissão de administrador.");
    irParaLoginAdm();
  } catch (error) {
    console.error("Erro ao verificar ADM:", error);
    alert("Não foi possível verificar sua permissão de administrador.");
    irParaLoginAdm();
  }
});

