import type { Label } from '../types'
import { FEATURES, LABELS, mulberry32, type Feature, type Row } from './synthetic'

/** Multinomial logistic regression on z-scored features. */
export interface SoftmaxModel {
  mean: number[]
  std: number[]
  W: number[][]
  b: number[]
  classes: readonly Label[]
}

export interface TrainOptions {
  epochs?: number
  lr?: number
  l2?: number
}

function softmax(z: number[]): number[] {
  const max = Math.max(...z)
  const e = z.map((v) => Math.exp(v - max))
  const sum = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / sum)
}

function standardise(m: Pick<SoftmaxModel, 'mean' | 'std'>, x: number[]): number[] {
  return x.map((v, j) => (v - m.mean[j]) / m.std[j])
}

function logits(m: SoftmaxModel, z: number[]): number[] {
  return m.W.map((w, c) => w.reduce((acc, wj, j) => acc + wj * z[j], m.b[c]))
}

export function stratifiedSplit(rows: Row[], testFraction: number, seed: number): { train: Row[]; test: Row[] } {
  const rand = mulberry32(seed)
  const train: Row[] = []
  const test: Row[] = []
  for (const label of LABELS) {
    const group = rows.filter((r) => r.y === label)
    // Fisher–Yates shuffle with the seeded PRNG.
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[group[i], group[j]] = [group[j], group[i]]
    }
    const k = Math.round(group.length * testFraction)
    test.push(...group.slice(0, k))
    train.push(...group.slice(k))
  }
  return { train, test }
}

/** Full-batch gradient descent from zero weights, so training is deterministic. */
export function train(X: number[][], y: Label[], opts: TrainOptions = {}): SoftmaxModel {
  const { epochs = 600, lr = 0.1, l2 = 1e-3 } = opts
  const nF = X[0].length
  const n = X.length
  const mean = Array.from({ length: nF }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n)
  const std = mean.map((m, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - m) ** 2, 0) / n) || 1)
  const Z = X.map((r) => standardise({ mean, std }, r))
  const target = y.map((label) => LABELS.indexOf(label))

  const model: SoftmaxModel = {
    mean,
    std,
    W: LABELS.map(() => new Array(nF).fill(0)),
    b: LABELS.map(() => 0),
    classes: LABELS,
  }

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gW = LABELS.map(() => new Array(nF).fill(0))
    const gb = LABELS.map(() => 0)
    for (let i = 0; i < n; i++) {
      const p = softmax(logits(model, Z[i]))
      for (let c = 0; c < LABELS.length; c++) {
        const err = p[c] - (target[i] === c ? 1 : 0)
        gb[c] += err / n
        for (let j = 0; j < nF; j++) gW[c][j] += (err * Z[i][j]) / n
      }
    }
    for (let c = 0; c < LABELS.length; c++) {
      model.b[c] -= lr * gb[c]
      for (let j = 0; j < nF; j++) model.W[c][j] -= lr * (gW[c][j] + l2 * model.W[c][j])
    }
  }
  return model
}

export function predictProba(m: SoftmaxModel, x: number[]): number[] {
  return softmax(logits(m, standardise(m, x)))
}

export function predict(m: SoftmaxModel, x: number[]): Label {
  const p = predictProba(m, x)
  return m.classes[p.indexOf(Math.max(...p))]
}

export function evaluate(m: SoftmaxModel, X: number[][], y: Label[]): { accuracy: number; confusion: number[][] } {
  const confusion = LABELS.map(() => LABELS.map(() => 0))
  let correct = 0
  X.forEach((x, i) => {
    const truth = LABELS.indexOf(y[i])
    const guess = LABELS.indexOf(predict(m, x))
    confusion[truth][guess]++
    if (truth === guess) correct++
  })
  return { accuracy: correct / X.length, confusion }
}

/** Weight × z-score for each feature, for the predicted (or given) class, largest effect first. */
export function contributions(
  m: SoftmaxModel,
  x: number[],
  classIndex?: number,
): { feature: Feature; value: number }[] {
  const z = standardise(m, x)
  const p = predictProba(m, x)
  const c = classIndex ?? p.indexOf(Math.max(...p))
  return FEATURES.map((feature, j) => ({ feature, value: m.W[c][j] * z[j] })).sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  )
}
