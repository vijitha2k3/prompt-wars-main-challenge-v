import { useState, useCallback, useRef } from 'react';
import { 
  validateLocation, 
  uploadPhotoToGCS, 
  analyzePhotoWithGemini, 
  findNearestPoliceStation, 
  searchMissingKidsDatabase,
  saveCaseToFirestore
} from '../services/google';

const MOCK_DELAY = 1500;

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

export function useEmergencyProtocol(currentUser) {
  const [phase, setPhase] = useState('splash'); // splash | chat | loading | dashboard
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [collectedData, setCollectedData] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const childIdRef = useRef(`LNM-${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0')}`);

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
          }, 1000);
        }, 600);
      }, 1200);
    }, 300);
  }, [addMessage]);

  const submitAnswer = useCallback(async (value, isSkip = false) => {
    const q = QUESTIONS[currentQuestion];
    const displayValue = isSkip ? "I don't know" : value;
    const storedValue = isSkip ? '[NOT PROVIDED]' : value;

    // Log the answer
    addMessage('user', displayValue, { isPhoto: q.type === 'photo' && !isSkip, photoUrl: q.type === 'photo' ? value : null });
    
    // Create new data snapshot
    const newData = { ...collectedData, [q.field]: storedValue };
    setCollectedData(newData);

    const nextIdx = currentQuestion + 1;

    if (nextIdx >= QUESTIONS.length) {
      setPhase('loading');
      
      try {
        const loc = newData.location || 'Unknown Area';
        
        // Execute Google Services in sequence for high reliability
        const mapsResult = await validateLocation(loc);
        const policeResult = await findNearestPoliceStation(loc);
        const matchResult = await searchMissingKidsDatabase(loc);
        
        let gcsResult = null;
        let geminiResult = null;

        // If a photo was provided (as a data URL from ChatIntake)
        if (newData.photoUrl && newData.photoUrl !== '[NOT PROVIDED]') {
          // Convert dataURL to Blob for upload
          const res = await fetch(newData.photoUrl);
          const blob = await res.blob();
          gcsResult = await uploadPhotoToGCS(blob, childIdRef.current, currentUser.uid);
          geminiResult = await analyzePhotoWithGemini(gcsResult.signedUrl);
        }

        const manifest = {
          child_id: childIdRef.current,
          location: mapsResult.formattedAddress,
          police_contact: policeResult,
          photo: gcsResult?.signedUrl || null,
          description: newData.description,
          childInfo: newData.childInfo,
          condition: newData.condition,
          matches: matchResult.results,
          poster: {
            headline: 'FOUND CHILD — URGENT',
            details: `Approx child found at ${mapsResult.formattedAddress}. ${newData.description}`
          },
          next_steps: [
            `Call ${policeResult.station} immediately at ${policeResult.phone}.`,
            'Stay in a well-lit, public area with the child.',
            'Keep child safe and calm while waiting for official law enforcement.',
            `Location for found-report: ${policeResult.address}`
          ],
          generated_at: new Date().toISOString()
        };

        setDashboardData(manifest);
        
        // Secure Persistence - Save to Firestore
        if (currentUser) {
          await saveCaseToFirestore(currentUser.uid, manifest);
        }

        setTimeout(() => setPhase('dashboard'), 2000);

      } catch (err) {
        console.error('Finalizing case error:', err);
        addMessage('ai', "I encountered a problem securing the records, but I've kept a local copy for you. Please proceed nonetheless.");
        setPhase('dashboard'); // Fallback to local dashboard
      }

    } else {
      setCurrentQuestion(nextIdx);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('ai', QUESTIONS[nextIdx].text, { questionId: QUESTIONS[nextIdx].id, step: nextIdx + 1 });
      }, 900);
    }
  }, [currentQuestion, collectedData, addMessage, currentUser]);

  const reset = useCallback(() => {
    setPhase('splash');
    setMessages([]);
    setCurrentQuestion(0);
    setCollectedData({});
    setDashboardData(null);
    setIsTyping(false);
    childIdRef.current = `LNM-${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0')}`;
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
