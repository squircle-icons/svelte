export type IconStyle = 'outline' | 'filled';
export type IconStrokeWidth = number | 'thin' | 'regular' | 'bold';

export type IconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: IconStrokeWidth;
  label?: string;
  class?: string;
  style?: IconStyle;
};
