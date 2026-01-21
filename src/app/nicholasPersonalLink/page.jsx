"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./adminPage.module.css";
import ShinyText from '../app/shinyText/shinyText';

export default function AdminPage() {
  // States
  const [boxes, setBoxes] = useState([]);
  const [teams, setTeams] = useState({ home: "", away: "" });
  const [headers, setHeaders] = useState({ rows: Array(10).fill("?"), columns: Array(10).fill("?") });
  const [loading, setLoading] = useState(true);
  const [changedBoxIds, setChangedBoxIds] = useState(new Set());
  const [filter, setFilter] = useState("All"); // quick filter buttons
  const statusClassMap = {
    Paid: styles.Paid,
    "Keeping but not paid": styles.Keeping,
    Nothing: styles.Nothing
  };
  
  
  // Fetch all data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: boxData, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("box_number", { ascending: true });
        if (boxError) throw boxError;
        setBoxes(boxData || []);

        const { data: teamData, error: teamError } = await supabase.from("teams").select("*");
        if (teamError) throw teamError;
        setTeams({
          home: teamData?.find(t => t.type === "home")?.name || "",
          away: teamData?.find(t => t.type === "away")?.name || "",
        });

        const { data: headerData, error: headerError } = await supabase.from("headers").select("*");
        if (headerError) throw headerError;
        setHeaders({
          rows: headerData?.filter(h => h.axis === "row").map(h => h.value) || Array(10).fill("?"),
          columns: headerData?.filter(h => h.axis === "column").map(h => h.value) || Array(10).fill("?"),
        });
      } catch (err) {
        console.error("Error saving changes:", err instanceof Error ? err.message : JSON.stringify(err));
        alert(`Failed to save changes: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handlers for boxes
  const handleNameChange = (boxId, value) => {
    setBoxes(prev => prev.map(box => (box.id === boxId ? { ...box, player_name: value } : box)));
    setChangedBoxIds(prev => new Set(prev).add(boxId));
  };

  const handleStatusChange = (boxId, value) => {
    setBoxes(prev => prev.map(box => (box.id === boxId ? { ...box, paid: value } : box)));
    setChangedBoxIds(prev => new Set(prev).add(boxId));
  };

  // Submit changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update only changed boxes
      const updates = boxes.filter(box => changedBoxIds.has(box.id));
      if (updates.length > 0) {
        const { error } = await supabase.from("boxes").upsert(
          updates.map(box => ({
            id: box.id,
            player_name: box.player_name,
            paid: box.paid,
            box_number: box.box_number,
          }))
        );
        if (error) throw error;
      }

      // Update teams
      for (const [type, name] of Object.entries(teams)) {
        const { error } = await supabase.from("teams").update({ name }).eq("type", type);
        if (error) throw error;
      }

      // Update headers
      for (let i = 0; i < 10; i++) {
        const { error: rowError } = await supabase.from("headers").update({ value: headers.rows[i] }).eq("axis", "row").eq("position", i);
        if (rowError) throw rowError;

        const { error: colError } = await supabase.from("headers").update({ value: headers.columns[i] }).eq("axis", "column").eq("position", i);
        if (colError) throw colError;
      }

      alert("All changes saved successfully!");
      setChangedBoxIds(new Set());
    } catch (err) {
      console.error("Error saving changes:", err);
      alert("Failed to save changes.");
    }
  };

  if (loading) return <p>Loading...</p>;

  // Apply filter
  const filteredBoxes = boxes.filter(box => filter === "All" || box.paid === filter);

  return (
    <div className={styles.page}>
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

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Teams */}
        <div className={styles.teamInputs}>
          <div className={styles.teamInput}>
            <label>Home Team:</label>
            <input
              type="text"
              value={teams.home}
              onChange={e => setTeams(prev => ({ ...prev, home: e.target.value }))}
              className={styles.inputName}
            />
          </div>
          <div className={styles.teamInput}>
            <label>Away Team:</label>
            <input
              type="text"
              value={teams.away}
              onChange={e => setTeams(prev => ({ ...prev, away: e.target.value }))}
              className={styles.inputName}
            />
          </div>
        </div>

        {/* Headers */}
        <div className={styles.headerInputs}>
          <div className={styles.headerGroup}>
            <div className={styles.headerTitle}>
              <label>Column Headers (X-Axis):</label>
            </div>
            <div className={styles.headerBoxes}>
            {headers.columns.map((value, i) => (
              <input
                key={i}
                type="text"
                value={value}
                onChange={e => {
                  const newCols = [...headers.columns];
                  newCols[i] = e.target.value;
                  setHeaders(prev => ({ ...prev, columns: newCols }));
                }}
                className={styles.inputHeader}
              />
            ))}
            </div>
          </div>
          <div className={styles.headerGroup}>
            <div className={styles.headerTitle}>
              <label>Row Headers (Y-Axis):</label>
            </div>
            <div className={styles.headerBoxes}>
            {headers.rows.map((value, i) => (
              <input
                key={i}
                type="text"
                value={value}
                onChange={e => {
                  const newRows = [...headers.rows];
                  newRows[i] = e.target.value;
                  setHeaders(prev => ({ ...prev, rows: newRows }));
                }}
                className={styles.inputHeader}
              />
            ))}
            </div>
          </div>
        </div>

        {/* Quick filter buttons */}
        <div className={styles.filterRow}>
          <span>Filter by Status: </span>
          <div className={styles.filterButtonContainer}>
          {["All", "Paid", "Keeping but not paid", "Nothing"].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`${styles.filterButton} ${statusClassMap[status]} ${filter === status ? styles.activeFilter : ""}`}
            >
              {status}
            </button>
          ))}
          </div>
        </div>

        {/* Boxes */}
        <div className={styles.grid}>
          {filteredBoxes.map(box => {
            // Determine the CSS class based on status
            let statusClass = "nothing"; // default
            if (box.paid === "Paid") statusClass = "paid";
            else if (box.paid === "Keeping but not paid") statusClass = "keeping";

            return (
              <div
                key={box.id}
                className={`${styles.boxCard} ${styles[statusClass]}`} // dynamic class
              >
                <div className={styles.boxNumber}>#{box.box_number}</div>
                <input
                  type="text"
                  placeholder="Player Name"
                  value={box.player_name || ""}
                  onChange={e => handleNameChange(box.id, e.target.value)}
                  className={styles.inputName}
                />
                <label className={styles.paidLabel}>
                  Status:
                  <select
                    value={box.paid || "Nothing"}
                    onChange={e => handleStatusChange(box.id, e.target.value)}
                    className={styles.statusSelect}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Keeping but not paid">Keeping but not paid</option>
                    <option value="Nothing">Nothing</option>
                  </select>
                </label>
              </div>
            );
          })}
        </div>


        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
