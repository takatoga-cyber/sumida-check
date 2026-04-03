import { chromium } from "playwright";
import nodemailer from "nodemailer";

const EMAIL = process.env.EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;
const TO = process.env.TO;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "ja-JP"
  });

  const page = await context.newPage();

  await page.goto("https://yoyaku03.city.sumida.lg.jp/user/Home", {
    waitUntil: "networkidle",
    timeout: 90000
  });

  await page.waitForTimeout(5000);

  // ここは一旦シンプルに（あとで元ロジックに戻す）
  const text = await page.content();

  if (text.includes("△")) {
    console.log("空きあり！メール送信");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: EMAIL,
      to: TO,
      subject: "【空きあり】墨田区コート",
      text: "空きが出てる可能性あり"
    });

  } else {
    console.log("空きなし");
  }

  await browser.close();
})();
