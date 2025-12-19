'use client';

import { useState, useEffect } from 'react';

interface Memo {
  id: number;
  project: string;
  tag: string;
  content: string;
  url: string;
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [project, setProject] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');

  // 【魔法1】アプリが開いた時に、保存されたデータを読み込む
  useEffect(() => {
    const savedMemos = localStorage.getItem('omoiyari_memos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  // 【魔法2】memos（データ）が更新されるたびに、ブラウザに保存する
  useEffect(() => {
    if (memos.length > 0) {
      localStorage.setItem('omoiyari_memos', JSON.stringify(memos));
    }
  }, [memos]);

  const handleSave = () => {
    if (!project || !content) {
      alert("案件名と内容は必須です！");
      return;
    }
    const newMemo: Memo = {
      id: Date.now(),
      project,
      tag,
      content,
      url
    };
    const updatedMemos = [newMemo, ...memos];
    setMemos(updatedMemos);
    // 1件だけの時も即保存
    localStorage.setItem('omoiyari_memos', JSON.stringify(updatedMemos));

    setProject(''); setTag(''); setContent(''); setUrl('');
  };

  // メモを削除する機能（おもいやり：間違えて登録した時のため）
  const handleDelete = (id: number) => {
    if (confirm('この情報を削除してもよろしいですか？')) {
      const updatedMemos = memos.filter(m => m.id !== id);
      setMemos(updatedMemos);
      localStorage.setItem('omoiyari_memos', JSON.stringify(updatedMemos));
    }
  };

  const filteredMemos = memos.filter(memo => 
    memo.project.toLowerCase().includes(searchQuery.toLowerCase()) || 
    memo.tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
    memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fdfdfd' }}>
      <h1 style={{ color: '#0f172a', textAlign: 'center', fontWeight: 'bold' }}>おもいやり情報ハブ</h1>
      
      <section style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>🚀 情報を登録する</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <input placeholder="案件名 (例: A社サイト改修)" value={project} onChange={e => setProject(e.target.value)} style={inputStyle} />
          <input placeholder="タグ (例: 決定事項, 設計, LINE)" value={tag} onChange={e => setTag(e.target.value)} style={inputStyle} />
          <textarea placeholder="内容・メモ (決定事項など)" value={content} onChange={e => setContent(e.target.value)} style={{ ...inputStyle, height: '100px' }} />
          <input placeholder="参考URL (https://...)" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          <button onClick={handleSave} style={buttonStyle}>情報を保存して集約</button>
        </div>
      </section>

      <section style={{ marginBottom: '25px' }}>
        <input 
          type="text" 
          placeholder="🔍 案件名、タグ、内容で検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, borderColor: '#3b82f6', borderWidth: '2px', backgroundColor: '#fff' }}
        />
      </section>

      <section>
        {filteredMemos.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>データがありません</p>}
        {filteredMemos.map(memo => (
          <div key={memo.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <div>
                <span style={projectBadgeStyle}>{memo.project}</span>
                <span style={{ ...tagBadgeStyle, marginLeft: '8px' }}>{memo.tag}</span>
              </div>
              <button onClick={() => handleDelete(memo.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>削除</button>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: '#1e293b', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}>{memo.content}</p>
            {memo.url && (
              <div style={{ marginTop: '10px' }}>
                <a href={memo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.95rem', fontWeight: 'bold', textDecoration: 'none' }}>
                  🔗 関連URLを開く
                </a>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

// デザイン設定（視認性をさらに強化）
const inputStyle = { padding: '12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', fontWeight: '600', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none' };
const buttonStyle = { padding: '14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' };
const cardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '8px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px' };
const projectBadgeStyle = { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '800' };
const tagBadgeStyle = { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600' };
