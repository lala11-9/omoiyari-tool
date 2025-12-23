'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase設定 ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- スタイル定義 ---
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px' };
const buttonStyle: React.CSSProperties = { backgroundColor: '#2383e2', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const stepButtonStyle: React.CSSProperties = { backgroundColor: 'white', color: '#334155', border: '2px solid #e2e8f0', padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s' };
const sideSectionStyle: React.CSSProperties = { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const tagBadgeStyle: React.CSSProperties = { backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#475569', fontWeight: '500' };

export default function Home() {
  // --- 状態管理 ---
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{id: string, name: string}[]>([]);
  
  // 3段階登録フロー用の状態
  const [step, setStep] = useState(1); // 1: 種類, 2: 公開範囲, 3: 詳細入力
  const [docType, setDocType] = useState<'書類' | 'ナレッジ' | 'ミニ'>('書類');
  const [visibility, setVisibility] = useState('非公開');

  // 入力フォーム用
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [filterTag, setFilterTag] = useState('すべて');

  // --- 初期データ取得 ---
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
    const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (docsData) setDocs(docsData);
    const { data: tagsData } = await supabase.from('custom_tags').select('id, name');
    if (tagsData) {
      setCustomTags(tagsData);
      if (tagsData.length > 0 && !selectedTag) setSelectedTag(tagsData[0].name);
    }
  };

  // --- ログイン処理 ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('ログイン失敗: ' + error.message);
    else window.location.reload();
  };

  // --- 保存処理 ---
  const handleSave = async () => {
    if (!title || !selectedTag) return alert('タイトルとタグは入力必須です');

    // 公開範囲をタグとして統合
    const finalTags = docType === '書類' ? [selectedTag, visibility] : [selectedTag];
    
    // 表示用のタイトル整形
    const displayTitle = docType === '書類' ? title : `【${docType}】${title}`;

    const { error } = await supabase.from('documents').insert([{
      title: displayTitle,
      tags: finalTags,
      url: docType === '書類' ? url : '',
      memo: memo,
      user_id: user.id
    }]);

    if (!error) {
      alert('ナレッジ資産として登録されました！');
      setTitle(''); setUrl(''); setMemo(''); setStep(1); // フォームリセット
      await fetchData();
    } else {
      alert('エラー: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>読み込み中...</div>;

  // --- ログイン画面 ---
  if (!user) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '350px' }}>
          <h1 style={{ marginBottom: '30px', fontSize: '24px', textAlign: 'center', fontWeight: '800' }}>📁 ナレッジ・ストッカー</h1>
          <input type="email" placeholder="ID (メールアドレス)" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={{ ...buttonStyle, width: '100%', marginTop: '10px', height: '45px' }}>ログイン</button>
        </form>
      </main>
    );
  }

  // --- メイン画面 ---
  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>📁 ナレッジ集積所</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white' }}>ログアウト</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '40px' }}>
        
        {/* 左側：登録パネル */}
        <aside>
          <div style={sideSectionStyle}>
            <h2 style={{ fontSize: '16px', marginBottom: '20px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ ナレッジの資産化
              <span style={{ fontSize: '12px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px' }}>Step {step}/3</span>
            </h2>

            {/* Step 1: 種類の選択 */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>登録する種類を選んでください</p>
                <button onClick={() => { setDocType('書類'); setStep(2); }} style={stepButtonStyle}>📄 書類 (URLを保存する)</button>
                <button onClick={() => { setDocType('ナレッジ'); setMemo("【Q】\n\n【A】"); setStep(3); }} style={stepButtonStyle}>💡 ガッツリ・ナレッジ (Q&A形式)</button>
                <button onClick={() => { setDocType('ミニ'); setMemo("【Q】\n\n【A】"); setStep(3); }} style={stepButtonStyle}>⚡ ミニナレッジ (簡潔にメモ)</button>
              </div>
            )}

            {/* Step 2: 公開範囲（書類のみ） */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>公開範囲の設定</p>
                <button onClick={() => { setVisibility('一般公開'); setStep(3); }} style={stepButtonStyle}>🌍 一般公開</button>
                <button onClick={() => { setVisibility('限定公開'); setStep(3); }} style={stepButtonStyle}>👥 限定公開</button>
                <button onClick={() => { setVisibility('非公開'); setStep(3); }} style={stepButtonStyle}>🔒 非公開 (自分のみ)</button>
                <button onClick={() => setStep(1)} style={{ fontSize: '13px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginTop: '10px' }}>← 種類を選び直す</button>
              </div>
            )}

            {/* Step 3: 詳細入力 */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', borderLeft: '4px solid #2383e2' }}>
                  <strong>作成中:</strong> {docType} {docType === '書類' && `[${visibility}]`}
                </div>
                
                <input placeholder="タイトル・見出し" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                
                <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={inputStyle}>
                  {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>

                {docType === '書類' && (
                  <input placeholder="URLをコピーして貼り付け" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
                )}

                <textarea 
                  placeholder="メモまたはQ&Aの内容" 
                  value={memo} 
                  onChange={e => setMemo(e.target.value)} 
                  style={{ ...inputStyle, height: '180px', resize: 'none', lineHeight: '1.6' }} 
                />
                
                <button onClick={handleSave} style={{ ...buttonStyle, height: '45px', marginTop: '10px' }}>ナレッジ資産を保存する</button>
                <button onClick={() => setStep(1)} style={{ fontSize: '13px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginTop: '15px' }}>× キャンセルして戻る</button>
              </div>
            )}
          </div>

          {/* タグ追加セクション */}
          <div style={sideSectionStyle}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>🏷️ 分野（タグ）を追加</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="例: React, SQL..." style={{ ...inputStyle, marginBottom: 0 }} />
              <button onClick={async () => {
                if(!newTagName) return;
                await supabase.from('custom_tags').insert([{ name: newTagName }]);
                setNewTagName(''); fetchData();
              }} style={buttonStyle}>追加</button>
            </div>
          </div>
        </aside>

        {/* 右側：資産一覧 */}
        <section>
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>絞り込み:</span>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <option value="すべて">すべての分野</option>
                {customTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>蓄積ナレッジ: <strong>{docs.length}</strong> 件</div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {docs.filter(d => filterTag === 'すべて' || d.tags?.includes(filterTag)).map(doc => (
              <div key={doc.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {doc.tags?.map((tag: string) => (
                    <span key={tag} style={tagBadgeStyle}>{tag}</span>
                  ))}
                </div>

                <h2 style={{ fontSize: '19px', fontWeight: '700', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" style={{ color: '#2383e2', textDecoration: 'none' }}>{doc.title}</a>
                  ) : (
                    <span>{doc.title}</span>
                  )}
                </h2>

                <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {doc.memo}
                </div>
                
                <div style={{ textAlign: 'right', marginTop: '15px' }}>
                  <button onClick={async () => {
                    if(confirm('このナレッジ資産を削除しますか？')) {
                      await supabase.from('documents').delete().eq('id', doc.id);
                      fetchData();
                    }
                  }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>削除</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}