'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', cursor: 'pointer', borderBottom: active ? '3px solid #2383e2' : '3px solid transparent',
  color: active ? '#2383e2' : '#64748b', fontWeight: 'bold', transition: '0.2s', backgroundColor: 'transparent', border: 'none'
});

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  
  // 入力用
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('非公開');
  const [newTagName, setNewTagName] = useState('');
  
  // 表示用
  const [displayTab, setDisplayTab] = useState<'すべて' | '書類' | 'ナレッジ'>('すべて');
  const [searchQuery, setSearchQuery] = useState('');

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
    const { data: d } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (d) setDocs(d);
    const { data: t } = await supabase.from('custom_tags').select('*').order('name');
    if (t) setCustomTags(t);
  };

  // モード切り替え時にテンプレートをセット
  const toggleMode = (mode: '書類' | 'ナレッジ') => {
    setInputMode(mode);
    if (mode === 'ナレッジ') {
      setMemo("【Q】\n\n【A】");
    } else {
      setMemo("");
    }
  };

  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    
    // 判定用に隠しタグを入れる（より確実な仕分けのため）
    const modeTag = inputMode === '書類' ? 'type:doc' : 'type:knowledge';
    const finalTags = [selectedTag, modeTag];
    if (inputMode === '書類') finalTags.push(visibility);

    const { error } = await supabase.from('documents').insert([{
      title: title,
      tags: finalTags,
      url: url, // ナレッジモードでもURLがあれば保存
      memo: memo
    }]);

    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(inputMode === 'ナレッジ' ? "【Q】\n\n【A】" : ""); setSelectedTag(''); fetchData();
    } else {
      alert('保存エラー: ' + error.message);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    const { error } = await supabase.from('custom_tags').insert([{ name: newTagName, type: inputMode }]);
    if (error) alert('タグ追加失敗: ' + error.message);
    else { setNewTagName(''); fetchData(); alert('タグを追加しました'); }
  };

  // --- フィルタリングロジック ---
  const filteredDocs = docs.filter(doc => {
    const isDocType = doc.tags?.includes('type:doc') || (doc.url && !doc.tags?.includes('type:knowledge'));
    const isKnowledgeType = doc.tags?.includes('type:knowledge') || (!doc.url && !doc.tags?.includes('type:doc'));

    let matchesTab = true;
    if (displayTab === '書類') matchesTab = isDocType;
    if (displayTab === 'ナレッジ') matchesTab = isKnowledgeType;

    const matchesSearch = 
      (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.memo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;
  if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>ログインが必要です</div>;

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* 入力エリア */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => toggleMode('書類')} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => toggleMode('ナレッジ')} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder={inputMode === '書類' ? "書類のタイトル" : "ナレッジ・疑問のタイトル"} value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                <option value="">タグを選択</option>
                {customTags.filter(t => t.type === inputMode || !t.type).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              {inputMode === '書類' && (
                <select value={visibility} onChange={e => setVisibility(e.target.value)} style={inputStyle}>
                  <option value="一般公開">🌍 一般</option>
                  <option value="限定公開">👥 限定</option>
                  <option value="非公開">🔒 非公開</option>
                </select>
              )}
            </div>
            {/* ナレッジモードでもURLを貼れるように！ */}
            <input placeholder={inputMode === '書類' ? "ファイルURLを貼り付け" : "参考リンクURL（任意）"} value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginTop: '10px' }} />
            
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>🏷️ {inputMode}タグ追加</p>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新タグ" style={{ ...inputStyle, backgroundColor: 'white' }} />
                <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b', fontSize: '12px' }}>追加</button>
              </div>
            </div>
          </div>
          <div>
            <textarea placeholder="内容を入力" value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '185px', resize: 'none' }} />
            <button onClick={handleSave} style={{ ...buttonStyle, width: '100%', marginTop: '10px', height: '40px' }}>保存する</button>
          </div>
        </div>
      </section>

      {/* 表示エリア */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex' }}>
            <button onClick={() => setDisplayTab('すべて')} style={tabStyle(displayTab === 'すべて')}>すべて</button>
            <button onClick={() => setDisplayTab('書類')} style={tabStyle(displayTab === '書類')}>📄 書類</button>
            <button onClick={() => setDisplayTab('ナレッジ')} style={tabStyle(displayTab === 'ナレッジ')}>💡 ナレッジ</button>
          </div>
          <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredDocs.map(doc => {
            const isDoc = doc.tags?.includes('type:doc');
            return (
              <div key={doc.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    {doc.tags?.filter((t:string) => !t.startsWith('type:')).map((t: string) => (
                      <span key={t} style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{t}</span>
                    ))}
                  </div>
                  <button onClick={async () => { if(confirm('削除しますか？')) { await supabase.from('documents').delete().eq('id', doc.id); fetchData(); } }} style={{ border: 'none', background: 'none', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}>削除</button>
                </div>
                <h3 style={{ fontSize: '17px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>
                      {isDoc ? '📄' : '💡'} {doc.title}
                    </a>
                  ) : (
                    <>{isDoc ? '📄' : '💡'} {doc.title}</>
                  )}
                </h3>
                <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>{doc.memo}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}