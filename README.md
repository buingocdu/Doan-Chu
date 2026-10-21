# Game Do An Chu (Word Guessing Game)

## Cau truc du an
```
D:\Working\Game word\
├── backend\game-word-server\        # Java Spring Boot Backend
├── frontend\game-word-web\          # React.js Frontend (Web)
└── README.md
```

## Tech Stack
- **Backend:** Java 17+, Spring Boot 3.2.5, Spring Data JPA, PostgreSQL, JWT, Lombok
- **Frontend:** React 18, Vite, Axios, React Router
- **Database:** PostgreSQL
- **Mobile (Phase 2):** Chua phat trien

## Cau hinh Database (PostgreSQL)
Tao database va user:
```sql
CREATE DATABASE game_word_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE game_word_db TO postgres;
```

Cap nhat `backend\game-word-server\src\main\resources\application.properties` neu can:
```
spring.datasource.url=jdbc:postgresql://localhost:5432/game_word_db
spring.datasource.username=postgres
spring.datasource.password=postgres
```

## Chay Backend
Yeu cau: Maven va Java 17+

```cmd
cd D:\Working\Game word\backend\game-word-server
mvn spring-boot:run
```
Hoac chay JAR:
```cmd
mvn -DskipTests package
java -jar target\game-word-server-1.0.0.jar
```

Backend chay tai: `http://localhost:8080`

## Chay Frontend (Web)
Yeu cau: Node.js

```cmd
cd D:\Working\Game word\frontend\game-word-web
npm install
npm run dev
```

Frontend chay tai: `http://localhost:3000`

## API Endpoints
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| POST | /api/auth/register | Dang ky nguoi dung |
| POST | /api/auth/login | Dang nhap, tra ve JWT token |
| GET | /api/words/random | Lay tu ngau nhien (params: excludedIds) |
| GET | /api/words/random/{level} | Lay tu theo cap do |
| POST | /api/game/start | Bat dau tran dau moi |
| POST | /api/game/guess | Gui luot doan |
| GET | /api/history/user/{id} | Lich su choi cua nguoi dung |
| GET | /api/leaderboard | Bang xep hang |

## Luat choi (Phase 1)
- Backend chon 1 tu ghep (2 tu) tu kho tu dien, tra ve so ki tu
- Nguoi choi co 10 lan doan (co the config qua `game.guess.max-attempts`)
- Mau sac feedback:
  - Xanh la: chu o dung vi tri
  - Vang: chu co trong tu nhung sai vi tri
  - Xanh duong: nguyen am dung nhung sai dau (a,e,i,o,u)
  - Den: chu khong co trong tu
- Sau moi luot, luu vao lich de khong trung tu khi random man tiep
- Dang nhap duoc xep hang, cong diem 10-100 tuong ung so lan doan

## Mở rộng (Phase 2)
- App Mobile (React Native / Flutter)
- He thong login, xep hang, luu diem tong ket
