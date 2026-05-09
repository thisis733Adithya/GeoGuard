import { View, Text } from 'react-native';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';

const STYLES = {
  active: { border: '#10b981', text: '#10b981' },
  normal: { border: '#10b981', text: '#10b981' },
  open: { border: '#000000', text: '#000000' },
  watch: { border: '#f5a524', text: '#f5a524' },
  warning: { border: '#f5a524', text: '#f5a524' },
  critical: { border: '#f31260', text: '#f31260' },
  expired: { border: '#a1a1aa', text: '#a1a1aa' },
  verified: { border: '#10b981', text: '#10b981' },
  'google maps': { border: '#10b981', text: '#10b981' },
  fallback: { border: '#f5a524', text: '#f5a524' },
};

export default function StatusBadge({ value }) {
  const { dark } = useTheme();
  const key = (value || 'normal').toLowerCase();
  const style = STYLES[key] || STYLES.normal;

  return (
    <View
      style={[
        tw`rounded-md px-2 py-0.5`,
        {
          borderWidth: 1,
          borderColor: style.border,
          backgroundColor: dark ? '#1a1a1a' : '#fafafa',
        },
      ]}
    >
      <Text style={[tw`text-xs font-medium`, { color: style.text }]}>
        {value || 'normal'}
      </Text>
    </View>
  );
}
