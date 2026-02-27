import { InfoTooltip } from './InfoTooltip';
import { Text } from './Text';

interface FormSectionHeaderProps {
  title: string;
  tooltip: string;
}

export function FormSectionHeader({ title, tooltip }: FormSectionHeaderProps) {
  return (
    <div className="form-section-header">
      <Text as="h3" variant="h3" weight="bold" className="form-section-header__title">
        {title}
      </Text>
      <InfoTooltip label={`About ${title} section`} content={tooltip} />
    </div>
  );
}
