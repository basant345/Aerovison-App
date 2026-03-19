import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { getAQIMeterLevels } from "../utils/aqiUtils";

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(" ");
  return d;
};

// ── UPDATED: AQI levels matching your backend & website exactly ──────────────
const WEBSITE_AQI_LEVELS = [
  { name: "Good",                min: 0,   max: 50,  color: "#22c55e" },
  { name: "Satisfactory",        min: 51,  max: 100, color: "#eab308" },
  { name: "Moderately Polluted", min: 101, max: 200, color: "#f97316" },
  { name: "Poor",                min: 201, max: 300, color: "#ef4444" },
  { name: "Very Poor",           min: 301, max: 400, color: "#a855f7" },
  { name: "Severe",              min: 401, max: 500, color: "#be123c" },
];
// ─────────────────────────────────────────────────────────────────────────────

const AQIMeter = ({ value = 0, levels, size = 200 }) => {
  const aqiLevels = levels || WEBSITE_AQI_LEVELS;
  const needleRotation = useRef(new Animated.Value(0)).current;
  const gaugeRadius = size / 2;
  const center = size / 2;
  const arcRadius = gaugeRadius - 40;
  const boundaryRadius = gaugeRadius - 20;
  const numberRadius = gaugeRadius - 5;

  const totalMax = 500; // Fixed max of 500 matching website

  useEffect(() => {
    const rotationDegree = (Math.min(value, totalMax) / totalMax) * 180;
    Animated.timing(needleRotation, {
      toValue: rotationDegree,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [value, totalMax, needleRotation]);

  const needleTransformStyle = {
    transform: [
      {
        rotate: needleRotation.interpolate({
          inputRange: [0, 180],
          outputRange: ["-90deg", "90deg"],
        }),
      },
    ],
  };

  // ── UPDATED: AQI category label matching website ──────────────────────────
  const getAQILabel = (val) => {
    if (!val) return { label: "—", color: "#38bdf8" };
    if (val <= 50)  return { label: "Good",                color: "#22c55e" };
    if (val <= 100) return { label: "Satisfactory",        color: "#eab308" };
    if (val <= 200) return { label: "Moderately Polluted", color: "#f97316" };
    if (val <= 300) return { label: "Poor",                color: "#ef4444" };
    if (val <= 400) return { label: "Very Poor",           color: "#a855f7" };
    return                 { label: "Severe",              color: "#be123c" };
  };

  const getNumberPosition = (angle) => {
    const radian = ((angle - 180) * Math.PI) / 180;
    let xOffset = 0;
    if (angle === 0) xOffset = 8;
    if (angle === 180) xOffset = -8;
    return {
      x: center + numberRadius * Math.cos(radian) + xOffset,
      y: center + numberRadius * Math.sin(radian) + 8,
    };
  };

  // ── UPDATED: AQI scale numbers matching website (0,50,100,200,300,400,500)
  const aqiNumbers = [0, 50, 100, 200, 300, 400, 500];

  const currentLabel = getAQILabel(value);

  return (
    <View style={[styles.gauge, { width: size, height: gaugeRadius }]}>
      <Svg width={size} height={gaugeRadius} style={styles.svg}>
        {/* Outer boundary arc */}
        <Path
          d={describeArc(center, center, boundaryRadius, 0, 180)}
          stroke="#e2e8f0"
          strokeWidth={3}
          fill="none"
        />

        {/* Tick marks */}
        {aqiNumbers.map((number) => {
          const angle = (number / totalMax) * 180;
          const radian = ((angle - 180) * Math.PI) / 180;
          const innerRadius = boundaryRadius - 8;
          const outerRadius = boundaryRadius + 8;
          const innerX = center + innerRadius * Math.cos(radian);
          const innerY = center + innerRadius * Math.sin(radian);
          const outerX = center + outerRadius * Math.cos(radian);
          const outerY = center + outerRadius * Math.sin(radian);
          return (
            <Path
              key={`tick-${number}`}
              d={`M ${innerX} ${innerY} L ${outerX} ${outerY}`}
              stroke="#94a3b8"
              strokeWidth={2}
            />
          );
        })}

        {/* Colored arcs matching website AQI levels */}
        {(() => {
          let accumulated = 0;
          return aqiLevels.map((level) => {
            const startAngle = (accumulated / totalMax) * 180;
            const endAngle = (level.max / totalMax) * 180;
            accumulated = level.max;
            return (
              <Path
                key={level.name}
                d={describeArc(center, center, arcRadius, startAngle, endAngle)}
                stroke={level.color}
                strokeWidth={45}
                fill="none"
              />
            );
          });
        })()}

        {/* AQI numbers */}
        {aqiNumbers.map((number) => {
          const angle = (number / totalMax) * 180;
          const position = getNumberPosition(angle);
          return (
            <SvgText
              key={number}
              x={position.x}
              y={position.y}
              textAnchor="middle"
              fontSize={size * 0.05}
              fill="#475569"
              fontWeight="700"
              stroke="#fff"
              strokeWidth="0.5"
            >
              {number}
            </SvgText>
          );
        })}
      </Svg>

      {/* Center display */}
      <View style={[styles.gaugeCenter, { width: "45%", height: "45%", right: "27.5%" }]}>
        <Text style={[styles.valueText, { fontSize: size * 0.12 }]}>
          {Math.round(value)}
        </Text>
        {/* ── UPDATED: Show AQI category label like website ── */}
        <Text style={[styles.categoryText, { fontSize: size * 0.055, color: currentLabel.color }]}
          numberOfLines={1} adjustsFontSizeToFit>
          {currentLabel.label}
        </Text>
      </View>

      {/* Needle */}
      <Animated.View
        style={[
          styles.needleContainer,
          {
            left: center - 1,
            bottom: 0,
            width: 2,
            height: gaugeRadius * 0.7,
          },
          needleTransformStyle,
        ]}
      >
        <View style={styles.needle} />
      </Animated.View>

      {/* Needle hub */}
      <View
        style={[
          styles.needleHub,
          {
            width: size * 0.05,
            height: size * 0.05,
            borderRadius: size * 0.025,
            left: center - size * 0.025,
            bottom: -size * 0.025,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gauge: {
    backgroundColor: "#f8fafc",
    borderRadius: 200,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: "relative",
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  gaugeCenter: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    position: "absolute",
    bottom: 0,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  valueText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 2,
  },
  // ── UPDATED: Category label below value ───────────────────────────────────
  categoryText: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: -4,
  },
  needleContainer: {
    position: "absolute",
    transformOrigin: "1px 100%",
  },
  needle: {
    position: "absolute",
    width: 4,
    height: "100%",
    backgroundColor: "#0ea5e9",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    shadowColor: "rgba(14,165,233,0.6)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 8,
  },
  needleHub: {
    position: "absolute",
    backgroundColor: "#0f172a",
    borderColor: "#0ea5e9",
    borderWidth: 2,
    shadowColor: "rgba(0,0,0,0.4)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 6,
  },
});

export default AQIMeter;
