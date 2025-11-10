import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

export interface SelectionOption {
  label: string;
  value: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: ReadonlyArray<SelectionOption>;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  options,
  onSelect,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

