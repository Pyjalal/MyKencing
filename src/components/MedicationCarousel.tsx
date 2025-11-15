/**
 * MedicationCarousel Component
 * Horizontal swipeable carousel for medication cards
 * Specifications from Figma analysis:
 * - Card size: 300x165px
 * - Snap-to-card behavior
 * - Show 1 full card + partial adjacent cards
 * - Smooth 60fps animations
 * - Touch gesture support
 * - Pagination dots indicator
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 300;
const CARD_HEIGHT = 165;
const CARD_SPACING = 20;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface MedicationData {
  id: string;
  name: string;
  dosage: string;
  indication: string;
  schedule: string;
  daysLeft: number;
  totalDays: number;
  notes?: string[];
}

interface MedicationCarouselProps {
  medications: MedicationData[];
  onCardPress?: (medication: MedicationData) => void;
  containerStyle?: ViewStyle;
}

export default function MedicationCarousel({
  medications,
  onCardPress,
  containerStyle,
}: MedicationCarouselProps) {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_SPACING));
      setActiveIndex(index);
    },
    []
  );

  const calculateProgressPercentage = (daysLeft: number, totalDays: number): number => {
    return Math.floor((daysLeft / totalDays) * 100);
  };

  const renderPaginationDots = () => {
    if (medications.length <= 1) return null;

    return (
      <View className="flex-row justify-center items-center mt-4 gap-2">
        {medications.map((_, index) => (
          <View
            key={index}
            className={cn(
              'h-2 rounded-full transition-all',
              index === activeIndex
                ? 'w-6 bg-warning'
                : 'w-2 bg-text-tertiary opacity-30'
            )}
          />
        ))}
      </View>
    );
  };

  if (medications.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-base text-text-secondary">
          {t('medications.no_active_medications')}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="center"
        contentInset={{
          left: SIDE_PADDING,
          right: SIDE_PADDING,
        }}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        accessibilityLabel="Medication carousel"
        accessibilityRole="adjustable"
      >
        {medications.map((medication, index) => {
          const progressPercentage = calculateProgressPercentage(
            medication.daysLeft,
            medication.totalDays
          );
          const progressWidth = (progressPercentage / 100) * 207;

          return (
            <View
              key={medication.id}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: index < medications.length - 1 ? CARD_SPACING : 0,
              }}
              className="bg-white rounded-[20px] p-4 shadow-md"
              accessibilityLabel={`${medication.name} ${medication.dosage}`}
              accessibilityHint={`Medication ${index + 1} of ${medications.length}`}
            >
              {/* Medication Name */}
              <Text
                className="text-2xl font-semibold text-warning mb-1"
                numberOfLines={1}
              >
                {medication.name} {medication.dosage}
              </Text>

              {/* Indication */}
              <Text className="text-[15px] font-medium text-text-secondary mb-1">
                {medication.indication}
              </Text>

              {/* Schedule */}
              <Text className="text-[15px] font-medium text-text-primary mb-3">
                {medication.schedule}
              </Text>

              {/* Progress Bar */}
              <View className="mb-2">
                <View
                  className="h-3 bg-background rounded-[16px] overflow-hidden"
                  style={{ width: 207 }}
                >
                  <View
                    className="h-full bg-[#F8D849] rounded-[16px]"
                    style={{ width: progressWidth }}
                  />
                </View>
              </View>

              {/* Days Left */}
              <Text className="text-[15px] font-medium text-text-secondary text-center mb-2">
                {medication.daysLeft} {t('medications.days_left')}
              </Text>

              {/* Notes */}
              {medication.notes && medication.notes.length > 0 && (
                <Text
                  className="text-[15px] font-medium text-text-secondary"
                  numberOfLines={1}
                >
                  {t('medications.note')} {medication.notes[0]}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {renderPaginationDots()}
    </View>
  );
}
