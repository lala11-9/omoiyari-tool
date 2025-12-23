'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル定義 ---
const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', cursor: 'pointer', borderBottom: active ? '3px solid #2383e2' : '3px solid transparent',
  color: active ? '#2383e2' : '#64748b', fontWeight: 'bold', transition: '0.2s', backgroundColor: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none'
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
  
  // 表示・検索用
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

  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const typePrefix = inputMode === '書類' ? '📄書類' : '💡ナレッジ';
    const finalTags = inputMode === '書類' ? [selectedTag, visibility] : [selectedTag];
    
    const { error } = await supabase.from('documents').insert([{
      title: `${typePrefix}: ${title}`,
      tags: finalTags,
      url: inputMode === '書類' ? url : '',
      memo: memo
    }]);

    if (!error) {
      alert('資産として保存しました！');
      setTitle(''); setUrl(''); setMemo(''); fetchData();
    } else {
      alert('保存エラー: ' + error.message);
    }
  };

  // タグ追加機能の修正
  const handleAddTag = async () => {
    if (!newTagName) return;
    
    // type列がない場合のエラーを避けるため、一旦nameのみで試行し、失敗したら詳細を出す
    const { error } = await supabase.from('custom_tags').insert([
      { name: newTagName, type: inputMode }
    ]);

    if (error) {
      console.error('Tag Error:', error);
      alert('タグ追加に失敗しました。Supabaseのcustom_tagsテーブルに「type」列があるか確認してください。\nエラー内容: ' + error.message);
    } else {
      setNewTagName('');
      await fetchData(); // 再読み込みしてセレクトボックスを更新
      alert(`「${newTagName}」を${inputMode}用タグとして追加しました`);
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesTab = 
      displayTab === 'すべて' || 
      (displayTab === '書類' && doc.title.startsWith('📄書類')) || 
      (displayTab === 'ナレッジ' && doc.title.startsWith('💡ナレッジ'));
    
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;
  if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>ログインが必要です</div>;

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* 1. 入力セクション */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold', color: '#1e293b' }}>✨ 資産登録</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setInputMode('書類'); setMemo(''); setSelectedTag(''); }} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => { setInputMode('ナレッジ'); setMemo("【Q】\n\n【A】"); setSelectedTag(''); }} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル（例：勤怠管理マニュアル）" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                <option value="">タグを選択</option>
                {customTags.filter(t => t.type === inputMode).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              {inputMode === '書類' && (
                <select value={visibility} onChange={e => setVisibility(e.target.value)} style={inputStyle}>
                  <option value="一般公開">🌍 一般</option>
                  <option value="限定公開">👥 限定</option>
                  <option value="非公開">🔒 非公開</option>
                </select>
              )}
            </div>
            {inputMode === '書類' && <input placeholder="URL (GoogleドライブやNotion等)" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginTop: '10px' }} />}
            
            {/* タグ追加エリア */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>🏷️ {inputMode}用タグを新規作成</p>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input placeholder="新しいタグ名" value={newTagName} onChange={e => setNewTagName(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }} />
                <button onClick={handleAddTag} style={{ ...buttonStyle, backgroundColor: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>追加</button>
              </div>
            </div>
          </div>

          <div>
            <textarea placeholder="内容の要約や補足事項..." value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '185px', resize: 'none' }} />
            <button onClick={handleSave} style={{ ...buttonStyle, width: '100%', marginTop: '10px', height: '45px', fontSize: '16px' }}>資産を保存する</button>
          </div>
        </div>
      </section>

      {/* 2. 表示・検索セクション */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flex: 1 }}>
            <button onClick={() => setDisplayTab('すべて')} style={tabStyle(displayTab === 'すべて')}>すべて ({docs.length})</button>
            <button onClick={() => setDisplayTab('書類')} style={tabStyle(displayTab === '書類')}>📄 書類</button>
            <button onClick={() => setDisplayTab('ナレッジ')} style={tabStyle(displayTab === 'ナレッジ')}>💡 ナレッジ</button>
          </div>
          <input 
            placeholder="🔍 検索..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ ...inputStyle, width: '250px' }} 
          />
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredDocs.length > 0 ? filteredDocs.map(doc => (
            <div key={doc.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {doc.tags?.map((t: string) => (
                    <span key={t} style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {t}{t === '非公開' && ' 🔒'}
                    </span>
                  ))}
                </div>
                <button onClick={async () => { if(confirm('このデータを削除しますか？')) { await supabase.from('documents').delete().eq('id', doc.id); fetchData(); } }} style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px' }}>削除</button>
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 10px 0', fontWeight: 'bold', color: '#1e293b' }}>
                {doc.url ? <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title.replace(/^.{4}: /, '')}</a> : doc.title.replace(/^.{4}: /, '')}
              </h3>
              <div style={{ fontSize: '14px', color: '#475569', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                {doc.memo}
              </div>
            </div>
          )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>表示する資産がありません</p>}
        </div>
      </section>
    </main>
  );
}