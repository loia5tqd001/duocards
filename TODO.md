Home Screen:

- [ ] Click to familiarity type to filter the list of cards
- [ ] State how much time until next review of each card
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
