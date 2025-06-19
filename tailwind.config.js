/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // กำหนดให้ Tailwind สแกนไฟล์ในโฟลเดอร์ src ที่มีนามสกุล js, jsx, ts, tsx
    './public/index.html', // หากคุณมีไฟล์ index.html ในโฟลเดอร์ public ให้เพิ่มไฟล์นี้เช่นกัน
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
