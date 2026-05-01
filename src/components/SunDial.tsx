import moment from "moment";
import React, { useState, useEffect } from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 100,
    width: 100,
    zIndex: 9999,
  },
});

export const isNight = (dayCount: number) => dayCount % 2 === 1;

function SunDial({dayCount, setDayCount}:{dayCount: number, setDayCount: React.Dispatch<React.SetStateAction<number>>}) {
  const [countdown, setCountdown] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(moment())
  const classes = useStyles();

  const dayLength = 60 * 5 * 1000 // 5 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      if (countdown < dayLength) {
        const now = moment();
        const timeDiff = now.diff(lastUpdated, 'milliseconds');
        setCountdown(prevTime => prevTime + timeDiff);
        setLastUpdated(now);
      } else {
        setCountdown(0);
        setDayCount(prevDayCount => prevDayCount + 1);
      }
    }, 1000);

    return () => {
      clearInterval(interval); // Cleanup the interval when the component unmounts
    };
  }, [countdown, lastUpdated]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = ((dayLength - countdown) / dayLength) * circumference;

  const dayCountRemainder = dayCount % 2;
  const dayCountWhole = Math.floor(dayCount / 2);

  return (
    <svg className={classes.root}>
      <circle
        stroke="rgba(0,0,0,.2)"
        fill="transparent"
        strokeWidth="20"
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset: offset }}
        r={radius}
        cx="50"
        cy="50"
      />
      <circle
        stroke="rgba(0,0,0,.1)"
        fill={dayCountRemainder === 0 ? "#eeddcc" : "#ccddee"}
        strokeWidth="20"
        strokeDasharray={circumference + ' ' + circumference}
        r={radius}
        cx="50"
        cy="50"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="papyrus"
        fontWeight="bold"
      >
        {dayCountRemainder === 0 ? "Day" : "Night"} {dayCountWhole + 1}
      </text>
    </svg>
  );
}

export default SunDial;
