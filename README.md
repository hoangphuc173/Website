# ClassicModels Dashboard

Website quan ly ClassicModels voi cac chuc nang tim kiem, thong ke va chatbot.

## Cong nghe

- Node.js + Express
- MySQL + Sequelize
- HTML/CSS/JavaScript (frontend)

## Cai dat

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env` voi cac bien ket noi CSDL (vi du):

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=classicmodels
DB_USER=root
DB_PASSWORD=your_password
PORT=3000
```

3. Chay ung dung:

```bash
npm start
```

## Scripts

- `npm start`: chay server
- `npm run dev`: chay server (dev)

## Cau truc thu muc chinh

- `public/`: giao dien frontend
- `server/app.js`: diem vao backend
- `server/config/`: cau hinh database
- `server/controllers/`: xu ly nghiep vu
- `server/models/`: model Sequelize
- `server/routes/`: dinh nghia API routes

## Tinh nang chinh

- Quan ly san pham, don hang, khach hang
- Tim kiem du lieu
- Thong ke tong quan
- Chatbot ho tro truy van

## Ghi chu

- Nho khong commit file `.env`.
- Mac dinh project chay voi `node server/app.js`.
