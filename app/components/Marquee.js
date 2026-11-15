import { EVENTS } from "../data";

export default function Marquee() {
  const row = [...EVENTS, ...EVENTS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div className="marquee-group" key={k}>
            {row.map((e, i) => (
              <span key={`${k}-${i}`}>
                {e.name}
                <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
