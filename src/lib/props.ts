export type IconStyle = 'outline' | 'bold' | 'filled';
export type IconFrame = 'none' | 'square' | 'circle';
export type IconStrokeWidth = number | 'thin' | 'regular' | 'bold';

export type IconProps = {
  /** Square/Circle frames are supported by the Arrow, Chevron and Plus/Minus/X families. */
  frame?: IconFrame;
  size?: number | string;
  color?: string;
  strokeWidth?: IconStrokeWidth;
  label?: string;
  class?: string;
  style?: IconStyle;
};

/** Direct Filled imports have a fixed style. */
export type FilledIconProps = Omit<IconProps, 'style'>;
