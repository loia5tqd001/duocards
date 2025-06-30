interface SwipeHintsProps {
  showIncorrectHint: boolean;
  showCorrectHint: boolean;
}

export default function SwipeHints({ showIncorrectHint, showCorrectHint }: SwipeHintsProps) {
  return (
    <>
      {/* Incorrect hint (left) */}
      <div
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 pointer-events-none z-10 ${
          showIncorrectHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className='bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg'>
          Didn't get it!
        </div>
      </div>

      {/* Correct hint (right) */}
      <div
        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 pointer-events-none z-10 ${
          showCorrectHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className='bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg'>
          Got it!
        </div>
      </div>
    </>
  );
}