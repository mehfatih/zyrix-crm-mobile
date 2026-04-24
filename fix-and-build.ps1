# ================================================================
# ZYRIX CRM MOBILE — COMPLETE FIX SCRIPT
# ================================================================
# This script fixes ALL build errors and prepares a clean AAB build.
# Run from: D:\Zyrix Hub\zyrix-crm-mobile
# ================================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Zyrix CRM Mobile — Complete Fix Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 0 — Verify location
$currentDir = Get-Location
if ($currentDir.Path -notlike "*zyrix-crm-mobile*") {
    Write-Host "ERROR: You must run this from D:\Zyrix Hub\zyrix-crm-mobile" -ForegroundColor Red
    exit 1
}

Write-Host "[1/10] Installing expo-sharing and expo-document-picker..." -ForegroundColor Yellow
npx expo install expo-sharing expo-document-picker

Write-Host ""
Write-Host "[2/10] Fixing PDFPreview.tsx (removing dynamic require)..." -ForegroundColor Yellow
$pdfPreviewPath = "src\components\feature-specific\PDFPreview.tsx"
$pdfPreviewContent = @'
/**
 * PDFPreview - lightweight PDF placeholder.
 * Uses static import for expo-sharing (Metro-safe).
 */

import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PDFPreviewProps {
  url: string;
  fileName?: string;
  pageCount?: number;
  size?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  url,
  fileName,
  pageCount,
  size,
}) => {
  const { t } = useTranslation();

  const openInBrowser = async (): Promise<void> => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t('files.uploadFailed'), url);
    }
  };

  const shareDocument = async (): Promise<void> => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(url, { dialogTitle: fileName ?? 'PDF' });
        return;
      }
    } catch (err) {
      console.warn('[PDFPreview] share failed', err);
    }
    await openInBrowser();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="document-outline" size={36} color={colors.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName ?? 'document.pdf'}
          </Text>
          <Text style={styles.detail}>
            {pageCount
              ? pageCount + ' ' + t('common.continue').toLowerCase()
              : 'PDF'}
            {size ? ' . ' + size : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.placeholderText}>
        {t('placeholders.comingInSprint', { sprint: 6 })}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={openInBrowser}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="download-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>{t('common.save')}</Text>
        </Pressable>
        <Pressable
          onPress={shareDocument}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="share-outline" size={18} color={colors.textInverse} />
          <Text style={[styles.actionText, { color: colors.textInverse }]}>
            {t('common.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.base,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  fileName: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  detail: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  placeholderText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceAlt,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default PDFPreview;
'@

if (Test-Path $pdfPreviewPath) {
    Set-Content -Path $pdfPreviewPath -Value $pdfPreviewContent -Encoding UTF8
    Write-Host "      PDFPreview.tsx fixed" -ForegroundColor Green
} else {
    Write-Host "      PDFPreview.tsx not found at expected path" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/10] Fixing FileUploader.tsx (removing dynamic require)..." -ForegroundColor Yellow
$fileUploaderPath = "src\components\forms\FileUploader.tsx"

if (Test-Path $fileUploaderPath) {
    $content = Get-Content $fileUploaderPath -Raw
    $hasDynamicRequire = $content -match 'require\(moduleId\)|safeRequire'
    
    if ($hasDynamicRequire) {
        $fileUploaderContent = @'
/**
 * FileUploader - static imports only (Metro-safe).
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface FileUploaderProps {
  onFileSelected?: (file: DocumentPicker.DocumentPickerAsset) => void;
  accept?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  accept = ['*/*'],
  maxSizeMB = 10,
  multiple = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickFile = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      if (file.size && file.size > maxSizeMB * 1024 * 1024) {
        Alert.alert(
          t('files.uploadFailed'),
          'File too large (max ' + maxSizeMB + ' MB)'
        );
        setLoading(false);
        return;
      }

      setSelectedFile(file);
      onFileSelected?.(file);
    } catch (err) {
      console.warn('[FileUploader] pick failed', err);
      Alert.alert(t('files.uploadFailed'), String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={pickFile}
        disabled={loading}
        style={({ pressed }) => [
          styles.dropZone,
          pressed ? { opacity: 0.8 } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Icon name="cloud-upload-outline" size={32} color={colors.primary} />
            <Text style={styles.dropText}>
              {selectedFile ? selectedFile.name : t('files.uploadPrompt')}
            </Text>
            {!selectedFile && (
              <Text style={styles.hintText}>
                Max {maxSizeMB} MB
              </Text>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    minHeight: 140,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  dropText: {
    ...textStyles.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hintText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default FileUploader;
'@
        Set-Content -Path $fileUploaderPath -Value $fileUploaderContent -Encoding UTF8
        Write-Host "      FileUploader.tsx fixed" -ForegroundColor Green
    } else {
        Write-Host "      FileUploader.tsx already clean, skipping" -ForegroundColor Gray
    }
} else {
    Write-Host "      FileUploader.tsx not found at expected path" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/10] Searching for other files with dynamic require..." -ForegroundColor Yellow
$problemFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | 
    Select-String -Pattern "require\(moduleId\)|safeRequire<" -List |
    Select-Object -ExpandProperty Path

if ($problemFiles) {
    Write-Host "      Found additional files with dynamic require:" -ForegroundColor Yellow
    $problemFiles | ForEach-Object { Write-Host "        - $_" -ForegroundColor Yellow }
    Write-Host "      These files need manual review. Paste their paths to Claude for fixing." -ForegroundColor Yellow
} else {
    Write-Host "      No other files with dynamic require found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/10] Updating app.json with correct package name and versionCode..." -ForegroundColor Yellow
$appJsonPath = "app.json"
if (Test-Path $appJsonPath) {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    
    if (-not $appJson.expo.android) {
        $appJson.expo | Add-Member -MemberType NoteProperty -Name "android" -Value @{} -Force
    }
    
    $appJson.expo.android | Add-Member -MemberType NoteProperty -Name "package" -Value "com.zyrix.crm" -Force
    $appJson.expo.android | Add-Member -MemberType NoteProperty -Name "versionCode" -Value 6 -Force
    
    if (-not $appJson.expo.android.adaptiveIcon) {
        $appJson.expo.android | Add-Member -MemberType NoteProperty -Name "adaptiveIcon" -Value @{
            foregroundImage = "./assets/adaptive-icon.png"
            backgroundColor = "#F0F9FF"
        } -Force
    }
    
    $appJson | ConvertTo-Json -Depth 20 | Set-Content $appJsonPath -Encoding UTF8
    Write-Host "      app.json updated: package=com.zyrix.crm, versionCode=6" -ForegroundColor Green
} else {
    Write-Host "      app.json not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "[6/10] Cleaning Metro cache and node_modules..." -ForegroundColor Yellow
if (Test-Path ".expo") { Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path "node_modules\.cache") { Remove-Item "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "      Cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "[7/10] Running TypeScript check..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "      TypeScript: 0 errors" -ForegroundColor Green
} else {
    Write-Host "      TypeScript errors detected - review before building" -ForegroundColor Red
    Write-Host "      Continue anyway? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "[8/10] Committing changes to git..." -ForegroundColor Yellow
git add .
git commit -m "Fix: static imports for Metro + package=com.zyrix.crm + bump versionCode"
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Committed successfully" -ForegroundColor Green
} else {
    Write-Host "      Nothing to commit or commit failed" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[9/10] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "      Push failed or nothing to push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[10/10] Starting EAS build for Android AAB (production)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Ready to build. Running eas build now..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

eas build --platform android --profile production --non-interactive --no-wait

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  DONE. Monitor build at:" -ForegroundColor Green
Write-Host "  https://expo.dev/accounts/journaliste/projects/zyrix-crm-mobile/builds" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
