'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// スタイル定義
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', color: '#444' };
const deleteButtonStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '11px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string}[]>([]);
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログイン失敗: ' + error.message);
    else window.location.reload();
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName }]);
    if (error) alert('追加失敗'); else { setNewTagName(''); await fetchData(); }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`タグ「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from('custom_tags').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const handleSaveDoc = async () => {
    if (!title || !selectedTag) return alert('入力不足です');
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url, memo }]);
    if (!error) { setTitle(''); setUrl(''); setMemo(''); await fetchData(); alert('保存完了！'); }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const displayDocs = docs
    .filter(doc => filterTag === 'すべて' || (doc.tags && doc.tags.includes(filterTag)))
    .sort((a, b) => (sortOrder === 'newest' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

  // --- ログイン画面 (ここをしっかり復活させました) ---
  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>📁 書類集積所</h1>
          <input type="email" placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%' }}>ログイン</button>
        </form>
      </main>
    );
  }

  // --- メイン画面 ---
  return (
    <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>📁 書類集積所</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        <aside>
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '15px' }}>🏷️ タグ管理</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={inputStyle} />
              <button onClick={handleAddTag} style={buttonStyle}>＋</button>
            </div>
            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', backgroundColor: 'white' }}>
              {customTags.map(tag => (
                <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span>{tag.name}</span>
                  <button onClick={() => handleDeleteTag(tag.id, tag.name)} style={{ border: 'none', color: 'red', cursor: 'pointer', background: 'none' }}>[消す]</button>
                </div>
              ))}
            </div>
          </div>

          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '15px' }}>📄 書類登録</h3>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <textarea placeholder="メモ" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'none' }} />
            <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%' }}>保存</button>
          </div>
        </aside>

        <section>
          <div style={{ marginBottom: '20px' }}>
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '5px' }}>
              <option value="すべて">すべて表示</option>
              {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gap: '15px' }}>
            {displayDocs.map(doc => (
              <div key={doc.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={tagBadgeStyle}>{doc.tags?.[0]}</span>
                    <h2 style={{ fontSize: '18px', margin: '10px 0 5px' }}>
                      <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a>
                    </h2>
                    {doc.memo && <p style={{ fontSize: '14px', color: '#666', margin: '5px 0', whiteSpace: 'pre-wrap' }}>{doc.memo}</p>}
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