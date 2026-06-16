import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Singleton para a conexão com o banco de dados
class Database {
    static #instance = null;
    #pool = null;


    #createPool() {
        this.#pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 100,
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }


    static getInstance() {
        if (!Database.#instance) {
            Database.#instance = new Database();
            Database.#instance.#createPool();
        }
        return Database.#instance;
    }


    getPool() {
        return this.#pool;
    }
}


export const connection = Database.getInstance().getPool();


export async function initializeDatabase() {
    console.log("Inicializando o banco de dados e tabelas");
    try {
        const tempConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });


        const dbName = process.env.DB_DATABASE || 'S1_R3_R4';


        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.query(`USE \`${dbName}\`;`);


        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS categorias(
                id_categoria INT auto_increment PRIMARY KEY,
                nome VARCHAR (50) NOT NULL,
                descricao VARCHAR(100),
                data_cad TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);


        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS produtos(
                id_produto INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                descricao VARCHAR (100),
                preco DECIMAL(10,2) NOT NULL,
                caminho_imagem VARCHAR(300),
                quantidade_estoque INT NOT NULL,
                id_categoria INT,
                data_cad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE
            );
        `);

        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS pedidos(
                id_pedido INT AUTO_INCREMENT PRIMARY KEY,
                subTotal DECIMAL (18,2) NOT NULL,
                status ENUM ('Aberto', 'Finalizado', 'Pendente') NOT NULL,
                quantidade_itens INT DEFAULT(0),
                dataCad  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            `)

        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS itens_pedido(
                idItem INT AUTO_INCREMENT PRIMARY KEY,
                produtoId INT NOT NULL,
                pedidoId INT NOT NULL,
                quantidade DECIMAL(18,2) NOT NULL,
                valorItem DECIMAL(18,2) NOT NULL,
                FOREIGN KEY (produtoId) REFERENCES produtos(id_produto) ON DELETE CASCADE,
                FOREIGN KEY (pedidoId) REFERENCES pedidos(id_pedido) ON DELETE CASCADE
            );
            `)


        await tempConnection.end();
        console.log("Banco de dados e tabelas verificados/criados com sucesso.");
    } catch (error) {
        console.error("Erro ao criar o banco ou as tabelas:", error);
        throw error;
    }
}


