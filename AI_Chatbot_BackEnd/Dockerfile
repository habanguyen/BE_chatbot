# ================================
# 🧠 Dockerfile cho Chatbot Backend
# ================================

# 1️⃣ Sử dụng Node.js image chính thức
FROM node:18

# 2️⃣ Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# 3️⃣ Copy file cấu hình vào container
COPY package*.json ./
COPY .env ./

# 4️⃣ Cài đặt dependencies
RUN npm install

# 5️⃣ Copy toàn bộ mã nguồn vào container
COPY . .

# 6️⃣ Mở port mà app sẽ chạy (ví dụ 3000)
EXPOSE 3000

# 7️⃣ Lệnh khởi động ứng dụng
CMD ["npm", "start"]
