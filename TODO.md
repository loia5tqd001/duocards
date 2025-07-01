Home Screen:

- [ ] Click to familiarity type to filter the list of cards
- [x] Show how long until next review for each card in the Home screen list
- [ ] Consider revamp the UI to be cleaner
- [ ] Make buttons bigger and more visible/clickable
- [ ] Display progress and learning activity

Review Screen:

- [ ] Has several review modes:
  - [ ] English to reveal all
  - [ ] Vietnamese to reveal all
  - [ ] Sounds like to reveal all
- [x] Use keyboard to navigate (Arrow keys for correct/incorrect)
- [x] Swipe gestures for card review (left = incorrect, right = correct)
- [ ] Better drag left/right animation

Add Card Screen:

- [ ] Suggestions from dictionary (a list of chips)
- [x] Add audio pronunciation button and speed toggle beside IPA phonetic in Add Card screen.
- [x] AddCard: Use auto-growing textarea for example field (AutoGrowTextarea component, mobile-first, shadcn/ui)
- [ ] Handle adding duplicate cards
- [ ] Bigger button and more visible/clickable (make button sticky to the bottom of the screen)

Settings Screen:

- [ ] Export/import cards
- [ ] Add folders/tags (categories)

Common:

- [x] Have correct, optimal Spaced Repetition algorithm (simplified 2-button system)
- [x] Migrate all styling to Tailwind CSS (mobile-first, shadcn/ui consistent)
- [ ] All new UI should use Tailwind utility classes and follow mobile-first design
- [ ] Disable page level bouncing scroll
- [ ] Improve content quality

- Abstracted all FaVolumeUp usages to a new VolumeButton component for consistent audio play UI/UX. Supports 'significant' (blue) and 'default' (shadow/black) color modes.

# TODO

## ✅ Completed

- [x] Basic flashcard review functionality
- [x] Add/edit cards
- [x] Card statistics on home screen
- [x] Mobile-first responsive design
- [x] Cambridge dictionary integration
- [x] Speech synthesis (TTS)
- [x] **Simplified Spaced Repetition Algorithm**
  - [x] Implemented simple 2-button system (Incorrect/Correct)
  - [x] Reduced to 3 statuses: New, Learning, Learned
  - [x] Fixed interval multipliers (2.5x for correct, 0.25x for incorrect)
  - [x] Learning steps simplified to 1min → 10min → 1 day
  - [x] Session queue prevents immediate repetition
  - [x] Cards that fail when interval < 1 day go back to learning
  - [x] Maximum interval capped at 1 year
- [x] Delete flashcard from Home screen
- [x] Edit flashcard from Home screen (reuses AddCard form)
- [x] Swipe gestures for review (left/right)
- [x] Arrow key navigation (←/→)
- [x] **Cloud Sync & Authentication**
  - [x] Google OAuth integration with Supabase
  - [x] Facebook OAuth integration with Supabase
  - [x] Local-first architecture with cloud backup
  - [x] Automatic sync on login/logout
  - [x] Optimistic updates with conflict resolution
  - [x] Real-time sync status indicators
  - [x] Cross-device data synchronization

## 🚧 In Progress

## 📋 Planned Features

### Core Features

- [ ] Backup/restore functionality
- [ ] Import/export cards (CSV, JSON)
- [ ] Card categories/tags
- [ ] Search functionality
- [ ] Dark mode support

### Algorithm Enhancements

- [ ] Adjustable learning steps (currently fixed at 1min, 10min)
- [ ] Customizable interval multipliers (currently fixed at 2.5x/0.25x)
- [ ] Daily review limits
- [ ] Review heatmap/statistics
- [ ] Success rate tracking
- [ ] Optional advanced algorithm mode (bring back 4-button system)

### User Experience

- [x] Swipe gestures for card review
- [ ] Keyboard shortcuts guide overlay
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

- [x] **Sync across devices** - Implemented with Supabase + Google OAuth
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
