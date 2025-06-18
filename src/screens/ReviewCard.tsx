import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FaVolumeUp, FaSyncAlt, FaArrowLeft, FaPlus } from 'react-icons/fa';

const placeholderCard = {
  english: 'compromise',
  vietnamese: 'thỏa hiệp',
  example: 'We argued for a long time but finally arrived at a compromise.',
  definition:
    'a settlement of differences in which each side gives up something it has previously demanded',
  phonetic: '/ˈkɒm.prə.maɪz/',
  partOfSpeech: 'noun, verb',
};

function speak(text: string) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

export default function ReviewCard() {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const card = placeholderCard;
  const [status, setStatus] = useState<'to-learn' | 'known' | 'learned'>(
    'to-learn'
  );
  const [nextReview, setNextReview] = useState('in 10 min'); // Placeholder

  const handleFlip = () => setFlipped((f) => !f);
  const handleCorrect = () => {
    setStatus('known');
    setNextReview('in 1 day');
    // TODO: Update spaced repetition logic and load next card
    setFlipped(false);
  };
  const handleIncorrect = () => {
    setStatus('to-learn');
    setNextReview('in 10 min');
    // TODO: Update spaced repetition logic and load next card
    setFlipped(false);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        padding: 20,
        minHeight: '100vh',
        height: '100vh',
        background: '#f8fafc',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Navigation */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Button
          variant='outline'
          size='icon'
          style={{ borderRadius: 12, width: 44, height: 44, minWidth: 0 }}
          onClick={() => navigate('/')}
          aria-label='Back to Home'
        >
          <FaArrowLeft size={20} />
        </Button>
        <Button
          variant='outline'
          size='icon'
          style={{ borderRadius: 12, width: 44, height: 44, minWidth: 0 }}
          onClick={() => navigate('/add')}
          aria-label='Add Card'
        >
          <FaPlus size={20} />
        </Button>
      </div>
      {/* 3D Flip Card */}
      <div
        style={{
          width: '100%',
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transition: 'transform 0.4s',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Front Side */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 1px 8px #0001',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backfaceVisibility: 'hidden',
              overflowY: 'auto',
              maxHeight: '100%',
            }}
          >
            <style>{`
              .review-card::-webkit-scrollbar { display: none; }
            `}</style>
            <div className='review-card' style={{ width: '100%' }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 8,
                  textAlign: 'center',
                  letterSpacing: -1,
                }}
              >
                {card.english}
              </div>
              <div
                style={{
                  color: '#888',
                  fontSize: 18,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {card.phonetic}
              </div>
              <div
                style={{
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: 17,
                  marginBottom: 18,
                }}
              >
                {card.partOfSpeech}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 8,
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant='secondary'
                  size='icon'
                  style={{
                    borderRadius: 16,
                    width: 40,
                    height: 40,
                    minWidth: 0,
                  }}
                  onClick={() => speak(card.english)}
                  aria-label='Play word audio'
                >
                  <FaVolumeUp size={20} />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  style={{
                    borderRadius: 16,
                    width: 40,
                    height: 40,
                    minWidth: 0,
                  }}
                  onClick={handleFlip}
                  aria-label='Flip card'
                >
                  <FaSyncAlt size={20} />
                </Button>
              </div>
            </div>
          </div>
          {/* Back Side */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 1px 8px #0001',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              overflowY: 'auto',
              maxHeight: '100%',
            }}
          >
            <style>{`
              .review-card::-webkit-scrollbar { display: none; }
            `}</style>
            <div className='review-card' style={{ width: '100%' }}>
              <div
                style={{
                  fontSize: 20,
                  color: '#22c55e',
                  fontWeight: 600,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {card.vietnamese}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {card.definition}
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: '#444',
                  marginBottom: 12,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ marginRight: 6 }}>Example:</span> {card.example}
                <Button
                  variant='ghost'
                  size='icon'
                  style={{
                    marginLeft: 8,
                    borderRadius: 16,
                    width: 32,
                    height: 32,
                    minWidth: 0,
                  }}
                  onClick={() => speak(card.example)}
                  aria-label='Play example audio'
                >
                  <FaVolumeUp size={16} />
                </Button>
              </div>
              <Button
                variant='outline'
                size='icon'
                style={{
                  borderRadius: 16,
                  width: 40,
                  height: 40,
                  minWidth: 0,
                  marginTop: 8,
                }}
                onClick={handleFlip}
                aria-label='Flip card back'
              >
                <FaSyncAlt size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div
        style={{ width: '100%', display: 'flex', gap: 14, marginBottom: 28 }}
      >
        <Button
          style={{
            flex: 1,
            fontSize: 18,
            padding: '14px 0',
            borderRadius: 24,
            opacity: flipped ? 1 : 0.5,
            pointerEvents: flipped ? 'auto' : 'none',
          }}
          variant='destructive'
          onClick={handleIncorrect}
          disabled={!flipped}
        >
          Incorrect
        </Button>
        <Button
          style={{
            flex: 1,
            fontSize: 18,
            padding: '14px 0',
            borderRadius: 24,
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            opacity: flipped ? 1 : 0.5,
            pointerEvents: flipped ? 'auto' : 'none',
          }}
          onClick={handleCorrect}
          disabled={!flipped}
        >
          Correct
        </Button>
      </div>
      {/* Status */}
      <div
        style={{
          fontSize: 15,
          color: '#888',
          marginBottom: 4,
          textAlign: 'center',
          fontWeight: 500,
        }}
      >
        Status:{' '}
        <span style={{ color: '#222', fontWeight: 700 }}>
          {status.replace('-', ' ')}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          color: '#888',
          textAlign: 'center',
          fontWeight: 500,
        }}
      >
        Next review:{' '}
        <span style={{ color: '#222', fontWeight: 700 }}>{nextReview}</span>
      </div>
    </div>
  );
}
