/**
 * PollutantCardApp.jsx
 * ─────────────────────
 * Matches the website's PollutantCard.jsx design for React Native.
 * Features:
 *  - Front: pollutant name, value, unit, icon
 *  - NAAQS health level color matching website exactly
 *  - Same color coding: Good/Satisfactory/Moderately Polluted/Poor/Very Poor/Severe
 *  - PPB conversion for gases (O₃, CO, SO₂, NO₂)
 *
 * Usage: Replace your existing pollutant cards in the AQI tab
 */

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Molecular weights for PPB conversion (matching website)
const molecularWeights = { "O₃": 48.0, "CO": 28.01, "SO₂": 64.06, "NO₂": 46.01 };

const convertToPPB = (shortName, value) => {
  const mw = molecularWeights[shortName];
  if (!mw || value == null) return value;
  return parseFloat(((value * 24.45) / mw).toFixed(2));
};

// NAAQS health levels matching website's PollutantCard exactly
const getHealthInfo = (shortName, rawValue) => {
  const NAAQS = {
    "PM₂.₅": [
      { max: 30,      level: "Good",                color: "#22c55e" },
      { max: 60,      level: "Satisfactory",         color: "#a3e635" },
      { max: 90,      level: "Moderately Polluted",  color: "#eab308" },
      { max: 120,     level: "Poor",                 color: "#f97316" },
      { max: 250,     level: "Very Poor",            color: "#ef4444" },
      { max: 9999,    level: "Severe",               color: "#7e0023" },
    ],
    "PM₁₀": [
      { max: 50,      level: "Good",                color: "#22c55e" },
      { max: 100,     level: "Satisfactory",         color: "#a3e635" },
      { max: 250,     level: "Moderately Polluted",  color: "#eab308" },
      { max: 350,     level: "Poor",                 color: "#f97316" },
      { max: 430,     level: "Very Poor",            color: "#ef4444" },
      { max: 9999,    level: "Severe",               color: "#7e0023" },
    ],
    "CO": [
      { max: 1000,    level: "Good",                color: "#22c55e" },
      { max: 2000,    level: "Satisfactory",         color: "#a3e635" },
      { max: 10000,   level: "Moderately Polluted",  color: "#eab308" },
      { max: 17000,   level: "Poor",                 color: "#f97316" },
      { max: 34000,   level: "Very Poor",            color: "#ef4444" },
      { max: 9999999, level: "Severe",               color: "#7e0023" },
    ],
    "SO₂": [
      { max: 40,      level: "Good",                color: "#22c55e" },
      { max: 80,      level: "Satisfactory",         color: "#a3e635" },
      { max: 380,     level: "Moderately Polluted",  color: "#eab308" },
      { max: 800,     level: "Poor",                 color: "#f97316" },
      { max: 1600,    level: "Very Poor",            color: "#ef4444" },
      { max: 9999,    level: "Severe",               color: "#7e0023" },
    ],
    "NO₂": [
      { max: 40,      level: "Good",                color: "#22c55e" },
      { max: 80,      level: "Satisfactory",         color: "#a3e635" },
      { max: 180,     level: "Moderately Polluted",  color: "#eab308" },
      { max: 280,     level: "Poor",                 color: "#f97316" },
      { max: 400,     level: "Very Poor",            color: "#ef4444" },
      { max: 9999,    level: "Severe",               color: "#7e0023" },
    ],
    "O₃": [
      { max: 50,      level: "Good",                color: "#22c55e" },
      { max: 100,     level: "Satisfactory",         color: "#a3e635" },
      { max: 168,     level: "Moderately Polluted",  color: "#eab308" },
      { max: 208,     level: "Poor",                 color: "#f97316" },
      { max: 748,     level: "Very Poor",            color: "#ef4444" },
      { max: 9999,    level: "Severe",               color: "#7e0023" },
    ],
  };

  const tiers = NAAQS[shortName];
  if (!tiers || rawValue == null) return { level: "—", color: "#64748b" };
  for (const t of tiers) {
    if (rawValue <= t.max) return { level: t.level, color: t.color };
  }
  return { level: "Severe", color: "#7e0023" };
};

const PollutantCardApp = ({ shortName, value, unit, icon, onPress }) => {
  const [flipped, setFlipped] = useState(false);

  const isGas = Object.keys(molecularWeights).includes(shortName);
  const displayValue = isGas ? convertToPPB(shortName, value) : value;
  const displayUnit  = isGas ? "ppb" : unit;
  const healthInfo   = getHealthInfo(shortName, value);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        setFlipped(!flipped);
        if (onPress) onPress();
      }}
      activeOpacity={0.85}
    >
      {!flipped ? (
        // ── FRONT ──────────────────────────────────────────────────────────
        <View style={styles.front}>
          <View style={styles.iconBox}>
            {typeof icon === "number" ? (
              <Image source={icon} style={styles.icon} resizeMode="contain" />
            ) : (
              <Feather name="wind" size={28} color="#0ea5e9" />
            )}
          </View>
          <View style={styles.frontRight}>
            <Text style={styles.shortName}>{shortName}</Text>
            <Text style={styles.value}>
              {displayValue ?? "--"}
              <Text style={styles.unit}> {displayUnit}</Text>
            </Text>
          </View>
          <View style={[styles.levelDot, { backgroundColor: healthInfo.color }]} />
          <Feather name="chevron-right" size={16} color="#94a3b8" />
        </View>
      ) : (
        // ── BACK (health info) ─────────────────────────────────────────────
        <View style={[styles.back, { backgroundColor: healthInfo.color }]}>
          <View style={styles.backHeader}>
            <Feather
              name={
                healthInfo.level === "Good" || healthInfo.level === "Satisfactory"
                  ? "check-circle"
                  : healthInfo.level === "Severe"
                  ? "x-circle"
                  : "alert-triangle"
              }
              size={16}
              color="#ffffff"
            />
            <Text style={styles.backShortName}>{shortName}</Text>
            <Text style={styles.backLevel}>— {healthInfo.level}</Text>
            <Text style={styles.backValue}>{displayValue ?? "--"} {displayUnit}</Text>
          </View>
          <Text style={styles.backTap}>Tap to flip back</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PollutantCardApp;

const styles = StyleSheet.create({
  container: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },

  // Front
  front: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(14,165,233,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 32,
    height: 32,
  },
  frontRight: {
    flex: 1,
  },
  shortName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  unit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748b",
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },

  // Back
  back: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backShortName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  backLevel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },
  backValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  backTap: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
  },
});
