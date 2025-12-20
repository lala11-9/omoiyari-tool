'use client';

import { useState, useEffect } from 'react';

interface Doc {
  id: number;
  title: string;
  type: string;
  tags: string[];
  url: string;
  memo: string;
  createdAt: string;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table'); // 表示切り替え用
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PDF');
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('team_home_v1');
    if (saved) setDocs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('team_home_v1', JSON.stringify(docs));
  }, [docs]);

  const handleSave = () => {
    if (!title) return;
    const newDoc: Doc = {
      id: Date.now(),
      title,
      type,
      tags: tagInput.split(',').map(t => t.trim()).filter(t => t !== ''),
      url,
      memo: '',
      createdAt: new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date()),
    };
    setDocs([newDoc, ...docs]);
    setTitle(''); setTagInput(''); setUrl('');
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.tags.some(t => t.includes(searchQuery))
  );

  return (
    <main style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif', color: '#37352f' }}>
      {/* タイトルエリア */}
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '3rem' }}>💾</span> security knowledge
      </h1>

      {/* チーム用登録フォーム */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#f7f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #edece9' }}>
        <input placeholder="資料名" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
        <input placeholder="Tag (カンマ区切り)" value={tagInput} onChange={e => setTagInput(e.target.value)} style={notionInputStyle} />
        <input placeholder="URL (Google Drive等)" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 20px', cursor: 'pointer', fontWeight: '600' }}>新規作成</button>
      </div>

      {/* ビュー切り替えタブ */}
      <div style={{ marginBottom: '2px', display: 'flex', gap: '10px', paddingLeft: '5px' }}>
        <button 
          onClick={() => setViewMode('table')}
          style={viewMode === 'table' ? activeTabStyle : inactiveTabStyle}>
          田 テーブルビュー
        </button>
        <button 
          onClick={() => setViewMode('list')}
          style={viewMode === 'list' ? activeTabStyle : inactiveTabStyle}>
          ＝ リストビュー
        </button>
      </div>

      {/* メイン表示エリア */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
        {viewMode === 'table' ? (
          /* --- テーブルビュー --- */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#666', textAlign: 'left', fontSize: '12px' }}>
                <th style={thStyle}>Aa 名前</th>
                <th style={thStyle}>⋮≡ Tag</th>
                <th style={thStyle}>🕒 作成日時</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={trStyle}>
                  <td style={tdStyle}>
                    <span style={{ marginRight: '10px' }}>📄</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#37352f', fontWeight: '500' }}>{doc.title}</a>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {doc.tags.map((tag, i) => <span key={i} style={tagBadgeStyle(tag)}>{tag}</span>)}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#666', fontSize: '12px' }}>{doc.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* --- リストビュー --- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDocs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '5px' }}>
                <span style={{ marginRight: '10px' }}>📄</span>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#37352f', flex: 1 }}>{doc.title}</a>
                <div style={{ display: 'flex', gap: '5px' }}>
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

// スタイル定義
const notionInputStyle = { border: '1px solid #ddd', padding: '10px', borderRadius: '4px', flex: 1, fontSize: '14px', backgroundColor: 'white' };
const thStyle = { padding: '10px', fontWeight: 'normal' };
const tdStyle = { padding: '10px', borderBottom: '1px solid #eee' };
const trStyle = { borderBottom: '1px solid #eee' };

const activeTabStyle = { border: 'none', background: 'none', borderBottom: '2px solid black', padding: '5px 10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const inactiveTabStyle = { border: 'none', background: 'none', color: '#666', padding: '5px 10px', cursor: 'pointer', fontSize: '14px' };

const tagBadgeStyle = (tag: string) => {
  const isWeb = tag.includes('Web');
  const isNet = tag.includes('ネットワーク');
  return {
    backgroundColor: isWeb ? '#d3e5ef' : isNet ? '#ffedeb' : '#eee',
    color: isWeb ? '#2383e2' : isNet ? '#eb5757' : '#37352f',
    padding: '2px 8px', borderRadius: '3px', fontSize: '12px', whiteSpace: 'nowrap' as any
  };
};