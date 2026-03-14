const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 已填你的域名 20230221.xyz（带HTTPS）
const ALLOWED_ORIGINS = [
  "https://20230221.xyz", 
  "https://www.20230221.xyz"
];

// 跨域配置（仅允许你的域名访问）
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化 SQLite 数据库（文件存储，无需额外配置）
const db = new sqlite3.Database('./comments.db', (err) => {
  if (err) console.error('数据库连接失败:', err.message);
  else console.log('数据库连接成功');
});

// 创建评论表（首次运行自动创建）
db.run(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  articleId TEXT NOT NULL, -- 区分不同文章的评论
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  createTime DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 接口1：提交评论
app.post('/api/comment', (req, res) => {
  const { articleId, nickname, content } = req.body;
  if (!articleId || !nickname || !content) {
    return res.status(400).json({ code: -1, msg: '昵称和评论内容不能为空！' });
  }

  const sql = 'INSERT INTO comments (articleId, nickname, content) VALUES (?, ?, ?)';
  db.run(sql, [articleId, nickname, content], function (err) {
    if (err) {
      console.error('提交评论失败:', err);
      res.status(500).json({ code: -1, msg: '评论提交失败，请稍后再试！' });
    } else {
      res.json({ code: 0, msg: '评论提交成功！', id: this.lastID });
    }
  });
});

// 接口2：获取文章评论
app.get('/api/comments', (req, res) => {
  const { articleId } = req.query;
  if (!articleId) {
    return res.status(400).json({ code: -1, msg: '文章ID不能为空！' });
  }

  const sql = 'SELECT * FROM comments WHERE articleId = ? ORDER BY createTime DESC';
  db.all(sql, [articleId], (err, rows) => {
    if (err) {
      console.error('获取评论失败:', err);
      res.status(500).json({ code: -1, msg: '获取评论失败，请稍后再试！' });
    } else {
      res.json({ code: 0, data: rows });
    }
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}`);
});
