CREATE DATABASE IF NOT EXISTS DB_MegaMind;

USE DB_MegaMind;

-- Tabela cadastro do Usuário
CREATE TABLE IF NOT EXISTS tb_Usuario
(
	id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    email_usuario VARCHAR(100) UNIQUE NOT NULL,
    senha_usuario VARCHAR(255) NOT NULL,
    data_cadastro_usuario DATE
);

-- Tabela Materia
CREATE TABLE IF NOT EXISTS tb_Materia
(
	id_materia INT AUTO_INCREMENT PRIMARY KEY,
    nome_materia VARCHAR(30)
);

-- Tabela para adicionar conteúdo
CREATE TABLE IF NOT EXISTS tb_Conteudo
(
	id_conteudo INT AUTO_INCREMENT PRIMARY KEY,
    titulo_conteudo VARCHAR(30),
    tipo_conteudo ENUM('video', 'texto'),
	descricao_conteudo TEXT,
	id_materia INT,
    foreign key (id_materia) references tb_Materia(id_materia)
    ON DELETE CASCADE
);

-- Tabela Questão
CREATE TABLE IF NOT EXISTS tb_Questao
(
	id_questao INT AUTO_INCREMENT PRIMARY KEY,
    enunciado TEXT NOT NULL,
    alternativa_a VARCHAR(255),
    alternativa_b VARCHAR(255),
    alternativa_c VARCHAR(255),
    alternativa_d VARCHAR(255),
    alternativa_e VARCHAR(255),
    resposta_correta CHAR(1),
    nivel_dificuldade_questao ENUM('facil', 'medio', 'dificil'),
    id_materia INT,
    FOREIGN KEY (id_materia) REFERENCES tb_Materia(id_materia) 
    ON DELETE CASCADE
);

-- Tabela Resposta do Usuario
CREATE TABLE IF NOT EXISTS tb_Resposta_Questao(
	id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    resposta_usuario CHAR(1),
	correta BOOLEAN,
    data_resposta DATETIME,
    id_usuario INT,
    id_questao INT,
    FOREIGN KEY (id_usuario) REFERENCES tb_Usuario(id_usuario)
    ON DELETE CASCADE,
    FOREIGN KEY (id_questao) REFERENCES tb_Questao(id_questao)
    ON DELETE CASCADE
);

-- Tabela Redação
CREATE TABLE IF NOT EXISTS tb_Redacao (
	id_redacao INT AUTO_INCREMENT PRIMARY KEY,
    tema_redacao VARCHAR(300),
    texto_redacao TEXT,
    nota_redacao DECIMAL(4,2),
    data_envio_redacao DATE,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES tb_Usuario(id_usuario)
    ON DELETE CASCADE
);

-- Tabela para add simulados
CREATE TABLE IF NOT EXISTS tb_Simulado (
    id_simulado INT AUTO_INCREMENT PRIMARY KEY,
    nome_simulado VARCHAR(100),
    tempo_minutos_simulado INT,
    data_criacao_simulado DATE
);

-- Tabela relaciona o siulado as questões
CREATE TABLE IF NOT EXISTS tb_Simulado_Questao (
    id_simulado INT,
    id_questao INT,
    PRIMARY KEY (id_simulado, id_questao),
    FOREIGN KEY (id_simulado) REFERENCES tb_Simulado(id_simulado)
    ON DELETE CASCADE,
    FOREIGN KEY (id_questao) REFERENCES tb_Questao(id_questao)
    ON DELETE CASCADE
);

-- Tabela armazena o resultado dos simulados
CREATE TABLE IF NOT EXISTS tb_Resultado_Simulado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    nota DECIMAL(5,2),
    data_realizacao DATE,
    id_usuario INT,
    id_simulado INT,
    FOREIGN KEY (id_usuario) REFERENCES tb_Usuario(id_usuario)
    ON DELETE CASCADE,
    FOREIGN KEY (id_simulado) REFERENCES tb_Simulado(id_simulado)
    ON DeLETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_Historico_Estudos (
	id_historico_estudos INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_conteudo INT,
    data_estudo DATETIME,
    tempo_estudo INT,
    FOREIGN KEY (id_usuario) REFERENCES tb_Usuario(id_usuario)
    ON DELETE CASCADE,
    FOREIGN KEY (id_conteudo) REFERENCES tb_Conteudo(id_conteudo)
    ON DELETE CASCADE
);

-- Tabela para armazenar os dias logados(gameficação)
CREATE TABLE IF NOT EXISTS tb_Streak_Usuario(
	id_usuario INT PRIMARY KEY,
    dias_seguidos INT DEFAULT 0,
    maior_streake INT DEFAULT 0,
    ultima_data_usuario DATE,
    FOREIGN KEY(id_usuario) REFERENCES tb_Usuario(id_usuario)
    ON DELETE CASCADE
);