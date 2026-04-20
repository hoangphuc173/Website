/**
 * Script tự động setup database ClassicModels
 * Chạy: node setup.js
 * Bạn sẽ được hỏi password MySQL
 */
const { Sequelize } = require('sequelize');
const readline = require('readline');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   🚗 ClassicModels Database Setup Wizard      ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  const host = await ask('MySQL Host (mặc định: localhost): ') || 'localhost';
  const port = await ask('MySQL Port (mặc định: 3306): ') || '3306';
  const user = await ask('MySQL User (mặc định: root): ') || 'root';
  const password = await ask('MySQL Password: ');

  console.log('\n⏳ Đang kết nối MySQL...');

  try {
    // Test connection
    const sequelize = new Sequelize('mysql', user, password, {
      host, port: parseInt(port), dialect: 'mysql', logging: false
    });
    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL thành công!');

    // Check if classicmodels exists
    const [dbs] = await sequelize.query("SHOW DATABASES LIKE 'classicmodels'");
    if (dbs.length > 0) {
      console.log('✅ Database classicmodels đã tồn tại!');
    } else {
      console.log('⚠️  Database classicmodels chưa tồn tại.');
      
      // Try to find SQL file
      const sqlFile = path.join(__dirname, 'database', 'mysqlsampledatabase.sql');
      if (!fs.existsSync(sqlFile)) {
        console.log('📥 Đang tải classicmodels SQL file...');
        fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true });
        try {
          await download('https://www.mysqltutorial.org/wp-content/uploads/2023/10/mysqlsampledatabase.zip', path.join(__dirname, 'database', 'sample.zip'));
          console.log('📦 Đã tải xong. Bạn cần giải nén và import thủ công.');
        } catch (e) {
          console.log('❌ Không thể tải tự động. Vui lòng:');
          console.log('   1. Tải từ: https://www.mysqltutorial.org/getting-started-with-mysql/mysql-sample-database/');
          console.log('   2. Giải nén vào thư mục database/');
          console.log('   3. Import: mysql -u root -p < database/mysqlsampledatabase.sql');
        }
      }

      if (fs.existsSync(sqlFile)) {
        console.log('📂 Tìm thấy file SQL. Đang import...');
        const sql = fs.readFileSync(sqlFile, 'utf-8');
        const statements = sql.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          try { await sequelize.query(stmt); } catch (e) { /* skip errors */ }
        }
        console.log('✅ Import classicmodels thành công!');
      }
    }

    // Verify tables
    const seq2 = new Sequelize('classicmodels', user, password, {
      host, port: parseInt(port), dialect: 'mysql', logging: false
    });
    const [tables] = await seq2.query("SHOW TABLES");
    console.log(`\n📊 Các bảng trong classicmodels (${tables.length}):`);
    tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));

    // Update .env file
    const envContent = `DB_HOST=${host}\nDB_PORT=${port}\nDB_USER=${user}\nDB_PASSWORD=${password}\nDB_NAME=classicmodels\nPORT=3000\n`;
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('\n✅ File .env đã được cập nhật!');

    console.log('\n🚀 Setup hoàn tất! Chạy: npm run dev');

    await seq2.close();
    await sequelize.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.message.includes('Access denied')) {
      console.log('\n💡 Password MySQL không đúng. Vui lòng kiểm tra lại.');
    }
  }

  rl.close();
}

main();
