'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', color: '#444' };
const deleteButtonStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '11px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string}[]>([]);
  
  // フォーム用
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState(''); // メモ欄追加
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const [filterTag, setFilterTag] = useState('すべて');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchData();
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    const { data: docsData } = await supabase.from('documents').select('*');
    if (docsData) setDocs(docsData);

    const { data: tagsData } = await supabase.from('custom_tags').select('id, name');
    if (tagsData) {
      setCustomTags(tagsData);
      if (tagsData.length > 0 && !selectedTag) setSelectedTag(tagsData[0].name);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName }]);
    if (error) alert('追加に失敗しました。');
    else { setNewTagName(''); await fetchData(); }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`タグ「${name}」を完全に消去しますか？`)) return;
    const { error } = await supabase.from('custom_tags').delete().eq('id', id);
    if (error) alert('削除できませんでした。権限設定を確認してください。');
    else await fetchData();
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url, memo }]);
    if (!error) { setTitle(''); setUrl(''); setMemo(''); await fetchData(); alert('保存完了！'); }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('この書類を削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const displayDocs = docs
    .filter(doc => filterTag === 'すべて' || (doc.tags && doc.tags.includes(filterTag)))
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;
  if (!user) return <div style={{ padding: '50px' }}>ログインしてください</div>; // 簡易版

  return (
    <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>📁 書類集積所</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        <aside>
          {/* タグ管理 */}
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '15px' }}>🏷️ タグ管理</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={inputStyle} />
              <button onClick={handleAddTag} style={buttonStyle}>＋</button>
            </div>
            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee', padding: '5px' }}>
              {customTags.map(tag => (
                <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span>{tag.name}</span>
                  <button onClick={() => handleDeleteTag(tag.id, tag.name)} style={{ border: 'none', color: 'red', cursor: 'pointer', background: 'none' }}>[消す]</button>
                </div>
              ))}
            </div>
          </div>

          {/* 書類登録 */}
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '15px' }}>📄 書類登録</h3>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <textarea placeholder="メモ（内容の要約など）" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'none' }} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%' }}>保存</button>
          </div>
        </aside>

        <section>
          {/* リスト表示 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '5px' }}>
              <option value="すべて">すべて表示</option>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {displayDocs.map(doc => (
              <div key={doc.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={tagBadgeStyle}>{doc.tags?.[0]}</span>
                    <h2 style={{ fontSize: '18px', margin: '10px 0 5px' }}>
                      <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a>
                    </h2>
                    {doc.memo && <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>{doc.memo}</p>}
                  </div>
                  <button onClick={() => handleDeleteDoc(doc.id)} style={deleteButtonStyle}>削除</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}