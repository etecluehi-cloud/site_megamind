import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");

document.getElementById("btnReset").addEventListener("click", async () => {
  const senha = document.getElementById("newPassword").value;

  try {
    await confirmPasswordReset(auth, oobCode, senha);
    alert("Senha alterada com sucesso!");
    window.location.href = "index.html";
  } catch (erro) {
    alert(erro.message);
  }
});