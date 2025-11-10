chatbot-backend/
├── docker-compose.yml
├── db/
|   |──db.sql
|   └──init.sql
├── .env
├── package.json
└── src/
    ├── app.js
    ├── db.js
    ├── server.js
    ├── routes/ → định nghĩa API endpoint
    |   ├── products.js
    |   └── chatbot.js
    ├── models/ → xử lý logic
    |   ├── productModel.js
    |   └── userModel.js
    ├── controllers/ → truy vấn dữ liệu trong DB
    |   ├── productController.js
    |   └── chatbotController.js → xử lý logic chatbot
    ├── utils/ 
        └── nlp.js → phân tích ngôn ngữ người dùng
        