import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react-native';
import { Colors } from '../../../constants/theme';
import { MIMSSearchResult } from '../../../types';
import { styles } from '../styles';
import { capitalizeDosageForm, getDisplayName } from '../utils';

interface MedicineSearchSectionProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isSearching: boolean;
  showSearchResults: boolean;
  searchResults: MIMSSearchResult[];
  onSelectResult: (medicine: MIMSSearchResult) => void;
  onClearSelection: () => void;
  selectedMedicine: MIMSSearchResult | null;
}

export const MedicineSearchSection: React.FC<MedicineSearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  isSearching,
  showSearchResults,
  searchResults,
  onSelectResult,
  onClearSelection,
  selectedMedicine,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('add_medicine.search_medicine')}</Text>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('add_medicine.type_medicine_name')}
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="words"
        />
        {(selectedMedicine || searchQuery.length > 0) && (
          <TouchableOpacity onPress={onClearSelection} style={styles.clearButton}>
            <X size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {showSearchResults && (
        <View style={styles.searchResultsInline}>
          {isSearching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color={Colors.primary.main} />
              <Text style={styles.searchingText}>{t('add_medicine.searching')}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.searchResultsList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="always"
            >
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSelectResult(item);
                  }}
                >
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultName}>{getDisplayName(item)}</Text>
                    <Text style={styles.searchResultDetails}>
                      {item.strength && `${item.strength} • `}
                      {item.dosageForm && `${capitalizeDosageForm(item.dosageForm)} • `}
                      {item.activeIngredients.slice(0, 2).join(', ')}
                      {item.activeIngredients.length > 2 && '...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {selectedMedicine && (
        <View style={styles.selectedMedicineContainer}>
          <Text style={styles.selectedMedicineLabel}>{t('add_medicine.selected_medicine')}</Text>
          <Text style={styles.selectedMedicineName}>{getDisplayName(selectedMedicine)}</Text>
          <Text style={styles.selectedMedicineDetails}>{t('add_medicine.registration')} {selectedMedicine.id}</Text>
        </View>
      )}
    </View>
  );
};

