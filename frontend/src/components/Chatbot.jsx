import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLang } from '../context/LanguageContext';

const SUGGESTED_QUESTIONS = {
  en: [
    'What does my CKD result mean?',
    'What foods should I avoid for kidney health?',
    'What is normal Serum Creatinine & Blood Urea?',
    'How can I lower my CKD risk?',
    'Explain my top risk factors'
  ],
  hi: [
    'मेरे CKD रिजल्ट का क्या मतलब है?',
    'किडनी के लिए कौन से खाने से बचें?',
    'सामान्य क्रिएटिनिन और यूरिया कितना होता है?',
    'CKD का खतरा कैसे कम करें?',
    'मेरे मुख्य जोखिम कारक समझाएं'
  ]
};

function cleanText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^[-\s:]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function Chatbot({ patientContext }) {
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your Kidney Health AI. Ask me about CKD, your lab values, diet, or prediction report.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async (questionText) => {
    const userText = questionText.trim();
    if (!userText || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: userText,
        patientContext: patientContext || null,
        lang
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not reach AI assistant.';
      setMessages((prev) => [...prev, { role: 'assistant', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion(input);
  };

  const options = SUGGESTED_QUESTIONS[lang] || SUGGESTED_QUESTIONS.en;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 bg-white border border-gray-200 shadow-xl rounded-2xl w-80 sm:w-96 flex flex-col h-[500px] overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <span className="font-semibold block">Dr. AI Assistant</span>
              <span className="text-xs text-blue-100">
                {lang === 'hi' ? 'केवल CKD और किडनी स्वास्थ्य' : 'CKD & Kidney Health Only'}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm whitespace-pre-line ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'
                }`}>
                  {m.role === 'assistant' ? cleanText(m.text) : m.text}
                </div>
              </div>
            ))}

            {/* Quick question options */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">
                {lang === 'hi' ? 'आप यह पूछ सकते हैं:' : 'Suggested Questions:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => askQuestion(q)}
                    className="text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {loading && <div className="text-xs text-gray-500">Thinking...</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'hi' ? 'CKD या किडनी से जुड़ा सवाल पूछें...' : 'Ask about CKD, diet, or lab values...'}
              className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full disabled:bg-gray-300 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer ml-auto"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
