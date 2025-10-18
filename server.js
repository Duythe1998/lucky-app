import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";

const __dirname = path.resolve();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Chuẩn hóa số điện thoại: bỏ khoảng trắng, giữ số, bỏ số 0 đầu
function normalizePhone(phone) {
  phone = phone.replace(/\s+/g, ""); // bỏ khoảng trắng
  if (phone.startsWith("0")) phone = phone.slice(1);
  return phone;
}

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbypqWfHK5gMJQ_azTrmc3CLDixHLjOJAIj12v4jjJWfb3JiwyKzkUem5ChcgggmFh21bw/exec"; // đổi thành URL Apps Script của bạn

// API kiểm tra số điện thoại
app.get("/check-phone", async (req, res) => {
  const phone = req.query.phone?.trim();
  if (!phone) return res.status(400).json({ error: "Thiếu số điện thoại" });

  try {
    // Gọi Google Sheet (GET), Sheet trả về JSON danh sách số điện thoại đã quay
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    console.log(data);

    if (data.phones?.includes(Number(phone))) {
      return res.json({
        used: true,
        message: "🚫 Số điện thoại này đã quay rồi!",
      });
    }
    return res.json({ used: false, message: "✅ Bạn có thể quay." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server" });
  }
});

// API lưu kết quả quay
app.post("/spin", async (req, res) => {
  const { name, phone, result } = req.body;
  if (!name || !phone || !result)
    return res.status(400).json({ error: "Thiếu dữ liệu" });

  try {
    // Gọi Sheet (POST) để lưu
    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, result }),
    });

    const data = await response.json();

    if (data.error) return res.status(400).json({ error: data.error });

    return res.json({ success: true, message: "🎉 Lưu kết quả thành công!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server đang chạy tại http://0.0.0.0:${PORT}`);
});
