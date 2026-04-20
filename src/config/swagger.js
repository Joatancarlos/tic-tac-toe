import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Capstone - Redes de Computadores 2",
            version: "1.0.0",
            description: "API para gerenciamento de jogadores, partidas e pontuações do jogo da velha"
        },
        servers: [
            {
                url: "https://localhost:3000",
                description: "Servidor local (HTTPS)"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            { name: "Auth", description: "Autenticação" },
            { name: "Game", description: "Gerenciamento de partidas" },
            { name: "Player", description: "Gerenciamento dos jogadores"},
            { name: "Score", description: "Adiciona vitórias ou empates aos jogadores"},
        ]
    },
    apis: ["./src/routes/*.js"] // onde vão ficar os comentários
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };