export type IconStyle = 'outline' | 'bold' | 'filled';
export type IconStrokeWidth = number | 'thin' | 'regular' | 'bold';

export type IconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: IconStrokeWidth;
  label?: string;
  class?: string;
  style?: IconStyle;
};

/** Direct Filled imports have a fixed style. */
export type FilledIconProps = Omit<IconProps, 'style'>;
