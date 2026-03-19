/**
 * AQICardMain.jsx
 * ───────────────
 * Drop-in replacement for the main AQI display card in the app.
 * Matches the website's AQICard.jsx design exactly:
 *  - Animated AQI number (count-up)
 *  - Live badge (pulsing red dot)
 *  - MP State Rank badge with 🏆
 *  - Cigarettes/day calculator (Berkeley Earth formula)
 *  - AQI gradient scale bar
 *  - Weather info (temp, wind, humidity)
 *  - AQI categories matching backend exactly
 *
 * Usage: Replace your existing AQI display inside AQITabBar.jsx
 * Props: { AQIData, weatherData, city }
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchMPRanking } from "../api/API";

// ── AQI helpers matching website exactly ─────────────────────────────────────
function getAqiHex(value) {
  if (!value) return "#22c55e";
  if (value <= 50)  return "#22c55e";   // Good
  if (value <= 100) return "#eab308";   // Satisfactory
  if (value <= 200) return "#f97316";   // Moderately Polluted
  if (value <= 300) return "#ef4444";   // Poor
  if (value <= 400) return "#a855f7";   // Very Poor
  return "#be123c";                      // Severe
}

function getAqiLabel(value) {
  if (!value) return "—";
  if (value <= 50)  return "Good";
  if (value <= 100) return "Satisfactory";
  if (value <= 200) return "Moderately Polluted";
  if (value <= 300) return "Poor";
  if (value <= 400) return "Very Poor";
  return "Severe";
}

// Berkeley Earth formula: 1 cigarette = 22 µg/m³ PM2.5 for 24hrs
function getCigarettes(pm25) {
  if (!pm25 || pm25 <= 0) return 0;
  return Math.round((pm25 / 22) * 10) / 10;
}

function getRankSuffix(n) {
  if (!n) return null;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
// ─────────────────────────────────────────────────────────────────────────────

// Animated count-up AQI number
function AnimatedAQINumber({ target }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!target) return;
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: target,
      duration: 2000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
    const id = animValue.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => animValue.removeListener(id);
  }, [target]);

  const color = getAqiHex(display);

  return (
    <View style={aqiNumStyles.container}>
      {/* Glow background */}
      <View style={[aqiNumStyles.glow, { backgroundColor: color }]} />
      <Text style={[aqiNumStyles.number, { color }]}>{display}</Text>
      {/* Progress bar */}
      <View style={aqiNumStyles.progressBg}>
        <Animated.View style={[
          aqiNumStyles.progressFill,
          {
            backgroundColor: color,
            width: animValue.interpolate({
              inputRange: [0, 400],
              outputRange: ["0%", "100%"],
              extrapolate: "clamp",
            }),
          },
        ]} />
      </View>
    </View>
  );
}

const aqiNumStyles = StyleSheet.create({
  container: { alignItems: "flex-start", marginBottom: 8 },
  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
    top: -20,
    left: -20,
  },
  number: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 80,
  },
  progressBg: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});

// ── Main Component ────────────────────────────────────────────────────────────
const AQICardMain = ({ AQIData, weatherData, city }) => {
  const [rankData, setRankData] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);

  const aqi         = AQIData?.aqi;
  const pm25        = AQIData?.pollutants?.[0]?.value;
  const pm10        = AQIData?.pollutants?.[1]?.value;
  const aqiColor    = getAqiHex(aqi);
  const aqiLabel    = getAqiLabel(aqi);
  const cigarettes  = getCigarettes(pm25);
  const todayWeather = weatherData?.[0];

  // Fetch MP Ranking
  useEffect(() => {
    if (!city) return;
    setRankData(null);
    setRankLoading(true);
    fetchMPRanking(city)
      .then(d => setRankData(d))
      .catch(() => {})
      .finally(() => setRankLoading(false));
  }, [city]);

  return (
    <View style={styles.card}>
      {/* Dark overlay background matching website */}
      <LinearGradient
        colors={["#0a0e1a", "#0f172a", "#0a0e1a"]}
        style={styles.gradient}
      >
        {/* ── Live Badge ─────────────────────────────────────────────────── */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDotOuter}>
            <View style={styles.liveDotInner} />
          </View>
          <Text style={styles.liveBadgeText}>LIVE AQI</Text>
        </View>

        {/* ── MP Rank Badge ───────────────────────────────────────────────── */}
        {(rankLoading || rankData) && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>🏆</Text>
            {rankLoading ? (
              <Text style={styles.rankText}>Loading rank…</Text>
            ) : (
              <Text style={styles.rankText}>
                Ranks{" "}
                <Text style={styles.rankNumber}>{getRankSuffix(rankData?.rank)}</Text>
                {" "}in MP
                <Text style={styles.rankTotal}> · {rankData?.total_cities} cities</Text>
              </Text>
            )}
          </View>
        )}

        {/* ── Main Content Row ────────────────────────────────────────────── */}
        <View style={styles.mainRow}>

          {/* LEFT: AQI + PM values + Cigarettes */}
          <View style={styles.leftCol}>
            {/* Animated AQI number */}
            {aqi != null
              ? <AnimatedAQINumber target={aqi} />
              : <Text style={styles.naText}>N/A</Text>
            }

            {/* AQI Label */}
            <Text style={styles.aqiLabelSmall}>Air Quality is</Text>
            <Text style={[styles.aqiLabelBig, { color: aqiColor }]}>{aqiLabel}</Text>

            {/* PM values */}
            <View style={styles.pmRow}>
              <Text style={styles.pmLabel}>PM₁₀: </Text>
              <Text style={styles.pmValue}>{pm10 ?? "--"} µg/m³</Text>
            </View>
            <View style={styles.pmRow}>
              <Text style={styles.pmLabel}>PM₂.₅: </Text>
              <Text style={styles.pmValue}>{pm25 ?? "--"} µg/m³</Text>
            </View>

            {/* ── Cigarettes/Day (Berkeley Earth) ── */}
            {pm25 != null && cigarettes > 0 && (
              <View style={styles.cigaretteBox}>
                <View style={styles.cigaretteRow}>
                  <Feather name="wind" size={14} color="#fbbf24" />
                  <Text style={styles.cigaretteLabel}>Cigarettes / Day</Text>
                  <Text style={styles.cigaretteCount}>{cigarettes}</Text>
                </View>
                <Text style={styles.cigaretteDesc}>
                  Breathing here = {cigarettes} cigarettes today
                </Text>
                <Text style={styles.cigaretteSource}>Source: Berkeley Earth</Text>
              </View>
            )}
          </View>

          {/* RIGHT: Weather */}
          <View style={styles.rightCol}>
            {/* Temperature */}
            <View style={styles.weatherTempRow}>
              <Feather
                name={
                  todayWeather?.precipitation_mm > 5 ? "cloud-rain" :
                  todayWeather?.max_wind_speed_kmh > 15 ? "wind" :
                  todayWeather?.max_temp >= 30 ? "sun" : "cloud"
                }
                size={32}
                color={
                  todayWeather?.precipitation_mm > 5 ? "#60a5fa" :
                  todayWeather?.max_wind_speed_kmh > 15 ? "#94a3b8" :
                  todayWeather?.max_temp >= 30 ? "#fbbf24" : "#94a3b8"
                }
              />
              <Text style={styles.tempText}>
                {todayWeather?.max_temp ?? "--"}°C
              </Text>
            </View>

            {/* Humidity */}
            <View style={styles.weatherRow}>
              <Feather name="droplets" size={14} color="#60a5fa" />
              <Text style={styles.weatherLabel}>Humidity</Text>
              <Text style={styles.weatherValue}>
                {todayWeather?.precipitation_mm ?? "--"} %
              </Text>
            </View>

            {/* Wind */}
            <View style={styles.weatherRow}>
              <Feather name="wind" size={14} color="#60a5fa" />
              <Text style={styles.weatherLabel}>Wind</Text>
              <Text style={styles.weatherValue}>
                {todayWeather?.max_wind_speed_kmh ?? "--"} km/h
              </Text>
            </View>
          </View>
        </View>

        {/* ── AQI Scale Bar (matching website) ────────────────────────────── */}
        <View style={styles.scaleSection}>
          <View style={styles.scaleLabels}>
            {["Good","Sat.","Mod.","Poor","V.Poor","Severe"].map((l, i) => (
              <Text key={i} style={[styles.scaleLabel, {
                color: ["#22c55e","#eab308","#f97316","#ef4444","#a855f7","#be123c"][i]
              }]}>{l}</Text>
            ))}
          </View>
          <View style={styles.scaleNumbers}>
            {["0","50","100","200","300","400","500"].map((n, i) => (
              <Text key={i} style={styles.scaleNumber}>{n}</Text>
            ))}
          </View>
          {/* Gradient bar */}
          <LinearGradient
            colors={["#22c55e","#eab308","#f97316","#ef4444","#a855f7","#be123c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scaleBar}
          />
          {/* AQI position indicator */}
          {aqi != null && (
            <View style={[styles.scaleIndicator, {
              left: `${Math.min((aqi / 500) * 100, 98)}%`,
              borderColor: aqiColor,
            }]} />
          )}
        </View>

      </LinearGradient>
    </View>
  );
};

export default AQICardMain;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    padding: 20,
  },

  // Live badge
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  liveDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  liveBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Rank badge
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.4)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  rankEmoji: { fontSize: 14 },
  rankText: {
    fontSize: 12,
    color: "#fde68a",
    fontWeight: "600",
  },
  rankNumber: {
    fontSize: 14,
    color: "#fef08a",
    fontWeight: "800",
  },
  rankTotal: {
    color: "rgba(253,230,138,0.6)",
    fontWeight: "400",
  },

  // Main layout
  mainRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  leftCol: { flex: 1.2 },
  rightCol: {
    flex: 0.8,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  naText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#64748b",
  },

  // AQI label
  aqiLabelSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
    marginBottom: 2,
  },
  aqiLabelBig: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  // PM values
  pmRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pmLabel: {
    fontSize: 13,
    color: "#38bdf8",
    fontWeight: "600",
  },
  pmValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  // Cigarettes
  cigaretteBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,180,60,0.25)",
  },
  cigaretteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cigaretteLabel: {
    fontSize: 12,
    color: "#fbbf24",
    fontWeight: "700",
    flex: 1,
  },
  cigaretteCount: {
    fontSize: 18,
    color: "#fcd34d",
    fontWeight: "900",
  },
  cigaretteDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  cigaretteSource: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontStyle: "italic",
  },

  // Weather
  weatherTempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tempText: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  weatherLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    flex: 1,
  },
  weatherValue: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },

  // AQI Scale
  scaleSection: {
    marginTop: 4,
    position: "relative",
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  scaleLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  scaleNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  scaleNumber: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
  },
  scaleBar: {
    height: 8,
    borderRadius: 4,
  },
  scaleIndicator: {
    position: "absolute",
    bottom: -4,
    width: 3,
    height: 16,
    backgroundColor: "#ffffff",
    borderRadius: 2,
    borderWidth: 1,
    marginLeft: -1.5,
  },
});
