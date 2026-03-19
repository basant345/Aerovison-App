import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../utils/translations";
import Pollutant from "./Pollutant";
import AQITabBar from "./aqi/AQITabBar";

// Import PNG images
const AQI_PNG   = require("../../assets/images/aqi.png");
const CO_PNG    = require("../../assets/images/co.png");
const NO2_PNG   = require("../../assets/images/no2.png");
const O3_PNG    = require("../../assets/images/o3.png");
const PM10_PNG  = require("../../assets/images/pm10.png");
const PM2_5_PNG = require("../../assets/images/pm2_5.png");
const SO2_PNG   = require("../../assets/images/so2.png");

// ── UPDATED: AQI categories matching backend & website exactly ───────────────
const getAQICategory = (aqiValue) => {
  if (!aqiValue) return { level: "—",                  color: "#38bdf8" };
  if (aqiValue <= 50)  return { level: "Good",               color: "#22c55e" };
  if (aqiValue <= 100) return { level: "Satisfactory",       color: "#eab308" };
  if (aqiValue <= 200) return { level: "Moderately Polluted",color: "#f97316" };
  if (aqiValue <= 300) return { level: "Poor",               color: "#ef4444" };
  if (aqiValue <= 400) return { level: "Very Poor",          color: "#a855f7" };
  return                      { level: "Severe",             color: "#be123c" };
};
// ─────────────────────────────────────────────────────────────────────────────

const TabBar = ({ airQualityData, weatherData, city }) => {
  // ── UPDATED: Two levels of tabs matching website exactly ─────────────────
  // Level 1: Main content tabs (Air Quality / Weather / Forecast / Historical)
  const [activeMainTab, setActiveMainTab] = useState("aqi");
  // Level 2: Pollutant tabs (AQI / PM2.5 / PM10 / NO2 / SO2 / CO / O3)
  const [activePollutant, setActivePollutant] = useState("AQI");
  // ─────────────────────────────────────────────────────────────────────────

  const { selectedLanguage } = useLanguage();
  const t = (key) => getTranslation(key, selectedLanguage);

  // ── UPDATED: Main tabs matching website's TabNavigation exactly ──────────
  const MAIN_TABS = [
    { id: "aqi",         label: t("airQuality") || "Air Quality",     icon: "wind"       },
    { id: "weather",     label: t("weather")    || "Weather",         icon: "cloud"      },
    { id: "forecast",    label: t("forecast")   || "6-Day Forecast",  icon: "trending-up"},
    { id: "historical",  label: "Historical",                          icon: "bar-chart-2"},
  ];
  // ─────────────────────────────────────────────────────────────────────────

  const POLLUTANTS = useMemo(
    () => [
      { key: "AQI",   label: t("aqi")   || "AQI",   icon: AQI_PNG   },
      { key: "pm2_5", label: t("pm2_5") || "PM2.5", icon: PM2_5_PNG },
      { key: "pm10",  label: t("pm10")  || "PM10",  icon: PM10_PNG  },
      { key: "no2",   label: t("no2")   || "NO₂",   icon: NO2_PNG   },
      { key: "so2",   label: t("so2")   || "SO₂",   icon: SO2_PNG   },
      { key: "co",    label: t("co")    || "CO",    icon: CO_PNG    },
      { key: "o3",    label: t("o3")    || "O₃",    icon: O3_PNG    },
    ],
    [t]
  );

  const currentAQI = airQualityData?.overall_daily_aqi?.[0]?.aqi || 0;
  const aqiCategory = getAQICategory(currentAQI);

  return (
    <View style={styles.container}>

      {/* ── AQI Status Bar (matching website's top status bar) ─────────────── */}
      {currentAQI > 0 && (
        <View style={[styles.aqiStatusBar, { borderLeftColor: aqiCategory.color }]}>
          <View style={[styles.aqiDot, {
            backgroundColor: aqiCategory.color,
            shadowColor: aqiCategory.color,
          }]} />
          <Text style={styles.aqiStatusCity}>{city}</Text>
          <Text style={styles.aqiStateText}>· Madhya Pradesh</Text>
          <View style={[styles.aqiStatusBadge, {
            backgroundColor: `${aqiCategory.color}18`,
            borderColor: `${aqiCategory.color}40`,
          }]}>
            <Text style={[styles.aqiStatusBadgeText, { color: aqiCategory.color }]}>
              AQI {currentAQI} · {aqiCategory.level}
            </Text>
          </View>
        </View>
      )}

      {/* ── UPDATED: Main Tab Navigation matching website's TabNavigation ──── */}
      <View style={styles.mainTabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mainTabScrollContent}
        >
          {MAIN_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.mainTabButton,
                activeMainTab === tab.id && styles.activeMainTabButton,
              ]}
              onPress={() => setActiveMainTab(tab.id)}
              activeOpacity={0.7}
            >
              <Feather
                name={tab.icon}
                size={14}
                color={activeMainTab === tab.id ? "#ffffff" : "#64748b"}
                style={styles.mainTabIcon}
              />
              <Text style={[
                styles.mainTabLabel,
                activeMainTab === tab.id && styles.activeMainTabLabel,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Pollutant Tab Navigation (only shown in Air Quality tab) ────────── */}
      {activeMainTab === "aqi" && (
        <View style={styles.pollutantTabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pollutantTabScrollContent}
          >
            {POLLUTANTS.map((pollutant) => (
              <TouchableOpacity
                key={pollutant.key}
                style={[
                  styles.pollutantTabButton,
                  activePollutant === pollutant.key && styles.activePollutantTabButton,
                ]}
                onPress={() => setActivePollutant(pollutant.key)}
                activeOpacity={0.7}
              >
                <Image
                  source={pollutant.icon}
                  style={[
                    styles.pollutantTabIcon,
                    activePollutant === pollutant.key && styles.activePollutantTabIcon,
                  ]}
                  resizeMode="contain"
                  fadeDuration={0}
                />
                <Text style={[
                  styles.pollutantTabLabel,
                  activePollutant === pollutant.key && styles.activePollutantTabLabel,
                ]}>
                  {pollutant.label}
                </Text>
                {activePollutant === pollutant.key && (
                  <View style={styles.activePollutantIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <View style={styles.contentContainer}>

        {/* Air Quality Tab */}
        {activeMainTab === "aqi" && (
          activePollutant === "AQI" ? (
            <AQITabBar
              AQIData={{
                ...airQualityData?.overall_daily_aqi?.[0],
                pollutants: airQualityData?.today_pollutants,
                fetchedAt: airQualityData?.fetchedAt,
                city: city,
              }}
              weatherData={
                weatherData?.forecast
                  ? weatherData.forecast.map((item, index) => ({
                      ...item,
                      fetchedAt: index === 0 ? weatherData?.fetchedAt : undefined,
                    }))
                  : null
              }
              forecastData={
                airQualityData?.overall_daily_aqi
                  ? airQualityData.overall_daily_aqi.map((item, index) => ({
                      ...item,
                      fetchedAt: index === 0 ? airQualityData?.fetchedAt : undefined,
                    }))
                  : null
              }
            />
          ) : (
            <Pollutant
              pollutant={activePollutant}
              data={
                airQualityData?.predictions?.[activePollutant]
                  ? airQualityData.predictions[activePollutant].map((item) => ({
                      ...item,
                      fetchedAt: airQualityData?.fetchedAt,
                    }))
                  : null
              }
            />
          )
        )}

        {/* Weather Tab */}
        {activeMainTab === "weather" && (
          <AQITabBar
            AQIData={null}
            weatherData={
              weatherData?.forecast
                ? weatherData.forecast.map((item, index) => ({
                    ...item,
                    fetchedAt: index === 0 ? weatherData?.fetchedAt : undefined,
                  }))
                : null
            }
            forecastData={null}
            showWeatherOnly={true}
          />
        )}

        {/* 6-Day Forecast Tab */}
        {activeMainTab === "forecast" && (
          <AQITabBar
            AQIData={{
              ...airQualityData?.overall_daily_aqi?.[0],
              pollutants: airQualityData?.today_pollutants,
              fetchedAt: airQualityData?.fetchedAt,
              city: city,
            }}
            weatherData={null}
            forecastData={
              airQualityData?.overall_daily_aqi
                ? airQualityData.overall_daily_aqi.map((item, index) => ({
                    ...item,
                    fetchedAt: index === 0 ? airQualityData?.fetchedAt : undefined,
                  }))
                : null
            }
            showForecastOnly={true}
          />
        )}

        {/* Historical Stats Tab */}
        {activeMainTab === "historical" && (
          <View style={styles.historicalPlaceholder}>
            <Feather name="bar-chart-2" size={40} color="#0ea5e9" />
            <Text style={styles.historicalTitle}>Historical Stats</Text>
            <Text style={styles.historicalSubtitle}>
              Last 30 days air quality data for {city}
            </Text>
            <Text style={styles.historicalNote}>
              Coming soon — use the website for full historical data
            </Text>
          </View>
        )}

      </View>
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // ── AQI Status Bar ────────────────────────────────────────────────────────
  aqiStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderLeftWidth: 3,
    gap: 6,
    flexWrap: "wrap",
  },
  aqiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  aqiStatusCity: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  aqiStateText: {
    fontSize: 12,
    color: "#94a3b8",
    flex: 1,
  },
  aqiStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  aqiStatusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Main Tab Navigation (matches website TabNavigation) ───────────────────
  mainTabContainer: {
    backgroundColor: "#e2e8f0",
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 4,
  },
  mainTabScrollContent: {
    gap: 2,
  },
  mainTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  // ── UPDATED: Active main tab uses website's sky blue gradient ─────────────
  activeMainTabButton: {
    backgroundColor: "#0ea5e9",
    shadowColor: "rgba(14,165,233,0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTabIcon: {
    marginRight: 2,
  },
  mainTabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeMainTabLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // ── Pollutant Tab Navigation ──────────────────────────────────────────────
  pollutantTabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  pollutantTabScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pollutantTabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    minWidth: 68,
  },
  activePollutantTabButton: {
    backgroundColor: "#0ea5e9",
  },
  pollutantTabIcon: {
    width: 26,
    height: 26,
    marginBottom: 3,
  },
  activePollutantTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  pollutantTabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
  },
  activePollutantTabLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  activePollutantIndicator: {
    position: "absolute",
    bottom: -6,
    height: 3,
    width: "60%",
    backgroundColor: "#0ea5e9",
    borderRadius: 2,
  },

  // ── Content Area ──────────────────────────────────────────────────────────
  contentContainer: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },

  // ── Historical Placeholder ────────────────────────────────────────────────
  historicalPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  historicalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
  },
  historicalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  historicalNote: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
});
