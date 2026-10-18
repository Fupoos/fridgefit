import type { ReactElement } from 'react'
import type { FridgeItem } from '../types'

/** A flat, hand-built illustration of a fridge interior generated from an item list. */

type Glyph = 'tray' | 'eggs' | 'tub' | 'carton' | 'bottle' | 'can' | 'bag' | 'block' | 'jar' | 'box' | 'veg' | 'fruit' | 'takeaway'

const GLYPH: Record<string, Glyph> = {
  chicken_breast: 'tray', chicken_thigh: 'tray', beef_mince: 'tray', pork_loin: 'tray', salmon: 'tray', ham: 'tray', sausages: 'tray', prawns: 'tray',
  eggs: 'eggs',
  greek_yogurt: 'tub', cottage_cheese: 'tub', ice_cream: 'tub',
  milk: 'carton', milk_skim: 'carton', soy_milk: 'carton', orange_juice: 'carton',
  soft_drink: 'bottle', olive_oil: 'bottle', beer: 'bottle',
  tuna_can: 'can', lentils_can: 'can', chickpeas_can: 'can', black_beans_can: 'can', energy_drink: 'can',
  rice: 'bag', oats: 'bag', pasta: 'bag', frozen_veg: 'bag', peas_frozen: 'bag', berries_frozen: 'bag', spinach: 'bag', chips: 'bag', edamame: 'bag', whey: 'jar',
  cheddar: 'block', butter: 'block', tofu: 'block', tempeh: 'block', bread_wholemeal: 'block', wraps: 'block',
  peanut_butter: 'jar',
  frozen_pizza: 'box', muesli_bar: 'box', chocolate: 'box', instant_noodles: 'box',
  broccoli: 'veg', lettuce: 'veg', cucumber: 'veg', capsicum: 'veg', tomato: 'veg', onion: 'veg', mushrooms: 'veg', zucchini: 'veg', carrot: 'veg', avocado: 'veg', sweet_potato: 'veg', potato: 'veg',
  banana: 'fruit', apple: 'fruit', orange: 'fruit', mango: 'fruit',
}

const SHELF_OF: Record<Glyph, 0 | 1 | 2 | 3> = {
  carton: 0, tub: 0, eggs: 0, jar: 0,
  tray: 1, block: 1, takeaway: 1, box: 1,
  bag: 2, can: 2, bottle: 2,
  veg: 3, fruit: 3,
}

const WIDTH: Record<Glyph, number> = {
  tray: 52, eggs: 56, tub: 34, carton: 26, bottle: 18, can: 20, bag: 34, block: 34, jar: 24, box: 46, veg: 34, fruit: 34, takeaway: 40,
}

const C = {
  line: '#7d4824',
  fill1: '#f3e3d3',
  fill2: '#e9cbb0',
  fill3: '#daa982',
  fill4: '#c78a5c',
  paper: '#ffffff',
  warm: '#efe6d2',
}

const K = 1.22

function glyph(kind: Glyph, key: string, x: number, base: number): ReactElement {
  const s = { stroke: C.line, strokeWidth: 1.6, strokeLinejoin: 'round' as const }
  const g = (children: ReactElement | ReactElement[]) => (
    <g key={key} transform={`translate(${x} ${base}) scale(${K})`}>
      {children}
    </g>
  )
  switch (kind) {
    case 'tray':
      return g([
        <rect key="a" x={0} y={-16} width={50} height={16} rx={3} fill={C.paper} {...s} />,
        <path key="b" d="M6 -12 q8 -8 18 -2 q10 6 20 -2" fill={C.fill2} {...s} />,
      ])
    case 'eggs':
      return g([
        <rect key="a" x={0} y={-10} width={54} height={10} rx={2} fill={C.warm} {...s} />,
        ...[6, 18, 30, 42].map((cx) => <ellipse key={cx} cx={cx + 3} cy={-14} rx={5} ry={6.5} fill={C.paper} {...s} />),
      ])
    case 'tub':
      return g([
        <path key="a" d="M2 -26 h30 l-3 26 h-24 z" fill={C.paper} {...s} />,
        <rect key="b" x={0} y={-30} width={34} height={5} rx={2} fill={C.fill3} {...s} />,
      ])
    case 'carton':
      return g([
        <path key="a" d="M0 -46 l6 -8 h14 l6 8 v46 h-26 z" fill={C.paper} {...s} />,
        <rect key="b" x={4} y={-34} width={18} height={14} rx={2} fill={C.fill2} stroke="none" />,
      ])
    case 'bottle':
      return g(<path d="M6 -62 h6 v8 q6 4 6 12 v42 h-18 v-42 q0 -8 6 -12 z" fill={C.fill1} {...s} />)
    case 'can':
      return g([
        <rect key="a" x={0} y={-26} width={20} height={26} rx={3} fill={C.paper} {...s} />,
        <rect key="b" x={0} y={-18} width={20} height={9} fill={C.fill3} stroke="none" />,
      ])
    case 'bag':
      return g([
        <path key="a" d="M2 -34 q15 -6 30 0 l2 34 h-34 z" fill={C.fill1} {...s} />,
        <path key="b" d="M8 -22 h18" {...s} fill="none" />,
      ])
    case 'block':
      return g(<rect x={0} y={-16} width={34} height={16} rx={2} fill={C.warm} {...s} />)
    case 'jar':
      return g([
        <rect key="a" x={0} y={-26} width={24} height={26} rx={4} fill={C.fill2} {...s} />,
        <rect key="b" x={2} y={-31} width={20} height={6} rx={1.5} fill={C.fill4} {...s} />,
      ])
    case 'box':
      return g([
        <rect key="a" x={0} y={-12} width={46} height={12} rx={1.5} fill={C.paper} {...s} />,
        <circle key="b" cx={23} cy={-6} r={4} fill={C.fill3} stroke="none" />,
      ])
    case 'veg':
      return g([
        <path key="a" d="M16 0 v-12" {...s} fill="none" />,
        <path key="b" d="M4 -16 a8 8 0 0 1 10 -12 a8 8 0 0 1 14 2 a7 7 0 0 1 2 12 q-6 4 -14 2 q-8 2 -12 -4 z" fill={C.fill3} {...s} />,
      ])
    case 'fruit':
      return g(<path d="M2 -6 q14 10 30 -14 q-12 12 -28 6 z" fill="#f3e6a6" {...s} />)
    case 'takeaway':
      return g([
        <path key="a" d="M2 -22 h36 l-4 22 h-28 z" fill={C.paper} {...s} />,
        <path key="b" d="M12 -22 q8 -10 16 0" fill="none" {...s} />,
      ])
  }
}

const SHELF_Y = [90, 166, 240, 306]

export function FridgeArt({ items, title }: { items: FridgeItem[]; title: string }) {
  const cursors = [16, 16, 16, 22]
  const drawn: ReactElement[] = []
  items.forEach((it, idx) => {
    const kind: Glyph = it.foodId === 'other' ? 'takeaway' : (GLYPH[it.foodId] ?? 'box')
    const shelf = SHELF_OF[kind]
    const w = WIDTH[kind] * K
    if (cursors[shelf] + w > 284) return
    drawn.push(glyph(kind, `${idx}`, cursors[shelf], SHELF_Y[shelf]))
    cursors[shelf] += w + 9
  })

  return (
    <svg viewBox="0 0 300 324" role="img" aria-label={title} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <title>{title}</title>
      <rect x={4} y={4} width={292} height={316} rx={18} fill="#fffdf8" stroke="#d9cbb6" strokeWidth={2} />
      <rect x={4} y={4} width={292} height={16} rx={8} fill="#f3ece0" />
      {SHELF_Y.slice(0, 3).map((y) => (
        <rect key={y} x={10} y={y} width={280} height={5} rx={2} fill="#ebe1d2" />
      ))}
      <rect x={12} y={250} width={276} height={62} rx={8} fill="#faf3e8" stroke="#d9cbb6" strokeWidth={1.5} />
      {drawn}
      <rect x={12} y={290} width={276} height={22} rx={6} fill="#ffffff" fillOpacity={0.6} stroke="#d9cbb6" strokeWidth={1.5} />
      <rect x={130} y={298} width={40} height={5} rx={2.5} fill="#d9cbb6" />
    </svg>
  )
}
