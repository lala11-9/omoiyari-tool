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
  
  // 入力用
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PDF');
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('doc_hub_notion_v1');
    if (saved) setDocs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('doc_hub_notion_v1', JSON.stringify(docs));
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
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
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
    <main style={{ padding: '20px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
        💾 security knowledge
      </h1>

      {/* 入力フォーム（簡易版） */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#f7f6f3', padding: '15px', borderRadius: '8px' }}>
        <input placeholder="名前" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
        <input placeholder="タグ (カンマ区切り)" value={tagInput} onChange={e => setTagInput(e.target.value)} style={notionInputStyle} />
        <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>新規</button>
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <span style={{ fontWeight: 'bold', borderBottom: '2px solid black', cursor: 'pointer' }}>田 テーブルビュー</span>
        <span style={{ color: '#666', cursor: 'pointer' }}>＝ リストビュー</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #eee', color: '#666', textAlign: 'left' }}>
            <th style={thStyle}>Aa 名前</th>
            <th style={thStyle}>⋮≡ Tag</th>
            <th style={thStyle}>🕒 作成日時</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocs.map(doc => (
            <tr key={doc.id} style={{ borderBottom: '1px solid #eee', height: '40px' }} className="table-row">
              <td style={tdStyle}>
                <span style={{ marginRight: '8px' }}>📄</span>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{doc.title}</a>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {doc.tags.map((tag, i) => (
                    <span key={i} style={tagBadgeStyle(tag)}>{tag}</span>
                  ))}
                </div>
              </td>
              <td style={{ ...tdStyle, color: '#666' }}>{doc.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const notionInputStyle = { border: '1px solid #ddd', padding: '8px', borderRadius: '4px', flex: 1 };
const thStyle = { padding: '10px', fontWeight: 'normal', fontSize: '13px' };
const tdStyle = { padding: '10px' };

const tagBadgeStyle = (tag: string) => {
  // 特定のワードで色を変える
  const isWeb = tag.includes('Web');
  const isNet = tag.includes('ネットワーク');
  return {
    backgroundColor: isWeb ? '#d3e5ef' : isNet ? '#ffedeb' : '#eee',
    color: isWeb ? '#2383e2' : isNet ? '#eb5757' : '#333',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
  };
};