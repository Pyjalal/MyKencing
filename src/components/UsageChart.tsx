import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../constants/theme';

type UsageDatum = { date: string; count: number };

export default function UsageChart({ data }: { data: UsageDatum[] }) {
  const chartData = useMemo(
    () => data.map(d => ({ x: d.date.slice(5), y: d.count })),
    [data]
  );

  // Use Victory Native for charts
  try {
    const { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } = require('victory-native');

    return (
      <View>
        <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 12 }}>
          <VictoryAxis tickFormat={(t: string | number) => t} style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryAxis
            dependentAxis
            tickFormat={(t: string | number) => `${t}`}
            style={{ tickLabels: { fontSize: 10 } }}
          />
          <VictoryBar
            data={chartData}
            x="x"
            y="y"
            cornerRadius={{ top: 4 }}
            style={{ data: { fill: Colors.text.link } }}
          />
        </VictoryChart>
      </View>
    );
  } catch (error) {
    console.warn('Victory Native chart error:', error);
    // Fallback to simple bar chart if Victory Native fails
    return (
      <View>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Daily activity</Text>
        {chartData.length === 0 ? (
          <Text style={{ color: Colors.text.tertiary }}>No activity recorded for this range.</Text>
        ) : (
          chartData.map(entry => (
            <View
              key={entry.x}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
            >
              <Text style={{ width: 56 }}>{entry.x}</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: Colors.neutral[200], borderRadius: 4 }}>
                <View
                  style={{
                    width: `${Math.min(entry.y * 10, 100)}%`,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.text.link,
                  }}
                />
              </View>
              <Text style={{ marginLeft: 8 }}>{entry.y}</Text>
            </View>
          ))
        )}
      </View>
    );
  }
}
