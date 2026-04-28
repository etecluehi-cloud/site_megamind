<?php

include "conexao.php";

$loginx=$_POST["usuario"];
$senhax=$_POST["senha"];
$fotox=$_POST["foto"];

//$loginx="ANGELA";
//$senhax="1234";

//$fotox="imagem.jpg";
$comando = "insert into tab(login, senha, foto) values
('$loginx', '$senhax', '$fotox')";
$resulta = mysqli_query($con,$comando);

if ($resulta!=0){
    $dados=array("status" => "ok");
}
else{
    $dados=array("status" => "erro");
}
$close = mysqli_close($con);
echo json_encode($dados);

?>