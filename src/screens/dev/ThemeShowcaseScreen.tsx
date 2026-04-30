import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Screen,
  Card,
  Button,
  IconTile,
  Pill,
  Input,
  Divider,
  ListItem,
  KPI,
  EmptyState,
  Skeleton,
  Sheet,
} from '../../components/ui';
import { darkColors, accents, spacing, typography } from '../../theme/dark';

export function ThemeShowcaseScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.lg }}>
        <SectionHeader>Buttons</SectionHeader>
        <View style={{ gap: 8 }}>
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Danger" variant="danger" onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
          <Button
            label="With Icon"
            leadingIcon={<Feather name="star" size={16} color="#fff" />}
            onPress={() => {}}
          />
        </View>

        <SectionHeader>IconTile (per accent)</SectionHeader>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['cyan','violet','emerald','sky','indigo','rose','amber','teal','lime','pink','slate','fuchsia','orange'] as const).map(a => (
            <IconTile
              key={a}
              accent={a}
              icon={<Feather name="trending-up" size={20} color={accents[a].text} />}
            />
          ))}
        </View>

        <SectionHeader>Pills</SectionHeader>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill variant="status" status="won"    label="Won" />
          <Pill variant="status" status="atRisk" label="At risk" />
          <Pill variant="status" status="lost"   label="Lost" />
          <Pill variant="status" status="ai"     label="AI" />
          <Pill variant="accent" accent="cyan"   label="Dashboard" />
          <Pill variant="accent" accent="violet" label="Customers" />
          <Pill variant="accent" accent="emerald" label="Deals" />
        </View>

        <SectionHeader>KPI tiles</SectionHeader>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <KPI accent="emerald" label="Revenue" value="$24.5K" delta={{ value: '+12%', positive: true }} />
          <KPI accent="cyan"    label="Deals"   value="48"     delta={{ value: '+3',   positive: true }} />
        </View>

        <SectionHeader>Cards</SectionHeader>
        <Card>
          <Text style={{ color: darkColors.textPrimary }}>Plain card on dark navy background.</Text>
        </Card>
        <Card accent="violet">
          <Text style={{ color: darkColors.textPrimary }}>Violet-tinted accent card.</Text>
        </Card>
        <Card accent="emerald" elevated>
          <Text style={{ color: darkColors.textPrimary }}>Emerald accent + elevation.</Text>
        </Card>

        <SectionHeader>Input</SectionHeader>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={inputValue}
          onChangeText={setInputValue}
          leadingIcon={<Feather name="search" size={16} color={darkColors.textMuted} />}
          helperText="We'll never share this."
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          errorText="Password must be at least 8 characters"
        />

        <SectionHeader>List items</SectionHeader>
        <View>
          <ListItem
            position="first"
            title="Profile"
            subtitle="Personal information"
            onPress={() => {}}
          />
          <ListItem
            position="middle"
            title="Notifications"
            trailingValue="On"
            onPress={() => {}}
          />
          <ListItem
            position="last"
            title="About"
            onPress={() => {}}
          />
        </View>

        <SectionHeader>Skeleton</SectionHeader>
        <View style={{ gap: 8 }}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="85%" />
        </View>

        <SectionHeader>Empty state</SectionHeader>
        <Card>
          <EmptyState
            icon={<Feather name="star" size={40} color={darkColors.textMuted} />}
            title="No deals yet"
            body="Add your first deal to start tracking revenue."
            cta={<Button label="Add deal" size="sm" onPress={() => {}} />}
          />
        </Card>

        <SectionHeader>Divider</SectionHeader>
        <Card>
          <Text style={{ color: darkColors.textPrimary }}>Above</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: darkColors.textPrimary }}>Below</Text>
        </Card>

        <SectionHeader>Sheet</SectionHeader>
        <Button label="Open bottom sheet" onPress={() => setSheetOpen(true)} />
        <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
          <Text style={{ color: darkColors.textPrimary, fontSize: typography.size.lg, fontWeight: '600' }}>
            Sheet content
          </Text>
          <Text style={{ color: darkColors.textMuted, marginTop: 8 }}>
            This is a bottom sheet rendered by the Sheet primitive — the foundation
            QuickAddSheet and AICommandCenter will be migrated to in a later sprint.
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <Button label="Close" variant="secondary" onPress={() => setSheetOpen(false)} />
          </View>
        </Sheet>
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: darkColors.textMuted,
        fontSize: typography.size.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.lg,
      }}
    >
      {children}
    </Text>
  );
}
