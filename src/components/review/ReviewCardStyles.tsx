export const ReviewCardStyles = () => (
  <style>{`
    @keyframes throwLeft {
      0% {
        transform: translateX(0) translateY(0) rotate(0deg) scale(1);
        opacity: 1;
      }
      50% {
        transform: translateX(-150%) translateY(-30%) rotate(-25deg) scale(0.9);
        opacity: 0.8;
      }
      100% {
        transform: translateX(-200%) translateY(100%) rotate(-30deg) scale(0.7);
        opacity: 0;
      }
    }
    @keyframes throwRight {
      0% {
        transform: translateX(0) translateY(0) rotate(0deg) scale(1);
        opacity: 1;
      }
      50% {
        transform: translateX(150%) translateY(-30%) rotate(25deg) scale(0.9);
        opacity: 0.8;
      }
      100% {
        transform: translateX(200%) translateY(100%) rotate(30deg) scale(0.7);
        opacity: 0;
      }
    }
    @keyframes slideUp {
      0% {
        transform: translateY(0) scale(0.95);
        opacity: 0.5;
        z-index: 0;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
        z-index: 1;
      }
    }
    .throw-left {
      animation: throwLeft 0.6s ease-out forwards;
    }
    .throw-right {
      animation: throwRight 0.6s ease-out forwards;
    }
    .slide-up {
      animation: slideUp 0.6s ease-out forwards;
    }
    .card-shadow {
      box-shadow: 
        0 20px 25px -5px rgb(0 0 0 / 0.15),
        0 10px 10px -5px rgb(0 0 0 / 0.1),
        0 0 0 1px rgb(0 0 0 / 0.05);
    }
    .deck-card-1 {
      box-shadow: 
        0 15px 20px -5px rgb(0 0 0 / 0.08),
        0 8px 8px -5px rgb(0 0 0 / 0.06);
    }
    .deck-card-2 {
      box-shadow: 
        0 10px 15px -5px rgb(0 0 0 / 0.05),
        0 5px 5px -5px rgb(0 0 0 / 0.03);
    }
    .review-card::-webkit-scrollbar { 
      display: none; 
    }
  `}</style>
);