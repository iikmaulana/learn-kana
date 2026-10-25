/* Suggests 3 quick response phrases based on the AI tutor's Japanese question.
 *
 * Each phrase has:
 * - jp: Japanese phrase (kana/simple kanji)
 * - id: Indonesian translation
 * - en: English translation
 *
 * Designed for beginner learners (JLPT N5) so they can answer promptly.
 */

export function getQuickRepliesForQuestion(questionJp) {
  const q = String(questionJp || '').trim();

  // 1. Name questions: おなまえ, なまえ, だれ
  if (q.includes('なまえ') || q.includes('名前') || q.includes('だれ') || q.includes('誰')) {
    return [
      { jp: 'わたしは [なまえ] です', id: 'Nama saya [nama]', en: 'My name is [name]' },
      { jp: 'はじめまして！', id: 'Senang berkenalan denganmu!', en: 'Nice to meet you!' },
      { jp: 'よろしくおねがいします', id: 'Mohon bantuannya / Salam kenal', en: 'Pleased to meet you' },
    ];
  }

  // 2. Origin / Where questions: どこ, くに, 国, 出身, しゅっしん, どこから
  if (q.includes('どこ') || q.includes('出身') || q.includes('しゅっしん') || q.includes('国') || q.includes('くに')) {
    return [
      { jp: 'インドネシアからです', id: 'Dari Indonesia', en: 'From Indonesia' },
      { jp: 'インドネシア人です', id: 'Orang Indonesia', en: 'I am Indonesian' },
      { jp: 'ジャカルタに すんでいます', id: 'Tinggal di Jakarta', en: 'I live in Jakarta' },
    ];
  }

  // 3. Likes / Hobbies / Favorites: すき, 好き, しゅみ, 趣味
  if (q.includes('すき') || q.includes('好き') || q.includes('しゅみ') || q.includes('趣味')) {
    return [
      { jp: 'アニメが すきです', id: 'Suka anime', en: 'I like anime' },
      { jp: 'にほんごの べんきょうです', id: 'Belajar bahasa Jepang', en: 'Studying Japanese' },
      { jp: 'おんがくを きくことです', id: 'Mendengarkan musik', en: 'Listening to music' },
    ];
  }

  // 4. Age questions: なんさい, 何歳, おいくつ
  if (q.includes('なんさい') || q.includes('何歳') || q.includes('おいくつ')) {
    return [
      { jp: 'はたちです', id: '20 tahun', en: 'I am 20 years old' },
      { jp: 'にじゅうごさいです', id: '25 tahun', en: 'I am 25 years old' },
      { jp: 'ひみつです', id: 'Rahasia', en: "It's a secret" },
    ];
  }

  // 5. Profession / Job / Occupation: しごと, 仕事, がくせい, 学生, なにをして
  if (q.includes('しごと') || q.includes('仕事') || q.includes('がくせい') || q.includes('学生') || q.includes('かいしゃいん')) {
    return [
      { jp: 'がくせいです', id: 'Saya seorang pelajar/mahasiswa', en: 'I am a student' },
      { jp: 'エンジニアです', id: 'Saya seorang engineer', en: 'I am an engineer' },
      { jp: 'かいしゃいんです', id: 'Saya pegawai kantor', en: 'I am an office worker' },
    ];
  }

  // 6. Food / Drink / Eating / Drinking: なにを たべ, たべもの, 食べ, のみもの, 飲み
  if (q.includes('たべ') || q.includes('食べ') || q.includes('のみ') || q.includes('飲み')) {
    return [
      { jp: 'ラーメンが すきです', id: 'Saya suka ramen', en: 'I like ramen' },
      { jp: 'すしを たべました', id: 'Saya makan sushi', en: 'I ate sushi' },
      { jp: 'おちゃを のみます', id: 'Saya minum teh', en: 'I drink tea' },
    ];
  }

  // 7. Japanese study / Language: にほんご, 日本語, べんきょう, 勉強
  if (q.includes('にほんご') || q.includes('日本語') || q.includes('べんきょう') || q.includes('勉強')) {
    return [
      { jp: 'まいにち べんきょうしています', id: 'Belajar setiap hari', en: 'I study every day' },
      { jp: 'すこし むずかしいです', id: 'Sedikit sulit', en: "It's a bit difficult" },
      { jp: 'とても たのしいです', id: 'Sangat menyenangkan', en: "It's very fun" },
    ];
  }

  // 8. Condition / How is it: どう, どんな, げんき, 元気, いかが
  if (q.includes('げんき') || q.includes('元気')) {
    return [
      { jp: 'はい、げんきです！', id: 'Ya, sehat/baik-baik saja!', en: 'Yes, I am fine!' },
      { jp: 'まあまあです', id: 'Biasa saja / lumayan', en: 'So-so' },
      { jp: 'おちつかないです', id: 'Sedikit lelah', en: 'A bit tired' },
    ];
  }

  if (q.includes('どう') || q.includes('どんな')) {
    return [
      { jp: 'とても たのしいです', id: 'Sangat menyenangkan', en: "It's very fun" },
      { jp: 'おもしろいです', id: 'Menarik', en: "It's interesting" },
      { jp: 'すこし たいへんです', id: 'Agak sulit/berat', en: "It's a bit tough" },
    ];
  }

  // 9. When / Time: いつ, なんじ, 何時, 何曜日, なんようび
  if (q.includes('いつ') || q.includes('なんじ') || q.includes('何時')) {
    return [
      { jp: 'きょうです', id: 'Hari ini', en: 'Today' },
      { jp: 'あしたです', id: 'Besok', en: 'Tomorrow' },
      { jp: 'しゅうまつです', id: 'Akhir pekan', en: 'This weekend' },
    ];
  }

  // 10. Yes/No questions (ends with ですか, ますか, か？, か)
  if (/[ですか|ますか|か][？?]?$/.test(q) || q.includes('ですか') || q.includes('ますか')) {
    return [
      { jp: 'はい、そうです', id: 'Ya, benar', en: "Yes, that's right" },
      { jp: 'いいえ、ちがいます', id: 'Tidak, bukan', en: "No, that's not right" },
      { jp: 'ちょっと わかりません', id: 'Agak kurang tahu/paham', en: "I don't really know" },
    ];
  }

  // General fallback: 3 polite and versatile conversational responses
  return [
    { jp: 'はい、わかりました', id: 'Ya, saya mengerti', en: 'Yes, I understand' },
    { jp: 'もういちど おねがいします', id: 'Tolong sekali lagi', en: 'Once more, please' },
    { jp: 'ありがとうございます', id: 'Terima kasih banyak', en: 'Thank you very much' },
  ];
}
