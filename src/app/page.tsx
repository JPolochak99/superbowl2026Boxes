"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import styles from "./SuperBowlBoxes.module.css";
import ShinyText from '../app/shinyText/shinyText';


// Types
type Box = {
  id: number;
  box_number: number;
  player_name: string | null;
  paid: boolean;
};

type Team = {
  id: number;
  name: string;
  type: "home" | "away";
};

type Header = {
  id: number;
  axis: "row" | "column";
  position: number;
  value: string; // e.g. "?" or "-"
};

export default function SuperBowlBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [teams, setTeams] = useState<{ home: string; away: string }>({ home: "", away: "" });
  const [headers, setHeaders] = useState<{ rows: string[]; columns: string[] }>({ rows: [], columns: [] });

  const [showRules, setShowRules] = useState(false);
  const [showWinners, setShowWinners] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch boxes
        const { data: boxData, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("box_number", { ascending: true });
        if (boxError) throw boxError;
        setBoxes(boxData ?? []);

        // Fetch teams
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*");
        if (teamError) throw teamError;

        const homeTeam = teamData?.find(t => t.type === "home")?.name ?? "";
        const awayTeam = teamData?.find(t => t.type === "away")?.name ?? "";
        setTeams({ home: homeTeam, away: awayTeam });

        // Fetch headers
        const { data: headerData, error: headerError } = await supabase
          .from("headers")
          .select("*");
        if (headerError) throw headerError;

        const rowHeaders = headerData?.filter(h => h.axis === "row").map(h => h.value) ?? [];
        const colHeaders = headerData?.filter(h => h.axis === "column").map(h => h.value) ?? [];
        setHeaders({ rows: rowHeaders, columns: colHeaders });
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }

    fetchData();
  }, []);

  // Rule panel handlers
  const openRules = () => setShowRules(true);
  const closeRules = () => setShowRules(false);
  const openWinners = () => setShowWinners(true);
  const closeWinners = () => setShowWinners(false);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <ShinyText
        text="Super Bowl LX Boxes "
        speed={2}
        delay={0}
        color="#b5b5b5"
        shineColor="#ffffff"
        spread={120}
        direction="left"
        yoyo
        pauseOnHover={false}
        disabled={false}
      />

        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button className={styles.rulesButton} onClick={openRules}>Rules</button>
          <button className={styles.winnersButton} onClick={openWinners}>Winners</button>
        </div>

                {/* Overlay */}
        <div
          className={`${styles.overlay} ${(showRules || showWinners) ? styles.show : ""}`}
          onClick={() => { setShowRules(false); setShowWinners(false); }}
        />

        {/* Rules Panel */}
        <div className={`${styles.rulesPanel} ${showRules ? styles.show : ""}`}>
          <div className={styles.panelHeader}>
            <h2>How to Win</h2>
            <button className={styles.closeButton} onClick={() => setShowRules(false)}>✕</button>
          </div>
          <div className={styles.panelContent}>
            <div className={styles.waysToWin}>
              <ol className={styles.rulesList}>
                <li>1st Quarter Score &nbsp; = <span className={styles.prizeAmount}>$700</span></li>
                <li>+1 to each team’s Q1 score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>2nd Quarter Score &nbsp; = <span className={styles.prizeAmount}>$1,000</span></li>
                <li>+1 to each team’s Q2 score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>The box below the Q2 score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>The box above the Q2 score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>3rd Quarter Score &nbsp; = <span className={styles.prizeAmount}>$700</span></li>
                <li>+1 to each team’s Q3 score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>Final Score &nbsp; =  <span className={styles.prizeAmount}>$3000</span></li>
                <li>Box above the final score &nbsp; =  <span className={styles.prizeAmount}>$450</span></li>
                <li>Box below the final score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>+1 to each team’s final score &nbsp; = <span className={styles.prizeAmount}>$450</span></li>
                <li>Add both teams’ final scores &nbsp; = <span className={styles.prizeAmount}>$500</span></li>
                <li>Add touchdown to each team &nbsp; = <span className={styles.prizeAmount}>$500</span></li>
              </ol>
            </div>
          </div>

        </div>

        {/* Winners Panel */}
        <div className={`${styles.winnersPanel} ${showWinners ? styles.show : ""}`}>
          <div className={styles.panelHeader}>
            <h2>Winners</h2>
            <button className={styles.closeButton} onClick={() => setShowWinners(false)}>✕</button>
          </div>
          <div className={styles.panelContent}>
            <ul>
              <li>Quarter 1 Winner: </li>
              <li>Quarter 2 Winner: </li>
              <li>Quarter 3 Winner: </li>
              <li>Quarter 4 Winner: </li>
              <li>Grand Prize Winner: </li>
            </ul>
          </div>
        </div>


        {/* Board */}
        <div className={styles.boardContainer}>
          <div className={styles.topTeam}>{teams.home || "HOME TEAM"}</div>

          <div className={styles.boardRow}>
            <div className={styles.leftTeam}>{teams.away || "AWAY TEAM"}</div>

            <div className={styles.board}>
              {/* Top-left corner */}
              <div className={styles.corner}></div>

              {/* Column headers */}
              {headers.columns.map((val, i) => (
                <div key={i} className={styles.header}>{val}</div>
              ))}

              {/* Rows and boxes */}
              {Array.from({ length: 10 }).map((_, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  <div className={styles.header}>{headers.rows[rowIndex] ?? rowIndex}</div>

                  {boxes
                    .slice(rowIndex * 10, rowIndex * 10 + 10)
                    .map(box => (
                      <div key={box.id} className={styles.box}>
                        <span className={styles.boxNumber}>{box.box_number}</span>
                        <span className={styles.boxName}>{box.player_name}</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

