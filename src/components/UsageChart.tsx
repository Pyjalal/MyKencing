import React from 'react';
import { View } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

export default function UsageChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = data.map(d => ({ x: d.date.slice(5), y: d.count }));
  return (
    <View>
      <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 12 }}>
        <VictoryAxis tickFormat={(t) => t} style={{ tickLabels: { fontSize: 10 } }} />
        <VictoryAxis dependentAxis tickFormat={(t) => `${t}`}
          style={{ tickLabels: { fontSize: 10 } }} />
        <VictoryBar data={chartData} x="x" y="y" cornerRadius={{ top: 4 }} style={{ data: { fill: '#2D9F9F' } }} />
      </VictoryChart>
    </View>
  );
}
