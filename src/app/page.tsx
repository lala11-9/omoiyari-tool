'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル ---
const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const dropZoneStyle: React.CSSProperties = { border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', marginTop: '10px' };

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [inputMode, setInputMode] = useState<'書類' | 'ナレッジ'>('書類');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('非公開');
  const [newTagName, setNewTagName] = useState('');
  
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

  // --- ファイルアップロード処理 ---
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('files').getPublicUrl(filePath);
      setUrl(data.publicUrl); // URL入力欄に自動セット
      if (!title) setTitle(file.name); // タイトルが空ならファイル名を入れる
      alert('ファイルをアップロードしました！');
    } catch (error: any) {
      alert('アップロード失敗: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 削除処理 (エラー対策済み) ---
  const handleDelete = async (doc: any) => {
    if (!confirm('本当に削除しますか？')) return;
    
    // SupabaseのIDは大文字の「ID」か、小文字の「id」か確認
    const idKey = doc.id ? 'id' : 'ID';
    const { error } = await supabase.from('documents').delete().eq(idKey, doc[idKey]);

    if (error) {
      alert('削除失敗: ' + error.message);
    } else {
      alert('削除しました');
      fetchData();
    }
  };

  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは必須です');
    const modeTag = inputMode === '書類' ? 'type:doc' : 'type:knowledge';
    const { error } = await supabase.from('documents').insert([{
      title,
      tags: [selectedTag, modeTag, ...(inputMode === '書類' ? [visibility] : [])],
      url,
      memo
    }]);

    if (!error) {
      alert('保存しました！');
      setTitle(''); setUrl(''); setMemo(inputMode === 'ナレッジ' ? "【Q】\n\n【A】" : ""); fetchData();
    } else {
      alert('保存失敗: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setInputMode('書類'); setMemo(''); }} style={{ ...buttonStyle, backgroundColor: inputMode === '書類' ? '#2383e2' : '#f1f5f9', color: inputMode === '書類' ? 'white' : '#64748b', flex: 1 }}>📄 書類モード</button>
          <button onClick={() => { setInputMode('ナレッジ'); setMemo("【Q】\n\n【A】"); }} style={{ ...buttonStyle, backgroundColor: inputMode === 'ナレッジ' ? '#2383e2' : '#f1f5f9', color: inputMode === 'ナレッジ' ? 'white' : '#64748b', flex: 1 }}>💡 ナレッジモード</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            
            {/* ドラッグ＆ドロップ風エリア */}
            <div 
              style={dropZoneStyle}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {uploading ? 'アップロード中...' : '📎 PDF等をドロップ または クリックで追加'}
              <input id="fileInput" type="file" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>

            <input placeholder="URL (アップロードすると自動入力)" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginTop: '10px' }} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                <option value="">タグを選択</option>
                {customTags.filter(t => t.type === inputMode || !t.type).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <textarea placeholder="内容..." value={memo} onChange={e => setMemo(e.target.value)} style={{ ...inputStyle, height: '150px', resize: 'none' }} />
            <button onClick={handleSave} style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}>資産を保存</button>
          </div>
        </div>
      </section>

      {/* 一覧エリア（削除ボタン付き） */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['すべて', '書類', 'ナレッジ'].map((t: any) => (
              <button key={t} onClick={() => setDisplayTab(t)} style={{ padding: '8px 15px', cursor: 'pointer', border: 'none', borderBottom: displayTab === t ? '2px solid #2383e2' : 'none', background: 'none' }}>{t}</button>
            ))}
          </div>
          <input placeholder="🔍 検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {docs.filter(doc => {
            const isDoc = doc.tags?.includes('type:doc') || doc.url;
            if (displayTab === '書類' && !isDoc) return false;
            if (displayTab === 'ナレッジ' && isDoc) return false;
            return doc.title.includes(searchQuery) || doc.memo.includes(searchQuery);
          }).map(doc => (
            <div key={doc.id || doc.ID} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#2383e2' }}>{doc.tags?.[0]}</span>
                <button onClick={() => handleDelete(doc)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>削除</button>
              </div>
              <h3>{doc.url ? <a href={doc.url} target="_blank">{doc.title}</a> : doc.title}</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{doc.memo}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}