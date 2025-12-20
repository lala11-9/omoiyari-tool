'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Vercelに設定した環境変数を読み込んでSupabaseと接続
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Doc {
  id: number;
  title: string;
  tags: string[];
  url: string;
  memo: string;
  created_at: string;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('すべて');
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // --- データベースからデータを取ってくる関数 ---
  const fetchData = async () => {
    // 1. 資料データを取得
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (docsData) setDocs(docsData);
    if (docsError) console.error('資料取得エラー:', docsError);

    // 2. タグ一覧を取得
    const { data: tagsData, error: tagsError } = await supabase
      .from('custom_tags')
      .select('name');
    
    if (tagsData) {
      const tagNames = tagsData.map(t => t.name);
      setCustomTags(tagNames);
      // 最初の一つを選択状態にする
      if (tagNames.length > 0 && !selectedTag) {
        setSelectedTag(tagNames[0]);
      }
    }
    if (tagsError) console.error('タグ取得エラー:', tagsError);
  };

  // 画面が開いたときに一度だけ実行
  useEffect(() => {
    fetchData();
  }, []);

  // --- 新しい資料をDBに保存する ---
  const handleSave = async () => {
    if (!title) return;
    const { error } = await supabase.from('documents').insert([
      { 
        title, 
        tags: [selectedTag], 
        url, 
        memo 
      }
    ]);

    if (!error) {
      setTitle(''); setUrl(''); setMemo('');
      fetchData(); // 画面を更新
      alert('データベースに保存しました！');
    } else {
      alert('保存に失敗しました。SQLの設定を確認してください。');
      console.error(error);
    }
  };

  // --- 新しいタグをDBに追加する ---
  const addTag = async () => {
    if (!newTagName || customTags.includes(newTagName)) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName }]);
    if (!error) {
      setNewTagName('');
      fetchData();
    }
  };

  // --- タグをDBから削除する ---
  const deleteTag = async (tagName: string) => {
    if (!confirm(`タグ「${tagName}」を削除しますか？`)) return;
    const { error } = await supabase.from('custom_tags').delete().eq('name', tagName);
    if (!error) fetchData();
  };

  // 検索とフィルタリングの処理
  const filteredDocs = docs.filter(d => {
    const matchesQuery = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (d.memo && d.memo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedFilterTag === 'すべて' || d.tags.includes(selectedFilterTag);
    return matchesQuery && matchesTag;
  });

  return (
    <main style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#37352f' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px' }}>💾 security knowledge</h1>

      {/* タグ管理セクション */}
      <details style={{ marginBottom: '20px', backgroundColor: '#fdfcfb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#666' }}>⚙️ タグ管理（DB同期中）</summary>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {customTags.map(tag => (
            <span key={tag} style={tagBadgeStyle(tag)}>
              {tag} <button onClick={() => deleteTag(tag)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff4d4f', marginLeft: '5px' }}>×</button>
            </span>
          ))}
          <input 
            value={newTagName} 
            onChange={e => setNewTagName(e.target.value)} 
            placeholder="新しいタグ名" 
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }} 
          />
          <button onClick={addTag} style={{ padding: '5px 15px', cursor: 'pointer' }}>追加</button>
        </div>
      </details>

      {/* 登録フォーム */}
      <div style={{ backgroundColor: '#f7f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #edece9', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="資料名" value={title} onChange={e => setTitle(e.target.value)} style={notionInputStyle} />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={notionInputStyle}>
            {customTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={notionInputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="一言メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...notionInputStyle, flex: 1 }} />
          <button onClick={handleSave} style={{ backgroundColor: '#2383e2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 30px', cursor: 'pointer', fontWeight: '600' }}>☁️ DBに保存</button>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input 
          placeholder="🔍 全文検索..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }} 
        />
        <select 
          value={selectedFilterTag} 
          onChange={e => setSelectedFilterTag(e.target.value)} 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          <option value="すべて">🏷️ すべてのタグ</option>
          {customTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {/* テーブル表示 */}
      <div style={{ borderTop: '1px solid #eee' }}>
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
                <td style={tdStyle}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#37352f', fontWeight: '500' }}>
                    📄 {doc.title}
                  </a>
                </td>
                <td style={tdStyle}>
                  <span style={tagBadgeStyle(doc.tags[0])}>{doc.tags[0]}</span>
                </td>
                <td style={tdStyle}>{doc.memo}</td>
                <td style={{ ...tdStyle, color: '#666', fontSize: '12px' }}>
                  {new Date(doc.created_at).toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// スタイル定義
const notionInputStyle = { border: '1px solid #ddd', padding: '10px', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' };
const thStyle = { padding: '12px 10px', fontWeight: 'normal' };
const tdStyle = { padding: '12px 10px' };
const tagBadgeStyle = (tag: string) => ({
  backgroundColor: tag === 'Web攻撃' ? '#d3e5ef' : tag === 'ネットワーク' ? '#ffedeb' : '#eee',
  color: tag === 'Web攻撃' ? '#2383e2' : tag === 'ネットワーク' ? '#eb5757' : '#37352f',
  padding: '2px 8px', borderRadius: '3px', fontSize: '12px', whiteSpace: 'nowrap' as any
});