# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/MBOLANG30/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/MBOLANG30/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Turkey Run — a fast turkey escape game. You are the turkey, and Thanksgiving is coming: outrun the farmer across the farmyard, the cornfield and the kitchen yard to the Freedom Gate 1000 m away. Jump the burning ovens, duck the flying carving knives, eat the corn to push the farmer back — get caught and you are dinner.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — the game is plain static files under `game/`.

## Controls

- **Space / click** — jump (press twice for a double-jump)
- **↓ arrow** — duck under flying carving knives
- **R** — restart after being caught or escaping
- **M** — mute the synthesized sound effects

## How it plays

- 3 lives, a chasing farmer who creeps closer on his own and lunges on every hit, and a distance bar to the 1000 m Freedom Gate.
- Score is distance plus 10 points per ear of corn. Corn also pushes the farmer back.
- Speed rises as the run goes on; the third stretch (Kitchen Yard) deals paired hazards.
- Title screen, live HUD (score, distance, lives, farmer proximity), and end screens for both CAUGHT! and ESCAPED!, with restart.

---

<sub>Entered on [make.fun](https://make.fun/?ref=v52s17wh&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
