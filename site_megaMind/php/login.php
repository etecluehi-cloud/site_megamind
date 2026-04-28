<?php

session_start();
include "conexao.php";

$email = $_POST['email'];
$senha = $_POST['senha'];

$sql = "SELECT * FROM tb_Usuario WHERE email_usuario = '$email'";
$result = mysqli_query($con, $sql);

if ($result && mysqli_num_rows($result) > 0) {

    $usuario = mysqli_fetch_assoc($result);

    if (password_verify($senha, $usuario['senha_usuario'])) {

        $_SESSION['usuario'] = $usuario['nome_usuario'];

        header("Location: /html/home.html");
        exit();

    } else {
        echo "Senha incorreta";
    }

} else {
    echo "Usuário não encontrado";
}

?>