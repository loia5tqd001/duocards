<!-- Help me create a todolist and design to code up this app of Flashcard based on Spaced Repetition to learn English vocabulary based on cambridge API.
- Home screen:
  - There are 3 stats: To Learn, Known (Short term memory), Learned (Long term memory)
  - There are 3 important buttons: To add a card, To review cards
- Add Card screen:
  - Have 3 inputs: English (the word to learn/memorise), Vietnamese (auto-translate but still allow user to edit, Vietnamese is the user's native language), Example of usage (English) optional
  - Have 1 big card at the bottom to explain about that vocab based on oxford info (please help me list out all of the infos important to learn English)
  - A button to submit to add the word to to-learn list, after adding, the user still stays in the page to add more vocab
- Review Card screen:
  - Showing a card for the user to review (based on spaced repetition algo, the more transparent the algo the better)
  - The user can then open the card, to flip the card to see full info of that vocab, whether they guessed it correctly will determine how early and frequently they'll see the card again.
  - You can decide to come up with the best UX to decide whether a card is correct or not, could be swipe left to not get it and swipe right to get it, or/and with keyboard right to get it, left to not get it.
  - In this screen, therere are small buttons for add card and go back to home page as well

Some notes: focus on creating the best UX, must have audio as well and optionally images, is there any text to speech solution? I want audio even for the example sentence, not just the vocab.

I attached the images of
1. an existing app's Home Page that has similar functionality, yet I want you to do better
2. screenshot of cambridge's vocab info that I can get by extracting the HTML elements inside the page, i.e: for the vocab compromise @https://dictionary.cambridge.org/dictionary/english-vietnamese/compromise  -->

# TODO: Flashcard App for English Vocabulary (Spaced Repetition)

## Cursor Rule (Workflow & Best Practices)

1. **Branching & PRs**

   - Each feature, screen, or major refactor must be developed in a separate branch.
   - Branch naming: use `feature/<feature-name>`, `fix/<bug-description>`, or `refactor/<scope>`.
   - Open a Pull Request (PR) for each feature/bugfix. Keep PRs focused and small.
   - Reference the relevant TODO.md item(s) in the PR description.

2. **Commit Messages**

   - Use clear, conventional commit messages:
     - `feat: <feature>` for new features
     - `fix: <bug>` for bug fixes
     - `refactor: <scope>` for refactoring
     - `style: <change>` for style/CSS changes
     - `docs: <change>` for documentation
     - `test: <change>` for tests
   - Example: `feat: add mobile-first Home screen layout`

3. **Code Review & Merging**

   - All PRs must be reviewed before merging (self-review if solo, otherwise peer review).
   - Address all review comments before merging.
   - Squash and merge PRs to keep history clean.
   - After merging, update TODO.md to reflect completed tasks.

4. **Component & File Structure**

   - Keep components modular and reusable.
   - Use a `components/` directory for shared UI elements.
   - Use a `screens/` directory for main app screens (Home, AddCard, ReviewCard, etc.).
   - Use a `hooks/` directory for custom React hooks.
   - Use a `utils/` directory for utility functions (e.g., spaced repetition logic, API calls).

5. **Mobile-First & Responsive Design**

   - All UI/UX must be designed mobile-first, then enhanced for desktop.
   - Use CSS media queries or utility classes for responsiveness.
   - Test all features on mobile emulators/devices before PR review.

6. **Testing & Linting**

   - Run linting (`npm run lint` or `pnpm lint`) before pushing.
   - Add tests for critical logic (spaced repetition, API integration, etc.) if possible.

7. **Documentation**
   - Update README.md and TODO.md as features are added/changed.
   - Add code comments for complex logic or algorithms.

---

## General

- [ ] Set up project structure and dependencies
- [ ] Integrate Cambridge Dictionary API for vocab info
- [ ] Integrate auto-translation (English → Vietnamese)
- [ ] Integrate text-to-speech (TTS) for vocab and example sentences (explore browser TTS and external APIs)
- [ ] (Optional) Integrate image search for vocab illustration
- [ ] Design and implement spaced repetition algorithm (transparent, user-friendly)
- [ ] Persistent storage (localStorage/IndexedDB, or backend if needed)
- [ ] **Mobile-first UI/UX: All screens and components must be designed for mobile first, then scale up for desktop**
- [ ] Add cursor rules for workflow (see below)

## Cursor Rules for Workflow

- [ ] Each feature/screen should be implemented in a separate branch and PR for easy review
- [ ] Use clear commit messages: `feat:`, `fix:`, `refactor:`, `style:`, etc.
- [ ] Update TODO.md after each major feature/PR
- [ ] Keep components modular and reusable
- [ ] Use Figma or similar for wireframes if needed (optional)

## Home Screen

- [ ] Display 3 stats:
  - [ ] To Learn
  - [ ] Known (Short term memory)
  - [ ] Learned (Long term memory)
- [ ] Buttons:
  - [ ] Add Card
  - [ ] Review Cards
- [ ] Modern, clean, and motivating UI/UX
- [ ] **Mobile-first layout: Large touch targets, vertical stacking, responsive grid for stats**

## Add Card Screen

- [ ] Input fields:
  - [ ] English (word to learn)
  - [ ] Vietnamese (auto-translate, editable)
  - [ ] Example of usage (English, optional)
- [ ] Fetch and display vocab info from Cambridge (see below for details)
- [ ] Big info card at bottom with:
  - [ ] Pronunciation (IPA, audio)
  - [ ] Part of speech
  - [ ] Definitions (all senses)
  - [ ] Example sentences (with audio)
  - [ ] Synonyms/antonyms (if available)
  - [ ] Word forms (plural, past, etc.)
  - [ ] Frequency/usage notes
  - [ ] (Optional) Image
- [ ] Button to submit and add to "To Learn" list
- [ ] Stay on page after adding (for quick entry)
- [ ] Excellent mobile and desktop UX
- [ ] **Mobile-first: Inputs and buttons easily accessible, info card scrollable on small screens**

## Review Card Screen

- [ ] Show card to review (based on spaced repetition)
- [ ] Card front: English word (optionally, audio button, image)
- [ ] User can flip card to see full info (definition, Vietnamese, example, etc.)
- [ ] User marks if they got it right or not:
  - [ ] Swipe right/left (mobile)
  - [ ] Keyboard arrows (desktop)
  - [ ] Buttons for correct/incorrect
- [ ] Show next review time (transparency)
- [ ] Update card status (To Learn → Known → Learned)
- [ ] Buttons: Add Card, Home
- [ ] Audio for word and example
- [ ] **Mobile-first: Swipe gestures, large tap areas, smooth animations**

## Audio/Text-to-Speech

- [ ] Use Cambridge audio if available
- [ ] Fallback to browser TTS for word and example sentences
- [ ] Ensure TTS works for both English and Vietnamese
- [ ] **Audio controls must be easily accessible on mobile**

## UX/UI

- [ ] Clean, modern, and motivating design
- [ ] Responsive (mobile & desktop)
- [ ] Fast interactions, minimal friction
- [ ] Tooltips/help for stats and spaced repetition
- [ ] Progress feedback and encouragement
- [ ] **Test all flows on mobile devices/emulators**

## Stretch Goals

- [ ] User accounts and sync (if backend)
- [ ] Import/export cards
- [ ] Dark mode
- [ ] Leaderboards or streaks
- [ ] Customizable spaced repetition settings

---

## Cambridge Vocab Info to Display (per word)

- Pronunciation (IPA, audio)
- Part of speech
- All definitions (with Vietnamese translation)
- Example sentences (with audio)
- Synonyms/antonyms
- Word forms (plural, past, etc.)
- Frequency/usage notes
- (Optional) Image
