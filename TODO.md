Home Screen:

- [ ] Click to familiarity type to filter the list of cards
- [x] Show how long until next review for each card in the Home screen list
- [ ] Consider revamp the UI to be cleaner

Review Screen:

- [ ] Has several review modes:
  - [ ] English to reveal all
  - [ ] Vietnamese to reveal all
  - [ ] Sounds like to reveal all
- [ ] Use keyboard to navigate (flip, correct, incorrect, next,...)

Add Card Screen:

- [ ] Suggestions from dictionary (a list of chips)
- [x] Add audio pronunciation button and speed toggle beside IPA phonetic in Add Card screen.
- [x] AddCard: Use auto-growing textarea for example field (AutoGrowTextarea component, mobile-first, shadcn/ui)

Common:

- [ ] Have correct, optimal Spaced Repetition algorithm

- [x] Migrate all styling to Tailwind CSS (mobile-first, shadcn/ui consistent)
- [ ] All new UI should use Tailwind utility classes and follow mobile-first design

- Abstracted all FaVolumeUp usages to a new VolumeButton component for consistent audio play UI/UX. Supports 'significant' (blue) and 'default' (shadow/black) color modes.

# TODO

## ✅ Completed

- [x] Basic flashcard review functionality
- [x] Add/edit cards
- [x] Card statistics on home screen
- [x] Mobile-first responsive design
- [x] Cambridge dictionary integration
- [x] Speech synthesis (TTS)
- [x] **Improved Spaced Repetition Algorithm**
  - [x] Implemented SM-2 inspired algorithm with 4-button system (Again/Hard/Good/Easy)
  - [x] Added learning steps (1min, 10min) for new cards
  - [x] Added relearning steps for forgotten cards
  - [x] Implemented ease factor tracking for better difficulty assessment
  - [x] Fixed immediate repetition issue with session queue
  - [x] Better interval progression based on performance
  - [x] Card status system: new → learning → review (with relearning for lapses)

## 🚧 In Progress

## 📋 Planned Features

### Core Features

- [ ] Backup/restore functionality
- [ ] Import/export cards (CSV, JSON)
- [ ] Card categories/tags
- [ ] Search functionality
- [ ] Dark mode support

### Algorithm Enhancements

- [ ] Adjustable learning steps
- [ ] Customizable ease factor bonuses
- [ ] Daily review limits
- [ ] Review heatmap/statistics
- [ ] Retention rate tracking
- [ ] FSRS algorithm option (advanced)

### User Experience

- [ ] Swipe gestures for card review
- [ ] Keyboard shortcuts guide
- [ ] Undo last review action
- [ ] Review timer
- [ ] Study streaks tracking
- [ ] Motivational statistics

### Content Features

- [ ] Multiple example sentences per card
- [ ] Image attachments
- [ ] Audio recording for pronunciation
- [ ] Reverse cards (Vietnamese → English)
- [ ] Cloze deletion cards

### Advanced Features

- [ ] Sync across devices
- [ ] Shared decks marketplace
- [ ] AI-powered card generation
- [ ] Contextual learning (sentences → words)
- [ ] Grammar pattern recognition

## 🐛 Known Issues

- [ ] Performance optimization for large collections (1000+ cards)
- [ ] Better error handling for offline dictionary lookups
- [ ] Session queue persistence across browser refreshes

## 💡 Ideas for Future

- Progressive Web App (PWA) support
- Native mobile app with React Native
- Gamification elements
- Social learning features
- Integration with other language learning platforms
