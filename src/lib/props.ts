export type IconStyle = 'outline' | 'filled';

export type IconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  label?: string;
  class?: string;
  style?: IconStyle;
};

/** Direct Filled imports have a fixed style. */
export type FilledIconProps = Omit<IconProps, 'style'>;
