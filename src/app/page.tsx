'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 資料管理用のステート ---
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState(''); // タグ追加用

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchData();
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    // 書類一覧の取得
    const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (docsData) setDocs(docsData);

    // タグ一覧の取得
    const { data: tagsData } = await supabase.from('custom_tags').select('name');
    if (tagsData) {
      const names = tagsData.map(t => t.name);
      setCustomTags(names);
      if (names.length > 0 && !selectedTag) setSelectedTag(names[0]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログイン失敗: ' + error.message);
    else window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- タグの追加機能 ---
  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName }]);
    if (error) {
      alert('タグの追加に失敗しました');
    } else {
      setNewTagName('');
      fetchData();
    }
  };

  // --- 書類の保存機能 ---
  const handleSaveDoc = async () => {
    if (!title || !selectedTag) {
      alert('書類名とタグを入力してください');
      return;
    }
    const { error } = await supabase.from('documents').insert([{ title, tags: [selectedTag], url }]);
    if (!error) {
      setTitle(''); setUrl('');
      fetchData();
      alert('保存しました！');
    } else {
      alert('保存に失敗しました');
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>読み込み中...</div>;

  if (!user) {
    return (
      <main style={centerFlexStyle}>
        <form onSubmit={handleLogin} style={loginCardStyle}>
          <h1 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>📁 書類集積所 ログイン</h1>
          <input type="email" placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>ログイン</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px' }}>📁 書類集積所</h1>
        <button onClick={handleLogout} style={secondaryButtonStyle}>ログアウト</button>
      </div>

      {/* タグ管理エリア */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>🏷️ タグを追加</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="新しいタグ名 (例: マニュアル)" value={newTagName} onChange={e => setNewTagName(e.target.value)} style={inputStyle} />
          <button onClick={handleAddTag} style={buttonStyle}>追加</button>
        </div>
      </section>

      {/* 書類登録エリア */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📄 書類を登録</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="書類名" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
            <option value="">タグを選択</option>
            {customTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={handleSaveDoc} style={{ ...buttonStyle, width: '100%' }}>書類をDBに保存</button>
      </section>

      {/* 書類リスト */}
      <section>
        <h2 style={sectionTitleStyle}>📚 登録済み書類</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={thStyle}>書類名</th>
              <th style={thStyle}>タグ</th>
              <th style={thStyle}>リンク</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{doc.title}</td>
                <td style={tdStyle}><span style={tagBadgeStyle}>{doc.tags?.[0]}</span></td>
                <td style={tdStyle}><a href={doc.url} target="_blank" style={{ color: '#2383e2' }}>開く</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

// --- スタイル定義 ---
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' as any };
const buttonStyle = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as any };
const secondaryButtonStyle = { padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white' };
const sectionStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' };
const sectionTitleStyle = { fontSize: '16px', marginBottom: '15px', color: '#555' };
const thStyle = { padding: '12px', color: '#666' };
const tdStyle = { padding: '12px' };
const tagBadgeStyle = { backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' };
const centerFlexStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' };
const loginCardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' };