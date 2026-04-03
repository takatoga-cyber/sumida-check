import { chromium } from 'playwright';
import fs from 'fs';
import nodemailer from 'nodemailer';

const EMAIL = 'takatoga@gmail.com';
const APP_PASSWORD = 'dyzy mlaj mgps avqc';
const TO = 'takatoga@gmail.com';

const SAVE_FILE = './last.json';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

await page.goto("https://yoyaku03.city.sumida.lg.jp/user/Home", {
  waitUntil: "domcontentloaded",
  timeout: 60000
});

await page.waitForTimeout(3000);

  // --- 操作 ---
  await page.getByRole('button', { name: '屋外スポーツ施設' }).click();
  await page.getByText('公園運動場').click();
  await page.getByRole('button', { name: '次へ進む' }).click();
  await page.getByText('3ヶ月').click();
  await page.getByRole('button', { name: 'その他の条件で絞り込む' }).click();
  await page.getByText('夜間').click();
  await page.getByRole('button', { name: '表示' }).first().click();

  await page.waitForSelector('table');
  await page.waitForTimeout(2000);

  const availableDates = [];

  const rows = await page.locator('table tbody tr').all();

  for (const row of rows) {
    const facility = await row.locator('td').first().innerText();

    if (!facility.includes('堤通公園テニスコートＢ面')) continue;

    const cells = await row.locator('td').all();

    for (const cell of cells) {
      const label = await cell.locator('label').first();
      if (!(await label.count())) continue;

      const classAttr = await label.getAttribute('class');

      // △のみ
      if (classAttr && classAttr.includes('some')) {
        const dateInput = await cell.locator('input[name$=".UseDate"]').first();

        if (await dateInput.count()) {
          const dateValue = await dateInput.inputValue();
          const date = dateValue.split('T')[0];
          availableDates.push(date);
        }
      }
    }
  }

  await browser.close();

  // --- 重複防止 ---
  let lastDates = [];
  if (fs.existsSync(SAVE_FILE)) {
    lastDates = JSON.parse(fs.readFileSync(SAVE_FILE));
  }

  const newDates = availableDates.filter(d => !lastDates.includes(d));

  if (newDates.length > 0) {
    const message = `🎾 空きあり！\n${newDates.join('\n')}`;
    console.log(message);

    // --- メール送信 ---
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL,
        pass: APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: EMAIL,
      to: TO,
      subject: '【テニス空き通知】',
      text: message,
    });

  } else {
    console.log('😞 空きなし or 通知済み');
  }

  // 保存
  fs.writeFileSync(SAVE_FILE, JSON.stringify(availableDates));
})();
