import { useState, useCallback, useRef } from 'react';

const MOCK_DELAY = 2800;

const QUESTIONS = [
  {
    id: 'location',
    step: 1,
    field: 'location',
    text: "First, I need your exact location. Where did you find this child? (e.g. 'Central Park Mall, near the food court')",
    placeholder: 'Enter the location...',
    type: 'text',
    icon: '📍',
  },
  {
    id: 'photo',
    step: 2,
    field: 'photoUrl',
    text: "Thank you. Now, if it's safe to do so, could you take or upload a photo of the child? This helps generate the rescue poster.",
    placeholder: null,
    type: 'photo',
    icon: '📷',
  },
  {
    id: 'description',
    step: 3,
    field: 'description',
    text: "You're doing great. Can you describe what the child is wearing? (e.g. 'blue t-shirt, jeans, white sneakers')",
    placeholder: "Clothing, colors, any distinctive features...",
    type: 'text',
    icon: '👕',
  },
  {
    id: 'childInfo',
    step: 4,
    field: 'childInfo',
    text: "Almost there. Has the child said their name, their parents' names, or any other words you could understand?",
    placeholder: "Any spoken words or names...",
    type: 'text',
    icon: '🧒',
  },
  {
    id: 'condition',
    step: 5,
    field: 'condition',
    text: "Last question. What is the child's physical condition right now? (e.g. calm, crying, injured, hungry)",
    placeholder: "Child's current condition...",
    type: 'text',
    icon: '❤️',
  },
];

function mockPoliceSearch(location) {
  const db = {
    default: { station: 'Local Police Department', phone: '100', address: 'Nearest station to your location' },
    'central park': { station: 'NYPD 20th Precinct', phone: '212-580-6411', address: '120 W 82nd St, New York, NY' },
    'mall': { station: 'Metro City Police', phone: '(555) 234-5678', address: 'City Center HQ' },
    'airport': { station: 'Airport Security & Police', phone: '(555) 911-0001', address: 'Terminal A, Ground Floor' },
  };
  const key = Object.keys(db).find(k => location.toLowerCase().includes(k));
  return db[key] || db.default;
}

function mockMissingKidsSearch(location) {
  return [
    {
      id: 'MK-001',
      name: 'Name Unknown',
      age: 'Approx 5-7 years',
      lastSeen: location || 'Your area',
      url: 'https://www.missingkids.org',
      source: 'missingkids.org',
    },
    {
      id: 'MK-002',
      name: 'Check local alerts',
      age: 'Various ages',
      lastSeen: 'Regional area',
      url: 'https://www.missingkids.org/gethelpnow/isyourchildmissing',
      source: 'NCMEC Database',
    },
  ];
}

export function useEmergencyProtocol() {
  const [phase, setPhase] = useState('splash'); // splash | chat | loading | dashboard
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [collectedData, setCollectedData] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const childIdRef = useRef(`LNM-${Math.floor(1000 + Math.random() * 9000)}`);

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, content, ...extra }]);
  }, []);

  const startChat = useCallback(() => {
    setPhase('chat');
    setMessages([]);
    setCurrentQuestion(0);
    setCollectedData({});

    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('ai', "Hello. I'm LostNoMore — I'm here to help reunite this child with their family. You're doing the right thing. Let's act fast together.\n\nIf you don't know the answer to any question, just tap **\"I Don't Know\"** — that's perfectly fine.");
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addMessage('ai', QUESTIONS[0].text, { questionId: QUESTIONS[0].id, step: 1 });
          }, 1200);
        }, 800);
      }, 1500);
    }, 400);
  }, [addMessage]);

  const submitAnswer = useCallback((value, isSkip = false) => {
    const q = QUESTIONS[currentQuestion];
    const displayValue = isSkip ? "I don't know" : value;
    const storedValue = isSkip ? '[NOT PROVIDED]' : value;

    addMessage('user', displayValue, { isPhoto: q.type === 'photo' && !isSkip, photoUrl: q.type === 'photo' ? value : null });
    setCollectedData(prev => ({ ...prev, [q.field]: storedValue }));

    const nextIdx = currentQuestion + 1;

    if (nextIdx >= QUESTIONS.length) {
      // All questions answered — run background tasks
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('ai', "You've done an incredible job. Thank you for helping this child. 🙏\n\nI'm now running background checks — finding the nearest police station, searching missing children databases, and building your rescue poster. This will take just a moment...");
        setTimeout(() => {
          setPhase('loading');
        }, 1800);
      }, 900);

      // After total mock wait, build dashboard
      setTimeout(() => {
        const loc = collectedData.location || value || 'Unknown Location';
        const police = mockPoliceSearch(loc);
        const matches = mockMissingKidsSearch(loc);
        const desc = collectedData.description || storedValue;
        setDashboardData({
          status: 'Ready',
          child_id: childIdRef.current,
          location: loc,
          police_contact: police,
          photo: q.field === 'photoUrl' ? value : collectedData.photoUrl,
          description: desc !== '[NOT PROVIDED]' ? desc : 'Description not provided',
          childInfo: collectedData.childInfo !== '[NOT PROVIDED]' ? collectedData.childInfo : null,
          condition: collectedData.condition !== '[NOT PROVIDED]' ? collectedData.condition : 'Not assessed',
          matches,
          poster: {
            headline: 'FOUND CHILD — URGENT',
            details: `Approx child found at ${loc}. ${desc !== '[NOT PROVIDED]' ? desc : ''} In need of assistance.`,
          },
          next_steps: [
            `Call ${police.station} immediately at ${police.phone}.`,
            'Stay in a well-lit, public area with the child.',
            'Alert nearby security staff or store employees.',
            'Share the generated poster on local WhatsApp and Facebook groups.',
            'Do NOT leave the child alone under any circumstances.',
          ],
        });
        setPhase('dashboard');
      }, MOCK_DELAY + 2700);
    } else {
      setCurrentQuestion(nextIdx);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('ai', QUESTIONS[nextIdx].text, { questionId: QUESTIONS[nextIdx].id, step: nextIdx + 1 });
      }, 1000);
    }
  }, [currentQuestion, collectedData, addMessage]);

  const reset = useCallback(() => {
    setPhase('splash');
    setMessages([]);
    setCurrentQuestion(0);
    setCollectedData({});
    setDashboardData(null);
    setIsTyping(false);
    childIdRef.current = `LNM-${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  return {
    phase,
    messages,
    currentQuestion,
    questions: QUESTIONS,
    isTyping,
    dashboardData,
    startChat,
    submitAnswer,
    reset,
  };
}
