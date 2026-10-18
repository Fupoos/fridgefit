import { type Page, expect, test } from '@playwright/test'
import { DEMO_FRIDGES } from '../src/data/samples'

const OUT = 'docs/screenshots'
const cut = DEMO_FRIDGES[0]

const profile = {
  age: 20,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  targetWeightKg: 75,
  goal: 'cut',
  activity: 'moderate',
  trainingDays: 4,
  weeklyBudgetAud: 80,
  diet: 'any',
  allergies: [],
}

const weeks = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12']
const weights = [80.6, 80.1, 79.6, 79.2, 78.8, 78.3]
const logs = weights.map((w, i) => ({
  weekStart: weeks[i],
  weightKg: w,
  sessions: 4,
  avgStepsK: 8.4,
  avgSleepH: 7.3,
  expiredUnused: 0,
  restocks: 2,
  takeawayOrders: 1,
}))

function seeded(extra: Record<string, unknown> = {}) {
  return {
    version: 1,
    consent: { donate: true, decidedAt: '2026-10-18' },
    profile,
    scans: [{ id: 'demo-cut', date: '2026-10-18', source: 'demo', sampleId: cut.id, predicted: cut.predicted, confirmed: cut.actual }],
    draft: null,
    logs,
    settings: { lang: 'en' },
    ...extra,
  }
}

async function withState(page: Page, state: unknown) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('fridgefit:v1:state', JSON.stringify(s))
      sessionStorage.setItem('seeded', '1')
    }
  }, state)
}

async function shoot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.screenshot({ path: `${OUT}/full/${name}.png`, fullPage: true })
}

test('welcome', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await shoot(page, '01-welcome')
})

test('profile', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/me')
  await shoot(page, '02-profile')
})

test('fridge', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/fridge')
  await shoot(page, '03-fridge')
})

test('confirm with scanner mistakes', async ({ page }) => {
  await withState(page, seeded({ draft: { id: 'd', date: '2026-10-18', source: 'demo', sampleId: cut.id, predicted: cut.predicted, confirmed: cut.predicted } }))
  await page.goto('./#/fridge/confirm')
  await shoot(page, '04-confirm')
  // Correct the yoghurt the scanner read as milk, and add the missed spinach: the labelling step.
  const rows = page.locator('details.xrow')
  await rows.nth(2).locator('summary').click()
  await rows.nth(2).locator('select').selectOption('greek_yogurt')
  await rows.nth(2).locator('summary').click()
  await page.getByRole('button', { name: 'Add a missing item' }).click()
  await rows.last().locator('summary').click()
  await rows.last().locator('select').selectOption('spinach')
  await rows.last().getByRole('spinbutton').first().fill('120')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${OUT}/full/05-confirm-corrected.png`, fullPage: true })
  await page.screenshot({ path: `${OUT}/05-confirm-corrected.png` })
})

test('plan', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/plan')
  await expect(page.getByRole('heading', { name: 'Meals' })).toBeVisible()
  await page.locator('details.xrow').first().locator('summary').click()
  await shoot(page, '06-plan')
})

test('shop', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/shop')
  await expect(page.getByRole('heading', { name: 'By store' })).toBeVisible()
  await shoot(page, '07-shop')
})

test('predict', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/predict')
  await expect(page.getByRole('heading', { name: 'What pushed it' })).toBeVisible()
  await shoot(page, '08-predict')
  await page.getByRole('heading', { name: 'How the model learned' }).click()
  await page.getByRole('heading', { name: 'How the model learned' }).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60))
  await page.screenshot({ path: `${OUT}/09-predict-training.png` })
  await page.locator('table.t').filter({ hasText: '↓ / →' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/10-predict-test.png` })
})

test('predict: takeaway week', async ({ page }) => {
  const tw = DEMO_FRIDGES[2]
  const stalledLogs = [...logs.slice(0, 5), { ...logs[5], weightKg: 78.9, avgSleepH: 6.4, expiredUnused: 3, restocks: 1, takeawayOrders: 5, avgStepsK: 6.1, sessions: 2 }]
  await withState(
    page,
    seeded({ logs: stalledLogs, scans: [{ id: 'demo-tw', date: '2026-10-18', source: 'demo', sampleId: tw.id, predicted: tw.predicted, confirmed: tw.actual }] }),
  )
  await page.goto('./#/predict')
  await expect(page.getByRole('heading', { name: 'What pushed it' })).toBeVisible()
  await shoot(page, '08b-predict-takeaway')
})

test('check-in', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/me/log')
  await shoot(page, '11-checkin')
})

test.describe('two-column forms fit narrow phones', () => {
  for (const width of [320, 360, 390]) {
    for (const lang of ['en', 'zh']) {
      test(`check-in at ${width}px (${lang})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await withState(page, seeded({ settings: { lang } }))
        await page.goto('./#/me/log')
        const grid = page.locator('.grid-2').first()
        const cells = await grid.locator(':scope > label.field').all()
        const boxes = []
        for (const cell of cells) {
          const label = (await cell.boundingBox())!
          const input = (await cell.locator('input').boundingBox())!
          // Each input stays inside its own grid cell.
          expect(input.x + input.width, `input overflows its column at ${width}px`).toBeLessThanOrEqual(label.x + label.width + 0.5)
          boxes.push(label)
        }
        // Both columns get the same width.
        expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThan(1)
        // Below 360px there is no room for a full date beside another field, so the form stacks.
        if (width < 360) expect(boxes[1].y).toBeGreaterThan(boxes[0].y + boxes[0].height)
        else expect(Math.abs(boxes[1].y - boxes[0].y)).toBeLessThan(1)
        await page.screenshot({ path: `test-results/layout-checkin-${width}-${lang}.png` })
      })
    }
  }
})

test('settings', async ({ page }) => {
  await withState(page, seeded())
  await page.goto('./#/me/settings')
  await shoot(page, '12-settings')
})

test('safety: unhealthy target is refused', async ({ page }) => {
  await withState(
    page,
    seeded({ profile: { ...profile, sex: 'female', age: 19, heightCm: 160, weightKg: 50, targetWeightKg: 45, activity: 'light' } }),
  )
  await page.goto('./#/plan')
  await expect(page.getByText(/below the healthy range/)).toBeVisible()
  await shoot(page, '13-safety')
})

test.describe('Chinese', () => {
  const zh = (extra: Record<string, unknown> = {}) => seeded({ settings: { lang: 'zh' }, ...extra })

  test('fridge (zh)', async ({ page }) => {
    await withState(page, zh())
    await page.goto('./#/fridge')
    await expect(page.getByRole('heading', { name: '扫描冰箱' })).toBeVisible()
    await shoot(page, 'zh-03-fridge')
  })

  test('plan (zh)', async ({ page }) => {
    await withState(page, zh())
    await page.goto('./#/plan')
    await expect(page.getByRole('heading', { name: '三餐' })).toBeVisible()
    await page.locator('details.xrow').first().locator('summary').click()
    await shoot(page, 'zh-06-plan')
  })

  test('predict (zh)', async ({ page }) => {
    const tw = DEMO_FRIDGES[2]
    await withState(page, zh({ scans: [{ id: 'demo-tw', date: '2026-10-18', source: 'demo', sampleId: tw.id, predicted: tw.predicted, confirmed: tw.actual }] }))
    await page.goto('./#/predict')
    await expect(page.getByRole('heading', { name: '影响因素' })).toBeVisible()
    await shoot(page, 'zh-08-predict')
  })
})
