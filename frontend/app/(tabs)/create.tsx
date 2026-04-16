import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createServiceListing } from '@/lib/auth';

export default function CreateListingScreen() {
  const [serviceTitle, setServiceTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('');
  const [availability, setAvailability] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Photo access is required to upload listing images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8,
    });

    if (result.canceled) {
      return;
    }

    const merged = [...selectedImages, ...result.assets].slice(0, 8);
    setSelectedImages(merged);
    setErrorMessage('');
  };

  const removeImageAt = (indexToRemove: number) => {
    setSelectedImages((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleCancel = () => {
    setServiceTitle('');
    setCategory('');
    setDescription('');
    setPrice('');
    setPriceType('');
    setAvailability('');
    setServiceArea('');
    setSelectedImages([]);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCreate = async () => {
    if (
      !serviceTitle.trim() ||
      !category.trim() ||
      !description.trim() ||
      !price.trim() ||
      !priceType.trim() ||
      !availability.trim() ||
      !serviceArea.trim()
    ) {
      setErrorMessage('Please fill all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      await createServiceListing({
        serviceTitle: serviceTitle.trim(),
        category: category.trim(),
        description: description.trim(),
        price: price.trim(),
        priceType: priceType.trim(),
        availability: availability.trim(),
        serviceArea: serviceArea.trim(),
        images: selectedImages.map((image, index) => ({
          uri: image.uri,
          name: image.fileName ?? `listing-image-${index + 1}.jpg`,
          type: image.mimeType ?? 'image/jpeg',
        })),
      });

      setServiceTitle('');
      setCategory('');
      setDescription('');
      setPrice('');
      setPriceType('');
      setAvailability('');
      setServiceArea('');
      setSelectedImages([]);
      setSuccessMessage('Listing created successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.modalCard}>
        <Text style={styles.title}>Create New Listing</Text>

        <Text style={styles.label}>Service Photo</Text>
        <TouchableOpacity style={styles.uploadBox} activeOpacity={0.8} onPress={pickImages}>
          <Text style={styles.uploadIcon}>↑</Text>
          <Text style={styles.uploadText}>Tap to upload one or more photos</Text>
          <Text style={styles.uploadHint}>PNG/JPG up to 10MB each (max 8)</Text>
        </TouchableOpacity>
        {selectedImages.length > 0 ? (
          <View style={styles.previewGrid}>
            {selectedImages.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.previewItem}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImageAt(index)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.removeImageButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>Service Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Professional House Cleaning"
          value={serviceTitle}
          onChangeText={setServiceTitle}
        />

        <Text style={styles.label}>Category *</Text>
        <TextInput
          style={styles.input}
          placeholder="Select a category"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Describe your service, experience, and what you offer..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>$ Price *</Text>
            <TextInput
              style={styles.input}
              placeholder="75"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Price Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="Per Hour"
              value={priceType}
              onChangeText={setPriceType}
            />
          </View>
        </View>

        <Text style={styles.label}>Availability *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Weekdays 9am-5pm"
          value={availability}
          onChangeText={setAvailability}
        />

        <Text style={styles.label}>Service Area *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., San Francisco, CA"
          value={serviceArea}
          onChangeText={setServiceArea}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel} disabled={isSubmitting}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Publish Listing</Text>
            )}
          </TouchableOpacity>
        </View>

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F2F3F5',
    minHeight: '100%',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E8EB',
    padding: 18,
    gap: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  uploadBox: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFCFD',
    paddingHorizontal: 10,
  },
  uploadIcon: {
    fontSize: 26,
    color: '#6B7280',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: -1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  secondaryButtonText: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  successText: {
    color: '#166534',
    fontWeight: '600',
    marginTop: 4,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    marginTop: 4,
  },
});

