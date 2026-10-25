/* Suggests 3 quick response phrases based on the AI tutor's Japanese question.
 *
 * Each phrase has:
 * - jp: Japanese phrase (kana/simple kanji)
 * - id: Indonesian translation
 * - en: English translation
 *
 * Designed for beginner learners (JLPT N5) so they can answer promptly.
 * If the AI message does not ask a question, an empty array is returned.
 */

/**
 * Checks whether the given text is a Japanese question.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isJapaneseQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  const raw = text.trim();
  if (!raw) return false;

  // 1. Explicit question mark (? or ？) anywhere in the text
  if (/[?？]/.test(raw)) return true;

  // 2. Prompting the user to answer / share (おしえて / 教えて / きかせて / 聞かせて)
  if (/おしえて|教えて|きかせて|聞かせて/.test(raw)) return true;

  // Clean trailing punctuation / whitespace / emoji / decorative symbols
  const cleaned = raw.replace(/[\s!！。・…〜~♪★☆\p{Emoji}\p{Extended_Pictographic}]+$/u, '');

  // 3. Polite / casual question endings:
  // ですか, ますか, でしょうか, かい, かしら, だろうか, のか, のかな, んでしょうか
  if (/(?:ですか|ますか|でしょうか|かい|かしら|だろうか|のか|のかな|んでしょうか)$/.test(cleaned)) {
    return true;
  }

  // 4. Ending in question particle か
  if (/か$/.test(cleaned)) {
    return true;
  }

  // 5. Informal question ending (の, なの) with interrogative or inquiry context
  if (/(?:なの|の)$/.test(cleaned) && /(?:なに|何|どこ|だれ|誰|いつ|どう|なぜ|なんで|どうして|どの|どれ|知ってる|しってる|ある|いる|すき|好き)/.test(cleaned)) {
    return true;
  }

  // 6. Ending in interrogative words (どう, なに, どんな)
  if (/(?:どう|なに|何|どんな)$/.test(cleaned)) {
    return true;
  }

  // 7. Contains specific interrogative constructions
  if (/(?:なんですか|何ですか|どうですか|どうして|なぜ|なんさい|何歳|なんじ|何時)/.test(cleaned)) {
    return true;
  }

  return false;
}

export function getQuickRepliesForQuestion(questionJp) {
  const q = String(questionJp || '').trim();
  if (!q) return [];

  // If the AI message is not a question, return empty array as requested
  if (!isJapaneseQuestion(q)) {
    return [];
  }

  // 1. Food / Drink questions (Checked before general 'すき')
  // e.g. すきな たべものは なに〜？, なにを たべたの？
  if (
    q.includes('たべもの') ||
    q.includes('食べ物') ||
    q.includes('のみもの') ||
    q.includes('飲み物') ||
    q.includes('たべ') ||
    q.includes('食べ') ||
    q.includes('のみ') ||
    q.includes('飲み') ||
    q.includes('ごはん') ||
    q.includes('朝ごはん') ||
    q.includes('昼ごはん') ||
    q.includes('晩ごはん') ||
    q.includes('ラーメン') ||
    q.includes('すし')
  ) {
    return [
      { jp: 'ラーメンが すきです', id: 'Saya suka ramen', en: 'I like ramen' },
      { jp: 'すしを たべたいです', id: 'Saya ingin makan sushi', en: 'I want to eat sushi' },
      { jp: 'まだ たべていません', id: 'Belum makan nih', en: "I haven't eaten yet" },
    ];
  }

  // 2. Anime / Manga / Pop Culture (Checked before general 'しゅみ' / 'すき')
  // e.g. すきな アニメとか ある〜？
  if (
    q.includes('アニメ') ||
    q.includes('まんが') ||
    q.includes('マンガ') ||
    q.includes('漫画')
  ) {
    return [
      { jp: 'アニメが だいすきです！', id: 'Saya sangat suka anime!', en: 'I love anime!' },
      { jp: 'ナルトや ワンピースが すきです', id: 'Suka Naruto dan One Piece', en: 'I like Naruto and One Piece' },
      { jp: 'おすすめは ありますか？', id: 'Ada rekomendasi anime?', en: 'Do you have any recommendations?' },
    ];
  }

  // 3. Reason for studying Japanese (Checked before general 'べんきょう')
  // e.g. どうして にほんごを べんきょう してるの〜？
  if (
    /(?:どうして|なぜ|なんで).*(?:べんきょう|勉強|にほんご|日本語)/.test(q) ||
    /(?:べんきょう|勉強|にほんご|日本語).*(?:どうして|なぜ|なんで|りゆう|理由)/.test(q)
  ) {
    return [
      { jp: 'にほんへ いきたいからです', id: 'Karena ingin pergi ke Jepang', en: 'Because I want to go to Japan' },
      { jp: 'アニメを みるためです', id: 'Untuk menonton anime', en: 'To watch anime' },
      { jp: 'にほんの ぶんかが すきだからです', id: 'Karena suka budaya Jepang', en: 'Because I like Japanese culture' },
    ];
  }

  // 4. Name / Who questions: おなまえ, なまえ, だれ
  if (q.includes('なまえ') || q.includes('名前') || q.includes('だれ') || q.includes('誰')) {
    return [
      { jp: 'わたしは [なまえ] です', id: 'Nama saya [nama]', en: 'My name is [name]' },
      { jp: 'はじめまして！', id: 'Senang berkenalan denganmu!', en: 'Nice to meet you!' },
      { jp: 'よろしくおねがいします', id: 'Mohon bantuannya / Salam kenal', en: 'Pleased to meet you' },
    ];
  }

  // 5. Origin / Where questions: どこ, くに, 国, 出身, しゅっしん, どこから
  if (q.includes('どこ') || q.includes('出身') || q.includes('しゅっしん') || q.includes('国') || q.includes('くに')) {
    return [
      { jp: 'インドネシアからです', id: 'Dari Indonesia', en: 'From Indonesia' },
      { jp: 'インドネシア人です', id: 'Orang Indonesia', en: 'I am Indonesian' },
      { jp: 'ジャカルタに すんでいます', id: 'Tinggal di Jakarta', en: 'I live in Jakarta' },
    ];
  }

  // 6. Age questions: なんさい, 何歳, おいくつ
  if (q.includes('なんさい') || q.includes('何歳') || q.includes('おいくつ')) {
    return [
      { jp: 'はたちです', id: '20 tahun', en: 'I am 20 years old' },
      { jp: 'にじゅうごさいです', id: '25 tahun', en: 'I am 25 years old' },
      { jp: 'ひみつです', id: 'Rahasia', en: "It's a secret" },
    ];
  }

  // 7. Profession / Job / Occupation: しごと, 仕事, がくせい, 学生, なにをして
  if (q.includes('しごと') || q.includes('仕事') || q.includes('がくせい') || q.includes('学生') || q.includes('かいしゃいん')) {
    return [
      { jp: 'がくせいです', id: 'Saya seorang pelajar/mahasiswa', en: 'I am a student' },
      { jp: 'エンジニアです', id: 'Saya seorang engineer', en: 'I am an engineer' },
      { jp: 'かいしゃいんです', id: 'Saya pegawai kantor', en: 'I am an office worker' },
    ];
  }

  // 8. Mood / Feeling / Condition: きぶん, 気分, げんき, 元気, ちょうし, 調子
  // e.g. きょうの きぶんは どう〜？, おげんきですか？
  if (
    q.includes('きぶん') ||
    q.includes('気分') ||
    q.includes('げんき') ||
    q.includes('元気') ||
    q.includes('ちょうし') ||
    q.includes('調子')
  ) {
    return [
      { jp: 'はい、げんきいっぱいです！', id: 'Ya, sangat sehat/bersemangat!', en: 'Yes, full of energy!' },
      { jp: 'ちょっと つかれました', id: 'Sedikit lelah', en: 'A bit tired' },
      { jp: 'まあまあ ですよ', id: 'Lumayan / biasa saja', en: "I'm doing okay" },
    ];
  }

  // 9. Likes / Hobbies / Favorites: すき, 好き, しゅみ, 趣味
  if (q.includes('すき') || q.includes('好き') || q.includes('しゅみ') || q.includes('趣味')) {
    return [
      { jp: 'おんがくを きくことです', id: 'Mendengarkan musik', en: 'Listening to music' },
      { jp: 'ゲームを することです', id: 'Bermain game', en: 'Playing games' },
      { jp: 'りょこうが すきです', id: 'Suka jalan-jalan / travelling', en: 'I like travelling' },
    ];
  }

  // 10. Weather
  // e.g. てんきは どう？, あついですか？
  if (
    q.includes('てんき') ||
    q.includes('天気') ||
    q.includes('あめ') ||
    q.includes('雨') ||
    q.includes('あつい') ||
    q.includes('暑い') ||
    q.includes('さむい') ||
    q.includes('寒い')
  ) {
    return [
      { jp: 'とても いい てんきです', id: 'Cuacanya sangat bagus/cerah', en: 'The weather is very nice' },
      { jp: 'あめが ふっています', id: 'Sedang hujan', en: 'It is raining' },
      { jp: 'きょうは とても あついです', id: 'Hari ini sangat panas', en: "It's very hot today" },
    ];
  }

  // 11. Japanese study / Language: にほんご, 日本語, べんきょう, 勉強
  if (
    q.includes('にほんご') ||
    q.includes('日本語') ||
    q.includes('べんきょう') ||
    q.includes('勉強') ||
    q.includes('かんじ') ||
    q.includes('漢字')
  ) {
    return [
      { jp: 'とても たのしいです！', id: 'Sangat menyenangkan!', en: "It's very fun!" },
      { jp: 'すこし むずかしいです', id: 'Sedikit sulit', en: "It's a bit difficult" },
      { jp: 'まいにち れんしゅうしています', id: 'Berlatih setiap hari', en: 'I practice every day' },
    ];
  }

  // 12. When / Schedule / Time: いつ, なんじ, 何時, 何曜日, なんようび, 週末
  if (
    q.includes('いつ') ||
    q.includes('なんじ') ||
    q.includes('何時') ||
    q.includes('しゅうまつ') ||
    q.includes('週末') ||
    q.includes('やすみ') ||
    q.includes('休み')
  ) {
    return [
      { jp: 'うちで ゆっくりします', id: 'Santai di rumah', en: 'Relax at home' },
      { jp: 'あした します', id: 'Akan dilakukan besok', en: "I'll do it tomorrow" },
      { jp: 'まだ きめていません', id: 'Belum diputuskan', en: "Haven't decided yet" },
    ];
  }

  // 13. What are you doing / Activity
  // e.g. なにを してるの？
  if (/(?:なにを|何をして|なにして|何して)/.test(q)) {
    return [
      { jp: 'にほんごを べんきょうしています', id: 'Sedang belajar bahasa Jepang', en: 'Studying Japanese' },
      { jp: 'やすんでいますよ', id: 'Sedang santai/istirahat nih', en: "I'm resting" },
      { jp: 'しごとを しています', id: 'Sedang bekerja', en: "I'm working" },
    ];
  }

  // 14. Understanding / Confirmation
  // e.g. わかりましたか？, だいじょうぶ？, しっていますか？
  if (
    q.includes('わかりました') ||
    q.includes('分かった') ||
    q.includes('だいじょうぶ') ||
    q.includes('大丈夫') ||
    q.includes('しってい') ||
    q.includes('知ってい') ||
    q.includes('しってる') ||
    q.includes('知ってる')
  ) {
    return [
      { jp: 'はい、わかりました！', id: 'Ya, saya mengerti!', en: 'Yes, I understand!' },
      { jp: 'もうすこし おしえてください', id: 'Tolong jelaskan sedikit lagi', en: 'Please teach me a bit more' },
      { jp: 'ちょっと むずかしいです', id: 'Agak sulit nih', en: "It's a bit difficult" },
    ];
  }

  // 15. Condition / How is it: どう, どんな
  if (q.includes('どう') || q.includes('どんな')) {
    return [
      { jp: 'とても たのしいです', id: 'Sangat menyenangkan', en: "It's very fun" },
      { jp: 'おもしろいです', id: 'Menarik', en: "It's interesting" },
      { jp: 'すこし たいへんです', id: 'Agak sulit/berat', en: "It's a bit tough" },
    ];
  }

  // 16. Fallback for other questions (e.g. general yes/no questions)
  return [
    { jp: 'はい、そうです！', id: 'Ya, benar!', en: "Yes, that's right!" },
    { jp: 'いいえ、ちがいますよ', id: 'Tidak, bukan begitu', en: "No, that's not it" },
    { jp: 'うーん、どうでしょう？', id: 'Hmm, bagaimana ya?', en: 'Hmm, I wonder?' },
  ];
}
