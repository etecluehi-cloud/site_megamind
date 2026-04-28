function toggleSenha() {
    const senha = document.getElementById("Senha");
    const icone = document.getElementById("IconeSenha");

    if (!senha || !icone) return;

    if (senha.type === "password") {
        senha.type = "text";
        icone.src = "img/olho.png";
    } else {
        senha.type = "password";
        icone.src = "img/invisivel.png";
    }
}

function MudarCor() {
    const icon = document.getElementById("iconeCor");
    if (!icon) return;

    const temaAtual = document.body.classList.contains("dark");

    if (temaAtual) {
        document.body.classList.remove("dark");
        icon.src = "img/Lua.png";
        localStorage.setItem("tema", "light");
    } else {
        document.body.classList.add("dark");
        icon.src = "img/sun.png";
        localStorage.setItem("tema", "dark");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const temaSalvo = localStorage.getItem("tema");
    const icon = document.getElementById("iconeCor");

    if (temaSalvo === "dark") {
        document.body.classList.add("dark");
        if (icon) icon.src = "img/sun.png";
    } else {
        document.body.classList.remove("dark");
        if (icon) icon.src = "img/Lua.png";
    }
});