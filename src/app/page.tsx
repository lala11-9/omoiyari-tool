'use client';

import { useState, useEffect } from 'react';

interface Doc {
  id: number;
  title: string;
  type: string;
  tags: string[];
  url: string;
  memo: string; // 一言メモ
  createdAt: string;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState(''); // メモ用ステート

  useEffect(() => {
    const saved = localStorage.getItem('team_home_final_v1');
    if (saved) setDocs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('team_home_final_v1', JSON.stringify(docs));
  }, [docs]);

  const handleSave = () => {
    if (!title) return;
    const newDoc: Doc = {
      id: Date.now(),
      title,
      type: '資料',
      tags: tagInput.split(',').map(t => t.trim()).filter(t => t !== ''),
      url,
      memo,
      createdAt: new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date()),
    };
    setDocs([newDoc, ...docs]);
    setTitle(''); setTagInput(''); setUrl(''); setMemo('');
  };

  // 全文検索ロジック（タイトル、タグ、メモ、URLすべてを対象にする）
  const filteredDocs = docs.filter(d => {
    const query = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(query) ||
      d.memo.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query)) ||
      d.url.toLowerCase().includes(query)
    );
  });

  return (
    <main style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#37352f' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '3rem' }}>💾</span> security knowledge
      </h1>

      {/* 登録フォーム */}
      <div style={{ backgroundColor: '#f7f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #edece9', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="名前" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
          <input placeholder="タグ (カンマ区切り)" value={tagInput} onChange={e => setTagInput(e.target.value)} style={notionInputStyle} />
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="一言メモ (検索対象になります)" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...notionInputStyle, flex: 1 }} />
          <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 30px', cursor: 'pointer', fontWeight: '600' }}>追加</button>
        </div>
      </div>

      {/* 🔍 全文検索窓 */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          placeholder="🔍 すべての項目から検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
        />
      </div>

      {/* ビュー切り替え */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', paddingLeft: '5px' }}>
        <button onClick={() => setViewMode('table')} style={viewMode === 'table' ? activeTabStyle : inactiveTabStyle}>田 テーブル</button>
        <button onClick={() => setViewMode('list')} style={viewMode === 'list' ? activeTabStyle : inactiveTabStyle}>＝ リスト</button>
      </div>

      <div style={{ borderTop: '1px solid #eee' }}>
        {viewMode === 'table' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#666', textAlign: 'left', fontSize: '12px' }}>
                <th style={thStyle}>Aa 名前</th>
                <th style={thStyle}>⋮≡ Tag</th>
                <th style={thStyle}>📝 一言メモ</th>
                <th style={thStyle}>🕒 作成日時</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><a href={doc.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>📄 {doc.title}</a></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {doc.tags.map((tag, i) => <span key={i} style={tagBadgeStyle(tag)}>{tag}</span>)}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#37352f' }}>{doc.memo}</td>
                  <td style={{ ...tdStyle, color: '#666', fontSize: '12px' }}>{doc.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
            {filteredDocs.map(doc => (
              <div key={doc.id} style={{ padding: '10px', borderBottom: '1px solid #f1f1f1' }}>
                <div style={{ fontWeight: '600' }}><a href={doc.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>📄 {doc.title}</a></div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{doc.memo}</div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                  {doc.tags.map((tag, i) => <span key={i} style={tagBadgeStyle(tag)}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// スタイルはほぼ同じ（再掲）
const notionInputStyle = { border: '1px solid #ddd', padding: '10px', borderRadius: '4px', fontSize: '14px' };
const thStyle = { padding: '12px 10px', fontWeight: 'normal' };
const tdStyle = { padding: '12px 10px' };
const linkStyle = { textDecoration: 'none', color: '#37352f' };
const activeTabStyle = { border: 'none', background: 'none', borderBottom: '2px solid black', padding: '5px', cursor: 'pointer', fontWeight: '600' };
const inactiveTabStyle = { border: 'none', background: 'none', color: '#666', padding: '5px', cursor: 'pointer' };
const tagBadgeStyle = (tag: string) => ({
  backgroundColor: tag.includes('Web') ? '#d3e5ef' : '#eee',
  color: tag.includes('Web') ? '#2383e2' : '#37352f',
  padding: '2px 8px', borderRadius: '3px', fontSize: '12px'
});