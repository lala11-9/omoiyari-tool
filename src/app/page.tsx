'use client';

import { useState, useEffect } from 'react';

// あらかじめ定義するタグの選択肢
const PRESET_TAGS = ['Web攻撃', 'ネットワーク', '重要', '2024年度', '確定済み', '参考資料'];

interface Doc {
  id: number;
  title: string;
  tags: string[];
  url: string;
  memo: string;
  createdAt: string;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('すべて'); // 絞り込み用
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState(PRESET_TAGS[0]); // 登録時の選択タグ

  useEffect(() => {
    const saved = localStorage.getItem('team_home_final_v2');
    if (saved) setDocs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('team_home_final_v2', JSON.stringify(docs));
  }, [docs]);

  const handleSave = () => {
    if (!title) return;
    const newDoc: Doc = {
      id: Date.now(),
      title,
      tags: [selectedTag], // 選択されたタグを保存
      url,
      memo,
      createdAt: new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date()),
    };
    setDocs([newDoc, ...docs]);
    setTitle(''); setUrl(''); setMemo('');
  };

  // 全文検索 + タグ絞り込みのダブルロジック
  const filteredDocs = docs.filter(d => {
    const matchesQuery = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.memo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = 
      selectedFilterTag === 'すべて' || d.tags.includes(selectedFilterTag);

    return matchesQuery && matchesTag;
  });

  return (
    <main style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#37352f' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px' }}>💾 security knowledge</h1>

      {/* 登録フォーム（タグを選択式に変更） */}
      <div style={{ backgroundColor: '#f7f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #edece9', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="資料名" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={notionInputStyle}>
            {PRESET_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="一言メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...notionInputStyle, flex: 1 }} />
          <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 30px', cursor: 'pointer', fontWeight: '600' }}>追加</button>
        </div>
      </div>

      {/* 🔍 検索 & タグフィルター */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input 
          placeholder="🔍 文字で検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
        />
        <select 
          value={selectedFilterTag} 
          onChange={e => setSelectedFilterTag(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '14px' }}
        >
          <option value="すべて">🏷️ すべてのタグ</option>
          {PRESET_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {/* ビュー切り替え */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
        <button onClick={() => setViewMode('table')} style={viewMode === 'table' ? activeTabStyle : inactiveTabStyle}>田 テーブル</button>
        <button onClick={() => setViewMode('list')} style={viewMode === 'list' ? activeTabStyle : inactiveTabStyle}>＝ リスト</button>
      </div>

      {/* 表示エリア */}
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
                    <span style={tagBadgeStyle(doc.tags[0])}>{doc.tags[0]}</span>
                  </td>
                  <td style={tdStyle}>{doc.memo}</td>
                  <td style={{ ...tdStyle, color: '#666', fontSize: '12px' }}>{doc.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* リストビューの詳細は省略可（テーブルと同様のフィルタリングが適用されます） */
          <div style={{ marginTop: '10px' }}>
            {filteredDocs.map(doc => (
              <div key={doc.id} style={{ padding: '10px', borderBottom: '1px solid #f1f1f1' }}>
                <div style={{ fontWeight: '600' }}><a href={doc.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>📄 {doc.title}</a></div>
                <div style={{ fontSize: '13px', color: '#666' }}>{doc.memo}</div>
                <div style={{ marginTop: '5px' }}><span style={tagBadgeStyle(doc.tags[0])}>{doc.tags[0]}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// スタイル（変更なし）
const notionInputStyle = { border: '1px solid #ddd', padding: '10px', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' };
const thStyle = { padding: '12px 10px', fontWeight: 'normal' };
const tdStyle = { padding: '12px 10px' };
const linkStyle = { textDecoration: 'none', color: '#37352f' };
const activeTabStyle = { border: 'none', background: 'none', borderBottom: '2px solid black', padding: '5px', cursor: 'pointer', fontWeight: '600' };
const inactiveTabStyle = { border: 'none', background: 'none', color: '#666', padding: '5px', cursor: 'pointer' };
const tagBadgeStyle = (tag: string) => ({
  backgroundColor: tag === 'Web攻撃' ? '#d3e5ef' : tag === 'ネットワーク' ? '#ffedeb' : '#eee',
  color: tag === 'Web攻撃' ? '#2383e2' : tag === 'ネットワーク' ? '#eb5757' : '#37352f',
  padding: '2px 8px', borderRadius: '3px', fontSize: '12px'
});