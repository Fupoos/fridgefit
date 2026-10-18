# FridgeFit

**Photograph your fridge. Get today's meals from what is already in it, a budget shopping list from Queensland supermarkets,
and a prediction of whether next week's weigh-in is on track.**

FridgeFit is a student prototype for UQ COMU1130 *Data & Society*, Assessment 3: "Your Data-Driven Smart Solution".
It is built for university students who train at the gym and want to lose fat, maintain or build muscle on a student budget.

**Live demo:** https://fupoos.github.io/fridgefit/. It works on a phone. Sample fridges run offline, with no account and no key.

| Scan | Check | Plan | Shop | Predict |
|---|---|---|---|---|
| ![](docs/screenshots/03-fridge.png) | ![](docs/screenshots/05-confirm-corrected.png) | ![](docs/screenshots/06-plan.png) | ![](docs/screenshots/07-shop.png) | ![](docs/screenshots/08b-predict-takeaway.png) |

## The idea

The pitch's hidden pattern: what is stocked in your fridge each week predicts whether next week's weigh-in moves towards
your goal better than your intentions do.

There are two supervised-learning steps:

1. **Recognition.** Photo → list of foods, using Google Gemini with a structured-output schema limited to our food table. The **Check** screen is where users fix mistakes, and every fix is a labelled example.
2. **Progress prediction.** Nine weekly features (fridge composition, training, steps, sleep, takeaway orders) → `on-track` / `stalled` / `too-fast`. The label comes from the next weekly weigh-in. In this prototype the model trains in the browser on **synthetic** data (see [MODEL_CARD.md](MODEL_CARD.md)).

The calories, macros, meal plan and shopping list are **not** produced by AI. They come from transparent, unit-tested rules:

- Mifflin–St Jeor energy needs;
- USDA nutrition values;
- a greedy planner that uses soon-to-expire food first;
- a best-value-per-dollar shopping planner limited to a Woolworths/Coles/ALDI catalogue.

## Safety and privacy by design

- **Calorie floor.** No plan goes below a floor of max(BMR, 1200/1500 kcal).
- **Limit on the rate of loss.** Cuts are capped at about 1% of body weight per week.
- **Refused cut plans.** Cuts are refused for under-18s, for a current BMI under 18.5, and for a target BMI under 18.5. Refusals show supportive wording and the Butterfly Foundation helpline.
- **No streaks, scores or shaming copy.**
- **Data stays on the device.** Everything is stored in the browser (`localStorage`). There is an export button and a delete-all button. The "data donation" switch is a prototype of the opt-in flow and sends nothing.
- **Your own Gemini key, optional.** The key stays in your browser, either remembered or for the session only. Only the photo is sent; it is shrunk and re-encoded, which removes GPS/EXIF data. The request has `store: false` set. Body measurements are never sent.
- **Free-tier caveat.** Google's free tier may use your inputs to improve its products. The app warns about this in Settings.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173/fridgefit/
npm test             # 96 unit tests (Vitest)
npm run build
npm run screens      # Playwright screenshots → docs/screenshots (uses installed Chrome)
node scripts/build-data.mjs   # regenerate src/data from the research files
```

To scan your own fridge, get a free key at [Google AI Studio](https://aistudio.google.com/apikey) and paste it under
**Me → Settings**. Gemini is for people 18 and over.

## Project layout

```
src/lib/      nutrition, safety, planner, shopping, gemini, image, storage (all unit-tested)
src/model/    synthetic data, softmax regression, feature extraction
src/data/     generated food table + Queensland catalogue, demo fridges
src/pages/    Welcome, Profile, Fridge, Confirm, Plan, Shop, Predict, Log, Settings
e2e/          Playwright screenshot run
```

Data sources: [DATA_SOURCES.md](DATA_SOURCES.md). Not medical advice.
