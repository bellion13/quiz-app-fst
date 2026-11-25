# Quiz ôn Frontend (HTML / CSS / JS / React)

Web app quiz để ôn lại kiến thức frontend, học ở đâu cũng được và dùng chung với bạn.

## Tech Stack

| Phần | Công nghệ |
|---|---|
| Frontend | React (Vite) |
| Routing client | react-router-dom |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon) |
| Xác thực | JWT |

## Cấu trúc thư mục

```
quiz-app-fst/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── db/
│   │   ├── validators/
│   │   └── index.js
│   └── package.json
└── README.md
```

## Chạy local

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Biến môi trường

### Backend (`server/.env`)
```
PORT=3001
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

### Frontend (`client/.env`)
```
VITE_API_URL=http://localhost:3001
```
