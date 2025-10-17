import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // phục vụ FE

const DATA_FILE = path.join(__dirname, "public", "results.csv");

function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

// ✅ Helper: đọc CSV và trả về mảng SĐT đã quay
function getUsedPhones() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const content = fs.readFileSync(DATA_FILE, "utf8");
  const lines = content.split("\n").slice(1); // bỏ header
  return lines.map((line) => line.split(",")[1]?.trim()).filter((v) => v); // bỏ rỗng
}

// API: kiểm tra SĐT
app.get("/check-phone", (req, res) => {
  const phone = req.query.phone?.trim();
  if (!phone) return res.status(400).json({ error: "Thiếu số điện thoại" });

  const usedPhones = getUsedPhones();
  const used = usedPhones.includes(phone);

  res.json({ used });
});

// API: lưu kết quả quay
app.post("/spin", (req, res) => {
  const { name, phone, result } = req.body;
  if (!name || !phone || !result)
    return res.status(400).json({ error: "Thiếu dữ liệu" });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "Name,Phone,Result,Time\n", "utf8");
  }
  // Kiểm tra trùng SĐT trước khi lưu
  const usedPhones = getUsedPhones();
  if (usedPhones.includes(phone)) {
    return res.status(400).json({ error: "Số điện thoại này đã quay rồi!" });
  }

  // Tạo file nếu chưa có
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "Name,Phone,Result,Time\n", "utf8");
  }
  const now = formatDate(new Date());
  const line = `${name},${phone},${result},${now}\n`;
  fs.appendFileSync(DATA_FILE, line, "utf8");

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`)
);
