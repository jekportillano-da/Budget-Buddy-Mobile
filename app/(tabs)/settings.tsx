import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useUserStore } from '../../stores';
import { useSavingsStore } from '../../stores/savingsStore';
import { useTheme } from '../../contexts/ThemeContext';

export default function Settings() {
  const [isEditing, setIsEditing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const theme = useTheme();

  const {
    profile,
    isLoading,
    updateProfile,
    clearProfile,
  } = useUserStore();

  const { unlockedThemes, activeTheme, activateTheme } = useSavingsStore();

  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    address: '',
    location: 'ncr', // 'ncr' or 'province'
    employmentStatus: 'employed',
    monthlyGrossIncome: '',
    monthlyNetIncome: '',
    hasSpouse: false,
    spouseIncome: '',
    numberOfDependents: '0',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        contactNumber: profile.contactNumber || '',
        email: profile.email || '',
        address: profile.address || '',
        location: profile.location || 'ncr',
        employmentStatus: profile.employmentStatus || 'employed',
        monthlyGrossIncome: profile.monthlyGrossIncome?.toString() || '',
        monthlyNetIncome: profile.monthlyNetIncome?.toString() || '',
        hasSpouse: profile.hasSpouse || false,
        spouseIncome: profile.spouseIncome?.toString() || '',
        numberOfDependents: profile.numberOfDependents?.toString() || '0',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        ...formData,
        location: formData.location as 'ncr' | 'province',
        employmentStatus: formData.employmentStatus as 'employed' | 'self_employed' | 'freelancer' | 'student' | 'unemployed' | 'retired',
        monthlyGrossIncome: parseFloat(formData.monthlyGrossIncome) || 0,
        monthlyNetIncome: parseFloat(formData.monthlyNetIncome) || 0,
        spouseIncome: parseFloat(formData.spouseIncome) || 0,
        numberOfDependents: parseInt(formData.numberOfDependents) || 0,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        contactNumber: profile.contactNumber || '',
        email: profile.email || '',
        address: profile.address || '',
        location: profile.location || 'ncr',
        employmentStatus: profile.employmentStatus || 'employed',
        monthlyGrossIncome: profile.monthlyGrossIncome?.toString() || '',
        monthlyNetIncome: profile.monthlyNetIncome?.toString() || '',
        hasSpouse: profile.hasSpouse || false,
        spouseIncome: profile.spouseIncome?.toString() || '',
        numberOfDependents: profile.numberOfDependents?.toString() || '0',
      });
    }
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const getLocationDisplay = (location: string) => {
    return location === 'ncr' ? 'National Capital Region (NCR)' : 'Province';
  };

  const getEmploymentStatusDisplay = (status: string) => {
    const statuses = {
      employed: 'Employed',
      self_employed: 'Self-Employed',
      freelancer: 'Freelancer',
      student: 'Student',
      unemployed: 'Unemployed',
      retired: 'Retired',
    };
    return statuses[status as keyof typeof statuses] || 'Unknown';
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.fullName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
            placeholder="Enter your full name"
          />
        ) : (
          <Text style={styles.inputValue}>{profile?.fullName || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contact Number</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.contactNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, contactNumber: text }))}
            placeholder="e.g., +63 9XX XXX XXXX"
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.inputValue}>{profile?.contactNumber || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : (
          <Text style={styles.inputValue}>{profile?.email || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        {isEditing ? (
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Street, Barangay, City, Province"
            multiline
            numberOfLines={3}
          />
        ) : (
          <Text style={styles.inputValue}>{profile?.address || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        {isEditing ? (
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.pickerText}>
              {getLocationDisplay(formData.location)}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.inputValue}>
            {getLocationDisplay(profile?.location || 'ncr')}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmploymentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Employment Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Employment Status</Text>
        {isEditing ? (
          <View style={styles.employmentOptions}>
            {['employed', 'self_employed', 'freelancer', 'student', 'unemployed', 'retired'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.employmentOption,
                  formData.employmentStatus === status && styles.selectedEmploymentOption
                ]}
                onPress={() => setFormData(prev => ({ ...prev, employmentStatus: status }))}
              >
                <Text style={[
                  styles.employmentOptionText,
                  formData.employmentStatus === status && styles.selectedEmploymentOptionText
                ]}>
                  {getEmploymentStatusDisplay(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.inputValue}>
            {getEmploymentStatusDisplay(profile?.employmentStatus || 'employed')}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Gross Income (₱)</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.monthlyGrossIncome}
            onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyGrossIncome: text }))}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        ) : (
          <Text style={styles.inputValue}>
            {profile?.monthlyGrossIncome ? formatCurrency(profile.monthlyGrossIncome) : 'Not set'}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Net Income (₱)</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.monthlyNetIncome}
            onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyNetIncome: text }))}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        ) : (
          <Text style={styles.inputValue}>
            {profile?.monthlyNetIncome ? formatCurrency(profile.monthlyNetIncome) : 'Not set'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFamilySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Family Information</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.inputLabel}>Do you have a spouse?</Text>
          {isEditing ? (
            <Switch
              value={formData.hasSpouse}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                hasSpouse: value,
                spouseIncome: value ? prev.spouseIncome : '0'
              }))}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={formData.hasSpouse ? '#fff' : '#f4f3f4'}
            />
          ) : (
            <Text style={styles.inputValue}>{profile?.hasSpouse ? 'Yes' : 'No'}</Text>
          )}
        </View>
      </View>

      {(isEditing ? formData.hasSpouse : profile?.hasSpouse) && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Spouse's Monthly Income (₱)</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={formData.spouseIncome}
              onChangeText={(text) => setFormData(prev => ({ ...prev, spouseIncome: text }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          ) : (
            <Text style={styles.inputValue}>
              {profile?.spouseIncome ? formatCurrency(profile.spouseIncome) : 'Not set'}
            </Text>
          )}
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Number of Dependents</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={formData.numberOfDependents}
            onChangeText={(text) => setFormData(prev => ({ ...prev, numberOfDependents: text }))}
            placeholder="0"
            keyboardType="number-pad"
          />
        ) : (
          <Text style={styles.inputValue}>{profile?.numberOfDependents || 0}</Text>
        )}
      </View>
    </View>
  );

  const renderThemeSection = () => {
    // Define theme colors and names
    const themeConfig = {
      bronze_theme: { name: 'Bronze', colors: { primary: '#CD7F32', secondary: '#B87333' }, emoji: '🥉' },
      silver_theme: { name: 'Silver', colors: { primary: '#C0C0C0', secondary: '#A8A8A8' }, emoji: '🥈' },
      gold_theme: { name: 'Gold', colors: { primary: '#FFD700', secondary: '#FFC107' }, emoji: '🥇' },
      platinum_theme: { name: 'Platinum', colors: { primary: '#E5E4E2', secondary: '#D3D3D3' }, emoji: '💎' },
      diamond_theme: { name: 'Diamond', colors: { primary: '#B9F2FF', secondary: '#87CEEB' }, emoji: '💎' },
      elite_theme: { name: 'Elite', colors: { primary: '#8A2BE2', secondary: '#9932CC' }, emoji: '👑' }
    };

    return (
      <View style={[styles.section, { backgroundColor: theme.currentTheme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.currentTheme.colors.text }]}>🎨 Theme Customization</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.currentTheme.colors.textSecondary }]}>
          Unlock themes by reaching savings milestones
        </Text>
        
        <View style={styles.themeGrid}>
          {Object.entries(themeConfig).map(([themeKey, themeData]) => {
            const isUnlocked = unlockedThemes.some(t => t.preference_key === themeKey);
            const isActive = activeTheme === themeKey;
            
            return (
              <TouchableOpacity
                key={themeKey}
                style={[
                  styles.themeCard,
                  { backgroundColor: theme.currentTheme.colors.background, borderColor: theme.currentTheme.colors.textSecondary },
                  isActive && { borderColor: theme.currentTheme.colors.primary, borderWidth: 3 },
                  !isUnlocked && { opacity: 0.5 }
                ]}
                disabled={!isUnlocked}
                onPress={async () => {
                  if (isUnlocked) {
                    const success = await activateTheme(themeKey);
                    if (success) {
                      console.log('✅ Theme switched to:', themeKey);
                    } else {
                      console.error('❌ Failed to switch theme');
                    }
                  }
                }}
              >
                <View style={styles.themePreview}>
                  <View 
                    style={[
                      styles.themeColorPrimary, 
                      { backgroundColor: themeData.colors.primary },
                      !isUnlocked && styles.lockedColor
                    ]} 
                  />
                  <View 
                    style={[
                      styles.themeColorSecondary, 
                      { backgroundColor: themeData.colors.secondary },
                      !isUnlocked && styles.lockedColor
                    ]} 
                  />
                </View>
                
                <View style={styles.themeInfo}>
                  <Text style={styles.themeEmoji}>{themeData.emoji}</Text>
                  <Text style={[
                    styles.themeName, 
                    { color: theme.currentTheme.colors.text },
                    !isUnlocked && { color: theme.currentTheme.colors.textSecondary }
                  ]}>
                    {themeData.name}
                  </Text>
                  {isActive && <Text style={[styles.activeText, { color: theme.currentTheme.colors.primary }]}>Active</Text>}
                  {!isUnlocked && <Text style={[styles.lockedText, { color: theme.currentTheme.colors.textSecondary }]}>🔒 Locked</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.themeStats}>
          <Text style={[styles.themeStatsText, { color: theme.currentTheme.colors.textSecondary }]}>
            Unlocked: {unlockedThemes.length}/6 themes
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.currentTheme.colors.background }]}>
  <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.currentTheme.colors.surface }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.currentTheme.colors.text }]}>Profile & Settings</Text>
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: theme.currentTheme.colors.primary },
                isEditing && { backgroundColor: theme.currentTheme.colors.error }
              ]}
              onPress={isEditing ? handleCancel : () => setIsEditing(true)}
            >
              <Text style={[styles.editButtonText, { color: theme.currentTheme.colors.surface }]}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Sections */}
        {renderProfileSection()}
        {renderEmploymentSection()}
        {renderFamilySection()}

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Sync</Text>
            <Text style={styles.settingValue}>Last synced: Never</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch value={true} trackColor={{ false: '#767577', true: '#2196F3' }} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Currency</Text>
            <Text style={styles.settingValue}>PHP (₱)</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Customization */}
        {renderThemeSection()}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => {
              Alert.alert(
                'Clear Profile',
                'This will delete all your profile data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear', 
                    style: 'destructive',
                    onPress: () => clearProfile()
                  }
                ]
              );
            }}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear Profile Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationOptions}>
            {[
              { value: 'ncr', label: 'National Capital Region (NCR)' },
              { value: 'province', label: 'Province' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.locationOption,
                  formData.location === option.value && styles.selectedLocationOption
                ]}
                onPress={() => setFormData(prev => ({ ...prev, location: option.value }))}
              >
                <Text style={[
                  styles.locationOptionText,
                  formData.location === option.value && styles.selectedLocationOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  cancelButton: {
    borderColor: '#666',
  },
  editButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Picker
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },

  // Employment Options
  employmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  employmentOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedEmploymentOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  employmentOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedEmploymentOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Switch Container
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  dangerItem: {
    borderBottomColor: '#ffebee',
  },
  dangerText: {
    color: '#d32f2f',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDone: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  locationOptions: {
    padding: 16,
  },
  locationOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedLocationOption: {
    backgroundColor: '#2196F3',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLocationOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Theme Section Styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  themeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeThemeCard: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f8ff',
  },
  lockedThemeCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  themePreview: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  themeColorPrimary: {
    flex: 2,
  },
  themeColorSecondary: {
    flex: 1,
  },
  lockedColor: {
    backgroundColor: '#d0d0d0',
  },
  themeInfo: {
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lockedText: {
    fontSize: 10,
    color: '#999',
  },
  themeStats: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  themeStatsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
