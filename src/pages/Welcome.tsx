import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { DEMO_FRIDGES } from '../data/samples'
import { type AppApi, go } from '../state'

export function Welcome({ api }: { api: AppApi }) {
  const [donate, setDonate] = useState(api.state.consent?.donate ?? false)

  const start = () => {
    api.update((s) => ({ ...s, consent: { donate, decidedAt: new Date().toISOString().slice(0, 10) } }))
    go(api.state.profile ? '/fridge' : '/me')
  }

  return (
    <>
      <div className="welcome-art">
        <FridgeArt items={DEMO_FRIDGES[0].actual} title="Illustration of an open fridge stocked for a training week" />
      </div>
      <div className="page-head">
        <h1>Your fridge says more about next week than your plans do.</h1>
        <p>
          FridgeFit reads a photo of your fridge, builds today's meals from what is already there, writes a weekly shopping list from
          Queensland supermarkets within your budget, and predicts whether next week's weigh-in is on track.
        </p>
      </div>

      <section className="shelf">
        <h2>What stays on this phone</h2>
        <div className="prose">
          <ul>
            <li>Your profile, fridge scans and weekly check-ins are saved only in this browser. You can export or delete them any time.</li>
            <li>Sample fridges work offline and send nothing anywhere.</li>
            <li>
              If you add your own Gemini key, the fridge photo (shrunk, with location data removed) is sent to Google to recognise the food.
              Your body measurements are never sent.
            </li>
          </ul>
        </div>
      </section>

      <section className="shelf">
        <h2>Help other students (optional)</h2>
        <label className="switch">
          <input type="checkbox" checked={donate} onChange={(e) => setDonate(e.target.checked)} />
          <span>
            <b>Donate anonymous weekly fridge patterns</b> to a student food study, so the predictor learns from people like you rather than
            from gym-goers who already have it figured out.
            <br />
            <span className="muted small">
              Weekly counts only, never photos or names. Prototype: this switch records your choice but nothing is sent.
            </span>
          </span>
        </label>
      </section>

      <button className="btn block" onClick={start}>
        Start
      </button>
      <p className="muted small">
        FridgeFit is a university prototype, not medical advice. If food or body image feels stressful, talk to a GP or call the Butterfly
        Foundation on 1800 33 4673.
      </p>
    </>
  )
}
