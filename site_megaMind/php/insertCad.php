<?php

include "conexao.php";

$usuario = $_POST["usuarioCad"];
$email = $_POST["emailCad"];
$senha = $_POST["senhaCad"];

$sql_check = "SELECT * FROM tb_Usuario WHERE email_usuario = '$email'";
$result_check = mysqli_query($con, $sql_check);

if (mysqli_num_rows($result_check) > 0) {
    echo "Email já cadastrado!";
    exit();
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$comando = "INSERT INTO tb_Usuario 
(nome_usuario, email_usuario, senha_usuario) 
VALUES 
('$usuario', '$email', '$senhaHash')";

$resulta = mysqli_query($con, $comando);

if ($resulta) {
    header("Location: /html/login.html");
    exit();
} else {
    echo "Erro: " . mysqli_error($con);
}

mysqli_close($con);

?>