
# SWP 391 – Frontend (React + Vite)

## 📌 Mục tiêu

Repo này dùng cho **Frontend team**. Branch `main` chỉ chứa **template + code đã được review**.

⛔ **CẤM push trực tiếp lên `main`** (trừ leader khi setup ban đầu)

---

## 🧠 Quy ước làm việc với Git (BẮT BUỘC)

* `main`: code chuẩn, ổn định
* Mỗi thành viên:

  * Tự tạo **branch riêng** theo tên mình
  * Chỉ push code lên **branch cá nhân**
  * Merge vào `main` bằng **Pull Request (PR)**

---
Lần đầu clone về mọi người nhớ
```bash
cd [thư mục chứa code] hoặc cd tab
npm install
npm run dev
```
---

## 🧩 BƯỚC 1: Clone repo (LÀM 1 LẦN DUY NHẤT)

```bash
git clone https://github.com/KhangTDse/SWP_391_Group5_Frontend.git
cd SWP_391_Group5_Frontend
```

Kiểm tra:

```bash
git status
```

---

## 🌿 BƯỚC 2: Tạo branch cá nhân

👉 Mỗi người tạo **1 branch riêng**, ví dụ:

```bash
git checkout -b HoangVo
```

Kiểm tra:

```bash
git branch
```

Phải thấy:

```
* HoangVo
  main
```

---

## 🔄 BƯỚC 3: MỖI NGÀY TRƯỚC KHI CODE (RẤT QUAN TRỌNG)

👉 Đồng bộ code mới nhất từ `main`

```bash
git checkout main
git pull origin main
git checkout HoangVo
```

---

## ✍️ BƯỚC 4: Code như bình thường

* Chỉ sửa code trên **branch cá nhân**
* KHÔNG checkout sang `main` để code

---

## 📦 BƯỚC 5: Commit code (SAU KHI CODE XONG)

```bash
git status          # kiểm tra file đã thay đổi
git add .           # đưa file vào staging
git commit -m "Hoang: build homepage UI"
```

📌 Quy ước message:

* `Tên: nội dung ngắn gọn`
* Ví dụ: `Hoang: add login page`

---

## 🚀 BƯỚC 6: Push code lên branch cá nhân

```bash
git push origin HoangVo
```

❌ **KHÔNG push lên main**

---

## 🔀 BƯỚC 7: Tạo Pull Request (PR)

1. Lên GitHub repo
2. Chọn **Compare & Pull Request**
3. Base: `main`
4. Compare: `HoangVo`
5. Ghi mô tả rõ ràng:

   * Làm gì?
   * Ảnh hưởng file nào?

---

## ✅ BƯỚC 8: Merge code

* Người merge: **Leader / người được phân quyền**
* Sau khi merge xong:

```bash
git checkout main
git pull origin main
git checkout HoangVo
```

---

## 🧹 (Tuỳ chọn) Xoá branch sau khi merge

```bash
git branch -d HoangVo
git push origin --delete HoangVo
```

---

## 🚨 NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

❌ Push trực tiếp lên `main`
❌ Force push `main`
❌ Code trên `main`
❌ Pull khi đang sửa file chưa commit

---

## 🧠 CHECKLIST NHANH TRƯỚC KHI PUSH

```bash
git status
git branch
git remote -v
```

✔️ Đúng branch
✔️ Đúng repo
✔️ Sạch sẽ rồi hãy push

---

## 📞 Có lỗi Git thì làm gì?

👉 **KHÔNG tự xử lý nếu không chắc**
👉 Hỏi leader hoặc người phụ trách Git

---

Happy coding 🚀


---



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
