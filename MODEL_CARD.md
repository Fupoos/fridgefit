# Model card: FridgeFit progress predictor (demo)

## What it predicts

Given one student-week, it predicts what next week's weigh-in will do relative to the plan:

| Label | Meaning |
|---|---|
| `on-track` | Weight moved at roughly the planned rate |
| `stalled` | Weight barely moved |
| `too-fast` | Weight dropped faster than planned (a sign of under-eating) |

## Inputs (nine features per week)

| Feature | Source in the app | Unit |
|---|---|---|
| `proteinItems` | Confirmed fridge scan: foods in the protein category, plus dairy with ≥ 8 g protein per 100 kcal | count |
| `produceItems` | Confirmed fridge scan: fruit & veg | count |
| `upfItems` | Confirmed fridge scan: foods flagged ultra-processed | count |
| `expiredUnused` | Weekly check-in | count |
| `restocks` | Weekly check-in | grocery trips |
| `sessions` | Weekly check-in (could come from Apple Health / Health Connect) | sessions |
| `stepsK` | Weekly check-in (could come from Apple Health / Health Connect) | thousand steps / day |
| `sleepH` | Weekly check-in (could come from a wearable) | hours / night |
| `takeawayOrders` | Weekly check-in (could come from a linked delivery account such as Uber Eats) | orders |

## Training data: synthetic

**No real people are in this dataset.** `src/model/synthetic.ts` generates 300 student-weeks with a seeded
PRNG (seed 1130). A latent "organised shopper" trait makes the fridge features correlate plausibly. Labels come from two noisy scores:

```
sOn   = .6·protein + .35·produce − .5·upf − .4·expired + .25·sessions
        + .15·stepsK + .5·(sleep − 7) − .45·takeaway + N(0,1)
sFast = .5·sessions + .2·stepsK − .3·(protein + produce) − .5·restocks
        − .4·(sleep − 7) + N(0,1)

too-fast  if sFast is in its top quartile
on-track  else if sOn is above its 55th percentile
stalled   otherwise
```

The rule encodes **our assumptions**, not findings. In the real product, labels would come from users' own
weekly weigh-ins after they opt in to donating anonymous weekly counts.

## Model

The model is a multinomial logistic regression (softmax) on z-scored features. It is trained with full-batch gradient descent from zero weights (600 epochs, learning rate 0.1, L2 = 0.001), so training is deterministic.

The data uses a stratified 80/20 split: 240 training rows and 60 test rows. Training runs in the browser in a few milliseconds. The **Retrain** button draws a new synthetic sample.

## Performance (seed 1130)

- Test accuracy is about 73%, on 60 unseen synthetic weeks.
- The confusion matrix is on the Predict page.
- "Stalled" and "too-fast" are confused most often.

## Known limitations and biases (discussed in the pitch)

- **Synthetic labels.** The model can only rediscover the rule we wrote. It is a teaching device, not evidence.
- **Cut-only.** Every synthetic user is on a fat-loss goal, so predictions for maintain or bulk goals are unreliable. The app says so.
- **Correlation is not causation.** "Fewer ultra-processed items" predicts on-track, but emptying a fridge does not cause progress. The app says so too.
- **Who is missing.** People who share a fridge, live in catered colleges, mostly eat out, or cannot afford a full fridge would be under-represented in real data. A weekly-weigh-in label also over-represents people who keep weighing in, who are usually the successful ones.
- **Weight as the target.** Weight is a narrow proxy for health and performance. Optimising it can harm people at risk of disordered eating. The app keeps a calorie floor, refuses unsafe targets, and shows support lines on "too-fast".
