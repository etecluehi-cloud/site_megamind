<?php
$con=mysqli_connect("sql311.infinityfree.com","if0_41357880","hLjxA4Sf87bEDyv","if0_41357880_db_megamind");

mysqli_set_charset($con, "utf8");

if(!$con)
{
    die("Erro de conexão: " . mysqli_connect_error());
}
?>