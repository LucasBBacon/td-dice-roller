import "./DieSilhouette.css";
import type { JSX } from "react";
import type { DieType } from "../../roll/dieTypes";

export const DieSilhouette = ({
  type,
}: {
  type: DieType;
}) => {
  const paths: Record<string, JSX.Element> = {
    d4: <polygon points="50,5 100,95 0,95" />,
    d6: <rect x="15" y="15" width="70" height="70" rx="12" />,
    d8: <polygon points="50,5 95,50 50,95 5,50" />,
    d10: <polygon points="50,5 90,40 50,95 10,40" />,
    d12: <polygon points="50,5 93,35 77,90 23,90 5,35" />,
    d20: <polygon points="50,5 93,25 93,75 50,95 7,75 7,25" />,
  };

  return (
    <svg viewBox="0 0 100 100" className="die-svg" fill="currentColor">
      {paths[type]}
    </svg>
  );
};
